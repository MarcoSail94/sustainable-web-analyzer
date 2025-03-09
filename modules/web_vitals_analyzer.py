"""
Web Vitals Analyzer module for measuring Core Web Vitals metrics.
Uses Pyppeteer to collect LCP, FID, and CLS via real browser measurements.
"""

import json
from .browser_manager import BrowserManager
from config import Config

class WebVitalsAnalyzer:
    """
    Analyzer for Core Web Vitals (LCP, FID, CLS).
    Uses headless browser to measure real performance metrics.
    """

    def measure_web_vitals(self, url):
        """
        Measure Core Web Vitals for the given URL using robust browser handling.
        Returns the metrics or fallback values in case of error.
        """
        try:
            # Get a page from browser manager
            page = BrowserManager.get_page()

            # Setup viewport and page monitoring
            BrowserManager.run_async(self._setup_page_monitoring(page))

            # Navigate to URL and measure metrics
            metrics = BrowserManager.run_async(self._collect_metrics(page, url))

            # Close page when done
            BrowserManager.run_async(page.close())

            return metrics

        except Exception as e:
            print(f"Error measuring Web Vitals: {str(e)}")
            return self._fallback_values()

    async def _setup_page_monitoring(self, page):
        """Set up performance monitoring on the page."""
        # Set viewport to standard desktop size
        await page.setViewport({'width': 1280, 'height': 800})

        # Enable metrics and network monitoring
        await page.setCacheEnabled(False)
        client = await page.target.createCDPSession()
        await client.send('Network.enable')
        await client.send('Performance.enable')

        # Set up layout shift tracking for CLS
        await page.evaluateOnNewDocument('''() => {
            let cls = 0;
            let shifts = [];
            
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        cls += entry.value;
                        shifts.push({
                            value: entry.value,
                            timestamp: entry.startTime
                        });
                    }
                }
                window.cls = cls;
                window.layoutShifts = shifts;
            }).observe({type: 'layout-shift', buffered: true});
        }''')

    async def _collect_metrics(self, page, url):
        """Navigate to the URL and collect all Core Web Vitals metrics."""
        # Navigate to the URL
        response = await page.goto(url, {
            'waitUntil': 'networkidle2',
            'timeout': Config.BROWSER_TIMEOUT * 1000
        })

        # Measure LCP
        lcp = await page.evaluate('''() => {
            return new Promise((resolve) => {
                let lcp = 0;
                new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    lcp = lastEntry.startTime;
                    resolve(lcp);
                }).observe({type: 'largest-contentful-paint', buffered: true});
                
                // Fallback in case of timeout
                setTimeout(() => {
                    if (lcp === 0) resolve(3000);
                }, 8000);
            });
        }''')

        # Find first interactive element for FID measurement
        first_clickable = await page.evaluate('''() => {
            const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea'));
            const clickable = elements.filter(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
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
                # Set up FID observer
                await page.evaluate('''() => {
                    window.firstInputDelay = 0;
                    new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        if (entries.length > 0) {
                            window.firstInputDelay = entries[0].processingStart - entries[0].startTime;
                        }
                    }).observe({type: 'first-input', buffered: true});
                }''')

                # Simulate a click
                await page.mouse.click(
                    first_clickable.get('x', 0),
                    first_clickable.get('y', 0)
                )

                # Wait for FID to be recorded
                await page.waitForTimeout(1000)

                # Get FID value
                fid = await page.evaluate('() => window.firstInputDelay || 0')
            except Exception as click_error:
                print(f"Error simulating click: {str(click_error)}")
                fid = 100  # Fallback value

        # Get CLS
        cls = await page.evaluate('() => window.cls || 0')

        # Get performance info
        client = await page.target.createCDPSession()
        perf_metrics = await client.send('Performance.getMetrics')

        # Extract load time
        timing = await page.evaluate('() => JSON.stringify(window.performance.timing)')
        timing_obj = json.loads(timing)
        load_time = (timing_obj['loadEventEnd'] - timing_obj['navigationStart']) / 1000

        # Collect network information
        network_stats = await page.evaluate('''() => {
            const resources = performance.getEntriesByType('resource');
            const total = resources.reduce((acc, res) => acc + (res.transferSize || 0), 0);
            const js = resources.filter(r => r.name.endsWith('.js')).reduce((acc, res) => acc + (res.transferSize || 0), 0);
            const css = resources.filter(r => r.name.endsWith('.css')).reduce((acc, res) => acc + (res.transferSize || 0), 0);
            const img = resources.filter(r => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].some(ext => r.name.endsWith('.' + ext))).reduce((acc, res) => acc + (res.transferSize || 0), 0);
            const font = resources.filter(r => ['woff', 'woff2', 'ttf', 'otf'].some(ext => r.name.endsWith('.' + ext))).reduce((acc, res) => acc + (res.transferSize || 0), 0);
            
            return { total, js, css, img, font };
        }''')

        # Calculate scores
        web_vitals_scores = self.calculate_web_vitals_scores(lcp, fid, cls)

        return {
            'lcp': round(lcp, 2),  # milliseconds
            'fid': round(fid, 2),  # milliseconds
            'cls': round(cls, 3),  # score
            'scores': web_vitals_scores,
            'load_time': round(load_time, 2),  # seconds
            'network_stats': network_stats
        }

    def _fallback_values(self):
        """Generate fallback values for Web Vitals when measurement fails."""
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