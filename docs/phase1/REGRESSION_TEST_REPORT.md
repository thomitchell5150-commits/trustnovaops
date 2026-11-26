# Regression Test Report

**Date:** 2026-11-26 · **Build:** Phase 1 working tree served by `netlify dev` (port 8889) · **Browser:** Chromium 159 headless (Playwright) · **Lighthouse:** 12.8.2
Raw evidence: `docs/phase1/evidence/` (regression output, browser sweep, Lighthouse table).

**No form submissions were sent to Netlify or any recipient.** Browser form tests intercepted the POST request and returned simulated 200/500 responses.

## 1. Automated suite — `node tests/regression.mjs`
**Result: 308 passed, 0 failed, 0 warnings** (static-only mode: 254 passed).

| Area | Checks |
|---|---|
| Metadata | Title, unique title, description length/uniqueness, canonical = route, OG image + Twitter card, exactly one `<h1>`, skip link — all 13 pages |
| Structured data | Every JSON-LD block parses; no ratings/reviews |
| Legal drafts | `noindex`, draft banner, not homepage content |
| Links | Every internal `href` resolves to a page, asset, file or configured redirect (0 broken) |
| Claims | Disclosure present on `/`, `/platform`, `/accord`, `/warden`, `/demo`; no assessment CTA points to `/demo` |
| Forms | Netlify registration attributes, honeypot, `form-name`, required privacy acknowledgment, optional unticked marketing consent, sensitive-data warning, UTM fields, label for every field; all 12 specified assessment fields present; 10 assessment areas |
| Config | No SPA catch-all, `_redirects` removed, CSP report-only, xlsx 0.18.5 removed, SRI on third-party scripts, committed runtime config has no GA ID, no secrets in published files |
| Analytics unit tests | 12 events allow-listed; unknown events blocked; email/free-text stripped; UTM captured; non-UTM query never captured; nothing sent without consent; sent after opt-in; stops after opt-out |
| Form unit tests | Flags classification marking, AWS key, password; does **not** flag an ordinary "CUI" mention; email validator accept/reject |
| Server validation | Valid assessment passes; invalid contact flagged |
| HTTP | 13 routes → 200 and serve their own `<title>` (direct navigation/refresh); unknown route + `/docs/…`, `/tests/…`, `/scripts/…` → 404 with branded page; 8 legacy routes → 301 to correct target; security headers present; sitemap, robots, security.txt, assets → 200 |

## 2. Browser sweep (14 routes × 375 / 768 / 1440 px)
| Check | Before (production, 5 routes) | After (14 routes) |
|---|---|---|
| JavaScript errors / uncaught exceptions | 0 | **0** |
| Failed network requests | 0 | **0** |
| CSP report-only violations | n/a | **0** |
| Horizontal overflow | `/platform` +175 px (mobile), `/warden` +527 px (mobile) / +134 px (tablet), `/demo` +46 px (mobile) | **0 on every route and viewport** |

## 3. Functional browser tests
| Scenario | Result |
|---|---|
| Assessment form: empty submit | 6 required-field errors, `aria-invalid` set, error summary receives focus, `assessment_form_error {error_type: validation, error_count: 6}` |
| Invalid email + "password: …" in challenges + phone preference without phone | Errors: invalid email, sensitive-data block, phone required, privacy acknowledgment |
| Ordinary text mentioning "CUI" | Accepted |
| Server returns 500 | Clear error message, form and answers retained, `assessment_form_error {error_type: server_500}` |
| Server returns 200 | Success panel shown, focus moved to heading, `assessment_form_submit {interest: agentic_ai}` |
| Posted body | `form-name=ai-factory-assessment`, `utm_source=linkedin`, `utm_campaign=phase1`, `landing_page=/ai-factory-assessment`, honeypot field present; `marketing_consent` absent when unticked |
| Analytics payloads | No `@` or form content in any event; injected `?email=` parameter never captured |
| `/contact?type=partnership` | Inquiry type preselected |
| `/cookies` with no GA configured | States analytics is not enabled; choice is saved |
| GA configured (simulated ID) | Banner shown; **0** Google requests before consent; gtag loaded after "Allow"; no banner after reload |
| Keyboard | First Tab = "Skip to main content"; Enter moves focus to `<main>` |
| Mobile nav (375 px) | Menu opens; `aria-expanded=true` |
| ACCORD | Chart.js loads, 4 charts render; SheetJS **not** loaded on page load; Export XLSX downloads `POA&M_Export_2026-11-26.xlsx` and loads SheetJS 0.20.3 on demand; re-import of that file shows Merge/Replace preview; 0 errors |
| NOVA | All 8 dashboard tabs clicked; 0 errors |
| WARDEN | Full scroll; 0 errors |
| `/demo` | Netlify form attributes restored; network/server failure no longer shows success (verified by test assertion and code review) |

## 4. Lighthouse
See `PERFORMANCE_BASELINE.md`. Every page scores Best Practices ≥ 96; accessibility ≥ 93; new pages score 97–100 on performance.

## 5. Not yet tested / requires deploy preview or owner
| Item | Reason |
|---|---|
| Real Netlify Forms submission and storage | Needs the deploy preview; one clearly-labelled test submission per form, with owner approval |
| Lead notification email delivery | Needs owner-configured recipient (must be a Netlify team member) |
| `formSubmitted` function log output | Visible in Netlify function logs after a real submission |
| HSTS and header set on the CDN | Re-run `BASE_URL=<deploy-preview-url> node tests/regression.mjs` |
| CSP reports from Netlify preview tooling | Inspect console on the deploy preview |
| Real devices / Safari / Firefox / screen readers | Only Chromium was available; manual VoiceOver/NVDA pass recommended |
| Light theme | Not applicable — the site has no light mode |
