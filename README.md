# Conference deadlines — agent-ready starter

A small static conference-deadline tracker based on [Pascal Cotret's list](https://pcotret.github.io/deadlines-confs/), with a lightweight UI and a JSON data file that an AI coding agent can maintain.

## What's included

- `index.html`, `styles.css`, `app.js`: dependency-free static site.
- `data/conferences.json`: conference list and individual deadline rounds.
- `AGENTS.md`: instructions for an AI agent to research, verify and update records safely.
- `.github/workflows/pages.yml`: deploys to GitHub Pages on pushes to `master`.
- `.github/workflows/validate.yml`: validates the dataset on pushes and pull requests.
- `.github/ISSUE_TEMPLATE/update-deadline.yml`: structured update requests.

The initial data is a snapshot transcribed from the source page on 2026-11-20. It is not independently re-verified against each conference's official site. Some dates are historical because they were present on the source page.

## Publish on GitHub Pages

1. Create a new GitHub repository and upload the contents of this ZIP (files at repository root).
2. Push to the `master` branch.
3. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
4. The `Deploy to GitHub Pages` workflow publishes the site automatically.

For a project page, the site works under a repository subpath because it uses relative asset paths.

## Let an agent maintain it

Open the repository with your preferred coding agent (Copilot coding agent, Claude Code, Codex, etc.) and ask:

> Follow AGENTS.md. Review upcoming conference deadlines against official conference websites, update only facts that can be verified, and open a pull request summarizing sources and changes.

No API key or server is required for the site. Agent research is performed by whichever coding agent you use; GitHub Actions only validates and deploys. This avoids putting an LLM secret in a public repository.

## Data format

Schema version 2 groups editions under a conference with a stable `id`, `acronym`, and `tags`. Each edition has its own unique `id`, `name`, `year`, `description`, `website`, `cfp_url`, `conference_dates`, `location`, `deadlines`, `discovery_status`, `last_verified`, and `sources`. A conference can have multiple editions, each with a completely different website. Do not overwrite or remove older editions when adding a year. `website` and `cfp_url` may be `null` when not known.

Each deadline has a positive `round`, `kind`, local wall time `deadline` (`YYYY-MM-DDTHH:mm:ss`), explicit `timezone`, and `sources`. Keep different submission types and rounds separate. Use `UNSPECIFIED` if the source does not state a timezone; do not silently assume UTC. Deadline and edition `sources` are arrays of direct official URLs supporting the relevant facts. Empty arrays mean no official source has been recorded, not that a fact is verified. Record disagreements and context in `notes` and in the pull request.

The site groups matching deadlines into one card per conference edition. Use `abstract`, `abstract_registration`, or `full_paper` as the `kind` when verified; `submission` means the submission type is unspecified, and other kinds are displayed as recorded. The status filter applies to individual deadlines, so a card shows only matching lines. Existing snapshot deadlines are all labeled `submission` and must not be reclassified without evidence.

The discovery statuses are `search_pending`, `website_found`, `verified`, `cfp_available`, `deadlines_verified`, `not_announced`, and `needs_review` (see `AGENTS.md`). `last_verified` is an ISO date or `null` and must reflect actual verification, not the import date. Record a search date separately as `last_searched` when appropriate. For statuses indicating verification, the validator requires a website, verification date and official edition sources; `cfp_available` also requires a CFP URL, and `deadlines_verified` requires official sources for every deadline. Validation checks structure, not the truth or authority of a source.

The migrated snapshot retains the original edition IDs, URLs and deadline details. Its `snapshot_source` and `snapshot_date` record the original third-party source and transcription date, not official verification. Those editions remain `search_pending`, with `last_verified` set to `null` and official source arrays empty until researched.

The website shows wall times with their recorded timezone. For `UNSPECIFIED`, it explicitly assumes AoE (UTC−12) for countdowns and past/upcoming filters without changing the stored source data. AoE, UTC/GMT and numeric UTC offsets use exact instants; other timezone formats fall back to date-only estimates relative to the viewer's local date and are labeled accordingly. Results are ordered by the recorded wall times. Confirm the actual cutoff with the conference.

Validate changes with `python scripts/validate.py`.

## Local preview

Run any static HTTP server from the repository root, e.g.:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Source and attribution

Initial conference list: https://pcotret.github.io/deadlines-confs/

The inspiration for the data-driven deadline-tracker approach is https://github.com/ccfddl/ccf-deadlines. This project is an independent, minimal implementation and does not copy its code.
