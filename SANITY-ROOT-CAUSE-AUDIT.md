# 1. Executive Summary

Audit date: 2026-10-12. Diagnosis only; no production code, schemas, dependencies, settings, or content changed. Public response copies and test results are in `audit-evidence/`.

**The live portfolio is reading deployed snapshots, not querying Sanity on page load. Those snapshots differ from the current published dataset. There is also a confirmed image-rendering mismatch and missing project content in the generated artifacts.** Sanity's public API itself returned HTTP 200.

Important scope limitation: the supplied workspace, `C:\groniq-site`, is a different application: Groniq at `groniqdigital.com`. The portfolio source, Studio, schemas, generator, and deployment settings are not present. This is an evidence-backed partial forensic report, not a claim that all 20 phases or all underlying causes were verified. The actual portfolio/Studio folder path was requested during the audit.

Architecture map:

| Layer | Observed architecture |
|---|---|
| Supplied workspace | Static Groniq HTML pages, tools and learning pages; one root package.json and npm lockfile |
| Local framework | Next.js 16.3.8 / React 19.2.8 declared; starter homepage in src/app/page.tsx; separate static index.html |
| Local deploy recipe | netlify.toml publishes `.`, runs `npm run build`, disables Next plugin; build generates UTM HTML and CSS |
| Local server function | netlify/functions/contact.js; email delivery, not CMS |
| Portfolio production | Static HTML listing pages load data/db.js, then js/cms-loader.js; clean-slug detail pages already contain generated HTML |
| Observed CMS origin | Public dataset `1nhwbh5x/production`, corroborated by image URLs and two exact document IDs in snapshot |
| Studio/schema/generator | NOT VERIFIED — requires actual portfolio and Studio source |
| Production delivery | Responses identify Cloudflare; underlying hosting provider/build command NOT VERIFIED |

# 2. Root Cause

## A. Published dataset and deployed snapshot diverge

ROOT CAUSE: At the deployed read layer, the frontend accepts a bundled content snapshot as authoritative and does not refresh it. The snapshot contains a case study absent from the current published dataset.

