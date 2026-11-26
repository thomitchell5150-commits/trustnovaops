# Security Hardening Report

## Response headers
| Header | Before (production) | After (Phase 1) |
|---|---|---|
| Strict-Transport-Security | `max-age=31536000` | `max-age=31536000; includeSubDomains` (wildcard cert covers all subdomains). Preload **not** requested — owner decision. |
| X-Content-Type-Options | `nosniff` | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` | unchanged |
| Permissions-Policy | camera, microphone, geolocation | + payment, usb, interest-cohort, browsing-topics |
| Clickjacking | Preview CSP `frame-ancestors https://*.netlify.com`; **no X-Frame-Options** | Enforced `Content-Security-Policy: frame-ancestors 'self' https://app.netlify.com https://*.netlify.com; base-uri 'self'; object-src 'none'` + `X-Frame-Options: SAMEORIGIN` (Netlify origins allowed so deploy-preview review tooling keeps working; remove them for stricter production if not needed) |
| Content-Security-Policy | none | **Report-only** full policy (see below) |
| Cross-Origin-Opener-Policy | none | `same-origin` |
| Cross-Origin-Resource-Policy | none | `same-site` |
| X-Permitted-Cross-Domain-Policies | none | `none` |
| Cache-Control (HTML) | `public, max-age=3600` | `public, max-age=0, must-revalidate` (CDN still caches per deploy) |

### Report-only CSP
```
default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.sheetjs.com https://www.googletagmanager.com https://netlify-cdp-loader.netlify.app;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com;
connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com;
frame-src 'none'; form-action 'self'; base-uri 'self'; object-src 'none'
```
**Tested:** headless sweep of 14 routes × 3 viewports, ACCORD import/export (lazy SheetJS), Chart.js, NOVA tabs, GA4 load after consent — **0 violations**. Deploy previews may additionally load Netlify's review drawer; watch for reports there. **Enforcement plan:** after ≥2 weeks of clean reports on production, switch to enforcing; `'unsafe-inline'` can only be removed after moving inline scripts/handlers in NOVA/ACCORD/WARDEN to external files (Phase 2).

## Third-party scripts
| Script | Before | After |
|---|---|---|
| Chart.js 4.4.1 (cdnjs) | No SRI, render-blocking | SRI `sha384-bs/nf9Fb…`, `crossorigin`, `no-referrer` |
| SheetJS xlsx **0.18.5** (cdnjs) | No SRI; known advisories CVE-2023-30533, CVE-2024-22363; parses user files | Removed. **0.20.3** from the official SheetJS CDN, SRI `sha384-EnyY0/GS…`, loaded only on import/export |
| Google Fonts | Disclosed nowhere | Disclosed in Privacy/Cookies pages (self-hosting recommended Phase 2) |
| GA4 | n/a | Loaded only after opt-in, only when configured |

## Forms and input handling
* Honeypot (`netlify-honeypot="bot-field"`) + Netlify Akismet filtering on all forms.
* Client validation (required, email, length, phone) with accessible errors.
* **Sensitive-data screening** blocks classification/CUI markings, private keys, cloud access keys, tokens, passwords, SSN-pattern and card-number-pattern input before submission.
* Server-side re-validation (`netlify/functions/lead-validation.mjs`, `formSubmitted` event) logs PII-free validation results and flags anomalies. **Limitation:** it cannot reject a submission that Netlify has already verified; flagged submissions must be reviewed in the Forms dashboard.
* Form content never sent to analytics or placed in URLs; analytics strips all non-UTM query parameters.
* All DOM output in new components uses `textContent`; no user input is rendered with `innerHTML`.

## Client-side storage
| Key | Content | Sensitivity |
|---|---|---|
| `tn_consent` (localStorage) | `{v, analytics, ts}` | None |
| `tn_attr` (sessionStorage) | UTM values (sanitised), landing path, referrer domain | Low |
| `crm_controls`, `crm_poams` (ACCORD) | Demo data the visitor edits | Visitor-controlled; disclosed; users told not to enter real data |

## Source exposure
* No secrets in source (regression test scans published files). Only env var in use: `NODE_VERSION`; Phase 1 adds optional non-secret `GA4_MEASUREMENT_ID`, `GSC_VERIFICATION`, `ANALYTICS_ENABLED_CONTEXTS`.
* Repository-only folders (`docs/`, `scripts/`, `tests/`, `netlify/`) return 404 publicly.
* `/.well-known/security.txt` published (RFC 9116, expires 2027-11-26 — renew annually).

## Error handling
* Real 404 status and branded page for unknown routes.
* Forms show actionable error messages on network/server failure and keep entered data.
* ACCORD shows a toast if the spreadsheet library cannot load.

## Residual risks
| Risk | Severity | Mitigation / owner |
|---|---|---|
| CSP not enforced; `'unsafe-inline'` scripts | Medium | Phase 2 refactor of inline handlers |
| ~50 `innerHTML` writes in NOVA/ACCORD templates (pre-existing). ACCORD XLSX import values flow into rendered tables | Medium | Phase 2: escape imported cell values before rendering; patched SheetJS reduces parser risk |
| Server validation cannot block submissions | Low | Review flagged entries; consider a Netlify Function endpoint in Phase 2 |
| Domain spoofing (no SPF/DMARC) | **High** for brand/email | See `EMAIL_DOMAIN_READINESS.md` |
| Google Fonts third-party request | Low (privacy) | Self-host in Phase 2 |
| Frame-ancestors permits `*.netlify.com` | Low | Tighten to `'self'` if Netlify review UI is not needed in production |
