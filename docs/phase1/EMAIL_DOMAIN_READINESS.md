# Email and Marketing Domain Readiness — trustnovaops.com

**Checked:** 2026-11-26T15:01Z via public resolvers 1.1.1.1 and 8.8.8.8. **No DNS records were changed.**
**DNS host:** Netlify DNS (NS1 nameservers `dns1–4.p06.nsone.net`; SOA `domains+netlify.netlify.com`). Records are managed in Netlify → Domains → trustnovaops.com.

## Status
| Item | Observed | Status |
|---|---|---|
| MX (apex) | No records | **Missing** — the domain cannot receive email |
| SPF (`v=spf1` TXT at apex) | No TXT records at apex | **Missing** |
| DKIM | No key found for 24 common selectors (`google`, `selector1/2`, `default`, `k1/k2`, `s1/s2`, `zoho`, `protonmail*`, `fm1-3`, `mandrill`, `mailjet`, `sendgrid`, `resend`, …). Actual selectors are provider-specific | **Unverified** — requires provider admin access |
| DMARC (`_dmarc` TXT) | No record | **Missing** |
| MTA-STS / TLS-RPT | No `_mta-sts` / `_smtp._tls` records | **Missing** (optional) |
| BIMI | None | Not applicable until DMARC enforcement |
| CAA | None | **Missing** (optional) |
| HTTPS / TLS | Let's Encrypt (YE1) wildcard `*.trustnovaops.com` + apex, valid to 2026-12-26, auto-renewed by Netlify; HSTS enabled; apex → www 301 | **Verified** |
| Mail provider | None discoverable | **Requires administrator input** |
| Email domain alignment | No sending service configured; Netlify form notifications are sent from `formresponses@netlify.com` (not aligned to the domain, which is normal for notifications) | **Not applicable yet** |

## Immediate, provider-independent protection (recommended now)
Because the domain sends **no** email today, publish "null" records so nobody can spoof it. Replace them when a mail provider is chosen.

| Type | Host | Value |
|---|---|---|
| TXT | `@` | `v=spf1 -all` |
| TXT | `_dmarc` | `v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s` |
| MX (optional "null MX", RFC 7505) | `@` | priority `0`, target `.` |

> Owner authorization is required before these are added in Netlify DNS.

## When a mail provider is chosen
Exact records depend on the provider; do **not** copy selectors from elsewhere. Typical steps:

1. **Remove** the null SPF/MX above.
2. **MX:** add the provider's MX hosts exactly as given in its admin console.
3. **SPF:** one TXT at `@`, e.g. Google Workspace `v=spf1 include:_spf.google.com ~all` or Microsoft 365 `v=spf1 include:spf.protection.outlook.com ~all`. Add each sending service (e.g. a marketing platform) with its `include:`; stay under 10 DNS lookups.
4. **DKIM:** generate keys in the provider console and publish the CNAME/TXT records it shows (selector names come from the provider). Do the same for any marketing platform (custom sending domain such as `mail.trustnovaops.com` is recommended for bulk mail).
5. **DMARC:** start with monitoring, then enforce:
   * Week 0: `v=DMARC1; p=none; rua=mailto:dmarc@trustnovaops.com; fo=1`
   * After 2–4 weeks of clean aggregate reports: `p=quarantine; pct=25` → `pct=100`
   * Then `p=reject`.
6. **Optional:** MTA-STS + TLS-RPT, CAA (`0 issue "letsencrypt.org"` — confirm Netlify's current CA list first), BIMI after `p=quarantine/reject`.

## CAN-SPAM / marketing prerequisites
| Requirement | Status |
|---|---|
| Accurate "From" identity and legal entity name | **Blocked** — owner to provide entity name |
| Valid physical postal address in every commercial email | **Blocked** — owner to provide |
| Working unsubscribe in every email, honoured within 10 business days | Pending email platform |
| Centralised suppression list shared across all senders (incl. GrowthOps™) | Pending email platform; design in `GROWTHOPS_INTEGRATION_READINESS.md` |
| Separate marketing consent captured on forms | **Done** (`marketing_consent`) |
| Privacy disclosures | **Drafted** (`/privacy`, pending approval) |
| Opt-out request channel | **Done** (`/privacy-contact`) |
| No campaigns, outreach automation or scraping in Phase 1 | **Confirmed** |
