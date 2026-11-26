/* TrustNovaOps accessible form handler for Netlify Forms (Phase 1)
 * Enhances <form data-tn-form ...> with:
 *  - accessible inline validation (aria-invalid, aria-describedby, focusable error summary)
 *  - sensitive-data screening (classification markings, credentials, keys, SSNs, card numbers)
 *  - AJAX submission that checks the HTTP response (no false "success")
 *  - funnel analytics with no PII (event names from data-* attributes)
 * Attributes on <form>:
 *   data-start-event="assessment_form_start"   data-submit-event="assessment_form_submit"
 *   data-error-event="assessment_form_error"   data-success="#successPanelId"
 * Works without JavaScript too: the form posts natively to Netlify Forms.
 */
(function () {
  'use strict';
  var EMAIL = /^[^\s@<>()[\]\\,;:"]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
  var SENSITIVE = [
    [/\b(TOP\s*SECRET|SECRET\s*\/\/|\/\/\s*NOFORN|CUI\s*\/\/|\/\/\s*CUI|CONFIDENTIAL\s*\/\/)/i, 'a classification or CUI marking'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
    [/\b(AKIA|ASIA)[0-9A-Z]{16}\b/, 'a cloud access key'],
    [/\b(gh[pousr]_[A-Za-z0-9]{30,}|xox[abpr]-[A-Za-z0-9-]{10,}|sk_(live|test)_[A-Za-z0-9]{16,})\b/, 'an access token'],
    [/\b(password|passwd|pwd)\s*[:=]\s*\S+/i, 'a password'],
    [/\b\d{3}-\d{2}-\d{4}\b/, 'a Social Security number'],
    [/\b(?:\d[ -]?){15,16}\b/, 'a payment card number']
  ];
  function t(name, props) { if (window.TNAnalytics) window.TNAnalytics.track(name, props); }

  function fieldLabel(el) {
    var l = el.id && el.form.querySelector('label[for="' + el.id + '"]');
    if (!l || el.type === 'radio') l = (el.closest('fieldset') && el.closest('fieldset').querySelector('legend')) || l;
    var txt = el.name;
    if (l) { var c = l.cloneNode(true); c.querySelectorAll('.req,.opt,[data-phone-required],[data-phone-optional]').forEach(function (x) { x.remove(); }); txt = c.textContent; }
    return (txt || '').replace(/\*|\(required\)|\(optional\)/gi, '').trim();
  }
  function errEl(el) {
    var fs = el.closest('fieldset');
    var key = el.type === 'radio' ? ((fs && fs.id) || el.name) : (el.id || el.name);
    var id = key + '-error', e = document.getElementById(id);
    if (!e) {
      e = document.createElement('p'); e.id = id; e.className = 'field-error'; e.hidden = true;
      var anchor = el.closest('.field') || el.closest('fieldset') || el.parentNode;
      anchor.appendChild(e);
    }
    return e;
  }
  function setError(el, msg) {
    var e = errEl(el);
    var targets = el.type === 'radio' ? el.form.querySelectorAll('input[name="' + el.name + '"]') : [el];
    Array.prototype.forEach.call(targets, function (x) {
      if (msg) x.setAttribute('aria-invalid', 'true'); else x.removeAttribute('aria-invalid');
      var d = (x.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (d.indexOf(e.id) < 0) { d.push(e.id); x.setAttribute('aria-describedby', d.join(' ')); }
    });
    e.textContent = msg || ''; e.hidden = !msg;
  }
  function validate(el) {
    if (el.disabled || el.type === 'hidden' || el.name === 'bot-field' || !el.name) return '';
    var v = (el.value || '').trim();
    var label = fieldLabel(el);
    if (el.type === 'checkbox') return el.required && !el.checked ? (el.getAttribute('data-required-msg') || 'Please confirm: ' + label + '.') : '';
    if (el.type === 'radio') {
      if (!el.required) return '';
      return el.form.querySelector('input[name="' + el.name + '"]:checked') ? '' : 'Please choose ' + label.toLowerCase() + '.';
    }
    if (el.required && !v) return 'Please enter ' + label.toLowerCase() + '.';
    if (!v) return '';
    if (el.type === 'email' && !EMAIL.test(v)) return 'Enter a valid email address, like name@organization.com.';
    if (el.maxLength > 0 && v.length > el.maxLength) return label + ' must be ' + el.maxLength + ' characters or fewer.';
    if (el.minLength > 0 && v.length < el.minLength) return label + ' must be at least ' + el.minLength + ' characters.';
    if (el.type === 'tel' && !/^[+()\d\s.\-x]{7,25}$/.test(v)) return 'Enter a valid phone number.';
    if (el.tagName === 'TEXTAREA' || el.type === 'text') {
      for (var i = 0; i < SENSITIVE.length; i++) {
        if (SENSITIVE[i][0].test(v)) return 'This appears to contain ' + SENSITIVE[i][1] + '. Please remove it — do not submit classified information, CUI, PHI, credentials or other sensitive data.';
      }
    }
    return '';
  }
  function conditional(form) {
    // Phone becomes required only when the visitor prefers a phone call.
    var phone = form.querySelector('[name="phone"]');
    var pref = form.querySelector('[name="preferred_contact"]:checked, select[name="preferred_contact"]');
    if (phone && pref) {
      var need = pref.value === 'phone';
      phone.required = need;
      var hint = form.querySelector('[data-phone-required]');
      if (hint) hint.hidden = !need;
      var opt = form.querySelector('[data-phone-optional]');
      if (opt) opt.hidden = need;
      if (!need) setError(phone, '');
    }
  }

  function enhance(form) {
    var name = form.getAttribute('name');
    var startEvt = form.getAttribute('data-start-event');
    var submitEvt = form.getAttribute('data-submit-event') || 'contact_submit';
    var errorEvt = form.getAttribute('data-error-event') || 'form_error';
    var started = false;
    var summary = form.querySelector('.form-error-summary');
    var status = form.querySelector('[data-form-status]');
    var btn = form.querySelector('[type="submit"]');
    var btnText = btn ? btn.textContent : '';
    form.setAttribute('novalidate', '');

    // Preselect inquiry type from ?type= (allow-listed values only).
    var q = new URLSearchParams(location.search).get('type');
    var sel = form.querySelector('select[name="inquiry_type"]');
    if (q && sel && sel.querySelector('option[value="' + q.replace(/[^a-z_]/g, '') + '"]')) sel.value = q.replace(/[^a-z_]/g, '');

    form.addEventListener('focusin', function () {
      if (!started) { started = true; if (startEvt) t(startEvt, { form: name }); }
    });
    form.addEventListener('change', function (e) { conditional(form); if (e.target.getAttribute('aria-invalid')) setError(e.target, validate(e.target)); });
    form.addEventListener('focusout', function (e) {
      var el = e.target;
      if (el.matches && el.matches('input,select,textarea') && (el.value || el.getAttribute('aria-invalid'))) setError(el, validate(el));
    });
    conditional(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      conditional(form);
      var errors = [], seen = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name) return;
        if (el.type === 'radio') { if (seen[el.name]) return; seen[el.name] = 1; }
        var msg = validate(el);
        setError(el, msg);
        if (msg) errors.push({ el: el, msg: msg });
      });
      if (errors.length) {
        if (summary) {
          summary.innerHTML = '';
          var h = document.createElement('p'); h.className = 'form-error-title';
          h.textContent = errors.length === 1 ? 'There is 1 problem with your submission:' : 'There are ' + errors.length + ' problems with your submission:';
          var ul = document.createElement('ul');
          errors.forEach(function (x) {
            var li = document.createElement('li'), a = document.createElement('a');
            a.href = '#' + (x.el.id || ''); a.textContent = x.msg;
            a.addEventListener('click', function (ev) { ev.preventDefault(); x.el.focus(); });
            li.appendChild(a); ul.appendChild(li);
          });
          summary.appendChild(h); summary.appendChild(ul); summary.hidden = false; summary.focus();
        } else { errors[0].el.focus(); }
        t(errorEvt, { form: name, error_type: 'validation', error_count: errors.length });
        return;
      }
      if (summary) summary.hidden = true;
      if (window.TNAnalytics) window.TNAnalytics.fillAttribution(form);
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      form.setAttribute('aria-busy', 'true');
      if (status) { status.className = 'form-status'; status.textContent = 'Sending your request…'; }

      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (res) {
          if (!res.ok) throw new Error('server_' + res.status);
          var props = { form: name };
          var it = form.querySelector('[name="inquiry_type"]');
          var evt = submitEvt;
          if (it) {
            props.inquiry_type = it.value;
            if (it.value === 'partnership') evt = 'partner_inquiry';
            else if (it.value === 'investor') evt = 'investor_inquiry';
          }
          ['primary_interest:interest', 'ai_maturity:maturity', 'organization_size:org_size', 'industry:industry'].forEach(function (pair) {
            var p = pair.split(':'), el = form.querySelector('[name="' + p[0] + '"]');
            if (el && el.value) props[p[1]] = el.value;
          });
          t(evt, props);
          var ok = document.querySelector(form.getAttribute('data-success'));
          form.hidden = true;
          if (ok) { ok.hidden = false; var f = ok.querySelector('[tabindex="-1"]') || ok; f.focus(); }
        })
        .catch(function (err) {
          var kind = /^server_/.test(err.message) ? err.message : 'network';
          if (status) {
            status.className = 'form-status is-error';
            status.textContent = 'Sorry — your request could not be sent (' + (kind === 'network' ? 'connection problem' : 'server error') + '). Your answers are still here; please try again in a moment.';
            status.focus();
          }
          t(errorEvt, { form: name, error_type: kind });
        })
        .then(function () {
          form.removeAttribute('aria-busy');
          if (btn && !form.hidden) { btn.disabled = false; btn.textContent = btnText; }
        });
    });
  }
  function init() { document.querySelectorAll('form[data-tn-form]').forEach(enhance); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.TNForms = { validate: validate, sensitive: SENSITIVE, email: EMAIL };
})();
