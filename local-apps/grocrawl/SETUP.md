# GroCrawl local setup

GroCrawl is Groniq's local SEO audit workspace, based on the downloaded
`C:\Users\mdtav\Downloads\LibreCrawl-main.zip`. Original LibreCrawl copyright
and MIT terms are retained in `LICENSE` (© 2025 Phiality). `README.md` is the
upstream documentation; use **this document** for the Groniq integration.

## Start on this machine

The isolated virtual environment has been installed and tested. In PowerShell:

```powershell
cd C:\groniq-site\local-apps\grocrawl
.\.venv\Scripts\python.exe run_local.py
```

Open **http://127.0.0.1:5000/**. Workspace and API share this origin. If port
5000 is already occupied by the verification server, use that running instance
or stop it before starting another. Ctrl+C stops the server.

Choose another port with `--port 5100`; then open `http://127.0.0.1:5100/`.
`--host` / `GROCRAWL_HOST` and `--port` / `GROCRAWL_PORT` are configurable.
The local runner refuses non-loopback hosts. Use the same host spelling in
your browser throughout a session.

## Fresh installation

Requires Python 3.11+ and an internet connection to install dependencies.
This machine has `uv` but does not expose `python` or `py` on PATH:

```powershell
cd C:\groniq-site\local-apps\grocrawl
uv venv --python 3.11 .venv
uv pip install --python .venv\Scripts\python.exe -r requirements.txt
.\.venv\Scripts\python.exe -m playwright install chromium
.\.venv\Scripts\python.exe run_local.py
```

Alternatively, with the standard Windows Python launcher:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m playwright install chromium
.\.venv\Scripts\python.exe run_local.py
```

Chromium is optional for HTTP crawls, required for JavaScript rendering.
Do not use the upstream Docker/start scripts as the GroCrawl launcher: their
network and authentication configuration is separate from this local profile.

## Workflow and limits

- Start with 50 pages, depth 3, HTTP HTML and a one-second delay. The local
  profile enforces one page at a time, a 500-page cap and a minimum 0.5-second
  page-request delay. robots.txt is always respected.
- URLs discovered from HTML are crawled. Sitemap probing, independent
  external-link/asset checks and PageSpeed API calls are off locally. Their
  reusable engine implementations remain in source. Rendering may request
  resources required by the page, subject to robots checks.
- Pause stops new work; an in-flight request may finish. Stop keeps partial
  results. History loads saved results, resumes recoverable saved checkpoints,
  archives and deletes audits. Resume capability depends on the upstream
  checkpoint; completed audits are loaded for inspection, not resumed.
- Export selects **URLs**, **Links** or **Issues**, then CSV, XLSX, JSON or XML.
  It exports the entire currently loaded dataset, not the filtered table.
  An active crawl export is a point-in-time partial dataset; stop or wait for
  completion for a stable complete export.
- `status_code` retains upstream final-response semantics (0 is a fetch-failure
  sentinel, not HTTP). New `initial_status`, `final_status`, `final_url`,
  `redirects`, `x_robots_tag`, `robots_directives` and `fetch_state` distinguish
  observations. Robots-blocked rows have null statuses. A redirect blocked by
  robots ends at the last observed response, with its unrequested destination
  recorded separately in `redirected_to`.
- Response milliseconds use received-response header timing across HTTP hops,
  excluding the deliberate crawl delay. They are not Core Web Vitals.
- Canonical differences are informational. Content/length rules require human
  review. No crawl result establishes Google indexing or selected canonical.
  The original E-E-A-T plugin is not loaded by this workspace; its retained
  source labels its score as a heuristic checklist, not Google's assessment.

## Storage and migration

`data/users.db` is the existing LibreCrawl SQLite schema. No downloaded database
was present in the archive, and no existing database was overwritten. The local
account owns local history. Sessions use an ephemeral signing key unless you
provide `SECRET_KEY`; restarting requires a fresh local session, but saved
history remains available through the local account.

Back up `data/users.db` with the server stopped before bringing an existing
LibreCrawl database into this project. Keep its original account records.
GroCrawl adds one nullable `crawled_urls.response_evidence` JSON column
idempotently; it does not rewrite or delete old rows. It preserves extra
response fields and updates saved referrer/link-status observations at final
save. Older rows cannot recover evidence never stored by the original version;
the UI labels unknown final destinations rather than guessing. Existing
user-owned history stays owned by that user, not automatically reassigned to
the new local account. Guest direct-access routes require matching guest
session ownership; guest access cannot read another user's crawl.

The source archive stays untouched. `verification/` contains test downloads,
screenshots and live audit evidence. Test audits in local history can be deleted
through History. Do not delete a user's database to reset test data.

## Static Groniq integration

From `C:\groniq-site`, run `npm.cmd run build`. This preserves the existing UTM
generation and CSS build, creates `/tools/grocrawl/` from the actual site shell,
then copies an explicit public asset allowlist into **dist/**. Netlify's publish
directory is now `dist`, rather than the entire repository. The build rejects
unexpected files in that directory. Python source, environments, databases,
credentials, test evidence and runtime caches are excluded.

No global tracking, homepage content, service content or other tool behavior
was edited. The public page links to local setup; it never sends crawl requests
to localhost. No deployment or hosting purchase has been performed.

## Verification commands

```powershell
cd C:\groniq-site
local-apps\grocrawl\.venv\Scripts\python.exe local-apps\grocrawl\tests\fixture_tests.py
local-apps\grocrawl\.venv\Scripts\python.exe local-apps\grocrawl\tests\grocrawl_regressions.py
# Requires the local app on port 5000 and installed Microsoft Edge:
local-apps\grocrawl\.venv\Scripts\python.exe local-apps\grocrawl\tests\browser_workflow.py
node --test tests/utm-builder.test.cjs
npm.cmd run build
```

Use `PYTHONUTF8=1` in terminals whose encoding cannot print upstream symbols.
See `HANDOFF.md` for results and limitations.

## Public hosting later

Do not expose `run_local.py`. Public hosting needs a separately configured
authenticated WSGI service, persistent database/backups, HTTPS and a same-origin
reverse proxy, authorization/CSRF tests, dependency/security review, crawl
quotas, background-worker/resource controls, and SSRF protection covering DNS,
redirects and browser resource requests. It also needs abuse controls and a
privacy/retention policy. Browser origin checks here protect local operation;
they are not a public deployment security boundary.

A companion Learn article can be authored separately: **“How to verify a
technical SEO finding: responses, robots directives, canonicals and recrawls.”**
No empty or duplicate Learn page was added.
