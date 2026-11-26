/* Cookie & Tracking Preferences page controller (works with assets/analytics.js). */
(function () {
  'use strict';
  function render() {
    var A = window.TNAnalytics; if (!A) return;
    var on = A.consent.get();
    var st = document.getElementById('pref-state');
    var av = document.getElementById('pref-availability');
    var gpc = document.getElementById('pref-gpc');
    if (st) { st.textContent = on ? 'On' : 'Off'; st.classList.toggle('on', on); }
    if (av) av.textContent = A.consent.configured()
      ? (A.consent.decided() ? 'Your choice is saved in this browser.' : 'You have not made a choice yet — analytics stays off until you allow it.')
      : 'Optional analytics is not currently enabled on this website, so nothing is collected regardless of this setting. Your choice will still be remembered.';
    if (gpc) gpc.hidden = !A.consent.gpc();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pref]'); if (!b || !window.TNAnalytics) return;
    window.TNAnalytics.consent.set(b.getAttribute('data-pref') === 'allow');
    render();
  });
  document.addEventListener('tn:consent', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
