// VANGUARD (AGT-08) — Principal Red Team Lead agent.
// A tool-using agent loop over Netlify AI Gateway (Anthropic), streamed to the
// browser as newline-delimited JSON events.
//
// Implemented as a path-routed Netlify Function (rather than a Netlify Server)
// because functions with a custom path run before the site's SPA catch-all
// rewrite (`/* /index.html 200`), whereas a server would never receive traffic.

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 4096
const MAX_AGENT_STEPS = 6
const MAX_HISTORY = 24
const MAX_MESSAGE_CHARS = 16000
const MAX_FIELD_CHARS = 2000

const ENGAGEMENT_TYPES = {
  external: 'External network & perimeter penetration test',
  internal: 'Internal network / assumed-breach penetration test',
  webapp: 'Web application & API penetration test',
  cloud: 'Cloud (AWS / Azure / GCP) configuration & attack-path assessment',
  ad: 'Active Directory / identity attack-path assessment',
  redteam: 'Objective-based red team / adversary emulation',
  purple: 'Purple team exercise (detection engineering with the blue team)',
  social: 'Social engineering / phishing resilience assessment',
}

// ─── System prompt ────────────────────────────────────────────────────────────
function systemPrompt(engagement) {
  return `You are VANGUARD (AGT-08), TrustNovaOps' agentic Principal Penetration Tester and Red Team Lead. You think and communicate like a senior offensive security practitioner with 15+ years of experience who now leads red team programs for defense contractors and federal systems: OSCE3/OSEP/CRTO-level depth, fluent in MITRE ATT&CK, PTES, OWASP WSTG/ASVS, NIST SP 800-115, NIST SP 800-171 / CMMC 2.0, and FedRAMP pen-test guidance.

## How you operate
- You lead the engagement. You set strategy, sequence the work, mentor operators, and translate technical risk into business impact for executives and auditors.
- Think in attack paths and objectives, not checklists. Chain low/medium findings into realistic impact narratives. Always state assumptions and what evidence would confirm or refute them.
- Be opinionated and prioritised: tell the user what you would do first and why, what is noise, and where the real risk is.
- Pair every offensive insight with defensive value: detection opportunities (log sources, telemetry, example Sigma/KQL/SPL logic), and concrete remediation.
- Map findings to MITRE ATT&CK technique IDs and to NIST SP 800-171 / CMMC Level 2 practices where relevant.
- Use crisp, structured Markdown: short headings, numbered steps, tables for findings. No filler.

## Tools (use them — you are an agent, not a chatbot)
- calculate_cvss: whenever you assign a severity, build a CVSS v3.1 vector and score it with this tool rather than guessing.
- map_controls: look up the compliance controls and ATT&CK techniques for a finding category before writing remediation or report language.
- record_finding: when the user shares evidence (scanner output, tool logs, observations) that supports a real finding, record it to the engagement findings board. One call per distinct finding.
- update_engagement_plan: when asked to plan, scope or re-sequence the engagement, publish the phased plan to the engagement board.

## Rules of engagement (non-negotiable)
- You only support the authorized engagement described below. The operator has attested that written authorization (signed ROE / statement of work) exists for this scope.
- If the user asks about targets, IPs, domains or organisations that are clearly outside the stated scope, pause and ask them to confirm the scope/ROE update before helping with that target.
- You advise, plan, analyse, emulate and report. You do not execute anything against live systems yourself.
- Do not produce functional malware, ransomware, self-propagating code, novel zero-day exploits, or code designed to evade EDR/AV for real-world deployment. Do not help with destructive actions (data destruction, denial of service) or with attacks on systems outside authorization. Where an engagement needs a payload or C2 profile, describe the approach, reference established, publicly available frameworks and their documentation, and focus on the detection and OPSEC considerations.
- Protect client data: remind operators to redact credentials, secrets and CUI before sharing evidence, and never repeat secrets back verbatim.
- If authorization looks doubtful, say so plainly and stop.

## Current engagement
- Client / organisation: ${engagement.org}
- Engagement type: ${ENGAGEMENT_TYPES[engagement.type] || engagement.type}
- Authorized scope: ${engagement.scope}
- Environment notes: ${engagement.environment || 'None provided'}
- Compliance drivers: ${engagement.compliance || 'CMMC 2.0 Level 2 / NIST SP 800-171'}
- Authorization attested by operator: YES`
}

