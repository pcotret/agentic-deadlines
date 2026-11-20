# Agent instructions

You maintain a conference deadline tracker. Treat deadline data as high-impact: an incorrect date can cause a missed submission.

## Before changing data
1. Read `data/conferences.json` and preserve its schema.
2. Verify each proposed change against the official conference website, CFP, or submission portal. Search snippets and third-party aggregators are discovery aids, not final evidence.
3. Prefer the current conference-year page over archived pages.
4. Never infer a deadline from a previous edition or from the conference date.
5. If the official source does not publish a deadline, keep the deadline absent rather than inventing one.
6. If a date is published without a time or timezone, preserve that uncertainty. Use `UNSPECIFIED` for timezone; do not label it AoE or UTC unless the source says so.
7. Keep distinct abstract, paper, journal-first, rebuttal, and round deadlines as distinct entries. Do not merge rounds.

## Editing rules
- Keep IDs stable. Use lowercase kebab-case for new IDs.
- Keep `deadlines[].deadline` in `YYYY-MM-DDTHH:mm:ss` local wall-time format.
- `deadlines[].timezone` must be an explicit timezone/zone label from the official source, or `UNSPECIFIED`.
- Add a concise `notes` field stating what the date represents and the source context.
- Update `last_verified` to today's date only for conferences you actually checked.
- Keep `source` pointing to the specific official page used when practical; include original list source for unchanged seed records.
- Do not delete past records unless asked. Historical data can be useful.
- Preserve tags from `Hardware`, `Security`, `VM & OS` unless a change is justified.

## Pull request requirements
- Summarize conferences checked, changes made, and unchanged items with uncertainty.
- Include direct official source URLs for every changed deadline.
- Clearly call out conflicting dates, ambiguous timezones, and dates that remain TBD.
- Run `python scripts/validate.py` before finishing.
- Do not claim a deadline is verified if the official source could not be accessed.

## Scope
This is a static GitHub Pages site. Do not add secrets, server-side services, trackers, or external dependencies without explicit instruction.
