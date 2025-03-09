"""
Helper functions for the Sustainable Web Analyzer.
Contains utility functions used across the application.
"""

from urllib.parse import urlparse

def is_same_domain(url, base_url):
    """
    Check if a URL belongs to the same domain as the base URL.

    Args:
        url: URL to check
        base_url: Base URL to compare against

    Returns:
        bool: True if URL belongs to the same domain, False otherwise
    """
    url_domain = urlparse(url).netloc
    base_domain = urlparse(base_url).netloc

    # Remove 'www.' if present for a more accurate comparison
    url_domain = url_domain.replace('www.', '')
    base_domain = base_domain.replace('www.', '')

    return url_domain == base_domain or url_domain.endswith('.' + base_domain)

def format_file_size(size_bytes):
    """
    Format a size in bytes to a human-readable string.

    Args:
        size_bytes: Size in bytes

    Returns:
        str: Formatted size (e.g., "1.23 MB", "456 KB")
    """
    if size_bytes >= 1024 * 1024:
        return f"{round(size_bytes / (1024 * 1024), 2)} MB"
    elif size_bytes >= 1024:
        return f"{round(size_bytes / 1024)} KB"
    else:
        return f"{size_bytes} B"

def get_resource_icon(resource_type):
    """
    Get the appropriate Font Awesome icon for a resource type.

    Args:
        resource_type: Type of resource (html, css, javascript, etc.)

    Returns:
        str: Font Awesome icon class
    """
    icons = {
        'html': 'fa-html5',
        'css': 'fa-css3-alt',
        'javascript': 'fa-js',
        'images': 'fa-image',
        'fonts': 'fa-font',
        'other': 'fa-file'
    }
    return icons.get(resource_type, 'fa-file')

def get_status_class(value, thresholds, reverse=False):
    """
    Get the CSS class for a status indicator based on thresholds.

    Args:
        value: Value to check
        thresholds: Tuple of (good, medium) thresholds
        reverse: If True, lower values are better; if False, higher values are better

    Returns:
        str: CSS class name ('status-good', 'status-needs-improvement', or 'status-poor')
    """
    good_threshold, medium_threshold = thresholds

    if reverse:
        # Lower values are better (like load time)
        if value <= good_threshold:
            return 'status-good'
        elif value <= medium_threshold:
            return 'status-needs-improvement'
        else:
            return 'status-poor'
    else:
        # Higher values are better (like sustainability score)
        if value >= good_threshold:
            return 'status-good'
        elif value >= medium_threshold:
            return 'status-needs-improvement'
        else:
            return 'status-poor'