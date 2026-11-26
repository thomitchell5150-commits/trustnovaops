# Phase 1 — Website Technical Audit

**Audit date:** 2026-11-26 · **Scope:** https://www.trustnovaops.com (production deploy `6afc84b93791f9883a1108e5`, published 2026-11-17) and repository `main`.
**Method:** direct inspection of repository files, the files of the published deploy, live HTTP responses and headers, the Netlify project configuration (forms, notification hooks, environment variable names), public DNS, a headless-browser sweep (Chromium 159 via Playwright) and Lighthouse 12.8.2 lab runs.

Priority scale: **P0** critical · **P1** high · **P2** medium · **P3** low.

## 1. Architecture

| Area | Finding |
|---|---|
| Framework | Hand-written static HTML/CSS/JS. No framework, bundler or `package.json`. Publish directory `.`. |
| Routes (before) | `/`, `/platform` (NOVA demo), `/accord` (ACCORD Cloud ISSO app), `/warden` (WARDEN concept page), `/demo` (demo request form), `404.html`. |
| Shared components | `assets/vanguard.css` (design tokens), `assets/site-chrome.css` (header/footer/page intro), `assets/site.js` (mobile nav, reveal animation, pipeline animation). Used by `index`, `platform`, `accord`. `warden`, `demo`, `404` use older stand-alone layouts with a colour override. |
| Theme | Dark only. No light mode exists, so there is no theme toggle to preserve. |
| Data/apps | ACCORD keeps demo controls/POA&Ms in `localStorage` (`crm_controls`, `crm_poams`); imports/exports XLSX via SheetJS; charts via Chart.js. NOVA and WARDEN are client-side simulations. No backend, no API calls. |
| Forms | Netlify Forms. One live form (`demo-request`). Eight legacy registrations with no live HTML and 0 submissions: `assessment`, `contact`, `strategic-conversation`, `strategy-session`, `gap-scan-request`, `gap-scan`, `cmmc-checklist`, `free-trial`. |
| Notifications | No form-submission notification hooks configured (only deploy-related hooks). |
| Environment variables | Only `NODE_VERSION`. No secrets referenced by the site. |
| Analytics | None installed. |

## 2. Findings

### P0 — Critical
| # | Finding | Evidence |
|---|---|---|
| A1 | **Production is not in source control.** Live site was manually published from an agent deploy preview; `main` contained the older CMMC/DevSecOps site and lacked `assets/*`. Any push to `main` would have rolled production back. | Deploy file list vs repo diff; live homepage 13,990 B vs repo `index.html` 67,926 B. |
| A2 | **Preview artefacts served in production**: injected `/.netlify/scripts/ar` agent script on every page and a preview CSP `frame-ancestors https://*.netlify.com`; repo-defined `X-Frame-Options: DENY` absent. | Live HTML and response headers. |
| A3 | **`/privacy`, `/terms` (and `/privacy-policy`, `/terms-of-service`, `/security`, `/compliance`, `/about`, `/careers`, `/contact`, `/contact-us`, `/pricing`, `/docs`, `/api`, `/blog`, `/status`, `/agent-007`, `/launch-agent`) returned the homepage with HTTP 200.** Root cause: Netlify rewrite rules `/<route>  /  200` plus a `/* /index.html 200` SPA catch-all on a site that has no client router — *not* SPA routing or a missing component. | `_redirects`; live responses identical to `/`. |
| A4 | **Every "Book an AI Factory Assessment" CTA linked to `/demo`**, a cybersecurity agent demo form (workstation count, SENTINEL/VAULT/STRIKER checkboxes). | `index`, `platform`, `accord` markup. |
| A5 | **Lead capture unverified and unmonitored**: 0 submissions across all 9 registered forms; no notification configured. | Netlify Forms API. |
| A6 | **Domain cannot send or receive authenticated email** — no MX, SPF, DMARC or discoverable DKIM. See `EMAIL_DOMAIN_READINESS.md`. | `dig` via 1.1.1.1 and 8.8.8.8. |

