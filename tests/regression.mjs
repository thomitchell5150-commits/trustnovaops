#!/usr/bin/env node
// TrustNovaOps Phase 1 regression suite — zero dependencies (Node 18+).
// Usage:
//   node tests/regression.mjs                       # against http://localhost:8889 (netlify dev)
//   BASE_URL=https://<deploy-preview>.netlify.app node tests/regression.mjs
//   STATIC_ONLY=1 node tests/regression.mjs         # file-level checks only, no server
// Never submits forms (no test leads are sent to production recipients).
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = (process.env.BASE_URL || 'http://localhost:8889').replace(/\/$/, '')
const STATIC_ONLY = !!process.env.STATIC_ONLY
let pass = 0, fail = 0, warn = 0
const results = []
const ok = (name, cond, detail = '') => { cond ? pass++ : fail++; results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail && !cond ? ' — ' + detail : ''}`) }
const note = (name, detail) => { warn++; results.push(`WARN  ${name} — ${detail}`) }

const PAGES = {
  '/': 'index.html', '/platform': 'platform.html', '/accord': 'accord.html', '/warden': 'warden.html', '/demo': 'demo.html',
  '/ai-factory-assessment': 'ai-factory-assessment.html', '/contact': 'contact.html', '/security': 'security.html',
  '/privacy': 'privacy.html', '/terms': 'terms.html', '/cookies': 'cookies.html', '/acceptable-use': 'acceptable-use.html', '/privacy-contact': 'privacy-contact.html',
}
const DRAFT_LEGAL = ['/privacy', '/terms', '/cookies', '/acceptable-use', '/privacy-contact']
const REDIRECTS = { '/privacy-policy': '/privacy', '/terms-of-service': '/terms', '/contact-us': '/contact', '/compliance': '/security', '/pricing': '/ai-factory-assessment', '/agent-007': '/platform', '/docs': '/#experience', '/status': '/' }
const read = (f) => readFileSync(join(ROOT, f), 'utf8')
const attr = (html, re) => (html.match(re) || [])[1]

// ---------------- Static checks ----------------
const titles = new Map(), descs = new Map()
for (const [path, file] of Object.entries(PAGES)) {
  const h = read(file)
  const title = attr(h, /<title>([^<]+)<\/title>/)
  const desc = attr(h, /<meta name="description" content="([^"]+)"/)
  const canon = attr(h, /<link rel="canonical" href="([^"]+)"/)
  ok(`${path} has title`, !!title)
  ok(`${path} has meta description (50–170 chars)`, desc && desc.length >= 50 && desc.length <= 170, `len=${desc?.length}`)
  ok(`${path} canonical matches route`, canon === 'https://www.trustnovaops.com' + path, canon)
  ok(`${path} has og:image + twitter card`, /og:image"/.test(h) && /twitter:card/.test(h))
  ok(`${path} has exactly one <h1>`, (h.match(/<h1[\s>]/g) || []).length === 1)
  ok(`${path} has skip link`, /class="skip-link"/.test(h))
  ok(`${path} loads analytics service`, /\/assets\/analytics\.js/.test(h) && /\/assets\/runtime-config\.js/.test(h))
  ok(`${path} has no injected preview script`, !/\.netlify\/scripts\/ar/.test(h))
  ok(`${path} has no inline GA/gtag snippet`, !/googletagmanager\.com\/gtag\/js\?id=G-/.test(h))
  for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    let parsed = null; try { parsed = JSON.parse(m[1]) } catch {}
    ok(`${path} JSON-LD parses`, !!parsed)
    if (parsed) ok(`${path} JSON-LD has no ratings/reviews`, !/aggregateRating|"review"/i.test(m[1]))
  }
  if (titles.has(title)) ok(`${path} title unique`, false, `duplicates ${titles.get(title)}`); else titles.set(title, path)
  if (descs.has(desc)) ok(`${path} description unique`, false, `duplicates ${descs.get(desc)}`); else descs.set(desc, path)
  if (DRAFT_LEGAL.includes(path)) {
    ok(`${path} is noindex while draft`, /<meta name="robots" content="noindex/.test(h))
    ok(`${path} shows draft banner`, /draft-banner/.test(h))
    ok(`${path} is not homepage content`, !/hero-grid/.test(h))
  }
  // internal links resolve to a known page, asset, anchor or redirect
  for (const m of h.matchAll(/href="(\/[^"#?]*)/g)) {
    const p = m[1].replace(/\/$/, '') || '/'
    const known = PAGES[p] || REDIRECTS[p] || p.startsWith('/assets/') || p === '/robots.txt' || p === '/.well-known/security.txt' || existsSync(join(ROOT, p.slice(1)))
    if (!known) ok(`${path} internal link ${p} resolves`, false)
  }
  // simulated metrics carry a disclosure
  if (['/', '/platform', '/accord', '/warden', '/demo'].includes(path)) ok(`${path} carries a demonstration disclosure`, /data-disclosure="/.test(h))
}
// assessment CTAs
for (const f of ['index.html', 'platform.html', 'accord.html']) {
  const h = read(f)
  ok(`${f}: no assessment CTA points to /demo`, !/href="\/demo"[^>]*>[^<]*Assessment/i.test(h))
}
// forms
const forms = { 'ai-factory-assessment.html': 'ai-factory-assessment', 'contact.html': 'contact', 'demo.html': 'demo-request' }
for (const [f, name] of Object.entries(forms)) {
  const h = read(f)
  const tag = attr(h, new RegExp(`(<form[^>]*name=['"]${name}['"][^>]*>)`))
  ok(`${f}: form "${name}" registered for Netlify Forms`, !!tag && /data-netlify="true"/.test(tag))
  ok(`${f}: honeypot configured`, !!tag && /netlify-honeypot="bot-field"/.test(tag) && /name="bot-field"/.test(h))
  ok(`${f}: hidden form-name present`, new RegExp(`name="form-name" value="${name}"`).test(h))
  if (name !== 'demo-request') {
    ok(`${f}: privacy acknowledgment required`, /name="privacy_ack"[^>]*required/.test(h))
    ok(`${f}: marketing consent optional & unchecked`, /name="marketing_consent"/.test(h) && !/name="marketing_consent"[^>]*(required|checked)/.test(h))
    ok(`${f}: sensitive-data warning shown`, /classified information/.test(h) && /CUI/.test(h) && /PHI/.test(h))
    ok(`${f}: UTM hidden fields present`, ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].every(k => h.includes(`name="${k}"`)))
    for (const m of h.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
      const a = m[2]; if (/type="(hidden|radio|checkbox)"/.test(a) || /name="bot-field"/.test(a)) continue
      const id = attr(a, /id="([^"]+)"/)
      ok(`${f}: field ${attr(a, /name="([^"]+)"/)} has a <label for>`, !!id && h.includes(`for="${id}"`))
    }
  }
}
ok('demo.html: no false success on failed submit', !/Still show success/.test(read('demo.html')) && /res\.ok/.test(read('demo.html')))
const assess = read('ai-factory-assessment.html')
ok('assessment page headline', assess.includes('Accelerate Your Enterprise AI Journey with the'))
for (const f of ['first_name', 'last_name', 'email', 'organization', 'job_title', 'industry', 'organization_size', 'primary_interest', 'ai_maturity', 'business_challenges', 'preferred_contact', 'additional_info'])
  ok(`assessment form has ${f}`, assess.includes(`name="${f}"`))
