# Conference deadlines — agent-ready starter

A small static conference-deadline tracker based on [Pascal Cotret's list](https://pcotret.github.io/deadlines-confs/), with a lightweight UI and a JSON data file that an AI coding agent can maintain.

## What's included

- `index.html`, `styles.css`, `app.js`: dependency-free static site.
- `data/conferences.json`: conference list and individual deadline rounds.
- `AGENTS.md`: instructions for an AI agent to research, verify and update records safely.
- `.github/workflows/pages.yml`: deploys to GitHub Pages on pushes to `main`.
- `.github/workflows/validate.yml`: validates the dataset on pushes and pull requests.
- `.github/ISSUE_TEMPLATE/update-deadline.yml`: structured update requests.

The initial data is a snapshot transcribed from the source page on 2026-11-20. It is not independently re-verified against each conference's official site. Some dates are historical because they were present on the source page.

## Publish on GitHub Pages

1. Create a new GitHub repository and upload the contents of this ZIP (files at repository root).
2. Push to the `main` branch.
3. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
4. The `Deploy to GitHub Pages` workflow publishes the site automatically.

For a project page, the site works under a repository subpath because it uses relative asset paths.

## Let an agent maintain it

Open the repository with your preferred coding agent (Copilot coding agent, Claude Code, Codex, etc.) and ask:

> Follow AGENTS.md. Review upcoming conference deadlines against official conference websites, update only facts that can be verified, and open a pull request summarizing sources and changes.

No API key or server is required for the site. Agent research is performed by whichever coding agent you use; GitHub Actions only validates and deploys. This avoids putting an LLM secret in a public repository.

## Data format

Each conference has metadata and a `deadlines` array. Keep separate rounds separate. Each deadline is ISO-like local wall time (`YYYY-MM-DDTHH:mm:ss`) plus an explicit timezone field. Use `UNSPECIFIED` if the source does not state a timezone; do not silently assume UTC. For future agent updates, prefer official conference CFP pages and record the evidence in `notes` and the pull request.

## Local preview

Run any static HTTP server from the repository root, e.g.:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Source and attribution

Initial conference list: https://pcotret.github.io/deadlines-confs/

The inspiration for the data-driven deadline-tracker approach is https://github.com/ccfddl/ccf-deadlines. This project is an independent, minimal implementation and does not copy its code.
