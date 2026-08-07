# TrustNovaOps v7 — Secure AI Factory™

V7 preserves the Secure AI Factory site and restores the stronger v5 AI Experience Center.

## Restored experiences

- NOVA Control Tower
- CMMC Compliance Control Tower
- AI Readiness Assessment
- Modernization ROI Estimator
- Platform Blueprint Builder
- Agent Orchestration
- AI Decision Gate
- Evidence-Grounded Copilot

The Center and demo routes use dedicated `demo-v5.css` and `demo-v5.js` assets, isolating the proven demo system from the main site.

## Netlify

Deploy the contents at the site root. The included `netlify.toml` publishes the root and applies baseline security headers.

## Structure

```
├── index.html                 # Secure AI Factory home
├── ai-factory.html            # Factory lifecycle, solutions, platform, and
├── solutions.html             #   company pages (flat, at the site root)
├── experience-center.html     # Hub for the interactive demos
├── demos/                     # Eight scenario-based demo experiences
├── assets/                    # styles.css + app.js (site), demo-v5.* (demos)
├── 404.html                   # Branded not-found page
├── _redirects                 # Clean URLs plus legacy route handling
├── netlify.toml               # Publish config, security headers, caching
├── robots.txt / sitemap.xml   # SEO
└── warden.html, accord.html, demo.html   # Retained pages from the prior site
```

## Deployment

Static site deployed via Netlify. Push to `main` to trigger a deploy.

## Links

- **Live site:** https://www.trustnovaops.com
- **Netlify dashboard:** https://app.netlify.com/projects/trustnovaops