### P1 — High
| # | Finding |
|---|---|
| B1 | `/demo` form showed "success" even when the request failed (`catch(_) { // Still show success }`) and promised response times ("typical response <4 hours", "within 1 business day") that are not established commitments. |
| B2 | After the Phase 1 restore, the `/demo` form had lost its `data-netlify` attribute (Netlify strips it from served HTML) — redeploying unchanged would have silently unregistered the form. |
| B3 | Soft 404s: any unknown URL returned 200 + homepage; `404.html` never served. |
| B4 | Simulated metrics without disclosure on the homepage hero ("94.8% control coverage", "−42% decision latency", "Model assurance: Verified", "Factory status: Operational"), NOVA ROI tiles, and `/demo` stats. See `MARKETING_COMPLIANCE_CHECKLIST.md`. |
| B5 | **`/warden` published an internal go-to-market recommendation** including pricing ("$8–$15/workstation/month"), "platform stickiness", "Higher ACV per contract" and a "SAM/CISA approved vendor path" statement. |
| B6 | No privacy/consent infrastructure; no legal pages; third parties (Google Fonts, cdnjs) undisclosed. |
| B7 | Third-party scripts without Subresource Integrity; **SheetJS xlsx 0.18.5** (known advisories CVE-2023-30533 prototype pollution, CVE-2024-22363 ReDoS) used to parse user-supplied files; loaded render-blocking (197 KiB transfer). |
| B8 | No Content-Security-Policy for scripts; HSTS without `includeSubDomains`. |

### P2 — Medium
| # | Finding |
|---|---|
| C1 | SEO metadata gaps: no canonical on `platform`, `warden`, `demo`, `404`; no description on `platform`/`404`; OG tags only on 2 pages; no `og:image`/Twitter cards anywhere; `meta keywords` on home; no structured data. NOVA Lighthouse SEO 82. |
| C2 | Sitemap stale (`lastmod` 2026-05-11) and lacked new routes; `robots.txt` had a redundant empty `Disallow:`. |
| C3 | Inconsistent chrome: `warden`, `demo`, `404` footers linked to dead `/docs`, `/status`, `/compliance`. |
| C4 | Accessibility: no `:focus`/`:focus-visible` styles; no skip link; reduced-motion not honoured on NOVA/WARDEN; 36 colour-contrast failures on WARDEN and low-opacity labels on NOVA; heading-order issue in the homepage hero card. |
| C5 | Mobile horizontal overflow at 375 px: `/platform` (+175 px), `/warden` (+527 px; +134 px at 768 px), `/demo` (+46 px). |
| C6 | Performance: render-blocking Google Fonts on all pages; ACCORD mobile Lighthouse Performance 69 (LCP 4.1 s, CLS 0.14); `/demo` mobile CLS up to 0.54; HTML cached for 1 hour by browsers (`max-age=3600`) delaying updates. |
| C7 | Eight legacy form registrations clutter the Forms dashboard. |

### P3 — Low
| # | Finding |
|---|---|
| D1 | No CAA record; HSTS not preloaded (owner decision). |
| D2 | Footer copyright lacked year on some pages and the legal entity name everywhere. |
| D3 | README described an outdated structure. |
| D4 | `/demo` meta description tone ("no slides, no BS"). |

### Verified as working / not an issue
* HTTPS forced; apex → www 301; Let's Encrypt wildcard certificate valid to 2026-12-26 (auto-renewing).
* No JavaScript errors or failed requests on any production page (headless sweep at 375/768/1440 px).
* No customer testimonials, logos, ratings or certification badges were found.
* No secrets in source (the only key-like string, `AKIAIOSFODNN7EXAMPLE`, is AWS's public documentation placeholder used inside the NOVA demo).

## 3. Field data
Real-user (CrUX) field data could not be retrieved: the PageSpeed Insights API rejected unauthenticated requests (daily quota) and the site's traffic volume is likely below CrUX thresholds. All performance numbers in this phase are **lab data**. See `PERFORMANCE_BASELINE.md`.
