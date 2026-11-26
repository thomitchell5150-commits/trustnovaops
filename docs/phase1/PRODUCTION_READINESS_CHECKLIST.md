# Production Readiness Checklist — Marketing Readiness Dashboard

This is the **repository-based Marketing Readiness Dashboard** for Phase 1. No authenticated administration exists on the site, so the dashboard is kept in source control: the machine-readable source of truth is [`readiness.json`](readiness.json) (schema `trustnovaops.readiness/v1`, ready for GrowthOps™ ingestion), and this page mirrors it. No telemetry is generated; anything not measured is **Pending**.

**Snapshot 2026-11-26:** Verified: 0 · Passed: 11 · Failed: 1 · Warning: 3 · Pending: 4 · Blocked: 5 · Not Applicable: 1

**Recommendation:** ready for owner review on the deploy preview. **Not ready for production publication** until the Blocked items marked ★ below are resolved.

| Category | Item | Status | Target | Last verified | Evidence | Remediation | Owner | Dependencies |
|---|---|---|---|---|---|---|---|---|
| Website health | Routes return their own content; unknown URLs 404 | **Passed** | All routes correct, 0 soft 404s | 2026-11-26 | tests/regression.mjs (local netlify dev) | Re-run against deploy preview | Web engineering | Deploy preview |
| Website health | Broken internal links | **Passed** | 0 | 2026-11-26 | tests/regression.mjs link check | — | Web engineering | — |
| Website health | Browser console errors | **Passed** | 0 critical | 2026-11-26 | evidence/browser-sweep-2026-11-26.txt | — | Web engineering | — |
| Website health | Production matches source control | **Pending** | Production deployed from main | 2026-11-26 | Audit A1 | Merge Phase 1 branch and publish from main | Site owner | Owner approval |
| Performance metrics | Lighthouse lab scores (desktop ≥90, mobile ≥85) | **Warning** | All pages meet targets | 2026-11-26 | PERFORMANCE_BASELINE.md | ACCORD mobile 71 / desktop 88 — Phase 2 font self-hosting and script externalisation | Web engineering | — |
| Performance metrics | Real-user (field) Core Web Vitals | **Pending** | LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at p75 | 2026-11-26 | Unavailable (no CrUX data; PSI API quota) | Check Search Console Core Web Vitals after traffic accrues | Marketing ops | Search Console verification |
| SEO readiness | Titles, descriptions, canonicals, OG/Twitter, JSON-LD | **Passed** | Unique and valid on every page | 2026-11-26 | SEO_AUDIT.md; tests/regression.mjs | — | Web engineering | — |
| SEO readiness | Search Console verification and sitemap submission | **Blocked** | Property verified, sitemap submitted | 2026-11-26 | — | Add DNS TXT verification or set GSC_VERIFICATION | Site owner | Google account access |
| Accessibility | WCAG 2.2 AA — new pages and shared chrome | **Passed** | Lighthouse a11y ≥95, keyboard operable | 2026-11-26 | Lighthouse 100 on new pages; browser keyboard tests | Manual screen-reader pass | Web engineering | — |
| Accessibility | Colour contrast inside WARDEN and NOVA app UIs | **Warning** | 0 contrast failures | 2026-11-26 | Lighthouse: WARDEN 36 contrast items (pre-existing) | Phase 2 palette adjustments with design review | Design | — |
| Legal page readiness | Privacy, Terms, Cookies, Acceptable Use, Privacy Contact | **Blocked** | Approved, published, indexed | 2026-11-26 | Draft pages live on preview with noindex | Provide entity, address, jurisdiction, privacy email, retention; counsel review | Site owner / counsel | Business identity, Legal review |
| Security posture | Security headers and HTTPS | **Passed** | HSTS, nosniff, framing control, COOP/CORP, Permissions-Policy | 2026-11-26 | SECURITY_HARDENING_REPORT.md; local header test | Verify on deploy preview CDN | Web engineering | Deploy preview |
| Security posture | Content Security Policy enforcement | **Warning** | Enforced CSP without unsafe-inline | 2026-11-26 | Report-only; 0 violations in sweep | Monitor 2+ weeks, then enforce; refactor inline handlers | Web engineering | — |
| Security posture | Third-party library vulnerabilities | **Passed** | No known-vulnerable libraries; SRI on all CDN scripts | 2026-11-26 | xlsx 0.18.5 → 0.20.3 with SRI; Chart.js SRI | — | Web engineering | — |
| Form functionality | Assessment, contact and demo forms — client behaviour | **Passed** | Validation, errors, success, spam protection | 2026-11-26 | REGRESSION_TEST_REPORT.md §3 (intercepted submissions) | — | Web engineering | — |
| Form functionality | Live submission reaches Netlify Forms | **Pending** | Test submission visible in Forms dashboard | 2026-11-26 | Not yet tested | One labelled test per form on deploy preview | Site owner | Deploy preview, Owner approval |
| Form functionality | Lead notification email | **Blocked** | Notification received by sales owner | 2026-11-26 | No notification hooks configured | Netlify → Forms → Notifications; recipient must be a team member | Site owner | Recipient address |
| Analytics configuration | Consent-gated GA4 + 12 conversion events | **Passed** | Events fire with no PII; nothing before consent | 2026-11-26 | ANALYTICS_CONFIGURATION.md; unit + browser tests with simulated ID | — | Web engineering | — |
| Analytics configuration | GA4 property connected | **Blocked** | Events visible in GA4 DebugView | 2026-11-26 | GA4_MEASUREMENT_ID not set | Create property, set env var, redeploy, verify | Marketing ops | GA4 account |
| Email authentication | SPF / DKIM / DMARC / MX | **Failed** | SPF + DKIM aligned, DMARC p=reject | 2026-11-26 | EMAIL_DOMAIN_READINESS.md (no records found) | Publish null SPF/DMARC now; full set after provider chosen | Site owner | DNS authorization, Mail provider |
| Marketing claims validation | Simulated metrics labelled; unsupported claims remediated | **Passed** | 100% of claims classified | 2026-11-26 | MARKETING_COMPLIANCE_CHECKLIST.md | — | Marketing | — |
| Marketing claims validation | Owner evidence for 74% statistic, Palantir integration, demo targets, WARDEN status | **Pending** | Each claim supported or removed | 2026-11-26 | Checklist items 4, 5, 12, 15, 16, 18 | Provide sources or approve removals | Site owner | — |
| Campaign readiness | UTM attribution captured on leads | **Passed** | UTM on every lead | 2026-11-26 | Browser test posted body | — | Marketing ops | — |
| Campaign readiness | Email marketing compliance (CAN-SPAM) | **Blocked** | Identity, address, unsubscribe, suppression list | 2026-11-26 | EMAIL_DOMAIN_READINESS.md | Choose email platform; provide address | Site owner | Business identity, Email platform |
| Campaign readiness | Online scheduling (meeting_booked) | **Not Applicable** | Scheduler integrated | 2026-11-26 | No scheduler configured; discovery calls requested via form | Optional Phase 2 integration | Marketing ops | Scheduler choice |

