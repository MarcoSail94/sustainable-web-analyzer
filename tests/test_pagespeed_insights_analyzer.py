import unittest

from modules.pagespeed_insights_analyzer import PageSpeedInsightsAnalyzer


class PageSpeedInsightsAnalyzerTest(unittest.TestCase):
    def test_extracts_lighthouse_metrics(self):
        analyzer = PageSpeedInsightsAnalyzer(api_key=None)

        metrics = analyzer._extract_metrics({
            'id': 'https://example.com/',
            'analysisUTCTimestamp': '2026-06-19T12:00:00Z',
            'lighthouseResult': {
                'fetchTime': '2026-06-19T12:00:00Z',
                'categories': {
                    'performance': {'score': 0.91},
                    'accessibility': {'score': 0.82},
                    'best-practices': {'score': 0.77},
                    'seo': {'score': 0.88}
                },
                'audits': {
                    'largest-contentful-paint': {'numericValue': 2100},
                    'total-blocking-time': {'numericValue': 140},
                    'cumulative-layout-shift': {'numericValue': 0.05},
                    'speed-index': {'numericValue': 2300},
                    'server-response-time': {'numericValue': 120},
                    'interactive': {'numericValue': 3100},
                    'first-contentful-paint': {'numericValue': 900},
                    'total-byte-weight': {'numericValue': 204800},
                    'uses-text-compression': {'score': 1},
                    'modern-image-formats': {'score': 0.5},
                    'uses-long-cache-ttl': {'score': 0.8},
                    'unused-javascript': {'score': 0.4},
                    'network-requests': {
                        'details': {
                            'items': [
                                {
                                    'url': 'https://example.com/app.js',
                                    'resourceType': 'script',
                                    'transferSize': 50000
                                },
                                {
                                    'url': 'https://cdn.example.net/image.webp',
                                    'resourceType': 'image',
                                    'transferSize': 100000
                                }
                            ]
                        }
                    }
                }
            }
        })

        self.assertEqual(metrics['analyzer_type'], 'pagespeed_insights')
        self.assertEqual(metrics['lighthouse_score'], 91.0)
        self.assertEqual(metrics['accessibility_score'], 82.0)
        self.assertEqual(metrics['category_scores']['seo'], 88.0)
        self.assertEqual(metrics['lcp'], 2100)
        self.assertEqual(metrics['fid'], 140)
        self.assertEqual(metrics['cls'], 0.05)
        self.assertEqual(metrics['network_requests'], 2)
        self.assertEqual(metrics['network_stats']['js'], 50000)
        self.assertEqual(metrics['network_stats']['img'], 100000)
        self.assertEqual(metrics['network_stats']['third_party'], 100000)
        self.assertEqual(metrics['optimization_scores']['next_gen_images'], 0.5)
        self.assertEqual(metrics['resource_data']['source'], 'pagespeed-insights')
        self.assertEqual(metrics['resource_data']['total_size'], 204800)
        self.assertEqual(metrics['resource_data']['resources']['javascript']['count'], 1)
        self.assertEqual(metrics['resource_data']['resources']['images']['size_bytes'], 100000)


if __name__ == '__main__':
    unittest.main()
