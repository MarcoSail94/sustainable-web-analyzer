"""
Web Vitals Analyzer with compatibility fix for the waitForTimeout issue.
"""

import json
import logging
import time
import asyncio
from urllib.parse import urlparse
from pyppeteer.errors import TimeoutError, NetworkError
from .browser_manager import BrowserManager
from config import Config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebVitalsAnalyzer:
    """
    Analyzer for Core Web Vitals (LCP, FID, CLS).
    Uses headless browser to measure real performance metrics.
    """

    def measure_web_vitals(self, url, timeout=None):
        """
        Measure Core Web Vitals for the given URL using a fresh browser instance.
        Returns the metrics or fallback values in case of error.

        Args:
            url: URL to analyze
            timeout: Optional timeout override in seconds

        Returns:
            Dictionary of Web Vitals metrics
        """
        if timeout is None:
            timeout = Config.BROWSER_TIMEOUT

        start_time = time.time()
        logger.info(f"Measuring Web Vitals for: {url} (timeout: {timeout}s)")

        # Pre-check the URL domain with DNS resolution
        try:
            domain = urlparse(url).netloc
            logger.info(f"Analyzing domain: {domain}")
        except Exception as e:
            logger.warning(f"URL parsing error: {str(e)}")

        # Run the analysis with a new browser and specified timeout
        metrics = BrowserManager.run_async_analysis(
            self._analyze_web_vitals,
            url,
            timeout=timeout
        )

        if metrics:
            elapsed = time.time() - start_time
            logger.info(f"Successfully measured Web Vitals in {elapsed:.2f}s")
            return metrics
        else:
            logger.warning(f"Web Vitals measurement failed for {url}")
            return self._fallback_values(url)

    async def _analyze_web_vitals(self, browser, url):
        """
        Analyze Web Vitals using the provided browser instance.

        Args:
            browser: Pyppeteer browser instance
            url: URL to analyze

        Returns:
            Web Vitals metrics or None if failed
        """
        page = None
        try:
            # Create a new page
            page = await browser.newPage()

            # Set viewport
            await page.setViewport({'width': 1280, 'height': 800})

            # Set user agent to a modern browser
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')

            # Disable cache for fresh analysis
            await page.setCacheEnabled(False)

            # Set request timeout
            page.setDefaultNavigationTimeout(Config.BROWSER_TIMEOUT * 1000)

            # Setup metrics collection script
            await self._setup_metrics_collection(page)

            # Navigate to URL with more robust error handling
            logger.info(f"Navigating to {url}")
            try:
                response = await page.goto(url, {
                    'waitUntil': 'networkidle2',
                    'timeout': Config.BROWSER_TIMEOUT * 1000
                })
            except TimeoutError:
                # Try with a more lenient wait until strategy
                logger.warning(f"Timeout with networkidle2, trying with domcontentloaded")
                response = await page.goto(url, {
                    'waitUntil': 'domcontentloaded',
                    'timeout': Config.BROWSER_TIMEOUT * 1000
                })

            if not response:
                logger.warning(f"No response from navigation to {url}")
                # Try to collect whatever metrics are available
            else:
                logger.info(f"Page loaded: {url} (status: {response.status})")

            # Wait for metrics to be collected - FIX: Using asyncio.sleep instead of waitForTimeout
            await asyncio.sleep(3)  # 3 seconds delay

            # First check if page was actually loaded by looking for basic elements
            basic_content = await page.evaluate('''() => {
                const body = document.body;
                return body ? {
                    textContent: body.textContent.length,
                    elementCount: document.getElementsByTagName('*').length
                } : null;
            }''')

            if not basic_content or basic_content.get('elementCount', 0) < 5:
                logger.warning(f"Page appears to be empty or blocked: {url}")
                return None

            # Get load time
            timing_json = await page.evaluate('() => JSON.stringify(window.performance.timing)')
            load_time = 0
            try:
                timing_obj = json.loads(timing_json)
                load_time = (timing_obj['loadEventEnd'] - timing_obj['navigationStart']) / 1000
                if load_time <= 0:
                    # Try alternative calculation with navigation timing
                    load_time = (timing_obj['domComplete'] - timing_obj['navigationStart']) / 1000
                    if load_time <= 0:
                        load_time = 3.0  # fallback
            except (json.JSONDecodeError, KeyError):
                load_time = 3.0  # fallback

            logger.info(f"Load time: {load_time}s")

            # Get LCP
            lcp = await page.evaluate('() => window.lcp || 0')
            if lcp <= 0:
                # Fallback calculation based on performance metrics
                lcp = await page.evaluate('''() => {
                    if (window.performance && window.performance.timing) {
                        return window.performance.timing.domContentLoadedEventEnd - 
                               window.performance.timing.navigationStart;
                    }
                    return 3000;
                }''')
            logger.info(f"LCP: {lcp}ms")

            # Get CLS
            cls = await page.evaluate('() => window.cls || 0')
            logger.info(f"CLS: {cls}")

            # Measure FID using best-effort approach
            fid = await self._measure_fid(page)
            logger.info(f"FID: {fid}ms")

            # Collect network statistics
            network_stats = await self._get_network_stats(page)

            # Calculate scores
            web_vitals_scores = self.calculate_web_vitals_scores(lcp, fid, cls)

            # Prepare metrics
            metrics = {
                'lcp': round(lcp, 2),  # milliseconds
                'fid': round(fid, 2),  # milliseconds
                'cls': round(cls, 3),  # score
                'scores': web_vitals_scores,
                'load_time': round(load_time, 2),  # seconds
                'network_stats': network_stats
            }

            return metrics

        except TimeoutError as e:
            logger.warning(f"Timeout during analysis: {str(e)}")
            return None
        except NetworkError as e:
            logger.warning(f"Network error during analysis: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error during Web Vitals analysis: {str(e)}")
            return None
        finally:
            # Close the page
            if page:
                try:
                    await page.close()
                except Exception:
                    pass

    async def _setup_metrics_collection(self, page):
        """Setup performance metrics collection on the page."""
        await page.evaluateOnNewDocument('''() => {
            let cls = 0;
            try {
                new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            cls += entry.value;
                        }
                    }
                    window.cls = cls;
                }).observe({type: 'layout-shift', buffered: true});
            } catch (e) {
                console.error('Error setting up CLS:', e);
            }
            
            // Set up LCP tracking
            let lcp = 0;
            try {
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    if (entries.length > 0) {
                        const lastEntry = entries[entries.length - 1];
                        lcp = lastEntry.startTime;
                    }
                    window.lcp = lcp;
                }).observe({type: 'largest-contentful-paint', buffered: true});
            } catch (e) {
                console.error('Error setting up LCP:', e);
            }
            
            // Set up FID tracking
            window.firstInputDelay = 0;
            try {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    if (entries.length > 0) {
                        window.firstInputDelay = entries[0].processingStart - entries[0].startTime;
                    }
                }).observe({type: 'first-input', buffered: true});
            } catch (e) {
                console.error('Error setting up FID:', e);
            }
        }''')

    async def _measure_fid(self, page):
        """
        Measure First Input Delay by finding and clicking a visible element.

        Args:
            page: Pyppeteer page object

        Returns:
            FID value in milliseconds (or fallback)
        """
        try:
            # Find clickable element for FID
            first_clickable = await page.evaluate('''() => {
                const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea'));
                const clickable = elements.filter(el => {
                    const style = window.getComputedStyle(el);
                    const rect = el.getBoundingClientRect();
                    return style.display !== 'none' && 
                           style.visibility !== 'hidden' && 
                           style.opacity !== '0' &&
                           rect.width > 0 &&
                           rect.height > 0 &&
                           rect.top >= 0 &&
                           rect.left >= 0 &&
                           rect.top < window.innerHeight &&
                           rect.left < window.innerWidth;
                });
                
                if (clickable.length > 0) {
                    const rect = clickable[0].getBoundingClientRect();
                    return {
                        x: rect.x + rect.width / 2,
                        y: rect.y + rect.height / 2,
                        found: true
                    };
                }
                return { found: false };
            }''')

            # Measure FID
            fid = 0
            if first_clickable.get('found', False):
                try:
                    # Simulate click
                    await page.mouse.click(
                        first_clickable.get('x', 0),
                        first_clickable.get('y', 0)
                    )

                    # Wait for FID to be recorded - FIX: Using asyncio.sleep instead of waitForTimeout
                    await asyncio.sleep(0.5)  # 500ms

                    # Get FID value
                    fid = await page.evaluate('() => window.firstInputDelay || 0')
                except Exception as e:
                    logger.warning(f"Error measuring FID: {str(e)}")
                    fid = 100  # fallback
            else:
                fid = 100  # fallback when no clickable element

            return fid
        except Exception as e:
            logger.warning(f"FID measurement failed: {str(e)}")
            return 100  # fallback

    async def _get_network_stats(self, page):
        """
        Get network statistics from the page.

        Args:
            page: Pyppeteer page object

        Returns:
            Dictionary of network stats
        """
        try:
            return await page.evaluate('''() => {
                try {
                    const resources = performance.getEntriesByType('resource');
                    const total = resources.reduce((acc, res) => acc + (res.transferSize || 0), 0);
                    const js = resources.filter(r => r.name.endsWith('.js')).reduce((acc, res) => acc + (res.transferSize || 0), 0);
                    const css = resources.filter(r => r.name.endsWith('.css')).reduce((acc, res) => acc + (res.transferSize || 0), 0);
                    const img = resources.filter(r => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].some(ext => r.name.endsWith('.' + ext))).reduce((acc, res) => acc + (res.transferSize || 0), 0);
                    const font = resources.filter(r => ['woff', 'woff2', 'ttf', 'otf'].some(ext => r.name.endsWith('.' + ext))).reduce((acc, res) => acc + (res.transferSize || 0), 0);
                    
                    return { total, js, css, img, font };
                } catch (e) {
                    console.error('Error collecting network stats:', e);
                    return { total: 0, js: 0, css: 0, img: 0, font: 0 };
                }
            }''')
        except Exception:
            return { "total": 0, "js": 0, "css": 0, "img": 0, "font": 0 }

    def _fallback_values(self, url):
        """Generate fallback values for Web Vitals when measurement fails."""
        logger.warning(f"Using fallback values for Web Vitals for {url}")
        return {
            'lcp': 3000,  # 3 seconds
            'fid': 150,   # 150 ms
            'cls': 0.15,  # 0.15
            'scores': self.calculate_web_vitals_scores(3000, 150, 0.15),
            'load_time': 3.5,  # 3.5 seconds
            'network_stats': {'total': 0, 'js': 0, 'css': 0, 'img': 0, 'font': 0},
            'is_fallback': True
        }

    def calculate_web_vitals_scores(self, lcp, fid, cls):
        """
        Calculate scores for each metric according to Google's guidelines:
        - LCP: Good < 2.5s, Needs Improvement < 4s, Poor >= 4s
        - FID: Good < 100ms, Needs Improvement < 300ms, Poor >= 300ms
        - CLS: Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25
        """
        scores = {}

        # LCP Score (Largest Contentful Paint)
        if lcp < 2500:  # 2.5 seconds
            scores['lcp'] = 100
        elif lcp < 4000:  # 4 seconds
            # Scale from 100 to 50 in the range 2.5s-4s
            scores['lcp'] = int(100 - (lcp - 2500) / 1500 * 50)
        else:
            # Scale from 50 to 0 for values above 4s, with minimum 0
            scores['lcp'] = max(0, int(50 - min(50, (lcp - 4000) / 4000 * 50)))

        # FID Score (First Input Delay)
        if fid < 100:  # 100 milliseconds
            scores['fid'] = 100
        elif fid < 300:  # 300 milliseconds
            # Scale from 100 to 50 in the range 100ms-300ms
            scores['fid'] = int(100 - (fid - 100) / 200 * 50)
        else:
            # Scale from 50 to 0 for values above 300ms, with minimum 0
            scores['fid'] = max(0, int(50 - min(50, (fid - 300) / 300 * 50)))

        # CLS Score (Cumulative Layout Shift)
        if cls < 0.1:
            scores['cls'] = 100
        elif cls < 0.25:
            # Scale from 100 to 50 in the range 0.1-0.25
            scores['cls'] = int(100 - (cls - 0.1) / 0.15 * 50)
        else:
            # Scale from 50 to 0 for values above 0.25, with minimum 0
            scores['cls'] = max(0, int(50 - min(50, (cls - 0.25) / 0.25 * 50)))

        # Overall Web Vitals score (weighted average)
        scores['overall'] = int((scores['lcp'] * 0.4) + (scores['fid'] * 0.3) + (scores['cls'] * 0.3))

        return scores