## Owner actions (in recommended order)
1. ★ **Review the deploy preview** and approve or request changes.
2. ★ **Business identity for legal pages:** legal entity name, postal mailing address, governing-law jurisdiction, privacy contact email, inquiry retention period, effective date. Then have counsel review `/privacy`, `/terms`, `/cookies`, `/acceptable-use`, `/privacy-contact` and remove the draft banners, `noindex` meta tags and `X-Robots-Tag` headers, and add the pages to `sitemap.xml`.
3. ★ **Lead notifications:** Netlify → Forms → Form notifications → add email for `ai-factory-assessment`, `contact` and `demo-request` (recipient must be an active Netlify team member).
4. ★ **Approve one test submission per form** on the deploy preview (clearly labelled "TEST — Phase 1"), confirm receipt, then delete the test entries.
5. **Claims evidence:** source for the 74% statistic; Palantir relationship/integration status; evidence for `/demo` targets; WARDEN availability; decision on the archived WARDEN recommendation section.
6. **Analytics:** create GA4 property and set `GA4_MEASUREMENT_ID` (or decide not to use GA).
7. **DNS:** authorize null SPF/DMARC records now; choose a mail provider for the full configuration.
8. **Search Console:** verify via DNS TXT; submit sitemap.
9. **Housekeeping:** delete the 8 legacy Netlify form registrations (all 0 submissions).
10. **Publish** from `main` after merge so production matches source control.

## Go-live verification (run on the deploy preview, then on production)
```
BASE_URL=https://<preview-url> node tests/regression.mjs
```
* Expect 0 failures (HSTS is only emitted by the CDN, so it is checked there).
* Check the browser console on `/`, `/platform`, `/accord` for CSP report-only messages.
* Confirm the test submission appears in Forms and the notification email arrives.
