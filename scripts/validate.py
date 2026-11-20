#!/usr/bin/env python3
import json
import re
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse


STATUSES = {
    "search_pending", "website_found", "verified", "cfp_available",
    "deadlines_verified", "not_announced", "needs_review",
}


def valid_url(value):
    if not isinstance(value, str):
        return False
    parsed = urlparse(value)
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def valid_date(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        return False
    try:
        date.fromisoformat(value)
        return True
    except ValueError:
        return False


def validate(data):
    assert data.get("schema_version") == 2, "expected schema version 2"
    conferences = data.get("conferences")
    assert isinstance(conferences, list) and conferences, "conferences must be a non-empty list"
    ids, edition_ids = set(), set()
    edition_count = deadline_count = 0
    for conference in conferences:
        cid = conference.get("id")
        assert isinstance(cid, str) and cid, "conference id is required"
        assert cid not in ids, f"duplicate conference id: {cid}"
        ids.add(cid)
        assert isinstance(conference.get("acronym"), str) and conference["acronym"], f"{cid}: acronym is required"
        assert isinstance(conference.get("tags"), list) and all(isinstance(t, str) and t for t in conference["tags"]), f"{cid}: invalid tags"
        editions = conference.get("editions")
        assert isinstance(editions, list) and editions, f"{cid}: editions must be a non-empty list"
        years = set()
        for edition in editions:
            eid = edition.get("id")
            assert isinstance(eid, str) and eid and eid not in edition_ids, f"{cid}: missing or duplicate edition id: {eid}"
            edition_ids.add(eid)
            year = edition.get("year")
            assert type(year) is int and 1 <= year <= 9999 and year not in years, f"{eid}: invalid or duplicate edition year"
            years.add(year)
            edition_count += 1
            for field in ("name", "description", "conference_dates", "location"):
                assert isinstance(edition.get(field), str) and edition[field], f"{eid}: missing {field}"
            for field in ("website", "cfp_url"):
                assert field in edition and (edition[field] is None or valid_url(edition[field])), f"{eid}: invalid {field}"
            status = edition.get("discovery_status")
            assert status in STATUSES, f"{eid}: invalid discovery status"
            verified = edition.get("last_verified")
            assert "last_verified" in edition and (verified is None or valid_date(verified)), f"{eid}: invalid last_verified"
            assert "last_searched" not in edition or valid_date(edition["last_searched"]), f"{eid}: invalid last_searched"
            sources = edition.get("sources")
            assert isinstance(sources, list) and all(valid_url(s) for s in sources), f"{eid}: invalid sources"
            if status in {"verified", "cfp_available", "deadlines_verified"}:
                assert edition["website"] and verified and sources, f"{eid}: verified status requires a website, verification date and official sources"
            if status == "cfp_available":
                assert edition["cfp_url"], f"{eid}: CFP status requires a CFP URL"
            for field in ("snapshot_source",):
                assert field not in edition or valid_url(edition[field]), f"{eid}: invalid {field}"
            assert "snapshot_date" not in edition or valid_date(edition["snapshot_date"]), f"{eid}: invalid snapshot_date"
            deadlines = edition.get("deadlines")
            assert isinstance(deadlines, list), f"{eid}: deadlines must be a list"
            for deadline in deadlines:
                value = deadline.get("deadline")
                assert isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", value), f"{eid}: invalid deadline {value}"
                try:
                    datetime.fromisoformat(value)
                except ValueError:
                    raise AssertionError(f"{eid}: invalid deadline {value}") from None
                assert type(deadline.get("round")) is int and deadline["round"] > 0, f"{eid}: invalid round"
                for field in ("timezone", "kind"):
                    assert isinstance(deadline.get(field), str) and deadline[field], f"{eid}: {field} is required"
                sources = deadline.get("sources")
                assert isinstance(sources, list) and all(valid_url(s) for s in sources), f"{eid}: invalid deadline sources"
                if status == "deadlines_verified":
                    assert sources, f"{eid}: verified deadlines require official sources"
                deadline_count += 1
    return len(conferences), edition_count, deadline_count


if __name__ == "__main__":
    data = json.loads(Path("data/conferences.json").read_text(encoding="utf-8"))
    conferences, editions, deadlines = validate(data)
    print(f"OK: {conferences} conferences, {editions} editions, {deadlines} deadline rounds")
