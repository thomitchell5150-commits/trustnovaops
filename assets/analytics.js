/* TrustNovaOps analytics & consent service (Phase 1)
 * - Zero dependencies. Safe to load on every page and inside demo apps.
 * - Nonessential tracking (GA4) loads ONLY after the visitor opts in, and only when a
 *   GA4 measurement ID is configured via the GA4_MEASUREMENT_ID environment variable.
 * - Honors Global Privacy Control (treated as an opt-out until the visitor chooses otherwise).
 * - Event payloads are allow-listed and scrubbed: no PII, no form content, no free text.
 * Public API: window.TNAnalytics.track(event, props), .consent.get()/.set(bool),
 *             .attribution(), .fillAttribution(form), .events (allow-list)
 */
(function () {
  'use strict';
  var CONSENT_KEY = 'tn_consent';
  var ATTR_KEY = 'tn_attr';
  var CONSENT_VERSION = 1;
  var cfg = window.TN_CONFIG || {};
  var GA_ID = /^G-[A-Z0-9]{4,16}$/.test(cfg.ga4 || '') ? cfg.ga4 : '';

  var EVENTS = {
    assessment_cta_click: 1, assessment_form_start: 1, assessment_form_submit: 1, assessment_form_error: 1,
    demo_launched: 1, demo_completed: 1, solution_viewed: 1, contact_submit: 1, meeting_booked: 1,
    partner_inquiry: 1, investor_inquiry: 1, outbound_link_click: 1, form_error: 1, contact_form_start: 1
  };
  var PROPS = { location: 1, cta: 1, demo: 1, solution: 1, form: 1, inquiry_type: 1, error_type: 1,
    error_count: 1, link_domain: 1, interest: 1, maturity: 1, org_size: 1, industry: 1 };
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  var debug = false;
  try { debug = /[?&]tn_debug=1/.test(location.search) || localStorage.getItem('tn_debug') === '1'; } catch (e) {}

  function store(kind) { try { var s = window[kind]; s.setItem('__t', '1'); s.removeItem('__t'); return s; } catch (e) { return null; } }
  var ls = store('localStorage'), ss = store('sessionStorage');

  // Value scrubber: short, token-like strings only. Rejects anything resembling an email, phone or long free text.
  function clean(v) {
    if (typeof v === 'number' && isFinite(v)) return Math.round(v);
    if (typeof v !== 'string') return undefined;
    v = v.trim().slice(0, 100);
    if (!v || /@|%40/.test(v) || /\d{7,}/.test(v.replace(/[\s().-]/g, ''))) return undefined;
    if (!/^[A-Za-z0-9 _.:\/+\-]+$/.test(v)) return undefined;
    return v;
  }

  // ---------- Consent ----------
  function readConsent() {
    if (!ls) return null;
    try { var c = JSON.parse(ls.getItem(CONSENT_KEY) || 'null'); return c && c.v === CONSENT_VERSION ? c : null; } catch (e) { return null; }
  }
  function gpc() { return navigator.globalPrivacyControl === true; }
  var consent = {
    get: function () { var c = readConsent(); return c ? !!c.analytics : false; },
    decided: function () { return !!readConsent(); },
    set: function (analytics) {
      if (ls) ls.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, analytics: !!analytics, ts: new Date().toISOString().slice(0, 10) }));
      if (analytics) loadGA(); else revokeGA();
      hideBanner();
      document.dispatchEvent(new CustomEvent('tn:consent', { detail: { analytics: !!analytics } }));
    },
    configured: function () { return !!GA_ID; },
    gpc: gpc
  };

  // ---------- Attribution (first touch per session, UTM keys only) ----------
  function captureAttribution() {
    if (!ss) return {};
    var existing = null;
    try { existing = JSON.parse(ss.getItem(ATTR_KEY) || 'null'); } catch (e) {}
    var params = new URLSearchParams(location.search), found = {}, any = false;
    UTM.forEach(function (k) { var v = clean(params.get(k) || ''); if (v) { found[k] = v.toLowerCase(); any = true; } });
    if (existing && !any) return existing;
    var ref = '';
    try { if (document.referrer) { var r = new URL(document.referrer); if (r.host !== location.host) ref = r.hostname; } } catch (e) {}
    var attr = found;
    attr.landing_page = location.pathname.slice(0, 100);
    if (ref) attr.referrer_domain = ref;
    try { ss.setItem(ATTR_KEY, JSON.stringify(attr)); } catch (e) {}
    return attr;
  }
  var attribution = captureAttribution();

  // Writes attribution into hidden form fields (first-party, submitted only with the visitor's own inquiry).
  function fillAttribution(form) {
    if (!form) return;
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'landing_page', 'referrer_domain'].forEach(function (k) {
      var el = form.querySelector('input[type="hidden"][name="' + k + '"]');
      if (el) el.value = attribution[k] || '';
    });
  }

  // ---------- GA4 loader ----------
  var gaLoaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  function safePageLocation() {
    // Strip every query parameter except UTM keys so no PII can leak through URLs.
    var u = new URL(location.href), keep = new URLSearchParams();
    UTM.forEach(function (k) { var v = clean(u.searchParams.get(k) || ''); if (v) keep.set(k, v); });
    var q = keep.toString();
    return u.origin + u.pathname + (q ? '?' + q : '');
  }
  function loadGA() {
    if (!GA_ID || gaLoaded) return;
    gaLoaded = true;
    gtag('js', new Date());
    gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    gtag('config', GA_ID, { page_location: safePageLocation(), allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
  }
  function revokeGA() {
    if (gaLoaded) gtag('consent', 'update', { analytics_storage: 'denied' });
    // Remove first-party GA cookies on this domain.
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^_ga/.test(name)) {
        var host = location.hostname, domains = ['', host, '.' + host.replace(/^www\./, '')];
        domains.forEach(function (d) { document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : ''); });
      }
    });
  }

  // ---------- Event tracking ----------
  var log = [];
  function track(name, props) {
    if (!EVENTS[name]) { if (debug) console.warn('[TNAnalytics] blocked unknown event', name); return false; }
    var payload = {};
    props = props || {};
    Object.keys(props).forEach(function (k) { if (PROPS[k]) { var v = clean(props[k]); if (v !== undefined) payload[k] = v; } });
    UTM.forEach(function (k) { if (attribution[k]) payload[k] = attribution[k]; });
    payload.page_path = location.pathname.slice(0, 100);
    log.push({ event: name, props: payload });
    if (log.length > 50) log.shift();
    if (debug) console.info('[TNAnalytics]', name, payload, consent.get() && GA_ID ? '(sent)' : '(not sent: no consent or no GA4 ID)');
    if (consent.get() && GA_ID) { loadGA(); gtag('event', name, payload); return true; }
    return false;
  }

  // ---------- Consent banner (only when there is something to consent to) ----------
  var banner = null;
  function hideBanner() { if (banner) { banner.remove(); banner = null; } }
  function showBanner() {
    // Global Privacy Control = opt-out signal: no banner, nothing loads unless the visitor opts in on /cookies.
    if (banner || !GA_ID || consent.decided() || gpc() || /^\/cookies\/?$/.test(location.pathname)) return;
    banner = document.createElement('div');
    banner.className = 'tn-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie and analytics preferences');
    banner.innerHTML = '<p><b>Analytics preferences.</b> With your permission we use Google Analytics to understand which pages and demonstrations are useful. ' +
      'No advertising cookies are used. <a href="/cookies">Manage preferences</a> · <a href="/privacy">Privacy</a></p>' +
      '<div class="tn-consent-actions"><button type="button" data-consent="deny">Decline</button><button type="button" data-consent="allow">Allow analytics</button></div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-consent]');
      if (b) consent.set(b.getAttribute('data-consent') === 'allow');
    });
    document.body.appendChild(banner);
  }

  // ---------- Automatic, PII-free interaction tracking ----------
  var DEMOS = { '/platform': 'nova', '/accord': 'accord', '/warden': 'warden' };
  function where(el) {
    var tagged = el.closest('[data-cta-location]');
    if (tagged) return tagged.getAttribute('data-cta-location');
    if (el.closest('.site-header, header')) return 'header';
    if (el.closest('.site-footer, footer')) return 'footer';
    var sec = el.closest('section[id]');
    return sec ? sec.id : 'page';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (!/^https?:$/.test(u.protocol)) return;
    if (u.host !== location.host) { track('outbound_link_click', { link_domain: u.hostname, location: where(a) }); return; }
    var path = u.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (path === '/ai-factory-assessment') track('assessment_cta_click', { location: where(a), cta: a.getAttribute('data-cta') || 'assessment' });
    if (a.hasAttribute('data-solution')) track('solution_viewed', { solution: a.getAttribute('data-solution'), location: where(a) });
  }, true);

  function onReady() {
    var demo = document.body && document.body.getAttribute('data-demo');
    if (demo) track('demo_launched', { demo: demo, location: 'page_load' });
    var sol = document.body && document.body.getAttribute('data-solution');
    if (sol) track('solution_viewed', { solution: sol, location: 'page_load' });
    if (consent.get()) loadGA(); else showBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady); else onReady();

  window.TNAnalytics = {
    track: track,
    consent: consent,
    attribution: function () { return JSON.parse(JSON.stringify(attribution)); },
    fillAttribution: fillAttribution,
    events: Object.keys(EVENTS),
    _log: log,
    _clean: clean,
    _demos: DEMOS
  };
})();
