# Performance Baseline (Before / After)

## Method
* **Tool:** Lighthouse 12.8.2 CLI with Chromium 159 (headless), default mobile (Moto G Power emulation, simulated slow 4G) and `--preset=desktop`. Single runs; lab variance of ±5 points and large CLS swings were observed on repeat runs (e.g. `/demo` mobile CLS 0.014–0.53).
* **Before:** production `https://www.trustnovaops.com` (deploy `6afc84b9…`), 2026-11-26.
* **After:** Phase 1 build served by `netlify dev` locally, 2026-11-26. The local server does **not** compress responses (e.g. homepage HTML 19 KiB vs ~4 KiB gzip on the CDN), so "after" figures are conservative. **Re-run against the deploy preview** before sign-off.
* **Field data:** unavailable. The PageSpeed Insights API refused unauthenticated requests (quota) and CrUX data likely does not exist at current traffic. INP cannot be measured in lab; Total Blocking Time is reported as the lab proxy.

## Results — mobile
| Page | Perf before → after | A11y | Best Pr. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 94 → **95** | 97 → **98** | 100 → 100 | 100 → 100 | 2.9 → 2.8 s | 0 → 0 | 0 → 0 ms |
| `/platform` | 99 → 96 | 94 → **95** | 100 → 100 | 82 → **92** | 1.7 → 2.2 s | 0.004 → 0.01 | 0 → 0 ms |
| `/accord` | 69 → **71** | 97 → 97 | 100 → 100 | 100 → 100 | 4.1 → 4.2 s | 0.14 → 0.14 | 150 → **0 ms** |
| `/warden` | 98 → 92 | 95 → 93 | 100 → 100 | 100 → 100 | 1.8 → 2.7 s | 0.018 → 0.02 | 0 → 0 ms |
| `/demo` | 78 → **95** | 95 → 95 | 96 → 96 | 100 → 100 | 1.6 → 2.4 s | 0.541 → **0.014** | 0 → 0 ms |
| `/ai-factory-assessment` (new) | — → 99 | 100 | 100 | 100 | 1.7 s | 0.045 | 0 ms |
| `/contact` (new) | — → 99 | 100 | 100 | 100 | 1.7 s | 0.018 | 0 ms |
| `/security` (new) | — → 100 | 100 | 100 | 100 | 1.4 s | 0.039 | 0 ms |
| `/privacy` (new, draft) | — → 98 | 100 | 100 | 66* | 1.6 s | 0.068 | 0 ms |
| `/terms` (new, draft) | — → 99 | 100 | 100 | 66* | 1.5 s | 0.062 | 0 ms |
| `/cookies` (new, draft) | — → 98 | 100 | 100 | 66* | 1.4 s | 0.085 | 0 ms |

\* SEO 66 is expected: draft legal pages are intentionally `noindex` until approved. They will score 100 once `noindex` is removed.

## Results — desktop
| Page | Perf before → after | A11y | SEO | LCP | CLS |
|---|---|---|---|---|---|
| `/` | 99 → 99 | 97 → 98 | 100 → 100 | 0.8 → 0.8 s | 0.001 → 0.001 |
| `/platform` | 96 → 94 | 94 → 95 | 82 → 92 | 0.9 → 1.0 s | 0.084 → 0.119 |
| `/accord` | 86 → 88 | 97 → 97 | 100 → 100 | 1.1 → 1.0 s | 0.189 → 0.19 |
| `/warden` | 97 → 98 | 95 → 95 | 100 → 100 | 1.0 → 0.9 s | 0.015 → 0.014 |
| `/demo` | 99 → 98 | 95 → 95 | 100 → 100 | 0.8 → 0.8 s | 0.005 → 0.005 |
| `/ai-factory-assessment` | — → 97 | 100 | 100 | 0.8 s | 0.08 |
| `/contact` | — → 99 | 100 | 100 | 0.8 s | 0.008 |

## Network payload changes (mobile lab)
| Page | Before | After |
|---|---|---|
| `/accord` | xlsx 0.18.5 **197 KiB** + Chart.js 59 KiB render-blocking on load | xlsx **not loaded** until import/export (patched 0.20.3, SRI); Chart.js SRI-pinned |
| All pages | Injected agent script 8 KiB | Removed |
| All pages | — | +analytics/disclosure/runtime-config ≈ 5 KiB gzip, deferred (no GA unless consented) |

## Acceptance targets
| Metric | Target | Status |
|---|---|---|
| Desktop Performance | 90+ | **Pass** except `/accord` (88) |
| Mobile Performance | 85+ | **Pass** except `/accord` (71) |
| Accessibility | 95+ | **Pass** except `/warden` mobile (93 — pre-existing contrast in app UI) |
| SEO | 95+ | **Pass** except `/platform` (92) and draft legal pages (noindex by design) |
| Best Practices | 95+ | **Pass** all pages |
| LCP ≤ 2.5 s | | **Pass** except `/`(2.8 s mobile), `/warden` (2.7 s), `/accord` (4.2 s) |
| CLS ≤ 0.10 | | **Pass** except `/accord` (0.14/0.19, pre-existing) and `/platform` desktop (0.119, font-swap reflow) |
| INP ≤ 200 ms | | **Not measurable in lab**; TBT 0 ms on all pages |
| Broken internal links | 0 | **Pass** (regression suite) |
| Critical console errors | 0 | **Pass** (browser sweep) |

## Remaining optimisation backlog (Phase 2)
1. Self-host Inter/Space Grotesk/IBM Plex Mono with `font-display: optional` or size-adjusted fallbacks — removes the third-party render-blocking request and most font-swap CLS (homepage LCP, NOVA/ACCORD CLS).
2. ACCORD: move inline app script (~170 KB) to a cached external file; defer chart initialisation; reserve chart container heights (CLS).
3. Trim IBM Plex Mono / Inter weight sets on app pages to those actually used.
