"""
Formatters for displaying data in the Sustainable Web Analyzer.
Contains functions for formatting data for display in reports and UI.
"""

def format_currency(value, currency='€', decimals=2):
    """
    Format a value as currency.

    Args:
        value: Numeric value to format
        currency: Currency symbol (default: '€')
        decimals: Number of decimal places (default: 2)

    Returns:
        str: Formatted currency string
    """
    return f"{currency}{value:.{decimals}f}"

def format_percent(value, decimals=0):
    """
    Format a value as a percentage.

    Args:
        value: Numeric value to format (0-100 or 0-1)
        decimals: Number of decimal places (default: 0)

    Returns:
        str: Formatted percentage string
    """
    # Handle both 0-100 and 0-1 ranges
    if value < 0:
        value = 0
    elif value <= 1 and decimals == 0:
        value = value * 100
    elif value > 100:
        value = 100

    return f"{value:.{decimals}f}%"

def format_time(seconds, milliseconds=False):
    """
    Format time in seconds to a human-readable string.

    Args:
        seconds: Time in seconds
        milliseconds: Whether to include milliseconds (default: False)

    Returns:
        str: Formatted time string
    """
    if milliseconds:
        return f"{seconds:.2f}s"
    else:
        minutes, secs = divmod(seconds, 60)
        if minutes > 0:
            return f"{int(minutes)}m {int(secs)}s"
        else:
            return f"{secs:.1f}s"

def format_co2(grams):
    """
    Format CO2 emissions in grams to a human-readable string.

    Args:
        grams: CO2 emissions in grams

    Returns:
        str: Formatted CO2 string
    """
    if grams >= 1000:
        return f"{grams/1000:.2f} kg CO₂"
    else:
        return f"{grams:.2f} g CO₂"

def get_sustainability_score_description(score):
    """
    Get a description of a sustainability score.

    Args:
        score: Sustainability score (0-100)

    Returns:
        str: Description of the score
    """
    if score >= 80:
        return "Excellent - Your site is very efficient"
    elif score >= 70:
        return "Good - Your site is efficient but has room for improvement"
    elif score >= 50:
        return "Fair - Your site needs some optimization"
    elif score >= 30:
        return "Poor - Your site requires significant improvements"
    else:
        return "Critical - Your site needs urgent optimization"

def get_web_vital_status(metric, value):
    """
    Get the status of a Web Vital metric.

    Args:
        metric: Web Vital metric name ('lcp', 'fid', or 'cls')
        value: Metric value

    Returns:
        tuple: (status, description)
    """
    if metric == 'lcp':  # Largest Contentful Paint (seconds)
        if value < 2.5:
            return 'good', 'Good'
        elif value < 4.0:
            return 'needs-improvement', 'Needs Improvement'
        else:
            return 'poor', 'Poor'
    elif metric == 'fid':  # First Input Delay (milliseconds)
        if value < 100:
            return 'good', 'Good'
        elif value < 300:
            return 'needs-improvement', 'Needs Improvement'
        else:
            return 'poor', 'Poor'
    elif metric == 'cls':  # Cumulative Layout Shift (score)
        if value < 0.1:
            return 'good', 'Good'
        elif value < 0.25:
            return 'needs-improvement', 'Needs Improvement'
        else:
            return 'poor', 'Poor'
    return 'unknown', 'Unknown'