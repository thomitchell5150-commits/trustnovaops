// Build step (no dependencies): writes public runtime config from environment variables.
// Usage (Netlify build command): node scripts/write-runtime-config.mjs
// Supported variables:
//   GA4_MEASUREMENT_ID   e.g. G-XXXXXXXXXX  (public identifier; only loaded after visitor consent)
//   GSC_VERIFICATION     Google Search Console HTML-tag token (optional; DNS verification preferred)
//   ANALYTICS_ENABLED_CONTEXTS  comma list of Netlify contexts allowed to load GA4 (default: production)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] || join(root, 'assets', 'runtime-config.js');
const context = process.env.CONTEXT || 'local';
const allowed = (process.env.ANALYTICS_ENABLED_CONTEXTS || 'production').split(',').map(s => s.trim());

let ga4 = (process.env.GA4_MEASUREMENT_ID || '').trim();
if (ga4 && !/^G-[A-Z0-9]{4,16}$/.test(ga4)) {
  console.warn('[runtime-config] GA4_MEASUREMENT_ID ignored: unexpected format');
  ga4 = '';
}
if (ga4 && !allowed.includes(context)) {
  console.log(`[runtime-config] GA4 disabled for context "${context}" (allowed: ${allowed.join(', ')})`);
  ga4 = '';
}
const config = { ga4, env: context };
writeFileSync(out, `/* Generated at build time by scripts/write-runtime-config.mjs. Public values only. */\nwindow.TN_CONFIG = ${JSON.stringify(config)};\n`);
console.log(`[runtime-config] wrote ${out} (analytics ${ga4 ? 'configured' : 'disabled'}, context ${context})`);

const gsc = (process.env.GSC_VERIFICATION || '').trim();
if (gsc && process.argv.length <= 2) {
  if (!/^[A-Za-z0-9_\-]{10,100}$/.test(gsc)) {
    console.warn('[runtime-config] GSC_VERIFICATION ignored: unexpected format');
  } else {
    const idx = join(root, 'index.html');
    const html = readFileSync(idx, 'utf8');
    if (html.includes('<!--gsc-verification-->')) {
      writeFileSync(idx, html.replace('<!--gsc-verification-->', `<meta name="google-site-verification" content="${gsc}">`));
      console.log('[runtime-config] Search Console verification tag injected');
    }
  }
}
