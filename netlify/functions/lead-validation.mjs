// Server-side validation of verified Netlify Forms submissions (formSubmitted event).
// Netlify Forms has already applied honeypot + Akismet spam filtering. This handler
// re-validates fields on the server and writes a PII-free log line so that
// malformed or sensitive-looking submissions can be reviewed in the Forms dashboard.
// It never logs names, emails, phone numbers or message content.

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/
const SENSITIVE = [
  [/\b(TOP\s*SECRET|SECRET\s*\/\/|\/\/\s*NOFORN|CUI\s*\/\/|\/\/\s*CUI|CONFIDENTIAL\s*\/\/)/i, 'classification_marking'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private_key'],
  [/\b(AKIA|ASIA)[0-9A-Z]{16}\b/, 'cloud_access_key'],
  [/\b(gh[pousr]_[A-Za-z0-9]{30,}|xox[abpr]-[A-Za-z0-9-]{10,}|sk_(live|test)_[A-Za-z0-9]{16,})\b/, 'access_token'],
  [/\b(password|passwd|pwd)\s*[:=]\s*\S+/i, 'password'],
  [/\b\d{3}-\d{2}-\d{4}\b/, 'ssn_pattern'],
]

export const RULES = {
  'ai-factory-assessment': {
    required: ['first_name', 'last_name', 'email', 'organization', 'primary_interest', 'privacy_ack'],
    max: { first_name: 80, last_name: 80, email: 254, organization: 120, job_title: 120, business_challenges: 2000, additional_info: 2000, phone: 25 },
    enums: {
      preferred_contact: ['email', 'phone', 'video_call', ''],
      primary_interest: ['enterprise_ai_readiness', 'agentic_ai', 'data_architecture', 'ai_security_governance', 'legacy_modernization', 'palantir_foundry_aip', 'cybersecurity_automation', 'regulatory_compliance', 'ai_infrastructure_costs', 'production_readiness', 'not_sure'],
    },
  },
  contact: {
    required: ['inquiry_type', 'first_name', 'last_name', 'email', 'message', 'privacy_ack'],
    max: { first_name: 80, last_name: 80, email: 254, organization: 120, job_title: 120, message: 3000, phone: 25 },
    enums: {
      inquiry_type: ['general', 'discovery_call', 'guided_demo', 'partnership', 'investor', 'privacy', 'security', 'media'],
      preferred_contact: ['email', 'phone', 'video_call', ''],
    },
  },
  'demo-request': {
    required: ['first_name', 'last_name', 'email', 'company', 'workstation_count'],
    max: { first_name: 120, last_name: 120, email: 254, company: 200, job_title: 200, notes: 5000 },
    enums: {},
  },
}

export function validateSubmission(data = {}) {
  const form = String(data['form-name'] || data.form_name || data.formName || 'unknown')
  const rules = RULES[form]
  const issues = []
  if (!rules) return { form, valid: true, issues: ['no_rules_for_form'] }
  const val = (k) => (data[k] == null ? '' : String(data[k])).trim()
  for (const k of rules.required) if (!val(k)) issues.push(`missing:${k}`)
  if (val('email') && !EMAIL.test(val('email'))) issues.push('invalid:email')
  for (const [k, n] of Object.entries(rules.max)) if (val(k).length > n) issues.push(`too_long:${k}`)
  for (const [k, allowed] of Object.entries(rules.enums)) if (val(k) && !allowed.includes(val(k))) issues.push(`unexpected_value:${k}`)
  if (val('preferred_contact') === 'phone' && !val('phone')) issues.push('missing:phone_for_phone_contact')
  if (val('bot-field')) issues.push('honeypot_filled')
  const free = Object.entries(data).filter(([k]) => !['form-name', 'email'].includes(k)).map(([, v]) => String(v ?? '')).join('\n')
  for (const [re, label] of SENSITIVE) if (re.test(free)) issues.push(`sensitive:${label}`)
  return { form, valid: issues.length === 0, issues, marketing_consent: val('marketing_consent') === 'yes' }
}

export default {
  formSubmitted(event) {
    const result = validateSubmission(event?.data || {})
    const line = JSON.stringify({ type: 'lead_validation', ...result })
    if (result.valid) console.log(line)
    else console.warn(line)
  },
}
