# TrustNovaOps

Secure AI Factory™ — engineering trusted, governed AI for regulated enterprises.

## Deployment

Static site deployed via Netlify. Push to `main` to trigger a deploy.

## Structure

```
├── index.html        # Secure AI Factory homepage
├── assets/vanguard.css  # Shared VANGUARD design system (navy/cyan)
├── assets/site-chrome.css  # Shared site header, footer and page intro (scoped, safe on app pages)
├── assets/site.js    # Nav toggle, reveal animations, factory pipeline
├── platform.html / warden.html / accord.html / demo.html  # Demos & demo request
├── 404.html          # Branded 404 page
├── _redirects        # Netlify route handling
├── netlify.toml      # Build config, headers, redirects
├── robots.txt        # Crawler directives
├── sitemap.xml       # SEO sitemap
└── .gitignore
```

## Links

- **Live site:** https://www.trustnovaops.com
- **Netlify dashboard:** https://app.netlify.com/projects/trustnovaops
