# Analytics Configuration

## Audit (before)
No analytics of any kind was installed (no GA, GTM, Plausible, Segment, etc.). The only third-party script was the preview-injected Netlify agent script, now removed. No duplicate tracking risk exists.

## Architecture
| Piece | File | Role |
|---|---|---|
| Runtime config | `assets/runtime-config.js` (generated) | `window.TN_CONFIG = {ga4, env}` — public values only |
| Build step | `scripts/write-runtime-config.mjs` | Writes runtime config from env vars; validates ID format; injects Search Console tag if configured |
| Service | `assets/analytics.js` | Consent manager, event allow-list, PII scrubber, UTM attribution, GA4 loader, consent banner, automatic click tracking |
| Preferences UI | `/cookies` + `assets/preferences.js` | Allow/decline, status, GPC notice |
| Forms | `assets/forms.js` | Fires funnel events; copies attribution into hidden fields |

## Environment variables (Netlify → Project configuration → Environment variables)
| Variable | Required | Example | Notes |
|---|---|---|---|
| `GA4_MEASUREMENT_ID` | To enable analytics | `G-XXXXXXXXXX` | Public identifier, not a secret. Invalid formats are ignored |
| `ANALYTICS_ENABLED_CONTEXTS` | No | `production` (default) or `production,deploy-preview` | Prevents preview traffic polluting production data |
| `GSC_VERIFICATION` | No | token string | Only if using HTML-tag verification instead of DNS |

**Account setup (owner):** create a GA4 property for `www.trustnovaops.com` → Web data stream → copy the Measurement ID → set `GA4_MEASUREMENT_ID` → redeploy. In GA4: set data retention to the shortest acceptable period, keep Google signals **off**, disable ads personalisation, register custom dimensions for `location`, `cta`, `demo`, `solution`, `form`, `inquiry_type`, `error_type`, `interest` (event scope), mark `assessment_form_submit`, `contact_submit`, `partner_inquiry`, `investor_inquiry` as **key events**.

## Consent behaviour
* No GA script, cookie or network request before the visitor clicks **Allow analytics** (verified in browser test: 0 Google requests before consent, 1 after).
* Banner appears only when a Measurement ID is configured and no choice is stored; not shown on `/cookies`.
* **Global Privacy Control** is treated as an opt-out (no banner, nothing loads unless the visitor opts in on `/cookies`).
* Declining removes `_ga*` cookies from the domain. Choice stored in `localStorage.tn_consent` (versioned).
* GA4 configured with `allow_google_signals: false`, `allow_ad_personalization_signals: false`, ad consent types `denied`.

## Events
| Event | Fired when | Properties |
|---|---|---|
| `assessment_cta_click` | Click on any link to `/ai-factory-assessment` | `location`, `cta` |
| `assessment_form_start` | First focus in the assessment form | `form` |
| `assessment_form_submit` | Successful (HTTP 2xx) assessment submission | `form`, `interest`, `maturity`, `org_size`, `industry` (option codes only) |
| `assessment_form_error` | Validation failure or network/server error | `form`, `error_type`, `error_count` |
| `demo_launched` | NOVA, ACCORD or WARDEN page loaded (`body[data-demo]`) | `demo`, `location` |
| `demo_completed` | ACCORD guided tour reaches the end | `demo`, `location` |
| `solution_viewed` | Click on a homepage solution card, or WARDEN page load | `solution`, `location` |
| `contact_submit` | Successful contact form (general, discovery call, guided demo, privacy, security, media) or `/demo` form | `form`, `inquiry_type` |
| `meeting_booked` | **Reserved** — no scheduler is integrated; wire to the scheduler's confirmation callback in Phase 2 | — |
| `partner_inquiry` | Successful contact form with inquiry type "Strategic partnership" | `form`, `inquiry_type` |
| `investor_inquiry` | Successful contact form with inquiry type "Investor relations" | `form`, `inquiry_type` |
| `outbound_link_click` | Click on a link to another host | `link_domain`, `location` |
| `form_error`, `contact_form_start` | Supporting events for non-assessment forms | as above |

All events also carry `page_path` and any session UTM values.

## PII safeguards
* Event names and property keys are allow-listed; unknown events/keys are dropped.
* Values must be short token-like strings: anything containing `@`, `%40`, 7+ consecutive digits, or characters outside `[A-Za-z0-9 _.:/+-]` is discarded.
* No free text, names, emails, phone numbers or form content is ever passed.
* `page_location` sent to GA4 is rebuilt with **only** UTM parameters — any other query string (e.g. `?email=`) is stripped.
* Verified by unit tests in `tests/regression.mjs` and a browser test (no `@` in any captured event).

## Campaign attribution
* `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` captured on landing (first touch per session, lower-cased, sanitised) into `sessionStorage.tn_attr` with `landing_page` and `referrer_domain`.
* Copied into hidden fields on every form so each lead records its source in Netlify Forms — works **even without analytics consent** (first-party, submitted only with the visitor's own inquiry; disclosed on `/privacy` and `/cookies`).
* Recommended UTM conventions:

| Channel | utm_source | utm_medium | utm_campaign example |
|---|---|---|---|
| LinkedIn (organic/paid) | `linkedin` | `social` / `paid_social` | `2027q1_ai_factory_assessment` |
| Email marketing | `newsletter` or platform name | `email` | `2027q1_launch` |
| Strategic partners | partner slug | `partner` | `partner_<name>_cobrand` |
| Referral | referring site slug | `referral` | `<program>` |
| GrowthOps™ agentic campaigns | `growthops` | `agent_email` / `agent_social` | `<growthops campaign id>` (use `utm_content` for variant id) |
| Organic search | — (automatic via referrer) | — | — |

## Testing
* `?tn_debug=1` (or `localStorage.tn_debug = "1"`) logs every event and whether it was sent.
* `window.TNAnalytics._log` holds the last 50 events for inspection.
* GA4 DebugView: enable after consent with the GA Debugger extension.
