import copy
import unittest

from validate import validate


class ValidateTests(unittest.TestCase):
    def setUp(self):
        self.data = {
            "schema_version": 2,
            "conferences": [{
                "id": "example", "acronym": "EX", "tags": ["Security"],
                "editions": [{
                    "id": "example-2026", "name": "EX 2026", "year": 2026,
                    "description": "Example", "website": "https://example.org",
                    "cfp_url": None, "conference_dates": "TBA", "location": "TBA",
                    "discovery_status": "search_pending", "last_verified": None,
                    "sources": [], "deadlines": [{
                        "round": 1, "deadline": "2026-12-01T23:59:00",
                        "timezone": "UNSPECIFIED", "kind": "submission", "sources": [],
                    }],
                }],
            }],
        }

    def test_multiple_editions_and_unknown_website(self):
        edition = copy.deepcopy(self.data["conferences"][0]["editions"][0])
        edition.update(id="example-2027", year=2027, website=None, deadlines=[])
        self.data["conferences"][0]["editions"].append(edition)
        self.assertEqual(validate(self.data), (1, 2, 1))

    def test_duplicate_edition_year_is_rejected(self):
        edition = copy.deepcopy(self.data["conferences"][0]["editions"][0])
        edition["id"] = "another-id"
        self.data["conferences"][0]["editions"].append(edition)
        with self.assertRaisesRegex(AssertionError, "duplicate edition year"):
            validate(self.data)

    def test_verified_deadlines_require_evidence(self):
        edition = self.data["conferences"][0]["editions"][0]
        edition.update(discovery_status="deadlines_verified", last_verified="2026-11-20",
                       sources=["https://example.org/cfp"])
        with self.assertRaisesRegex(AssertionError, "verified deadlines require official sources"):
            validate(self.data)
        edition["deadlines"][0]["sources"] = ["https://example.org/cfp"]
        self.assertEqual(validate(self.data), (1, 1, 1))

    def test_invalid_calendar_date_is_rejected(self):
        deadline = self.data["conferences"][0]["editions"][0]["deadlines"][0]
        deadline["deadline"] = "2026-02-30T23:59:00"
        with self.assertRaisesRegex(AssertionError, "invalid deadline"):
            validate(self.data)


if __name__ == "__main__":
    unittest.main()
