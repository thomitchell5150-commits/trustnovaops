# GrowthOps™ Integration Readiness

This document records what Phase 1 put in place for the future TrustNovaOps GrowthOps™ agentic business-development platform, and what GrowthOps must respect. **Nothing in Phase 1 activates outreach, campaigns, LinkedIn automation or prospect scraping.**

## 1. Interfaces available today
| Capability | Where | How GrowthOps can use it |
|---|---|---|
| Lead capture | Netlify Forms `ai-factory-assessment`, `contact`, `demo-request` | Read via the Netlify API `listFormSubmissions` (paginate with the `Link` header) or subscribe to form-submission events/webhooks |
| Server-side lead hook | `netlify/functions/lead-validation.mjs` (`formSubmitted`) | Extend to forward **validated** leads to a CRM/GrowthOps endpoint (store credentials as Netlify env vars, never in code) |
| Lead quality signal | Validation result (`valid`, `issues[]`) logged per submission | Use to route/hold flagged leads for human review |
| Consent record | `privacy_ack` (required) and `marketing_consent` (optional) on every lead | **Only leads with `marketing_consent=yes` may enter marketing sequences** |
| Attribution | Hidden fields `utm_source/medium/campaign/content/term`, `landing_page`, `referrer_domain` on every lead | Join leads to campaigns; GrowthOps campaigns must use `utm_source=growthops` (see `ANALYTICS_CONFIGURATION.md`) |
| Intent taxonomy | `inquiry_type` (general, discovery_call, guided_demo, partnership, investor, privacy, security, media); `primary_interest` (10 assessment areas + not_sure); `ai_maturity`; `industry`; `organization_size` | Stable option codes suitable for routing and scoring |
| Behavioural events | 12 GA4 events (consented visitors only) | Aggregate funnel analysis; never join GA client IDs to identified leads without a lawful basis and updated privacy notice |
| Readiness state | `docs/phase1/readiness.json` (`trustnovaops.readiness/v1`) | Ingest as a governance gate: GrowthOps should refuse to launch campaigns while any `Email authentication` or `Campaign readiness` item is not `Passed`/`Verified` |
| Claims governance | `MARKETING_COMPLIANCE_CHECKLIST.md`, disclosure component | Generated copy must not reuse simulated metrics as outcomes; reuse `TNDisclosure` types when rendering demo data |

## 2. Guardrails GrowthOps must enforce (governed agentic marketing)
1. **Consent gate:** no marketing email to anyone without `marketing_consent=yes` or another documented lawful basis approved by counsel.
2. **Suppression first:** check a central suppression list (unsubscribes, privacy deletion requests, bounces, complaints) before every send, across all channels and agents.
3. **Identity & address:** every commercial email carries the legal entity name, physical postal address and a one-click unsubscribe (CAN-SPAM; also RFC 8058 `List-Unsubscribe-Post` for bulk senders).
4. **Authenticated sending only:** SPF, DKIM (aligned) and DMARC at `p=quarantine` or stricter on the sending domain before any campaign (`EMAIL_DOMAIN_READINESS.md`).
5. **Human-in-the-loop:** agent-drafted outreach, partner and investor communications require human approval before sending.
6. **No scraping / platform-ToS violations:** LinkedIn and other platforms' automation rules apply; prospect data must come from lawful, documented sources.
7. **Claims discipline:** only claims classified 1 or 2 in the claims register may be stated as fact.
8. **Sensitive data:** never ingest classified information, CUI, PHI or credentials; reuse the screening patterns from `assets/forms.js` / the validation function.

## 3. Gaps to close before GrowthOps go-live
| Gap | Blocking? | Notes |
|---|---|---|
| CRM / system of record | Yes | Choose CRM; build forwarder from the `formSubmitted` function |
| Email platform with unsubscribe + suppression | Yes | Must support API suppression sync |
| Domain email authentication | Yes | Currently none |
| Legal entity, address, approved Privacy Policy listing GrowthOps processors | Yes | Update `/privacy` § Service providers before use |
| Scheduler for `meeting_booked` | No | Event reserved in analytics service |
| Preference centre (topic-level opt-in) | No | `/privacy-contact` handles opt-outs today |
| Data retention schedule | Yes | Owner to define; apply to Forms, CRM, GrowthOps stores |
| Netlify Forms data export / deletion procedure | Yes | Document who can access submissions and how deletion requests are fulfilled |