ok('assessment page lists 10 areas', (assess.match(/<ul class="areas">([\s\S]*?)<\/ul>/)?.[1].match(/<li>/g) || []).length === 10)
// sitemap / robots / config
const sm = read('sitemap.xml')
ok('sitemap includes assessment page', sm.includes('/ai-factory-assessment</loc>'))
ok('sitemap excludes draft legal pages', !DRAFT_LEGAL.some(p => sm.includes(p + '</loc>')))
ok('robots.txt references sitemap', /Sitemap: https:\/\/www\.trustnovaops\.com\/sitemap\.xml/.test(read('robots.txt')))
const toml = read('netlify.toml')
ok('netlify.toml has no SPA catch-all', !/from = "\/\*"/.test(toml))
ok('_redirects removed (single source of truth)', !existsSync(join(ROOT, '_redirects')))
ok('CSP shipped report-only', /Content-Security-Policy-Report-Only/.test(toml))
ok('accord: xlsx 0.18.5 removed', !/xlsx\/0\.18\.5/.test(read('accord.html')))
ok('accord: third-party scripts carry SRI', [...read('accord.html').matchAll(/<script src="https:[^"]+"([^>]*)>/g)].every(m => /integrity="sha384-/.test(m[1])))
ok('runtime-config.js committed default has no GA ID', /ga4: ""/.test(read('assets/runtime-config.js')))
// secrets scan
const secretRe = /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk_live_[A-Za-z0-9]{16,}|ghp_[A-Za-z0-9]{30,}|nfp_[A-Za-z0-9]{20,})/
const files = readdirSync(ROOT).filter(f => /\.(html|js|toml|xml|txt|md)$/.test(f)).concat(readdirSync(join(ROOT, 'assets')).filter(f => f.endsWith('.js')).map(f => 'assets/' + f))
// AKIAIOSFODNN7EXAMPLE is AWS's public documentation placeholder used inside the NOVA demo.
ok('no secrets in published files', !files.some(f => secretRe.test(read(f).replaceAll('AKIAIOSFODNN7EXAMPLE', ''))))

