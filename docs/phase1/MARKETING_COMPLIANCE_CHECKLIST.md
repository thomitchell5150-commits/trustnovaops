# Marketing Claims and Compliance Checklist

Classification: **1** Independently verified · **2** Supported by published research · **3** Demonstration/simulated data · **4** Illustrative target · **5** Unsupported claim requiring remediation.

## Claims register
| # | Claim (location) | Class | Action taken | Owner action |
|---|---|---|---|---|
| 1 | "Factory status: Operational" (home hero card) | 3 | Kept; card labelled **Representative scenario · Simulated environment** with link to demo terms; `aria-label` says "(simulated)" | — |
| 2 | "94.8 CONTROL %" / "Control coverage 94.8%" (home hero) | 3 | Kept under the same disclosure | — |
| 3 | "Model assurance: Verified" (home hero) | 5 | Changed to "Model checks: Passing" (scenario state) under disclosure | — |
| 4 | "Decision latency −42%" (home hero) | 5→4 | Relabelled "Latency target −42%" under disclosure | Confirm or replace target |
| 5 | "74% of enterprises struggle to move AI from pilot to scaled value" (home) | 5 (pending) | Replaced with "Most enterprises still struggle…" | Provide source (likely BCG, *Where's the Value in AI?*, Oct 2024). Restore figure **with visible citation** only after confirming exact wording |
| 6 | "● Live demo" (Experience Center) | 3 | Changed to "Interactive demo"; section disclosure added | — |
| 7 | "110 PRACTICES" (Experience Center) | Factual | NIST SP 800-171 Rev 2 has 110 requirements | — |
| 8 | Sector chips "Defense, Federal, Utilities, Healthcare, Manufacturing" | 4 | Reads as "Built for…" (target markets), not customers | Confirm no implication of existing customers |
| 9 | NOVA: "Apex Defense Systems · 847 endpoints · C3PAO: SecureVault Assessment Group" | 3 | Marked "(fictional)"; note says data, scores and savings are simulated, not customer data | Confirm names do not belong to real organisations |
| 10 | NOVA: CMMC score 92%, 99.1% pass rate, ATO readiness 87%, 99.8% accuracy, evidence counts | 3 | Covered by page-level demo disclosure | — |
| 11 | NOVA: "$420K cost avoidance", "2,140 hrs saved", "C3PAO prep ↓78%", "Consultant fees ↓80%" | 5→3 | Labelled "Cost Avoidance · illustrative", "Illustrative scenario estimate — not a measured customer result" + badge | — |
| 12 | `/demo`: "<90ms mean time to contain", "83% auto-resolved", "99.7% detection accuracy" | 5→4 | Labelled **Illustrative targets — not measured production customer results** | Provide evidence or remove |
| 13 | `/demo`: "typical response <4 hours", "within 1 business day" | 5 (commitment) | Removed | Re-add only if an SLA is staffed |
| 14 | `/demo` "We will never sell your data or add you to bulk marketing lists" | Commitment | Replaced with privacy acknowledgment + sensitive-data notice | Policy statement now lives in Privacy Policy |
| 15 | WARDEN page overall | 4 | **Product concept** disclosure added (footer already said "Product Concept") | Confirm current availability |
| 16 | WARDEN: "Palantir Foundry Integration — Native ontology-level classification" | 5 | Reworded "Designed for … (planned)" | Confirm whether any Palantir integration or relationship exists |
| 17 | WARDEN vs "Traditional DLP (Symantec, Forcepoint, etc.)" comparison | 5 | Disclaimer: design intent vs general category, not independent evaluation; trademarks belong to owners | Counsel review of comparative advertising |
| 18 | WARDEN internal Recommendation section: pricing "$8–$15/workstation/month", "SAM/CISA approved vendor path", "Higher ACV", "existing TrustNovaOps customers" | 5 / internal | **Removed from public page**; archived verbatim at `docs/phase1/archive/warden-recommendation-section.html` | Decide: keep private (recommended) or republish approved copy |
| 19 | ACCORD: "RMF Ready", "FedRAMP Support", "Evidence 98% current", "Accelerated ATO readiness" | 3/4 | Disclosure: simulated environment; outputs are not compliance evidence and do not represent a FedRAMP authorization or ATO | — |
| 20 | Framework references sitewide (CMMC, FedRAMP, NIST 800-53/171, RMF/ATO, DFARS, HIPAA, NIST AI RMF) | Alignment | Terms §"No certification or authorization implied"; Security page "What we do not claim" | Provide evidence for any certification before claiming it |
| 21 | Third-party names (Palantir, Foundry, AIP, AWS GovCloud, Azure, Splunk, ServiceNow, …) | — | Terms: trademarks of owners; no partnership/endorsement implied | Confirm any actual partnerships to state them accurately |

## Implied relationships check
| Question | Result |
|---|---|
| Implies existing commercial customers? | Removed "existing TrustNovaOps customers" (WARDEN). No logos/testimonials exist. **Pass** |
| Implies government authorization (FedRAMP/ATO/CMMC certification)? | Disclaimers on Terms, Security, ACCORD. **Pass** |
| Implies security certification (SOC 2, ISO 27001)? | No such claims found. **Pass** |
| Implies production deployment? | "Live demo"/"Operational" labelled as simulated. **Pass** |
| Implies partnership (Palantir, AWS, Microsoft)? | Reworded/disclaimed. **Pass pending owner confirmation** |

## Disclosure component usage
`assets/disclosure.js` + styles in `assets/site-chrome.css`. Types: `simulated`, `illustrative`, `demo`, `representative`, `not-customer-data`, `target`, `concept`.
```html
<p class="tn-disclosure" data-disclosure="simulated"><b>Simulated environment</b> Optional detail. <a href="/terms#demonstrations">About our demos</a></p>
<!-- or let the script fill text: --> <span data-disclosure="illustrative"></span>
<script>el.append(TNDisclosure.create('demo', {compact:true}))</script>
```
Prefer static markup above the fold (avoids layout shift).

## Communication compliance (CAN-SPAM readiness)
| Requirement | Status |
|---|---|
| Separate, unticked marketing consent on forms | **Done** (`marketing_consent`, optional) |
| Privacy acknowledgment separate from marketing consent | **Done** (`privacy_ack`, required) |
| Accurate business identity & physical postal address | **Blocked** — owner to provide |
| Unsubscribe mechanism in every email | **Pending** — provided by future email platform |
| Opt-out request channel | **Done** — `/privacy-contact` → contact form (inquiry type "Privacy request") |
| Centralised suppression list | **Pending** — create in chosen email platform; see `GROWTHOPS_INTEGRATION_READINESS.md` |
| No campaigns, LinkedIn automation or scraping activated | **Confirmed** — none activated in Phase 1 |
