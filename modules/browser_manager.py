"""
Browser manager module with browser per analysis approach.
Creates a new browser for each analysis, avoiding signal handling issues.
"""

import os
import asyncio
import atexit
import logging
import subprocess
from pyppeteer import launch
from pyppeteer.errors import NetworkError, TimeoutError

# Configura il logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BrowserManager:
    """
    Manages browser instances for web analysis.
    Creates a fresh browser for each analysis to ensure reliability.
    """

    @staticmethod
    async def create_browser():
        """
        Create a new browser instance.
        Returns the browser or None if failed.
        """
        try:
            logger.info("Creating new browser instance...")
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
                    '--disable-gpu'
                ]
            )
            logger.info("Browser created successfully")
            return browser
        except Exception as e:
            logger.error(f"Error creating browser instance: {str(e)}")
            return None

    @staticmethod
    async def analyze_with_new_browser(analyze_func, url):
        """
        Run analysis function with a fresh browser instance.

        Args:
            analyze_func: Async function that accepts (browser, url) and performs analysis
            url: URL to analyze

        Returns:
            Analysis results or None if failed
        """
        browser = None
        try:
            browser = await BrowserManager.create_browser()
            if not browser:
                logger.error("Failed to create browser")
                return None

            # Run the analysis function
            return await analyze_func(browser, url)

        except Exception as e:
            logger.error(f"Error during analysis: {str(e)}")
            return None
        finally:
            # Always close the browser
            if browser:
                try:
                    logger.info("Closing browser...")
                    await browser.close()
                    logger.info("Browser closed successfully")
                except Exception as e:
                    logger.error(f"Error closing browser: {str(e)}")

                    # Try to kill the process using OS-specific commands
                    # instead of signals to avoid thread issues
                    try:
                        if hasattr(browser, 'process') and browser.process is not None:
                            pid = browser.process.pid
                            if pid:
                                logger.info(f"Force killing browser process (PID: {pid})")
                                if os.name == 'nt':  # Windows
                                    subprocess.run(['taskkill', '/F', '/PID', str(pid)],
                                                   shell=True, check=False,
                                                   stderr=subprocess.DEVNULL,
                                                   stdout=subprocess.DEVNULL)
                                else:  # Unix/Linux/MacOS
                                    subprocess.run(['pkill', '-9', '-P', str(pid)],
                                                   shell=True, check=False,
                                                   stderr=subprocess.DEVNULL,
                                                   stdout=subprocess.DEVNULL)
                    except Exception as kill_error:
                        logger.error(f"Error force killing browser: {str(kill_error)}")

    @staticmethod
    def run_async_analysis(analyze_func, url):
        """
        Run async analysis in a new event loop.

        Args:
            analyze_func: Async function for browser analysis
            url: URL to analyze

        Returns:
            Analysis results or None if failed
        """
        # Create a new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Run the analysis with a new browser
            return loop.run_until_complete(
                BrowserManager.analyze_with_new_browser(analyze_func, url)
            )
        except Exception as e:
            logger.error(f"Error running async analysis: {str(e)}")
            return None
        finally:
            loop.close()