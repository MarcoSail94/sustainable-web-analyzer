"""
Browser manager module for handling Pyppeteer browser instance.
Provides thread-safe browser initialization, page creation, and cleanup.
"""

import os
import signal
import asyncio
import atexit
import threading
from concurrent.futures import ThreadPoolExecutor
from pyppeteer import launch
from pyppeteer.errors import NetworkError, TimeoutError

# Global browser instance
global_browser = None
browser_lock = threading.Lock()
browser_event = threading.Event()

class BrowserManager:
    """
    Manages a global Pyppeteer browser instance in a thread-safe manner.
    Handles initialization, page creation, and proper cleanup.
    """

    @staticmethod
    def initialize_browser():
        """Initialize a browser instance in a thread-safe way."""
        global global_browser

        # Return if browser is already initialized
        if global_browser is not None:
            return

        # Use lock to ensure only one thread initializes the browser
        with browser_lock:
            if global_browser is not None:
                return

            # Create a new thread for browser initialization
            future = ThreadPoolExecutor(max_workers=1).submit(BrowserManager._create_browser_in_thread)
            future.result()  # Wait for browser to be initialized

            # Set cleanup handler
            atexit.register(BrowserManager.shutdown)

    @staticmethod
    def _create_browser_in_thread():
        """Create a browser in a dedicated thread."""
        global global_browser, browser_event

        # Create a new event loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Launch browser with robust options
            global_browser = loop.run_until_complete(launch(
                headless=True,
                handleSIGINT=False,
                handleSIGTERM=False,
                handleSIGHUP=False,
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
            ))
            browser_event.set()  # Signal that browser is ready
        except Exception as e:
            print(f"Error initializing browser: {e}")
            global_browser = None

    @staticmethod
    def get_page():
        """Get a new page from the global browser in a thread-safe way."""
        global global_browser

        # Initialize browser if not initialized
        if global_browser is None:
            BrowserManager.initialize_browser()
            if not browser_event.wait(timeout=30):  # Wait up to 30 seconds
                raise Exception("Timeout during browser initialization")

        # Create a new loop for this thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            # Open a new page in the browser
            return loop.run_until_complete(global_browser.newPage())
        except Exception as e:
            print(f"Error opening a new page: {e}")
            # Try to reinitialize browser if error
            global_browser = None
            browser_event.clear()
            BrowserManager.initialize_browser()
            if not browser_event.wait(timeout=30):
                raise Exception("Timeout during browser reinitialization")
            return loop.run_until_complete(global_browser.newPage())

    @staticmethod
    def run_async(coro):
        """Run an async coroutine in a safe manner."""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()

    @staticmethod
    def shutdown():
        """Properly close the browser."""
        global global_browser

        if global_browser is None:
            return

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(global_browser.close())
        except Exception as e:
            print(f"Error closing browser: {e}")
            # In case of error, force kill the process
            try:
                if hasattr(global_browser, 'process') and global_browser.process is not None:
                    pid = global_browser.process.pid
                    if pid:
                        if os.name == 'nt':  # Windows
                            os.system(f'taskkill /F /PID {pid}')
                        else:  # Unix/Linux/MacOS
                            os.kill(pid, signal.SIGKILL)
            except:
                pass
        finally:
            global_browser = None
            browser_event.clear()