// ─── Tools ────────────────────────────────────────────────────────────────────
const buildTools = () => [
  {
    name: 'calculate_cvss',
    description:
      'Calculate a CVSS v3.1 base score and qualitative severity from a vector string, e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H".',
    input_schema: {
      type: 'object',
      properties: { vector: { type: 'string', description: 'CVSS v3.1 vector string' } },
      required: ['vector'],
    },
  },
  {
    name: 'map_controls',
    description:
      'Look up NIST SP 800-171 r2 / CMMC 2.0 Level 2 practices and representative MITRE ATT&CK techniques for a finding category.',
    input_schema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: Object.keys(CONTROL_MAP),
          description: 'Finding category',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'record_finding',
    description: 'Record a validated finding on the engagement findings board.',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Finding ID, e.g. VG-001' },
        title: { type: 'string' },
        severity: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Low', 'Informational'] },
        cvss_vector: { type: 'string' },
        cvss_score: { type: 'number' },
        affected_assets: { type: 'string' },
        attack_path: { type: 'string', description: 'How an adversary would chain or exploit this' },
        business_impact: { type: 'string' },
        remediation: { type: 'string' },
        attack_techniques: { type: 'array', items: { type: 'string' } },
        controls: { type: 'array', items: { type: 'string' }, description: 'NIST 800-171 / CMMC practice IDs' },
      },
      required: ['id', 'title', 'severity', 'affected_assets', 'remediation'],
    },
  },
  {
    name: 'update_engagement_plan',
    description: 'Publish or replace the phased engagement plan on the engagement board.',
    input_schema: {
      type: 'object',
      properties: {
        objective: { type: 'string', description: 'Overall engagement objective / crown jewels' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string', enum: ['planned', 'in-progress', 'complete', 'blocked'] },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              attack_techniques: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'status', 'objectives'],
          },
        },
      },
      required: ['phases'],
    },
  },
]

