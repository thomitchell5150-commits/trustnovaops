# TrustNovaOps

TrustNovaOps Secure AI Factory™ (V7): trusted, governed AI for regulated enterprises.

## Deployment

Static site plus one Netlify Function, deployed via Netlify. Push to `main` to trigger a deploy.

## Structure

```
├── index.html               # V7 homepage (Secure AI Factory)
├── *.html                   # V7 pages (ai-factory, solutions, platform, experience-center, …)
├── demos/                   # Experience Center demos (cmmc, control-tower, copilot, vanguard, …)
├── assets/                  # Shared CSS / JS (styles.css + app.js, demo-v5.css + demo-v5.js)
├── netlify/functions/
│   └── vanguard.mjs         # VANGUARD red team lead agent API (/api/vanguard, Netlify AI Gateway)
├── 404.html                 # Branded 404 page
├── netlify.toml             # Build config and headers
├── robots.txt / sitemap.xml
└── package.json             # Function dependencies
```

## Links

- **Live site:** https://www.trustnovaops.com
- **Netlify dashboard:** https://app.netlify.com/projects/trustnovaops
