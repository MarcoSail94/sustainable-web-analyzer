"""
Enhanced Browser Manager with better process management and signal handling.
"""

import os
import asyncio
import atexit
import logging
import subprocess
import signal
import time
import psutil
from pyppeteer import launch
from pyppeteer.errors import NetworkError, TimeoutError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BrowserManager:
    """
    Manages browser instances for web analysis.
    Creates a new browser for each analysis, avoiding signal handling issues.
    """

    # Track active browser processes for proper cleanup
    _active_processes = set()

    # Track Chrome subprocess PIDs which may not be direct children
    _chrome_pids = set()

    @classmethod
    def shutdown(cls):
        """
        Properly shut down any active browser processes.
        Called by atexit handler to ensure clean shutdown.
        """
        logger.info(f"Shutting down {len(cls._active_processes)} browser processes...")

        # First try to kill our tracked processes
        for pid in list(cls._active_processes):
            try:
                logger.info(f"Killing browser process (PID: {pid})")
                cls._kill_process(pid)
                cls._active_processes.remove(pid)
            except Exception as e:
                logger.error(f"Error killing browser process {pid}: {str(e)}")

        # Then try to kill Chrome instances we've tracked
        for pid in list(cls._chrome_pids):
            try:
                logger.info(f"Killing Chrome subprocess (PID: {pid})")
                cls._kill_process(pid)
                cls._chrome_pids.remove(pid)
            except Exception as e:
                logger.error(f"Error killing Chrome subprocess {pid}: {str(e)}")

        # Finally, find and kill any remaining Chrome processes (emergency cleanup)
        cls._find_and_kill_zombie_chromes()

        logger.info("Browser shutdown completed")

    @classmethod
    def _kill_process(cls, pid):
        """Safely kill a process by PID."""
        try:
            # Check if process exists
            if not psutil.pid_exists(pid):
                return

            # Get process
            proc = psutil.Process(pid)

            # Kill it and its children
            parent = proc
            children = parent.children(recursive=True)
            for child in children:
                try:
                    child.kill()
                except:
                    pass

            # Kill the parent
            parent.kill()

            # Wait a bit
            gone, alive = psutil.wait_procs([parent], timeout=3)

            # Force kill if still alive
            for p in alive:
                try:
                    p.kill()
                except:
                    pass
        except Exception as e:
            logger.error(f"Error in _kill_process for PID {pid}: {e}")
            # Fall back to OS commands if psutil fails
            cls._kill_process_os_commands(pid)

    @classmethod
    def _kill_process_os_commands(cls, pid):
        """Kill a process using OS-specific kill commands as fallback."""
        try:
            if os.name == 'nt':  # Windows
                subprocess.run(['taskkill', '/F', '/PID', str(pid)],
                               shell=True, check=False,
                               stderr=subprocess.DEVNULL,
                               stdout=subprocess.DEVNULL)
            else:  # Unix/Linux/MacOS
                subprocess.run(['kill', '-9', str(pid)],
                               shell=True, check=False,
                               stderr=subprocess.DEVNULL,
                               stdout=subprocess.DEVNULL)
        except Exception as e:
            logger.error(f"OS-level kill failed for PID {pid}: {e}")

    @classmethod
    def _find_and_kill_zombie_chromes(cls):
        """Find and kill any Chrome/Chromium processes left over from our app."""
        # Only use emergency cleanup when we have Chrome session marker
        marker = os.environ.get('SUSTAINABLE_WEB_ANALYZER_RUNNING', '')
        if not marker:
            return

        try:
            chrome_processes = []

            # Find Chrome/Chromium processes
            for proc in psutil.process_iter(['pid', 'name']):
                try:
                    proc_name = proc.info['name'].lower()
                    if any(name in proc_name for name in ['chrome', 'chromium']):
                        # Linux: chrome, chromium
                        # Windows: chrome.exe
                        # Mac: Google Chrome, Chromium
                        chrome_processes.append(proc)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            # Kill only recent processes (within 5 minutes)
            current_time = time.time()
            for proc in chrome_processes:
                try:
                    # Check if process is recent
                    if current_time - proc.create_time() < 300:  # 5 minutes
                        logger.info(f"Emergency cleanup: killing Chrome PID {proc.pid}")
                        cls._kill_process(proc.pid)
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Error during emergency Chrome cleanup: {e}")

    @classmethod
    async def create_browser(cls, timeout=30):
        """
        Create a new browser instance with improved timeout handling.

        Args:
            timeout: Browser launch timeout in seconds

        Returns:
            The browser or None if failed
        """
        try:
            logger.info("Creating new browser instance...")

            # Set an environment marker for emergency cleanup
            os.environ['SUSTAINABLE_WEB_ANALYZER_RUNNING'] = '1'

            # Better arguments for stability
            browser = await launch(
                headless=True,
                handleSIGINT=False,  # Disable signal handlers
                handleSIGTERM=False, # Disable signal handlers
                handleSIGHUP=False,  # Disable signal handlers
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-infobars',
                    '--window-size=1366,768',
                    '--disable-features=site-per-process',  # Can help with stability
                    '--disable-popup-blocking',
                    '--disable-notifications',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-breakpad',  # Disable crash reporting
                    '--disable-component-extensions-with-background-pages'
                ],
                ignoreHTTPSErrors=True,  # Ignore HTTPS errors for broader compatibility
                timeout=timeout * 1000  # Convert to ms
            )

            # Track the process ID for cleanup
            if browser.process is not None:
                cls._active_processes.add(browser.process.pid)

                # On Linux/Mac, we can also get child processes
                if hasattr(psutil, 'Process'):
                    try:
                        parent = psutil.Process(browser.process.pid)
                        children = parent.children(recursive=True)
                        for child in children:
                            cls._chrome_pids.add(child.pid)
                    except:
                        pass

                logger.info(f"Browser created successfully (PID: {browser.process.pid if browser.process else 'unknown'})")
            else:
                logger.warning(f"Browser created but process ID not available")

            return browser
        except Exception as e:
            logger.error(f"Error creating browser instance: {str(e)}")
            return None

    @classmethod
    async def analyze_with_new_browser(cls, analyze_func, url, timeout=30):
        """
        Run analysis function with a fresh browser instance.

        Args:
            analyze_func: Async function that accepts (browser, url) and performs analysis
            url: URL to analyze
            timeout: Timeout for browser operations in seconds

        Returns:
            Analysis results or None if failed
        """
        browser = None
        try:
            browser = await cls.create_browser(timeout=timeout)
            if not browser:
                logger.error("Failed to create browser")
                return None

            # Run the analysis function with timeout protection
            try:
                result = await asyncio.wait_for(
                    analyze_func(browser, url),
                    timeout=timeout
                )
                return result
            except asyncio.TimeoutError:
                logger.error(f"Analysis timed out after {timeout} seconds")
                return None

        except Exception as e:
            logger.error(f"Error during analysis: {str(e)}")
            return None
        finally:
            # Always close the browser
            if browser:
                pid = browser.process.pid if browser.process else None
                try:
                    logger.info(f"Closing browser (PID: {pid})...")
                    await browser.close()
                    logger.info("Browser closed successfully")

                    # Remove from active processes if successful
                    if pid and pid in cls._active_processes:
                        cls._active_processes.remove(pid)
                except Exception as e:
                    logger.error(f"Error closing browser: {str(e)}")

                    # Try to kill the process if it's still tracked
                    if pid and pid in cls._active_processes:
                        try:
                            cls._kill_process(pid)
                            if pid in cls._active_processes:
                                cls._active_processes.remove(pid)
                        except Exception as kill_error:
                            logger.error(f"Error force killing browser: {str(kill_error)}")

    @classmethod
    def run_async_analysis(cls, analyze_func, url, timeout=30):
        """
        Run async analysis in a new event loop.

        Args:
            analyze_func: Async function for browser analysis
            url: URL to analyze
            timeout: Timeout in seconds

        Returns:
            Analysis results or None if failed
        """
        # Create a new event loop for this thread
        try:
            # For most scenarios, get the current event loop or create new one
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
            except RuntimeError:
                # No event loop in this thread
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            # Run the analysis with a new browser
            return loop.run_until_complete(
                cls.analyze_with_new_browser(analyze_func, url, timeout=timeout)
            )
        except Exception as e:
            logger.error(f"Error running async analysis: {str(e)}")
            return None
        finally:
            # Ensure loop cleanup
            try:
                if loop and not loop.is_closed():
                    pending = asyncio.all_tasks(loop)
                    if pending:
                        # Cancel any pending tasks
                        for task in pending:
                            task.cancel()

                        # Allow them to complete
                        try:
                            loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                        except:
                            pass
            except Exception as e:
                logger.error(f"Error cleaning up event loop: {str(e)}")