const CONTROL_MAP = {
  'weak-authentication': {
    controls: ['3.5.3 (IA.L2-3.5.3) Multifactor authentication', '3.5.7 (IA.L2-3.5.7) Password complexity', '3.5.8 (IA.L2-3.5.8) Password reuse', '3.1.8 (AC.L2-3.1.8) Unsuccessful logon attempts'],
    attack: ['T1110 Brute Force', 'T1078 Valid Accounts', 'T1556 Modify Authentication Process'],
  },
  'access-control': {
    controls: ['3.1.1 (AC.L1-3.1.1) Authorized access control', '3.1.2 (AC.L1-3.1.2) Transaction & function control', '3.1.5 (AC.L2-3.1.5) Least privilege', '3.1.7 (AC.L2-3.1.7) Privileged functions'],
    attack: ['T1068 Exploitation for Privilege Escalation', 'T1548 Abuse Elevation Control Mechanism', 'T1078 Valid Accounts'],
  },
  'active-directory': {
    controls: ['3.1.5 (AC.L2-3.1.5) Least privilege', '3.1.6 (AC.L2-3.1.6) Non-privileged account use', '3.5.10 (IA.L2-3.5.10) Cryptographically-protected passwords', '3.4.2 (CM.L2-3.4.2) Security configuration enforcement'],
    attack: ['T1558.003 Kerberoasting', 'T1558.004 AS-REP Roasting', 'T1003.006 DCSync', 'T1649 Steal or Forge Authentication Certificates', 'T1557.001 LLMNR/NBT-NS Poisoning'],
  },
  'unpatched-software': {
    controls: ['3.11.2 (RA.L2-3.11.2) Vulnerability scanning', '3.11.3 (RA.L2-3.11.3) Vulnerability remediation', '3.14.1 (SI.L1-3.14.1) Flaw remediation'],
    attack: ['T1190 Exploit Public-Facing Application', 'T1210 Exploitation of Remote Services', 'T1068 Exploitation for Privilege Escalation'],
  },
  misconfiguration: {
    controls: ['3.4.1 (CM.L2-3.4.1) System baselining', '3.4.2 (CM.L2-3.4.2) Security configuration enforcement', '3.4.6 (CM.L2-3.4.6) Least functionality', '3.4.7 (CM.L2-3.4.7) Nonessential functionality'],
    attack: ['T1133 External Remote Services', 'T1046 Network Service Discovery', 'T1574 Hijack Execution Flow'],
  },
  'cloud-misconfiguration': {
    controls: ['3.1.1 (AC.L1-3.1.1) Authorized access control', '3.4.2 (CM.L2-3.4.2) Security configuration enforcement', '3.13.1 (SC.L1-3.13.1) Boundary protection', '3.13.16 (SC.L2-3.13.16) Data at rest'],
    attack: ['T1530 Data from Cloud Storage', 'T1078.004 Cloud Accounts', 'T1552.005 Cloud Instance Metadata API', 'T1098 Account Manipulation'],
  },
  'injection': {
    controls: ['3.14.1 (SI.L1-3.14.1) Flaw remediation', '3.13.2 (SC.L2-3.13.2) Security engineering', '3.4.2 (CM.L2-3.4.2) Security configuration enforcement'],
    attack: ['T1190 Exploit Public-Facing Application', 'T1059 Command and Scripting Interpreter', 'T1505.003 Web Shell'],
  },
  'sensitive-data-exposure': {
    controls: ['3.1.3 (AC.L2-3.1.3) Control CUI flow', '3.8.1 (MP.L2-3.8.1) Media protection', '3.13.8 (SC.L2-3.13.8) Data in transit', '3.13.16 (SC.L2-3.13.16) Data at rest'],
    attack: ['T1552 Unsecured Credentials', 'T1005 Data from Local System', 'T1039 Data from Network Shared Drive', 'T1567 Exfiltration Over Web Service'],
  },
  'weak-cryptography': {
    controls: ['3.13.8 (SC.L2-3.13.8) Data in transit', '3.13.11 (SC.L2-3.13.11) CUI encryption (FIPS-validated)', '3.5.10 (IA.L2-3.5.10) Cryptographically-protected passwords'],
    attack: ['T1557 Adversary-in-the-Middle', 'T1040 Network Sniffing', 'T1110.002 Password Cracking'],
  },
  'network-segmentation': {
    controls: ['3.13.1 (SC.L1-3.13.1) Boundary protection', '3.13.5 (SC.L1-3.13.5) Public-access system separation', '3.13.6 (SC.L2-3.13.6) Network communication by exception', '3.1.3 (AC.L2-3.1.3) Control CUI flow'],
    attack: ['T1021 Remote Services', 'T1570 Lateral Tool Transfer', 'T1090 Proxy'],
  },
  'logging-detection-gap': {
    controls: ['3.3.1 (AU.L2-3.3.1) System auditing', '3.3.2 (AU.L2-3.3.2) User accountability', '3.3.5 (AU.L2-3.3.5) Audit correlation', '3.14.6 (SI.L2-3.14.6) Monitor communications for attacks', '3.14.7 (SI.L2-3.14.7) Identify unauthorized use'],
    attack: ['T1562 Impair Defenses', 'T1070 Indicator Removal'],
  },
  'phishing-social-engineering': {
    controls: ['3.2.1 (AT.L2-3.2.1) Role-based risk awareness', '3.2.2 (AT.L2-3.2.2) Role-based training', '3.2.3 (AT.L2-3.2.3) Insider threat awareness', '3.5.3 (IA.L2-3.5.3) Multifactor authentication'],
    attack: ['T1566 Phishing', 'T1598 Phishing for Information', 'T1204 User Execution'],
  },
  'remote-access': {
    controls: ['3.1.12 (AC.L2-3.1.12) Control remote access', '3.1.13 (AC.L2-3.1.13) Remote access confidentiality', '3.1.14 (AC.L2-3.1.14) Remote access routing', '3.13.7 (SC.L2-3.13.7) Split tunneling'],
    attack: ['T1133 External Remote Services', 'T1021.001 Remote Desktop Protocol', 'T1078 Valid Accounts'],
  },
  'secrets-in-code': {
    controls: ['3.5.10 (IA.L2-3.5.10) Cryptographically-protected passwords', '3.13.10 (SC.L2-3.13.10) Key management', '3.4.2 (CM.L2-3.4.2) Security configuration enforcement'],
    attack: ['T1552.001 Credentials in Files', 'T1213.003 Code Repositories', 'T1078 Valid Accounts'],
  },
}

