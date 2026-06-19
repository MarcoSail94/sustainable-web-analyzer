"""
URL validation helpers for server-side website analysis.

The analyzer fetches user-supplied URLs from the server, so every URL must be
limited to public HTTP(S) destinations before any network request is made.
"""

import ipaddress
import socket
from urllib.parse import urlsplit, urlunsplit


class UnsafeUrlError(ValueError):
    """Raised when a URL is not safe for server-side fetching."""


BLOCKED_HOSTNAMES = {'localhost'}
BLOCKED_SUFFIXES = ('.localhost', '.local')


def normalize_and_validate_url(url, resolver=None):
    """
    Normalize a user-provided URL and ensure it resolves only to public IPs.

    Args:
        url: Raw URL or domain entered by the user.
        resolver: Optional resolver function for tests. It receives a hostname
            and returns an iterable of IP strings.

    Returns:
        A normalized HTTP(S) URL without fragments.

    Raises:
        UnsafeUrlError: If the URL is malformed or points to a private address.
    """
    if not isinstance(url, str):
        raise UnsafeUrlError('URL must be a string')

    normalized = url.strip()
    if not normalized:
        raise UnsafeUrlError('URL is empty')

    if '://' not in normalized:
        normalized = 'https://' + normalized

    parsed = urlsplit(normalized)
    if parsed.scheme not in ('http', 'https'):
        raise UnsafeUrlError('Only http and https URLs are supported')

    if not parsed.hostname:
        raise UnsafeUrlError('URL must include a hostname')

    if parsed.username or parsed.password:
        raise UnsafeUrlError('URLs with credentials are not supported')

    hostname = parsed.hostname.rstrip('.').lower()
    _validate_hostname(hostname, resolver=resolver)

    netloc = hostname
    if parsed.port:
        netloc = f'{hostname}:{parsed.port}'

    path = parsed.path or '/'
    return urlunsplit((parsed.scheme, netloc, path, parsed.query, ''))


def _validate_hostname(hostname, resolver=None):
    if hostname in BLOCKED_HOSTNAMES or hostname.endswith(BLOCKED_SUFFIXES):
        raise UnsafeUrlError('Local hostnames are not allowed')

    try:
        ip = _as_ip_address(hostname)
    except ValueError:
        addresses = _resolve_hostname(hostname, resolver=resolver)
    else:
        addresses = [ip]

    if not addresses:
        raise UnsafeUrlError('Hostname does not resolve')

    for address in addresses:
        ip = _as_ip_address(address)
        if not ip.is_global:
            raise UnsafeUrlError('URL resolves to a non-public IP address')


def _resolve_hostname(hostname, resolver=None):
    if resolver:
        return [_as_ip_address(address) for address in resolver(hostname)]

    try:
        results = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise UnsafeUrlError('Hostname does not resolve') from exc

    return {
        _as_ip_address(result[4][0])
        for result in results
    }


def _as_ip_address(value):
    if isinstance(value, (ipaddress.IPv4Address, ipaddress.IPv6Address)):
        return value
    return ipaddress.ip_address(value)
