#!/usr/bin/env python3
import json, re, sys
from pathlib import Path
p=Path("data/conferences.json")
data=json.loads(p.read_text(encoding="utf-8"))
assert data.get("schema_version")==1
confs=data.get("conferences")
assert isinstance(confs,list) and confs, "conferences must be a non-empty list"
ids=set()
for c in confs:
    for field in ("id","name","year","description","url","deadlines","tags"):
        assert field in c, f"{c.get('id','?')}: missing {field}"
    assert c["id"] not in ids, f"duplicate id: {c['id']}"
    ids.add(c["id"])
    assert c["url"].startswith("https://"), f"{c['id']}: URL must use https"
    for d in c["deadlines"]:
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}",d["deadline"]), f"{c['id']}: invalid deadline {d['deadline']}"
        assert d.get("timezone"), f"{c['id']}: timezone must be explicit or UNSPECIFIED"
        assert isinstance(d.get("round"),int)
print(f"OK: {len(confs)} conferences, {sum(len(c['deadlines']) for c in confs)} deadline rounds")