// ---------------- Unit checks: analytics PII guard & form validation ----------------
{
  const store = () => { const m = new Map(); return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) } }
  const listeners = {}
  const ctx = {
    window: {}, navigator: {}, console, URL, URLSearchParams, Date, JSON, Math, isFinite, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o?.detail } },
    location: { href: 'https://www.trustnovaops.com/ai-factory-assessment?utm_source=linkedin&utm_medium=social&utm_campaign=q1&email=a%40b.com', search: '?utm_source=linkedin&utm_medium=social&utm_campaign=q1&email=a%40b.com', pathname: '/ai-factory-assessment', host: 'www.trustnovaops.com', hostname: 'www.trustnovaops.com' },
    document: { readyState: 'complete', referrer: '', cookie: '', body: { getAttribute: () => null, appendChild() {} }, head: { appendChild() {} }, addEventListener: (t, f) => { listeners[t] = f }, dispatchEvent() {}, createElement: () => ({ setAttribute() {}, addEventListener() {}, remove() {} }), querySelectorAll: () => [] },
  }
  ctx.window = ctx; ctx.localStorage = store(); ctx.sessionStorage = store()
  ctx.window.TN_CONFIG = { ga4: 'G-TEST12345' }
  vm.createContext(ctx)
  vm.runInContext(read('assets/analytics.js'), ctx)
  const A = ctx.TNAnalytics
  ok('analytics: 12 required events allow-listed', ['assessment_cta_click', 'assessment_form_start', 'assessment_form_submit', 'assessment_form_error', 'demo_launched', 'demo_completed', 'solution_viewed', 'contact_submit', 'meeting_booked', 'partner_inquiry', 'investor_inquiry', 'outbound_link_click'].every(e => A.events.includes(e)))
  ok('analytics: unknown events blocked', A.track('made_up_event', {}) === false && !A._log.some(e => e.event === 'made_up_event'))
  A.track('assessment_form_submit', { form: 'x', email: 'jane@corp.com', interest: 'jane@corp.com', message: 'hello', location: 'hero' })
  const last = A._log[A._log.length - 1].props
  ok('analytics: email/unknown props stripped', !JSON.stringify(last).includes('@') && !('email' in last) && !('message' in last) && last.location === 'hero')
  ok('analytics: UTM attribution captured', last.utm_source === 'linkedin' && last.utm_campaign === 'q1')
  ok('analytics: non-UTM query params never captured', !JSON.stringify(A.attribution()).includes('email'))
  ok('analytics: nothing sent without consent', A.track('demo_launched', { demo: 'nova' }) === false && ctx.dataLayer.length === 0)
  A.consent.set(true)
  ok('analytics: sent after opt-in', A.track('demo_launched', { demo: 'nova' }) === true)
  A.consent.set(false)
  ok('analytics: stops after opt-out', A.track('demo_launched', { demo: 'nova' }) === false)
}
{
  const ctx = { window: {}, document: { readyState: 'loading', addEventListener() {} }, console, URLSearchParams, location: { search: '' } }
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(read('assets/forms.js'), ctx)
  const F = ctx.TNForms
  const scan = (v) => F.sensitive.some(([re]) => re.test(v))
  ok('forms: flags classification marking', scan('SECRET//NOFORN details'))
  ok('forms: flags AWS key', scan('key AKIAABCDEFGHIJKLMNOP'))
  ok('forms: flags password', scan('password: hunter2'))
  ok('forms: does not flag ordinary CUI mention', !scan('We need help protecting CUI under CMMC Level 2'))
  ok('forms: email validator accepts business email', F.email.test('jane.doe@agency.gov'))
  ok('forms: email validator rejects bad email', !F.email.test('jane@') && !F.email.test('jane doe@x.com'))
}
{
  const m = await import(join(ROOT, 'netlify/functions/lead-validation.mjs'))
  ok('server validation: valid assessment passes', m.validateSubmission({ 'form-name': 'ai-factory-assessment', first_name: 'A', last_name: 'B', email: 'a@b.co', organization: 'X', primary_interest: 'agentic_ai', privacy_ack: 'yes' }).valid)
  const bad = m.validateSubmission({ 'form-name': 'contact', email: 'bad', message: 'password: x', inquiry_type: 'nope' })
  ok('server validation: invalid contact flagged', !bad.valid && bad.issues.includes('invalid:email') && bad.issues.includes('sensitive:password'))
}