EVIDENCE: [Live loader](https://mdtavrejansari.com/js/cms-loader.js), lines 173–178, assigns `window.cmsDatabase`, calls `hydratePages()`, and returns. `audit-evidence/runtime-results.json` and `loader-unit-results.json` record zero fetches. Snapshot ID `7c2da528-cbf3-4a2d-9792-dff6a1aacaf7` is absent from the unrestricted published document inventory in `sanity-public-query.json`. Both project IDs match the dataset exactly. Snapshot JSON and JS payloads are identical at audit time.

FAILURE PATH: Sanity published dataset → **unverified generation/deployment boundary** → divergent data/db.js → unconditional snapshot selection → outdated case-study listing and generated detail page.

WHY PREVIOUS REBUILDS DID NOT FIX IT: Rebuilding/reconnecting Studio alone cannot update a separately deployed snapshot. Whether previous frontend rebuilds ran, queried the intended dataset, or deployed successfully is NOT VERIFIED. An exact historical explanation requires build/deploy logs.

This proves divergence and the frontend behavior. It does **not** prove a missing webhook, wrong build query, wrong production dataset setting, or failed deployment. The image-origin dataset is strongly corroborated, but Studio identity and the generator's configured dataset remain unverified.

## B. Published project sections are absent before rendering

ROOT CAUSE: The delivered project representation lacks content present in the published Sanity document. The loss occurs at or before snapshot/detail generation, not inside the listing renderer.

EVIDENCE: Published project `7BFJOwll8u80YQvAZo97d8` contains Portable Text `objective`, `whatIBuilt`, `outcome`, and `whatILearned`. Exact-text comparisons found objective/whatIBuilt in both snapshot and detail HTML, but outcome/whatILearned in neither. See `sanity-content.json`, `data_db.js.txt:20`, and `projects_google-ads-dental-clinic-campaign_.txt`.

FAILURE PATH: Sanity project → unknown build query/transformation/version → snapshot with only some sections → static detail HTML missing outcome and lessons.

WHY PREVIOUS REBUILDS DID NOT FIX IT: NOT VERIFIED — requires generator code and historical logs. Rebuilding an unchanged incomplete projection or converter would preserve the omission, but that explanation is not yet established.

## C. Card renderer ignores available cover image

ROOT CAUSE: `getCardImage()` inspects only an HTML `<img src="...">` inside `item.content`; it never reads `item.coverImage`.

EVIDENCE: Loader lines 505–518; snapshot lines 77–78 give Spacia a text-only body and a valid coverImage. Isolated execution returns a gradient. A HEAD request to the image returned HTTP 200, image/png.

FAILURE PATH: generated coverImage URL → card data → getCardImage ignores field → gradient instead of cover photo.

WHY PREVIOUS REBUILDS DID NOT FIX IT: A content rebuild cannot change the deployed renderer's field selection. Historical deployment of renderer revisions is NOT VERIFIED.

# 3. Verified Working Parts

- Public homepage, all four listing URLs, dental project detail, and Spacia detail returned HTTP 200.
- Anonymous direct Sanity API query returned HTTP 200 for `1nhwbh5x/production`.
- Published inventory contains two project documents; their IDs, titles and slugs agree with deployed snapshot entries.
- Executed downloaded loader and database in JSDOM with the actual downloaded homepage/listing HTML: homepage 3 cards, projects 2, case studies 1, articles/resources 0 with empty-state messages. This is DOM execution, not a visual browser or complete third-party-script test.
- Dental objective and whatIBuilt text reach generated detail HTML.
- Spacia image asset is reachable independently of card rendering.
- JS and JSON snapshot contents agree at audit time.

# 4. Verified Broken Parts

- Deployed case-study presence differs from the published inventory of the dataset corroborated by deployed assets/project IDs.
- Dental outcome and whatILearned content present in Sanity is absent from generated snapshot/detail HTML.
- Card coverImage field is ignored; Spacia renders a gradient in the DOM test.
- Spacia's deployed body is literally `Coming soon. technical error` in both snapshot and detail HTML. It is stored content in these artifacts, not an observed thrown runtime exception. Current case-study source content cannot be compared because no corresponding published document was returned.
- Unversioned cms-loader.js has a one-year immutable cache header; data/db.js has four-hour freshness. This creates a demonstrated cache configuration obstacle to immediate updates, although a particular user's stale browser cache was not inspected.

Empty articles/resources do not by themselves prove a broken query: neither type appears in the published inventory or snapshot. A `technology` document titled Groniq UTM Builder exists; it is not a `resource`. Intended modeling of that entry requires Studio/schema inspection.

# 5. Not Verified

- NOT VERIFIED — requires actual portfolio repository and Studio folder: every schema, validation, query, converter, build script, preview configuration, dependency compatibility, and local production build.
- NOT VERIFIED — requires Studio configuration/account: intended project/dataset, draft documents, release documents, references as edited in Studio, publishing success, and CORS settings.
- NOT VERIFIED — requires deployment configuration/logs: build query/API version/token permissions, branch/commit/base/publish directory, generation failures, webhook delivery, deletion handling, and origin hosting provider.
- NOT VERIFIED — requires authenticated draft access: whether absent case study/articles/resources are drafts, unpublished, deleted, in a release, or in another dataset. No authenticated credentials were requested or exposed.
- NOT VERIFIED — requires browser session: browser console/network, cached older JS, visual layout and user-specific failures. JSDOM tests cover downloaded CMS scripts, not all page scripts.
- NOT VERIFIED — requires controlled authorized publish/edit test: new/updated content latency. No content was created, edited, or deleted.
- NOT VERIFIED — requires representative published resource/article: detail generation, Drive downloads, file downloads and external destination behavior end-to-end.

The production build was not run: the actual portfolio build source is unavailable. Running this workspace's `npm run build` would generate unrelated Groniq HTML/CSS in place (`build-utm-builder.js:1608–1609`, package.json:8), contrary to the diagnosis-only constraint. No build success/failure is claimed. Node v22.23.1 and npm.cmd 10.9.8 were observed locally; production versions are unknown. PowerShell blocked npm.ps1; npm.cmd worked, so this is not classified as an application fault.

# 6. Local vs Production Matrix

PASS here means the specified test passed, not that the whole pipeline is healthy. Local means actual portfolio running from source; downloaded production code executed locally is listed separately above.

| Check | Local portfolio | Production |
|---|---|---|
| Sanity connection | NOT VERIFIED | PASS: anonymous API read; site itself uses snapshot |
| Projects listing | NOT VERIFIED | PASS: 2 cards in production-artifact DOM test |
| Project detail | NOT VERIFIED | FAIL: HTTP 200 but confirmed missing source sections |
| Articles listing | NOT VERIFIED | PASS: HTTP 200 and correct empty state for observed dataset |
| Article detail | NOT VERIFIED | NOT VERIFIED: no representative published article |
| Resources | NOT VERIFIED | PASS: listing/empty state only; content flow NOT VERIFIED |
| Case studies | NOT VERIFIED | FAIL: snapshot entry absent from published inventory |
| Images | NOT VERIFIED | FAIL: coverImage ignored; asset HTTP request PASS |
| New content | NOT VERIFIED | NOT VERIFIED: no publish test |
| Updated content | NOT VERIFIED | NOT VERIFIED: no edit test; existing divergence confirmed |

# 7. Content-Type Matrix

| Type | Data exists | Query works | Frontend receives | Component renders | Production works |
|---|---|---|---|---|---|
| Projects | PASS: 2 published | PASS: diagnostic API query | PASS: matching IDs in snapshot | PASS: cards; FAIL: missing detail sections | Partial; FAIL for complete body |
| Articles | No published documents observed | PASS: inventory, zero | Empty snapshot | PASS: empty state | Actual article pipeline NOT VERIFIED |
| Resources | No published documents observed | PASS: inventory, zero | Empty snapshot | PASS: empty state | External/internal resource pipeline NOT VERIFIED |
| Case studies | Snapshot 1; published inventory 0 | PASS: inventory | PASS: old snapshot entry | PASS: card/static placeholder body | FAIL: dataset/snapshot divergence |
| Images | PASS: published assets | PASS: inventory | PASS: coverImage in snapshot | FAIL: cover image discarded | Asset PASS; card FAIL |

These are diagnostic queries, not verified copies of the application's missing build queries.

# 8. Configuration Matrix

| Source | Variable/setting | Value/source | Use/scope | Consistency |
|---|---|---|---|---|
| Local index.html:7,14; sitemap.xml:4 | Identity | Groniq / groniqdigital.com | Local static application | NO: differs from requested portfolio |
| Local package.json:6–9 | dev/build/start | next dev / generator + CSS / next start | Local Groniq | Different dev/build pipelines; not proof of portfolio fault |
| Local netlify.toml:2–6 | publish/build/plugin | . / npm run build / skip Next=true | Local deployment recipe | Consistent with static Groniq |
| Local contact.js:4,149,159 | CONTACT_RECIPIENT_EMAIL, RESEND_API_KEY, RESEND_FROM_EMAIL | Server environment; email/from defaults | Contact runtime only | No Sanity relationship; dashboard values NOT VERIFIED |
| Local source/package/lockfile | SANITY_*, Sanity packages/config | None found | Local | Portfolio configuration unavailable |
| Production db.js:78 | Image project/dataset | 1nhwbh5x / production | Public image URL | Corroborated by matching project document IDs |
| Production loader:14–15 | FALLBACK_DB_URL / DB_URL | relative data/db.json; /api/content only on port 8080 | Browser | No Sanity client configured in this loader |
| Production loader:175–178 | window.cmsDatabase | data/db.js snapshot | Browser preferred source | Bypasses all fetching when nonempty |
| Diagnostic request | apiVersion/perspective/useCdn | 2025-02-19 / published / direct api.sanity.io | Audit only | NOT the unknown application build configuration |
| Portfolio generator/Studio | projectId,dataset,apiVersion,token,useCdn,perspective | NOT VERIFIED | Build/Studio | Cannot establish full consistency |

No local .env variants, sanity.config.*, sanity.cli.*, CMS client, schema directory, or Sanity/Portable Text lock entries were found. No portfolio environment variable names can honestly be inferred from Groniq. Exact portfolio variable names require its source; do not invent NEXT_PUBLIC_* requirements for a static generator.

# 9. Evidence

## Discovery scope

Recursive workspace source/config inventory, including hidden configuration, public assets and scratch scripts: 118 files enumerated before evidence output. Dependency/build directories and browser-profile databases/caches were excluded from application-source searches. Package lock was separately inspected for Sanity/Portable Text dependencies. Initial broad discovery also identified the browser-profile directories; they were not treated as application code. Matches for `projectId` were the Groniq research tool's local project identifier; portfolio-name matches were social/contact links. No actual Sanity client/config was found. `case-studies/index.html` does not exist here. `git status` reported this directory is not a Git repository.

## Public requests

Public homepage initially failed through web retrieval and sandboxed Node (`EACCES`). A permitted read-only network retry succeeded. The initial access failures are tool-environment limitations, not website outages.

Base: `https://mdtavrejansari.com/`. HTTP 200 observed for `/`, `/projects/`, `/case-studies/`, `/articles/`, `/resources/`, `/data/db.js`, `/data/db.json`, `/js/cms-loader.js`, `/projects/google-ads-dental-clinic-campaign/`, and `/case-studies/spacia-interiors-conversion-focused-landing-page/`.

Observed Cache-Control:

- cms-loader.js: `public, max-age=31536000, immutable`
- data/db.js: `public, max-age=14400, must-revalidate`
- data/db.json and sampled HTML: `public,max-age=0,must-revalidate`

Headers were printed during requests; body copies are stored in audit-evidence. Response caches vary over time; these are audit-time observations.

Direct diagnostic API:

`https://1nhwbh5x.api.sanity.io/v2025-02-19/data/query/production?perspective=published&query=<URL-encoded GROQ>`

```groq
*[]{_id,_type,_updatedAt,title,slug,status,coverImage,mainImage}
```

Returned 12 published objects: two project documents, one category, one technology, one file asset, seven image assets. No published case-study, article or resource object of any type appeared in this unrestricted inventory.

```groq
*[_type in ["project","article","resource","caseStudy","case_study","technology"]]
```

Returned two projects and one technology. Full public results saved in sanity-content.json. No token was used. Diagnostic API version is chosen for this test, not inferred from Studio.

## End-to-end trace: dental project

1. Public dataset returns `_id=7BFJOwll8u80YQvAZo97d8`, `_type=project`, slug.current `google-ads-dental-clinic-campaign`.
2. The actual build GROQ is unavailable; diagnostic query retrieves the document and its Portable Text sections successfully.
3. Deployed db.js transforms identity to `id`, `type=projects`, scalar `slug`, `status=published`, and HTML `content`. Title/slug agree exactly.
4. Objective and whatIBuilt survive. Outcome and whatILearned are absent from snapshot and generated detail HTML. This is the first observable content loss; assigning it to a particular missing query/converter function would be speculation.
5. Browser initCMS selects snapshot; hydratePages filters status; hydrateListContainer filters type; createItemCard receives the transformed item and creates its clean-slug link. JSDOM verifies two project cards and no fetch.
6. Dental clean-slug detail returns HTTP 200 with pre-generated body. It does not include db.js/cms-loader.js, so its missing sections cannot be repaired by the listing loader.

## Second trace: Spacia case study

1. Published inventory does not contain snapshot ID `7c2da528-cbf3-4a2d-9792-dff6a1aacaf7`; draft/deletion history unknown.
2. db.js still contains that ID with status published, text-only placeholder content and a valid coverImage.
3. Loader accepts snapshot and renders its card. getCardImage returns a gradient despite the reachable cover asset.
4. Clean-slug static detail returns HTTP 200 and the same placeholder at saved HTML line 136. Snapshot and generated detail are mutually consistent but not consistent with current published presence.

## Field comparison: observed documents, not unavailable schema definitions

| Type | Observed Sanity field | Build query expects | Delivered/component field | Assessment |
|---|---|---|---|---|
| Project | _id / _type=project | NOT VERIFIED | id / type=projects | Transformation observed and working |
| Project | slug.current | NOT VERIFIED | scalar slug | Transformation observed and working |
| Project | objective, whatIBuilt Portable Text | NOT VERIFIED | content HTML | Survives in representative project |
| Project | outcome, whatILearned Portable Text | NOT VERIFIED | no corresponding body content | Confirmed omission before rendering |
| Case study | Current published source absent | NOT VERIFIED | coverImage + content HTML | Cannot validate source schema |
| Image | snapshot coverImage | NOT VERIFIED | getCardImage searches content img | Confirmed renderer mismatch |
| Article/resource | No published representative | NOT VERIFIED | type/status/slug/content, resourceMode/destination | Schema match NOT VERIFIED |

No React server/client boundaries, hydration, ISR or framework fetch revalidation occur in the inspected deployed CMS loader. Do not apply the unrelated local Next.js configuration to this portfolio.

## Queries, errors, routing, and caching

All CMS-loader fetches are lines 183 (DB_URL) and 195 (FALLBACK_DB_URL). No browser GROQ occurs there. Errors at 189–191 are discarded; fallback errors at 200–201 become a generic warning. Non-OK primary/fallback responses do not report status or response details. Initial snapshot hydration at 177 is outside these catches. Data validation is limited: content.filter, string content.match, and string tag.toLowerCase assume compatible types; no malformed-data failure was demonstrated.

Detail fallback function reads only `?slug=` at 415–425, whereas links are clean paths at 246–247. **Not classified as a current route failure:** tested clean detail pages are generated HTML and do not load this fallback. Prefix handles only one parent level; again not an active failure on sampled generated detail pages using explicit ../../ script URLs.

Resource destinations use resourceMode/destination at 240–244. No published resource was available to exercise external/download behavior. References in the sampled project fields are mostly string lists; complete schema validation and unresolved-reference checks remain unavailable.

CORS: the production CMS path executes browser-side but reads same-origin static files and, with the snapshot present, makes no fetch. No CORS failure was observed. The direct diagnostic API request was server-side and cannot prove browser CORS settings. NOT VERIFIED — requires Sanity project CORS settings inspection for Studio or any other clients. There is no evidence justifying wildcard CORS.

Update behavior: the page reads a deployed JS snapshot, and detail content is pre-generated HTML. Publishing in Sanity alone is not a browser refresh mechanism. A generator/deploy process must update these artifacts; its trigger is unknown. Even after deployment, the four-hour JS freshness and year-long immutable unversioned loader can retain older artifacts. No ISR/live subscription or revalidation endpoint exists in the inspected public loader. Server-side webhook/build mechanisms remain unverified.

Dependency audit: local package/lock have no Sanity, @sanity/client, @sanity/vision or @portabletext entries. This describes the wrong workspace, not missing dependencies in the portfolio build. No dependency incompatibility is confirmed. No packages installed or upgraded.

# 10. Root-Cause Ranking

| Rank | Finding | Confidence |
|---|---|---|
| P0-1 | Deployed content read layer serves snapshot divergent from corroborated published dataset; no refresh when snapshot exists | CONFIRMED behavior/divergence; upstream cause NOT VERIFIED |
| P0-2 | Published dental outcome/whatILearned absent from generated content/detail | CONFIRMED data loss; responsible build query/converter/version NOT VERIFIED |
| P1-1 | Card renderer ignores coverImage | CONFIRMED through execution and reachable asset |
| P1-2 | Unversioned CMS script immutable for one year; snapshot fresh for four hours | CONFIRMED headers; actual user cache impact NOT VERIFIED |
| P1-3 | Fetch failures/status details suppressed by loader | CONFIRMED code; no live failing fetch reproduced |
| P2 | Legacy ?slug detail function differs from active generated-route architecture | CONFIRMED coexistence; no current route failure demonstrated |
| Audit blocker | Supplied workspace is Groniq, not portfolio/Studio | CONFIRMED; not a production root cause |

No P3 redesign recommendations are needed. Main affected layers: generated frontend content, generation/deployment boundary, rendering, and cache policy. Sanity API outage, CORS failure, token failure, schema mismatch, wrong Studio dataset and dependency incompatibility are not confirmed.

# 11. Minimum Fix Plan

Diagnosis only. No fixes applied. Final changes at the unknown build boundary must follow inspection of the actual source.

**FIX 1 — Establish the correct source and release path.**
Problem: actual generator and Studio unavailable. Exact files/settings: portfolio package.json, build scripts, sanity.config.*, sanity.cli.*, environment-name declarations, deploy configuration and latest logs. Required change: provide/open correct repository; compare actual identifiers with `1nhwbh5x/production`, then identify which commit/artifacts are deployed. Why: avoid changing unrelated Groniq or inventing a webhook fault. Risk: read-only, low. Verify: documented Studio → query → generator → deployed artifact mapping.

**FIX 2 — Restore complete, authoritative generated content.**
Problem: stale case-study presence and missing project sections. Exact files/settings: portfolio generator/query (path unknown until FIX 1), generated data/db.js, data/db.json and detail HTML. Required change: only after identifying the responsible omission/trigger, ensure intended published fields are transformed and artifacts reflect the same published snapshot; ensure removed/unpublished entries do not remain in generated outputs. Preserve current architecture. Why: this is where observed divergence/omission occurs. Risk: avoid accidental content deletion; reconcile intended published state before regeneration. Verify: document ID set and relevant body sections agree between API, snapshots and detail pages.

**FIX 3 — Honor coverImage in cards.**
Problem: available cover discarded. Exact file: portfolio js/cms-loader.js, getCardImage. Required change: use valid coverImage before body-image extraction/gradient fallback. Why: fixes demonstrated mismatch with minimal scope. Risk: low; preserve existing fallbacks. Verify: Spacia or a controlled published image document yields its image URL and visible card image.

**FIX 4 — Make deployed CMS asset updates observable.**
Problem: long-lived unversioned script/snapshot caching. Exact settings: portfolio cache/header configuration or asset-versioning generation, currently unavailable. Required change: version immutable JS URLs or revalidate mutable URLs; select snapshot caching consistent with intended publish latency. Why: rebuild alone need not replace cached JS. Risk: modest additional requests. Verify: same browser session receives changed data/loader after deploy within the agreed window.

**FIX 5 — Preserve useful loader errors.**
Problem: fetch exceptions/statuses hidden. Exact file: js/cms-loader.js initCMS. Required change: report source URL, status and safe error context while retaining intentional fallback. Why: makes future failures diagnosable. Risk: no tokens/private payloads in browser logs. Verify: controlled failed fetch clearly identifies stage/status.

# 12. Verification Plan

1. Open actual portfolio/Studio repositories and record intended project/dataset, installed versions, every GROQ, converter and environment-variable name without secrets.
2. Inspect published and draft documents with authorized access; establish whether case-study removal and absence of articles/resources are intentional.
3. In an isolated build copy, run the exact production command and capture logs. Compare emitted snapshots/detail routes against a direct published API response.
4. Verify a representative project includes objective, whatIBuilt, process, outcome and lessons wherever intended; confirm slug, references and assets.
5. With explicit authorization for test content, publish one representative project/article/resource/case study, including image, rich text and destination variants. Query each ID and trace transformation to generated artifacts and local pages.
6. Deploy through the established release process; test listing and clean detail URLs, card images, resource destinations/downloads, browser console and network. Do not substitute HTTP 200 for content correctness.
7. Edit a title/body, publish, observe build/webhook if configured, and verify production receives the update within the intended latency in an existing browser session.
8. Test unpublish/removal in a safe test context; generated listings and detail outputs must follow the intended publication policy.
9. Test controlled API/build/fetch failure paths so failures cannot silently deploy empty or outdated content.

The full forensic diagnosis remains open pending the correct source and relevant Studio/deployment access. This report records verified public behavior and exact remaining evidence gaps rather than presenting untested causes as conclusions.
