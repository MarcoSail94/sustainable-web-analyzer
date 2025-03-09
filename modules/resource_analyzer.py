"""
Resource analyzer module for examining web page resources.
Analyzes HTML content, extracts and categorizes resources,
measures their sizes and impact.
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from concurrent.futures import ThreadPoolExecutor
from utils.helpers import is_same_domain

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

    def analyze(self):
        """
        Perform the analysis on the page resources.
        Returns the resource data and metrics.
        """
        start_time = requests.get(self.url).elapsed.total_seconds()
        self.load_time = start_time

        try:
            # Add headers to avoid blocks
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }

            response = requests.get(self.url, headers=headers, timeout=10)
            response.raise_for_status()

            # Calculate load time
            self.load_time = response.elapsed.total_seconds()

            # Analyze HTML content
            self.analyze_html(response.text, response.headers)

            return {
                'resources': self.format_resources(),
                'total_size': self.total_size,
                'load_time': self.load_time,
                'third_party_count': len(self.third_party_domains)
            }

        except requests.exceptions.RequestException as e:
            return {'error': f"Error analyzing site: {str(e)}"}

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

        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')

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

        # Collect all external resources
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Analyze external CSS
            css_links = soup.find_all('link', rel='stylesheet')
            for link in css_links:
                if link.get('href'):
                    executor.submit(self.analyze_external_resource, link.get('href'), 'css')

            # Analyze external JavaScript
            js_links = soup.find_all('script', src=True)
            for script in js_links:
                if script.get('src'):
                    executor.submit(self.analyze_external_resource, script.get('src'), 'javascript')

            # Analyze images
            img_tags = soup.find_all('img')
            for img in img_tags:
                if img.get('src'):
                    executor.submit(self.analyze_external_resource, img.get('src'), 'images')

            # Analyze fonts
            font_links = soup.find_all('link', rel=lambda x: x and 'font' in x)
            for font in font_links:
                if font.get('href'):
                    executor.submit(self.analyze_external_resource, font.get('href'), 'fonts')

    def analyze_external_resource(self, url, resource_type):
        """
        Analyze an external resource by retrieving its size and properties.

        Args:
            url: URL of the resource
            resource_type: Type of resource (css, javascript, images, fonts, other)
        """
        try:
            # Handle relative URLs
            if url.startswith('//'):
                url = 'https:' + url
            elif not url.startswith(('http://', 'https://')):
                if url.startswith('/'):
                    url = f"https://{self.domain}{url}"
                else:
                    url = f"https://{self.domain}/{url}"

            # Check if this is a third-party domain
            if not is_same_domain(url, self.url):
                self.third_party_domains.add(urlparse(url).netloc)

            # Add to external resources list
            self.external_resources.append({
                'url': url,
                'type': resource_type
            })

            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Referer': self.url
            }

            # Use GET directly to avoid issues with HEAD
            try:
                response = requests.get(url, headers=headers, timeout=5, stream=True)
                size = len(response.content)
            except requests.exceptions.RequestException as e:
                # In case of error, set a default size
                print(f"Error retrieving {url}: {str(e)}")
                size = 0

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
            print(f"Error analyzing resource {url}: {str(e)}")

    def format_resources(self):
        """Format resources for reporting with readable sizes."""
        resources_formatted = {}
        for key, value in self.resources.items():
            # Convert size from bytes to KB or MB
            size_bytes = value['size']
            if size_bytes > 1024 * 1024:
                size_formatted = f"{round(size_bytes / (1024 * 1024), 2)} MB"
            else:
                size_formatted = f"{round(size_bytes / 1024)} KB"

            resources_formatted[key] = {
                'size': size_formatted,
                'size_bytes': size_bytes,
                'count': value['count'],
                'co2': round((size_bytes / (1024 * 1024)) * 0.2, 2)  # CO2 in grams
            }

        return resources_formatted