// ---------------- HTTP checks ----------------
async function http() {
  const get = (p, o = {}) => fetch(BASE + p, { redirect: 'manual', ...o })
  try { await get('/') } catch { note('HTTP checks', `server not reachable at ${BASE} — skipped`); return }
  for (const [path, file] of Object.entries(PAGES)) {
    const r = await get(path); const body = await r.text()
    ok(`GET ${path} → 200`, r.status === 200, `got ${r.status}`)
    const want = attr(read(file), /<title>([^<]+)<\/title>/)
    ok(`GET ${path} serves its own page`, body.includes(`<title>${want}</title>`))
  }
  for (const p of ['/this-page-does-not-exist', '/docs/phase1/PHASE1_WEBSITE_AUDIT.md', '/tests/regression.mjs', '/scripts/write-runtime-config.mjs']) {
    const r = await get(p); const b = await r.text()
    ok(`GET ${p} → 404`, r.status === 404, `got ${r.status}`)
    if (p.startsWith('/this')) ok('404 page is branded', b.includes('Page Not Found'))
  }
  for (const [from, to] of Object.entries(REDIRECTS)) {
    const r = await get(from)
    const loc = r.headers.get('location') || ''
    ok(`${from} → 301 ${to}`, r.status === 301 && (loc === to || loc.endsWith(to)), `${r.status} ${loc}`)
  }
  const h = (await get('/')).headers
  for (const k of ['x-content-type-options', 'referrer-policy', 'permissions-policy', 'strict-transport-security', 'content-security-policy', 'content-security-policy-report-only', 'cross-origin-opener-policy', 'x-frame-options'])
    h.get(k) ? ok(`header ${k} present`, true) : (BASE.includes('localhost') && k === 'strict-transport-security' ? note(`header ${k}`, 'not emitted by local dev server; verify on deploy preview') : ok(`header ${k} present`, false))
  for (const p of ['/sitemap.xml', '/robots.txt', '/.well-known/security.txt', '/assets/analytics.js', '/assets/disclosure.js', '/assets/forms.js', '/assets/img/og-default.jpg'])
    ok(`GET ${p} → 200`, (await get(p)).status === 200)
}
if (!STATIC_ONLY) await http()

console.log(results.join('\n'))
console.log(`\n${pass} passed, ${fail} failed, ${warn} warnings  (base: ${STATIC_ONLY ? 'static only' : BASE})`)
process.exit(fail ? 1 : 0)
