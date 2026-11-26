# Phase 1 — Remediation Plan and Backlog Status

Plan approved by the owner on 2026-11-26. Status reflects the end of the Phase 1 implementation (deploy-preview stage). Finding IDs refer to `PHASE1_WEBSITE_AUDIT.md`.

Status key: **Done** · **Done – needs owner action** · **Partial** · **Deferred** · **Blocked (owner input)**

| Inc. | Item | Findings | Status |
|---|---|---|---|
| 0 | Rollback checkpoint: restore the 13 published production files into the repo; strip preview-injected script | A1, A2 | Done |
| 1 | Remove homepage rewrites and SPA catch-all; real 404; 301s for retired routes; single redirect source (`netlify.toml`) | A3, B3 | Done |
| 1 | Dedicated pages: `/privacy`, `/terms`, `/cookies`, `/acceptable-use`, `/privacy-contact`, `/contact`, `/security` | A3, B6 | Done – drafts await owner/legal approval |
| 2 | Reusable disclosure component; label simulated metrics; remediate unsupported claims | B4 | Done – evidence items await owner |
| 2 | Remove WARDEN internal pricing/strategy section (archived) | B5 | Done – owner decision to republish or delete |
| 3 | `/ai-factory-assessment` landing page and form; repoint all assessment CTAs | A4 | Done |
| 3 | Fix `/demo` false-success, restore form registration, remove unsupported response-time promises | B1, B2 | Done |
| 3 | Server-side re-validation of submissions (`formSubmitted` event function) | A5 | Done (logs/flags; cannot reject) |
| 3 | Lead notification email | A5 | **Blocked (owner input)** — recipient must be a Netlify team member; set in Netlify UI |
| 3 | End-to-end live submission test | A5 | **Pending** — run on deploy preview with owner approval |
| 4 | Consistent CTA set; Contact in primary nav; Engage/Legal footer columns; discovery call, partner and investor paths | — | Done |
| 4 | Unify `warden`/`demo`/`404` chrome with shared header | C3 | Partial — dead links fixed, legacy headers kept (lower regression risk) |
| 5 | Consent-gated GA4 analytics service, 12 events, UTM attribution, PII guard | — | Done – needs `GA4_MEASUREMENT_ID` |
| 6 | Unique titles/descriptions, canonicals, OG/Twitter, share image, JSON-LD, sitemap, robots, Search Console support | C1, C2 | Done |
| 7 | Lazy-load SheetJS; defer site scripts; cache policy; reduced motion | B7, C6 | Done |
| 7 | Self-host fonts / trim font weights on app pages | C6 | Deferred (Phase 2) |
| 8 | Security headers; report-only CSP; SRI; patched SheetJS 0.20.3; security.txt | A2, B7, B8 | Done — CSP enforcement deferred |
| 9 | Focus-visible, skip links, form accessibility, mobile overflow fixes | C4, C5 | Done |
| 9 | Colour-contrast fixes inside WARDEN/NOVA app UIs | C4 | Deferred (needs design review of app palettes) |
| 10 | Marketing readiness dashboard (repository-based) | — | Done — `PRODUCTION_READINESS_CHECKLIST.md` + `readiness.json` |
| 11 | Regression suite and documentation | — | Done |
| — | DNS email authentication | A6 | **Blocked (owner input)** — provider choice + DNS authorization |
| — | Delete legacy Netlify form registrations | C7 | Deferred — owner to delete in Netlify UI after confirming no needed data (all have 0 submissions) |
| — | HSTS preload, CAA record | D1 | Deferred — owner decision |
