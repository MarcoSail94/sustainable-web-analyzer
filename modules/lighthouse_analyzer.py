"""
Lighthouse Web Vitals Analyzer module.
Uses Google Lighthouse to analyze Core Web Vitals and other performance metrics.
"""

import os
import json
import logging
import subprocess
import tempfile
from urllib.parse import urlparse
import shutil
from config import Config

# Configura logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LighthouseAnalyzer:
    """
    Analyzer for Web Performance using Google Lighthouse.
    Calculates Core Web Vitals and other performance metrics.
    """

    def __init__(self):
        """Initialize the Lighthouse analyzer."""
        # Verifica se Lighthouse CLI è installato
        self.lighthouse_path = self._find_lighthouse_binary()

    def measure_web_vitals(self, url, timeout=None, options=None):
        """
        Measure Core Web Vitals and performance metrics using Lighthouse.

        Args:
            url: URL to analyze
            timeout: Optional timeout override in seconds
            options: Optional dictionary of Lighthouse options

        Returns:
            Dictionary of Web Vitals metrics
        """
        if timeout is None:
            timeout = Config.BROWSER_TIMEOUT

        start_time = logger.info(f"Measuring Web Vitals using Lighthouse for: {url} (timeout: {timeout}s)")

        # Pre-check the URL domain
        try:
            domain = urlparse(url).netloc
            logger.info(f"Analyzing domain: {domain}")
        except Exception as e:
            logger.warning(f"URL parsing error: {str(e)}")

        # Set default Lighthouse options
        lighthouse_options = {
            'onlyCategories': ['performance'],
            'output': 'json',
            'quiet': True,
            'maxWaitForLoad': timeout * 1000,  # Convert to ms
            'throttling': {
                'cpuSlowdownMultiplier': 1,
                'requestLatencyMs': 0,
                'downloadThroughputKbps': 0,
                'uploadThroughputKbps': 0
            }
        }

        # Update with user options if provided
        if options and isinstance(options, dict):
            lighthouse_options.update(options)

        try:
            # Run Lighthouse and get metrics
            metrics = self._run_lighthouse(url, lighthouse_options)
            return metrics
        except Exception as e:
            logger.error(f"Lighthouse analysis failed: {str(e)}")
            return self._fallback_values(url)

    def _run_lighthouse(self, url, options):
        """
        Run Lighthouse CLI and parse the results.

        Args:
            url: URL to analyze
            options: Lighthouse options

        Returns:
            Dictionary with Web Vitals metrics
        """
        if not self.lighthouse_path:
            raise EnvironmentError("Lighthouse not found. Please install it with: npm install -g lighthouse")

        # Create a temporary file for the Lighthouse report
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp_file:
            temp_filename = tmp_file.name

        try:
            # Construct the Lighthouse command
            cmd = [
                self.lighthouse_path,
                url,
                '--output=json',
                f'--output-path={temp_filename}',
                '--chrome-flags="--headless --no-sandbox --disable-gpu"',
                '--quiet'
            ]

            # Add category
            cmd.append('--only-categories=performance')

            # Run Lighthouse
            logger.info(f"Running Lighthouse with command: {' '.join(cmd)}")
            process = subprocess.run(
                cmd,
                check=True,
                stderr=subprocess.PIPE,
                stdout=subprocess.PIPE,
                text=True,
                timeout=Config.BROWSER_TIMEOUT + 30  # Add some buffer to the timeout
            )

            # Read the JSON report
            with open(temp_filename, 'r') as f:
                lighthouse_data = json.load(f)

            # Extract Web Vitals and other metrics
            return self._extract_metrics(lighthouse_data)

        except subprocess.SubprocessError as e:
            logger.error(f"Lighthouse process error: {str(e)}")
            if hasattr(e, 'stderr'):
                logger.error(f"Stderr: {e.stderr}")
            raise RuntimeError(f"Lighthouse process failed: {str(e)}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Lighthouse JSON: {str(e)}")
            raise RuntimeError(f"Invalid Lighthouse JSON output: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error during Lighthouse analysis: {str(e)}")
            raise
        finally:
            # Clean up the temporary file
            if os.path.exists(temp_filename):
                os.unlink(temp_filename)

    def _extract_metrics(self, lighthouse_data):
        """
        Extract Web Vitals and performance metrics from Lighthouse data.

        Args:
            lighthouse_data: The Lighthouse JSON report data

        Returns:
            Dictionary with Web Vitals metrics
        """
        try:
            # Get the audits section
            audits = lighthouse_data.get('audits', {})

            # Extract Core Web Vitals
            lcp_audit = audits.get('largest-contentful-paint', {})
            fid_audit = audits.get('max-potential-fid', {})  # Lighthouse uses max-potential-fid as a proxy
            cls_audit = audits.get('cumulative-layout-shift', {})

            # Convert to milliseconds if needed
            lcp_value = lcp_audit.get('numericValue', 0)
            fid_value = fid_audit.get('numericValue', 0)
            cls_value = cls_audit.get('numericValue', 0)

            # Extract other useful metrics
            speed_index = audits.get('speed-index', {}).get('numericValue', 0)
            ttfb = audits.get('server-response-time', {}).get('numericValue', 0)
            time_to_interactive = audits.get('interactive', {}).get('numericValue', 0)

            # Get the overall performance score
            categories = lighthouse_data.get('categories', {})
            performance_score = categories.get('performance', {}).get('score', 0) * 100

            # Calculate Web Vitals scores
            web_vitals_scores = self.calculate_web_vitals_scores(lcp_value, fid_value, cls_value)

            # Prepare the metrics dictionary
            metrics = {
                'lcp': round(lcp_value, 2),  # milliseconds
                'fid': round(fid_value, 2),  # milliseconds
                'cls': round(cls_value, 3),  # score
                'scores': web_vitals_scores,
                'lighthouse_score': round(performance_score, 1),
                'speed_index': round(speed_index, 2),
                'ttfb': round(ttfb, 2),
                'time_to_interactive': round(time_to_interactive, 2),
                'load_time': round(time_to_interactive / 1000, 2),  # Approximate load time in seconds
                'network_stats': self._extract_network_stats(lighthouse_data)
            }

            return metrics
        except Exception as e:
            logger.error(f"Error extracting metrics from Lighthouse data: {str(e)}")
            raise RuntimeError(f"Failed to extract metrics: {str(e)}")

    def _extract_network_stats(self, lighthouse_data):
        """
        Extract network statistics from Lighthouse data.

        Args:
            lighthouse_data: The Lighthouse JSON report data

        Returns:
            Dictionary of network stats
        """
        try:
            network_stats = {
                'total': 0,
                'js': 0,
                'css': 0,
                'img': 0,
                'font': 0,
                'other': 0
            }

            # Extract network details from the audit
            network_requests = lighthouse_data.get('audits', {}).get('network-requests', {})
            items = network_requests.get('details', {}).get('items', [])

            for item in items:
                resource_size = item.get('transferSize', 0)
                resource_type = item.get('resourceType', 'other').lower()

                # Update total size
                network_stats['total'] += resource_size

                # Update specific type size
                if resource_type in ['script', 'javascript']:
                    network_stats['js'] += resource_size
                elif resource_type in ['stylesheet', 'css']:
                    network_stats['css'] += resource_size
                elif resource_type in ['image', 'img']:
                    network_stats['img'] += resource_size
                elif resource_type in ['font']:
                    network_stats['font'] += resource_size
                else:
                    network_stats['other'] += resource_size

            return network_stats
        except Exception as e:
            logger.warning(f"Error extracting network stats: {str(e)}")
            return {
                'total': 0,
                'js': 0,
                'css': 0,
                'img': 0,
                'font': 0,
                'other': 0
            }

    def _find_lighthouse_binary(self):
        """
        Find the Lighthouse binary in the system.

        Returns:
            Path to the Lighthouse binary or None if not found
        """
        # Check if we have a custom path in config
        custom_path = getattr(Config, 'LIGHTHOUSE_PATH', None)
        if custom_path and os.path.exists(custom_path):
            return custom_path

        # Try to find 'lighthouse' in PATH
        lighthouse_path = shutil.which('lighthouse')
        if lighthouse_path:
            return lighthouse_path

        # Try common locations
        common_paths = [
            '/usr/local/bin/lighthouse',
            '/usr/bin/lighthouse',
            # Windows paths with Node.js installation
            'C:\\Program Files\\nodejs\\lighthouse',
            'C:\\Program Files (x86)\\nodejs\\lighthouse',
            # NPM global paths
            os.path.expanduser('~/.npm-global/bin/lighthouse'),
            os.path.expanduser('~/npm/bin/lighthouse'),
            os.path.expanduser('~/node_modules/.bin/lighthouse')
        ]

        for path in common_paths:
            if os.path.exists(path):
                return path

        logger.warning("Lighthouse binary not found. Ensure it's installed with 'npm install -g lighthouse'")
        return None

    def _fallback_values(self, url):
        """Generate fallback values for Web Vitals when measurement fails."""
        logger.warning(f"Using fallback values for Web Vitals for {url}")
        return {
            'lcp': 3000,  # 3 seconds
            'fid': 150,   # 150 ms
            'cls': 0.15,  # 0.15
            'scores': self.calculate_web_vitals_scores(3000, 150, 0.15),
            'lighthouse_score': 50,  # Default middle score
            'speed_index': 4500,
            'ttfb': 600,
            'time_to_interactive': 5000,
            'load_time': 5.0,  # 5 seconds
            'network_stats': {'total': 0, 'js': 0, 'css': 0, 'img': 0, 'font': 0, 'other': 0},
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