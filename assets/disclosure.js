/* TrustNovaOps demonstration disclosure component (Phase 1)
 * Reusable, framework-free labels that explain the purpose and limits of simulated data.
 *
 * Static markup (preferred — renders without JavaScript, no layout shift):
 *   <p class="tn-disclosure" data-disclosure="simulated"><b>Simulated environment</b> Optional detail text.</p>
 * Empty placeholder (text filled in by this script):
 *   <span class="tn-disclosure" data-disclosure="illustrative"></span>
 * From application code (e.g. dynamically rendered dashboards):
 *   TNDisclosure.create('demo', {compact:true})  -> HTMLElement
 *
 * Types: simulated | illustrative | demo | representative | not-customer-data | target | concept
 */
(function () {
  'use strict';
  var TYPES = {
    'simulated': ['Simulated environment', 'Status indicators and data are generated for demonstration and do not reflect a live system.'],
    'illustrative': ['Illustrative data', 'Values are illustrative and are not measured results.'],
    'demo': ['Demonstration metrics', 'Figures are part of a scripted demonstration scenario.'],
    'representative': ['Representative scenario', 'A fictional scenario representative of the problems TrustNovaOps is designed to address.'],
    'not-customer-data': ['Not production customer data', 'No customer, government or production data is shown.'],
    'target': ['Illustrative targets', 'Design objectives — not measured production customer results.'],
    'concept': ['Product concept', 'Describes intended capabilities; availability and integrations may vary. Contact us for current status.']
  };
  var LEARN = '/terms#demonstrations';

  function build(el, type, opts) {
    var t = TYPES[type] || TYPES.illustrative;
    opts = opts || {};
    el.classList.add('tn-disclosure');
    el.setAttribute('data-disclosure', type in TYPES ? type : 'illustrative');
    var generated = false;
    if (!el.textContent.trim()) {
      generated = true;
      var b = document.createElement('b'); b.textContent = t[0]; el.appendChild(b);
      if (!opts.compact) { el.appendChild(document.createTextNode(' ' + t[1] + ' ')); }
    }
    if (!el.title) el.title = t[0] + ': ' + t[1];
    // Static (server-rendered) disclosures are never altered visually, to avoid layout shift.
    if (generated && opts.link !== false && !el.querySelector('a') && !el.closest('a')) {
      var a = document.createElement('a'); a.href = LEARN; a.textContent = 'About our demos';
      a.className = 'tn-disclosure-link'; el.appendChild(a);
    }
    return el;
  }
  function create(type, opts) {
    var el = document.createElement((opts && opts.tag) || 'span');
    return build(el, type, opts);
  }
  function init(root) {
    (root || document).querySelectorAll('[data-disclosure]').forEach(function (el) {
      if (el.__tnd) return; el.__tnd = 1;
      build(el, el.getAttribute('data-disclosure'), { compact: el.hasAttribute('data-compact'), link: !el.hasAttribute('data-nolink') });
    });
  }
  window.TNDisclosure = { create: create, init: init, types: Object.keys(TYPES) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); }); else init();
})();
