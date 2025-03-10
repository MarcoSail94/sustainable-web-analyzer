"""
Web Vitals Analyzer module for measuring Core Web Vitals metrics.
Uses a fresh browser instance for each analysis to ensure reliability.
"""

import json
import logging
import time
from pyppeteer.errors import TimeoutError, NetworkError
from .browser_manager import BrowserManager
from config import Config

# Configura il logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WebVitalsAnalyzer:
    """
    Analyzer for Core Web Vitals (LCP, FID, CLS).
    Uses headless browser to measure real performance metrics.
    """

    def measure_web_vitals(self, url):
        """
        Measure Core Web Vitals for the given URL using a fresh browser instance.
        Returns the metrics or fallback values in case of error.
        """
        start_time = time.time()
        logger.info(f"Measuring Web Vitals for: {url}")

        # Run the analysis with a new browser
        metrics = BrowserManager.run_async_analysis(self._analyze_web_vitals, url)

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

            # Disable cache
            await page.setCacheEnabled(False)

            # Set up layout shift tracking for CLS
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
            }''')

            # Navigate to URL
            logger.info(f"Navigating to {url}")
            response = await page.goto(url, {
                'waitUntil': 'networkidle2',
                'timeout': Config.BROWSER_TIMEOUT * 1000
            })

            if not response:
                logger.warning(f"No response from navigation to {url}")
                return None

            logger.info(f"Page loaded: {url} (status: {response.status})")

            # Wait for metrics to be collected
            await page.waitForTimeout(2000)

            # Get load time
            timing_json = await page.evaluate('() => JSON.stringify(window.performance.timing)')
            load_time = 0
            try:
                timing_obj = json.loads(timing_json)
                load_time = (timing_obj['loadEventEnd'] - timing_obj['navigationStart']) / 1000
                if load_time <= 0:
                    load_time = 3.0
            except (json.JSONDecodeError, KeyError):
                load_time = 3.0

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

            # Setup for FID measurement
            await page.evaluate('''() => {
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
                           rect.height > 0;
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

                    # Wait for FID to be recorded
                    await page.waitForTimeout(500)

                    # Get FID value
                    fid = await page.evaluate('() => window.firstInputDelay || 0')
                except Exception as e:
                    logger.warning(f"Error measuring FID: {str(e)}")
                    fid = 100  # fallback
            else:
                fid = 100  # fallback when no clickable element

            logger.info(f"FID: {fid}ms")

            # Collect network statistics
            network_stats = await page.evaluate('''() => {
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