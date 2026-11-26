# Phase 1 — Implementation Report

**Prepared:** 2026-11-26 · **Status:** implemented on a Netlify deploy preview for owner review. **Not published to production.**

## 1. Rollback checkpoint and procedures
* **Checkpoint:** the exact files of production deploy `6afc84b93791f9883a1108e5` (published 2026-11-17) were downloaded and committed as the baseline before any change, with only the preview-injected `/.netlify/scripts/ar` tag removed. The previous repository state (old CMMC site) remains in git history.
* **Roll back production:** Netlify → Deploys → select deploy `6afc84b9…` → *Publish deploy*. Instant; no rebuild.
* **Roll back code:** revert the Phase 1 commit(s) on the branch; or check out the baseline commit.
* **Partial rollback:** each concern is isolated — e.g. delete the `Content-Security-Policy-Report-Only` line in `netlify.toml`; remove `<script src="/assets/analytics.js…">` tags to disable analytics; restore the archived WARDEN section from `docs/phase1/archive/`.

## 2. Files modified
| File | Change |
|---|---|
| `index.html` | New metadata/OG/JSON-LD (Organization, WebSite); shared header with Contact + "Request assessment"; CTAs → `/ai-factory-assessment`; hero disclosure; "Verified" → "Model checks: Passing"; "Decision latency" → "Latency target"; "74%" → "Most" (pending source); "Live demo" → "Interactive demo"; discovery-call and partner CTAs; `data-solution` analytics hooks; new footer; Search Console placeholder. |
| `platform.html` | Metadata, SoftwareApplication + breadcrumb JSON-LD; shared header/footer; CTA → assessment; fictional names labelled; ROI tile labelled illustrative + disclosure badge; mobile overflow fix. |
| `accord.html` | Metadata/JSON-LD; Chart.js pinned with SRI; **xlsx 0.18.5 removed** and replaced by on-demand, SRI-pinned SheetJS 0.20.3; CTAs → assessment; simulated-environment disclosure (not compliance evidence / not an ATO); `demo_completed` on guided-tour completion; shared footer. |
| `warden.html` | "Product concept" disclosure; internal Recommendation section removed and archived; Palantir row reworded "Designed for … (planned)"; comparison-table disclaimer; dead footer links fixed; metadata; responsive nav fixes. |
| `demo.html` | Netlify form attributes restored; real error handling (`res.ok`); unsupported response-time promises removed; stats labelled "Illustrative targets"; sensitive-data notice; metadata; nav link to assessment; footer links fixed; responsive fixes. |
| `404.html` | `noindex`, helpful links, focus styles; served with real 404 status. |
| `assets/site-chrome.css` | Skip link, global `:focus-visible`, reduced-motion, disclosure component styles, consent banner, 5-column footer, 44 px mobile menu target. |
| `netlify.toml` | Rebuilt: build command, functions dir, 301 redirects, 404 for internal paths, security headers, report-only CSP, cache policy, `X-Robots-Tag` for drafts. |
| `sitemap.xml`, `robots.txt`, `README.md` | Updated. |
| `_redirects` | **Deleted** (merged into `netlify.toml`). |

## 3. Components and files created
| Component | Purpose |
|---|---|
| `ai-factory-assessment.html` | Conversion landing page + accessible Netlify form `ai-factory-assessment`. |
| `contact.html` | Contact / discovery call / partnership / investor / privacy / security inquiries (form `contact`; `?type=` preselects). |
| `privacy.html`, `terms.html`, `cookies.html`, `acceptable-use.html`, `privacy-contact.html` | Draft legal pages (noindex, draft banner, owner placeholders). |
| `security.html`, `.well-known/security.txt` | Website security posture and vulnerability reporting (RFC 9116). |
| `assets/disclosure.js` | Reusable demonstration-disclosure component (7 types; static markup or `TNDisclosure.create()`). |
| `assets/analytics.js` | Consent manager + PII-safe event service + UTM attribution + GA4 loader. |
| `assets/forms.js` | Accessible validation, sensitive-data screening, AJAX submit with real success/error states, funnel events. |
| `assets/preferences.js` | Cookie preferences page controller. |
| `assets/pages.css` | Styles for legal, form and contact pages (built on existing tokens). |
| `assets/runtime-config.js`, `scripts/write-runtime-config.mjs` | Public runtime config generated from env vars at build time. |
| `netlify/functions/lead-validation.mjs` | Server-side re-validation of verified submissions; PII-free log line. |
| `assets/img/og-default.jpg`, `assets/img/logo-512.png` | Social share card and structured-data logo (generated from existing brand mark/colours). |
| `tests/regression.mjs` | Zero-dependency regression suite (308 checks). |
| `docs/phase1/*` | This documentation set, `readiness.json`, archive. |

## 4. Architectural decisions
1. **Stay static, no framework.** New pages are plain HTML using the existing design system; total new JS ≈ 30 KB unminified, zero dependencies.
2. **Netlify Forms** remains the form backend (already in use; spam filtering included). A `formSubmitted` event function adds server-side validation without changing the submission path.
3. **Consent-first analytics.** GA4 loads only after opt-in *and* only when `GA4_MEASUREMENT_ID` is set; by default only production context loads it. Banner is not shown when nothing is configured.
4. **Report-only CSP** because ACCORD/NOVA rely on inline scripts and ~160 inline handlers; enforcement requires refactoring (Phase 2).
5. **Repository-based readiness dashboard** (`readiness.json` + checklist) because no authenticated admin exists; it is structured for GrowthOps™ ingestion.
6. **Legal pages ship as clearly-marked drafts** with `noindex` and excluded from the sitemap until approved.
7. **Legacy page chrome kept** on WARDEN/demo/404 (only links/metadata fixed) to avoid regressions in large hand-built pages.

## 5. Test results (summary)
* Regression suite: **308 passed, 0 failed** against `netlify dev` (static mode: 254 passed).
* Browser sweep (14 routes × 3 viewports): **0 JavaScript errors, 0 failed requests, 0 CSP violations, 0 horizontal overflow**.
* Form behaviour, consent, analytics payloads, keyboard access, ACCORD import/export and NOVA tabs verified in Chromium. Details: `REGRESSION_TEST_REPORT.md`.
* Lighthouse before/after: `PERFORMANCE_BASELINE.md`.

## 6. Unresolved issues and residual risks
* Live form submission and email notification **not yet verified** (needs deploy preview + owner-approved recipient). Do not consider lead capture operational until confirmed.
* CSP not enforced; inline scripts permitted.
* ACCORD mobile performance 71 (lab) — dominated by 239 KB HTML and Chart.js; below the 85 target.
* NOVA/WARDEN colour-contrast issues inside app UIs; NOVA SEO 92 due to `<a>` elements without `href` in the demo.
* Domain email authentication absent.
* Legal content not approved; business identity unknown.

## 7. Required owner approvals and inputs
See `PRODUCTION_READINESS_CHECKLIST.md` § Owner actions.
