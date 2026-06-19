import unittest

from utils.url_validation import UnsafeUrlError, normalize_and_validate_url


def resolver_for(addresses):
    def resolve(_hostname):
        return addresses
    return resolve


class UrlValidationTest(unittest.TestCase):
    def test_adds_https_scheme(self):
        result = normalize_and_validate_url(
            'example.com/path',
            resolver=resolver_for(['93.184.216.34'])
        )

        self.assertEqual(result, 'https://example.com/path')

    def test_rejects_localhost(self):
        with self.assertRaises(UnsafeUrlError):
            normalize_and_validate_url('http://localhost:8080')

    def test_rejects_private_dns_result(self):
        with self.assertRaises(UnsafeUrlError):
            normalize_and_validate_url(
                'https://internal.example',
                resolver=resolver_for(['10.0.0.5'])
            )

    def test_rejects_credentials(self):
        with self.assertRaises(UnsafeUrlError):
            normalize_and_validate_url(
                'https://user:password@example.com',
                resolver=resolver_for(['93.184.216.34'])
            )

    def test_removes_fragment(self):
        result = normalize_and_validate_url(
            'https://example.com/path?x=1#section',
            resolver=resolver_for(['93.184.216.34'])
        )

        self.assertEqual(result, 'https://example.com/path?x=1')


if __name__ == '__main__':
    unittest.main()
