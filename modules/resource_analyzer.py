"""
Resource analyzer module for examining web page resources.
Analyzes HTML content, extracts and categorizes resources,
measures their sizes and impact with improved error handling.
"""

import requests
import time
import logging
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from concurrent.futures import ThreadPoolExecutor, as_completed
from utils.helpers import is_same_domain, format_file_size
from config import Config

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ResourceAnalyzer:
    """
    Analyzes web page resources: HTML, CSS, JavaScript, images, fonts, etc.
    Determines their sizes, counts, and environmental impacts.
    """

    def __init__(self, url):
        """Initialize analyzer with the URL to analyze."""
        self.url = url
        self.domain = urlparse(url).netloc
        self.resources = {
            'html': {'size': 0, 'count': 0},
            'css': {'size': 0, 'count': 0},
            'javascript': {'size': 0, 'count': 0},
            'images': {'size': 0, 'count': 0},
            'fonts': {'size': 0, 'count': 0},
            'other': {'size': 0, 'count': 0}
        }
        self.total_size = 0
        self.load_time = 0
        self.external_resources = []
        self.third_party_domains = set()
        self.session = requests.Session()  # Use session for connection pooling

    def analyze(self):
        """
        Perform the analysis on the page resources.
        Returns the resource data and metrics.
        """
        logger.info(f"Starting resource analysis for {self.url}")
        start_time = time.time()

        try:
            # Add headers to avoid blocks
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
            }

            # Set timeout to avoid hanging requests
            timeout = Config.BROWSER_TIMEOUT

            try:
                response = self.session.get(self.url, headers=headers, timeout=timeout)
                response.raise_for_status()
            except requests.exceptions.SSLError as e:
                logger.warning(f"SSL error for {self.url}, trying without verification: {str(e)}")
                response = self.session.get(self.url, headers=headers, timeout=timeout, verify=False)
                response.raise_for_status()

            # Calculate load time
            self.load_time = response.elapsed.total_seconds()

            # Debug info
            logger.info(f"Got response in {self.load_time}s (status: {response.status_code}, size: {len(response.content)} bytes)")

            # Check content type
            content_type = response.headers.get('Content-Type', '').lower()
            if 'text/html' not in content_type and 'application/xhtml+xml' not in content_type:
                logger.warning(f"Response is not HTML content type: {content_type}")

                # Handle redirects to catch common issues
                if response.history:
                    redirect_chain = ' -> '.join([str(r.status_code) for r in response.history])
                    logger.info(f"Redirect chain: {redirect_chain}")

                # For non-HTML content, create a fallback
                self.resources['other']['size'] += len(response.content)
                self.resources['other']['count'] += 1
                self.total_size += len(response.content)

                return {
                    'resources': self.format_resources(),
                    'total_size': self.total_size,
                    'load_time': self.load_time,
                    'third_party_count': 0,
                    'non_html_content': True
                }

            # Analyze HTML content
            self.analyze_html(response.text, response.headers)

            elapsed = time.time() - start_time
            logger.info(f"Analysis completed in {elapsed:.2f}s")

            return {
                'resources': self.format_resources(),
                'total_size': self.total_size,
                'load_time': self.load_time,
                'third_party_count': len(self.third_party_domains)
            }

        except requests.exceptions.RequestException as e:
            logger.error(f"Error analyzing site: {str(e)}")
            return {'error': f"Error analyzing site: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error during analysis: {str(e)}")
            return {'error': f"Unexpected error during analysis: {str(e)}"}

    def analyze_html(self, html_content, headers):
        """
        Analyze HTML content and extract resources.

        Args:
            html_content: The HTML content of the page
            headers: The HTTP response headers
        """
        # Analyze HTML size
        html_size = len(html_content)
        self.resources['html']['size'] = html_size
        self.resources['html']['count'] = 1
        self.total_size += html_size

        # Parse HTML with BeautifulSoup with error handling
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
        except Exception as e:
            logger.error(f"Error parsing HTML: {str(e)}")
            # Return early with partial data
            return

        # Analyze inline CSS
        style_tags = soup.find_all('style')
        for style in style_tags:
            if style.string:
                size = len(style.string)
                self.resources['css']['size'] += size
                self.resources['css']['count'] += 1
                self.total_size += size

        # Analyze inline JavaScript
        script_tags = soup.find_all('script')
        for script in script_tags:
            if script.string and not script.has_attr('src'):
                size = len(script.string)
                self.resources['javascript']['size'] += size
                self.resources['javascript']['count'] += 1
                self.total_size += size

        # Collect all external resources with concurrent processing
        resource_urls = []

        # Gather CSS links
        for link in soup.find_all('link', rel='stylesheet'):
            if link.get('href'):
                resource_urls.append((link.get('href'), 'css'))

        # Gather JavaScript links
        for script in soup.find_all('script', src=True):
            if script.get('src'):
                resource_urls.append((script.get('src'), 'javascript'))

        # Gather images
        for img in soup.find_all('img'):
            if img.get('src'):
                resource_urls.append((img.get('src'), 'images'))

        # Gather fonts
        for font_link in soup.find_all('link', rel=lambda x: x and 'font' in x):
            if font_link.get('href'):
                resource_urls.append((font_link.get('href'), 'fonts'))

        # Process resources concurrently but limit concurrency
        # to avoid overwhelming the server
        max_workers = min(10, len(resource_urls))
        if max_workers > 0:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                # Start the resource analysis tasks
                future_to_resource = {
                    executor.submit(self.analyze_external_resource, url, resource_type):
                        (url, resource_type) for url, resource_type in resource_urls
                }

                # Process results as they complete
                for future in as_completed(future_to_resource):
                    url, resource_type = future_to_resource[future]
                    try:
                        future.result()  # Get any exceptions
                    except Exception as e:
                        logger.warning(f"Error analyzing resource {url}: {str(e)}")

    def analyze_external_resource(self, url, resource_type):
        """
        Analyze an external resource by retrieving its size and properties.

        Args:
            url: URL of the resource
            resource_type: Type of resource (css, javascript, images, fonts, other)
        """
        try:
            full_url = self._normalize_url(url)

            # Skip invalid URLs
            if not full_url:
                return

            # Skip duplicate URLs
            if any(r.get('url') == full_url for r in self.external_resources):
                return

            # Check if this is a third-party domain
            if not is_same_domain(full_url, self.url):
                self.third_party_domains.add(urlparse(full_url).netloc)

            # Add to external resources list
            self.external_resources.append({
                'url': full_url,
                'type': resource_type
            })

            # Standard headers for resource requests
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': self.url
            }

            # Set shorter timeout for resource fetches
            timeout = 5  # seconds

            # Use HEAD request first to check resource availability and size
            try:
                head_response = self.session.head(full_url, headers=headers, timeout=timeout)

                # If Content-Length is available, use it
                content_length = head_response.headers.get('Content-Length')
                if content_length and content_length.isdigit():
                    size = int(content_length)
                    logger.debug(f"Got size from Content-Length: {size} bytes for {full_url}")
                else:
                    # Fall back to GET if Content-Length is not available
                    response = self.session.get(full_url, headers=headers, timeout=timeout, stream=True)
                    size = 0

                    # Read in chunks to avoid loading large files fully into memory
                    chunk_size = 8192  # 8KB chunks
                    for chunk in response.iter_content(chunk_size=chunk_size):
                        size += len(chunk)

                        # Limit resource size analysis to avoid excessive memory usage
                        max_analyzed_size = 1024 * 1024 * 5  # 5MB
                        if size > max_analyzed_size:
                            logger.warning(f"Resource too large, limiting size analysis: {full_url}")
                            break

                    logger.debug(f"Got size from content: {size} bytes for {full_url}")
            except requests.exceptions.RequestException as e:
                # Log the error but continue with other resources
                logger.warning(f"Error retrieving {full_url}: {str(e)}")
                # Estimate a small size for the resource to account for it
                size = 1024  # 1KB default size

            # Update statistics for the resource type
            if resource_type in self.resources:
                self.resources[resource_type]['size'] += size
                self.resources[resource_type]['count'] += 1
                self.total_size += size
            else:
                # Use 'other' if resource type is not valid
                self.resources['other']['size'] += size
                self.resources['other']['count'] += 1
                self.total_size += size

        except Exception as e:
            logger.warning(f"Error analyzing resource {url}: {str(e)}")

    def _normalize_url(self, url):
        """
        Normalize a URL to an absolute URL.

        Args:
            url: Relative or absolute URL

        Returns:
            Absolute URL or None if invalid
        """
        try:
            # Handle protocol-relative URLs
            if url.startswith('//'):
                url = 'https:' + url
            # Handle relative URLs
            elif not url.startswith(('http://', 'https://')):
                base = f"https://{self.domain}" if url.startswith('/') else f"https://{self.domain}/"
                url = urljoin(base, url)

            return url
        except Exception as e:
            logger.warning(f"Error normalizing URL {url}: {str(e)}")
            return None

    def format_resources(self):
        """Format resources for reporting with readable sizes."""
        resources_formatted = {}
        for key, value in self.resources.items():
            # Convert size from bytes to KB or MB
            size_bytes = value['size']
            size_formatted = format_file_size(size_bytes)

            resources_formatted[key] = {
                'size': size_formatted,
                'size_bytes': size_bytes,
                'count': value['count'],
                'co2': round((size_bytes / (1024 * 1024)) * Config.CO2_PER_MB, 2)  # CO2 in grams
            }

        return resources_formatted