// CVSS v3.1 base score (FIRST specification)
const W = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  PR: { U: { N: 0.85, L: 0.62, H: 0.27 }, C: { N: 0.85, L: 0.68, H: 0.5 } },
  UI: { N: 0.85, R: 0.62 },
  CIA: { H: 0.56, L: 0.22, N: 0 },
}
function roundup(x) {
  const i = Math.round(x * 100000)
  return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10
}
export function calculateCvss(vector) {
  const m = {}
  for (const part of String(vector).trim().split('/')) {
    const [k, v] = part.split(':')
    if (k && v) m[k.toUpperCase()] = v.toUpperCase()
  }
  const S = m.S
  if (
    !W.AV[m.AV] || !W.AC[m.AC] || !['U', 'C'].includes(S) || !W.PR.U[m.PR] ||
    !W.UI[m.UI] || W.CIA[m.C] === undefined || W.CIA[m.I] === undefined || W.CIA[m.A] === undefined
  ) {
    return { error: 'Invalid CVSS v3.1 vector. Expected CVSS:3.1/AV:_/AC:_/PR:_/UI:_/S:_/C:_/I:_/A:_' }
  }
  const iss = 1 - (1 - W.CIA[m.C]) * (1 - W.CIA[m.I]) * (1 - W.CIA[m.A])
  const impact = S === 'U' ? 6.42 * iss : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
  const exploitability = 8.22 * W.AV[m.AV] * W.AC[m.AC] * W.PR[S][m.PR] * W.UI[m.UI]
  let score = 0
  if (impact > 0) {
    score = S === 'U' ? roundup(Math.min(impact + exploitability, 10)) : roundup(Math.min(1.08 * (impact + exploitability), 10))
  }
  const severity = score === 0 ? 'None' : score < 4 ? 'Low' : score < 7 ? 'Medium' : score < 9 ? 'High' : 'Critical'
  const normalized = `CVSS:3.1/AV:${m.AV}/AC:${m.AC}/PR:${m.PR}/UI:${m.UI}/S:${S}/C:${m.C}/I:${m.I}/A:${m.A}`
  return { vector: normalized, score, severity, impact: Math.round(impact * 10) / 10, exploitability: Math.round(exploitability * 10) / 10 }
}

function runTool(name, input, emit) {
  switch (name) {
    case 'calculate_cvss':
      return calculateCvss(input.vector)
    case 'map_controls': {
      const entry = CONTROL_MAP[input.category]
      return entry ? { category: input.category, ...entry } : { error: `Unknown category. Use one of: ${Object.keys(CONTROL_MAP).join(', ')}` }
    }
    case 'record_finding': {
      if (input.cvss_vector) {
        const c = calculateCvss(input.cvss_vector)
        if (!c.error) {
          input.cvss_vector = c.vector
          input.cvss_score = c.score
        }
      }
      emit({ type: 'finding', finding: input })
      return { recorded: true, id: input.id }
    }
    case 'update_engagement_plan':
      emit({ type: 'plan', plan: input })
      return { published: true, phases: input.phases?.length || 0 }
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

// ─── Request validation ───────────────────────────────────────────────────────
const clip = (s, n = MAX_FIELD_CHARS) => String(s ?? '').slice(0, n).trim()

function parseBody(body) {
  const e = body?.engagement || {}
  if (e.roe_attested !== true) return { error: 'Written authorization (signed ROE / SOW) must be attested before VANGUARD can support this engagement.' }
  const engagement = {
    org: clip(e.org, 200),
    type: ENGAGEMENT_TYPES[e.type] ? e.type : 'redteam',
    scope: clip(e.scope),
    environment: clip(e.environment),
    compliance: clip(e.compliance, 300),
  }
  if (!engagement.org || !engagement.scope) return { error: 'Client organisation and authorized scope are required.' }

  const raw = Array.isArray(body.messages) ? body.messages.slice(-MAX_HISTORY) : []
  const messages = raw
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
  while (messages.length && messages[0].role !== 'user') messages.shift()
  if (!messages.length || messages[messages.length - 1].role !== 'user') return { error: 'A user message is required.' }
  return { engagement, messages }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = parseBody(body)
  if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 })
  const { engagement, messages } = parsed

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event) => controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
      try {
        const convo = [...messages]
        for (let step = 0; step < MAX_AGENT_STEPS; step++) {
          const ms = anthropic.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt(engagement),
            tools: buildTools(),
            messages: convo,
          })
          ms.on('text', (text) => emit({ type: 'text', text }))
          const msg = await ms.finalMessage()
          if (msg.stop_reason === 'refusal') {
            emit({
              type: 'refusal',
              error: 'The model safeguards declined this request. Reframe it around the authorized scope, analysis, detection or remediation, and redact any sensitive data.',
            })
            break
          }
          convo.push({ role: 'assistant', content: msg.content })

          const toolUses = msg.content.filter((b) => b.type === 'tool_use')
          if (msg.stop_reason !== 'tool_use' || !toolUses.length) break

          const results = toolUses.map((tu) => {
            emit({ type: 'tool', name: tu.name, input: tu.input })
            let result
            try {
              result = runTool(tu.name, tu.input || {}, emit)
            } catch (err) {
              result = { error: String(err?.message || err) }
            }
            return { type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(result) }
          })
          convo.push({ role: 'user', content: results })
          emit({ type: 'step' })
        }
        emit({ type: 'done' })
      } catch (err) {
        console.error('VANGUARD error', err)
        const status = err?.status
        emit({
          type: 'error',
          error: status === 429 ? 'VANGUARD is at capacity. Wait a minute and retry.' : 'VANGUARD hit an error generating a response. Please retry.',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

export const config = {
  path: '/api/vanguard',
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
}
