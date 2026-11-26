# TrustNovaOps

Secure AI Factory™ — engineering trusted, governed AI for regulated enterprises.

## Deployment

Static site on Netlify. The build command (`node scripts/write-runtime-config.mjs`) only writes public runtime config from environment variables; there is no bundler. Push to `main` to deploy. Production should always be published from `main` (see `docs/phase1/PHASE1_WEBSITE_AUDIT.md`, finding A1).

## Structure

```
├── index.html                  # Secure AI Factory homepage
├── ai-factory-assessment.html  # AI Factory Assessment landing page + form
├── contact.html                # Contact, discovery call, partner, investor inquiries
├── platform.html / accord.html / warden.html   # Interactive demonstrations (simulated data)
├── demo.html                   # Guided demo request
├── privacy.html / terms.html / cookies.html / acceptable-use.html / privacy-contact.html  # Legal (DRAFT, noindex)
├── security.html, .well-known/security.txt     # Security posture & vulnerability reporting
├── 404.html
├── assets/
│   ├── vanguard.css            # Design system tokens
│   ├── site-chrome.css         # Shared header/footer, focus, disclosure, consent styles
│   ├── pages.css               # Legal, form and contact page styles
│   ├── site.js                 # Nav toggle, reveal animation, factory pipeline
│   ├── analytics.js            # Consent-gated, PII-safe analytics service (GA4)
│   ├── disclosure.js           # Reusable demonstration-disclosure component
│   ├── forms.js                # Accessible Netlify Forms handler
│   ├── preferences.js          # Cookie preferences page
│   ├── runtime-config.js       # Generated at build (public values only)
│   └── img/                    # Share image, logo
├── netlify/functions/lead-validation.mjs  # Server-side form re-validation
├── scripts/write-runtime-config.mjs
├── tests/regression.mjs        # Zero-dependency regression suite
├── docs/phase1/                # Phase 1 audit, reports, readiness dashboard
├── netlify.toml                # Build, redirects, headers (single source of truth)
├── robots.txt, sitemap.xml
```

## Environment variables (optional, all public/non-secret)
| Name | Purpose |
|---|---|
| `GA4_MEASUREMENT_ID` | Enables Google Analytics 4 after visitor consent |
| `ANALYTICS_ENABLED_CONTEXTS` | Contexts allowed to load GA4 (default `production`) |
| `GSC_VERIFICATION` | Search Console HTML-tag token (DNS verification preferred) |

## Testing
```
netlify dev --port 8889 &          # local server
node tests/regression.mjs          # or BASE_URL=https://<deploy-preview> node tests/regression.mjs
STATIC_ONLY=1 node tests/regression.mjs
```
The suite never submits forms.

## Links
- **Live site:** https://www.trustnovaops.com
- **Netlify dashboard:** https://app.netlify.com/projects/trustnovaops
