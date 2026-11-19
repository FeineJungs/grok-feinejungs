/* Preview-only UI and safety rails. Does not ship on the live site. */
(function () {
  var MSG = 'Vorschau – keine echte Buchung';

  function warn(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
    try { alert(MSG); } catch (err) {}
    return false;
  }

  function urlOf(input) {
    if (!input) return '';
    if (typeof input === 'string') return input;
    try { return String(input.url || input.href || input); } catch (e) { return ''; }
  }

  function isMutatingApi(url, method) {
    var m = (method || 'GET').toUpperCase();
    if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return false;
    return /supabase\.co\/functions\/v1/i.test(url)
      || /mollie\.com/i.test(url)
      || /\/(checkout|anfrage|inquiry|wagyu-order|wagyu-cart|wagyu-checkout|create-payment)/i.test(url);
  }

  if (!window.__fjPreviewFetchWrapped) {
    window.__fjPreviewFetchWrapped = true;
    var origFetch = window.fetch;
    if (typeof origFetch === 'function') {
      window.fetch = function (input, init) {
        var url = urlOf(input);
        var method = (init && init.method) || (input && input.method) || 'GET';
        if (isMutatingApi(url, method)) {
          warn();
          return Promise.resolve(new Response(JSON.stringify({ ok: false, error: 'preview' }), {
            status: 418,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        return origFetch.apply(this, arguments);
      };
    }
    var OrigXHR = window.XMLHttpRequest;
    if (OrigXHR) {
      window.XMLHttpRequest = function () {
        var xhr = new OrigXHR();
        var open = xhr.open;
        xhr.open = function (method, url) {
          xhr.__fjMethod = method;
          xhr.__fjUrl = url;
          return open.apply(xhr, arguments);
        };
        var send = xhr.send;
        xhr.send = function () {
          if (isMutatingApi(xhr.__fjUrl || '', xhr.__fjMethod)) {
            warn();
            return;
          }
          return send.apply(xhr, arguments);
        };
        return xhr;
      };
    }
  }

  function guardCheckout() {
    if (window.fjCheckout && !window.fjCheckout.__fjPreviewGuarded) {
      var fc = window.fjCheckout;
      fc.__fjPreviewGuarded = true;
      ['open', 'inquire', 'submit'].forEach(function (k) {
        if (typeof fc[k] === 'function') {
          fc[k] = function () { warn(); return false; };
        }
      });
    }
    if (window.fjWagyu && !window.fjWagyu.__fjPreviewGuarded) {
      window.fjWagyu.__fjPreviewGuarded = true;
      if (typeof window.fjWagyu.checkout === 'function') {
        window.fjWagyu.checkout = function () {
          warn();
          return Promise.reject(new Error('preview'));
        };
      }
    }
  }
  guardCheckout();
  var gi = setInterval(guardCheckout, 250);
  setTimeout(function () { clearInterval(gi); }, 20000);
  document.addEventListener('DOMContentLoaded', guardCheckout);

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || !f.closest) return;
    var id = (f.id || '') + ' ' + (f.getAttribute('action') || '');
    if (/kForm|qForm|checkout|anfrage|warenkorb|bestell|inquiry|wagyu/i.test(id)
      || f.closest('#anfrage, .configurator, [data-checkout], .fj-checkout, #fj-ty')) {
      warn(e);
    }
  }, true);

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('button, a, [data-buy], [type=submit]');
    if (!t) return;
    if (t.id === 'fjCcYes' || t.id === 'fjCcNo' || t.closest('#fjCookie')) return;
    if (t.classList && t.classList.contains('fj-cta-wa')) return;
    if (t.closest('#fj-mobile-cta')) return;
    var label = ((t.textContent || '') + ' ' + (t.getAttribute('aria-label') || '')).toLowerCase();
    if (t.hasAttribute('data-buy')
      || /jetzt kaufen|zur kasse|verbindlich|zahlungspflichtig|ticket kaufen|gutschein kaufen|bestellung absenden|anfrage senden|anfrage abschicken/i.test(label)) {
      warn(e);
    }
  }, true);

  /* ----- Mobile CTA (preview enhancement) ----- */
  if (document.getElementById('fj-mobile-cta')) return;

  var css = ''
    + '#fj-mobile-cta{display:none}'
    + '@media (max-width:768px){'
    + '#fj-mobile-cta{position:fixed;left:0;right:0;bottom:0;z-index:1100;display:flex;align-items:center;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));background:#20231f;box-shadow:0 -8px 24px rgba(20,30,20,.2);font-family:"DM Sans",Arial,sans-serif}'
    + '#fj-mobile-cta a{flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 12px;text-decoration:none;font:600 11px/1 "IBM Plex Mono",monospace;letter-spacing:.08em;text-transform:uppercase;border:0}'
    + '#fj-mobile-cta a.fj-cta-inquire{background:#606b55;color:#fff}'
    + '#fj-mobile-cta a.fj-cta-inquire:hover{background:#4e5746}'
    + '#fj-mobile-cta a.fj-cta-wa{flex:0 0 auto;background:#fff;color:#20231f;padding:0 14px}'
    + '#fj-mobile-cta a.fj-cta-wa:hover{background:#eef1ec}'
    + '#fj-mobile-cta svg{width:16px;height:16px;flex:0 0 auto}'
    + 'body.fj-intro-on #fj-mobile-cta{visibility:hidden}'
    + 'body:has(#fjCookie.show) #fj-mobile-cta{display:none}'
    + 'body:has(#fjCookie.show){padding-bottom:0}'
    + 'body{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))}'
    + '}';

  function mountCta() {
    if (document.getElementById('fj-mobile-cta')) return;
    if (!document.head || !document.body) return;
    if (!document.getElementById('fj-preview-ui')) {
      var style = document.createElement('style');
      style.id = 'fj-preview-ui';
      style.textContent = css;
      document.head.appendChild(style);
    }
    function inquiryHref() {
      var path = location.pathname.replace(/\/$/, '') || '/grok-feinejungs';
      if (path === '/grok-feinejungs' || path === '/grok-feinejungs/index.html') return '#anfrage';
      if (document.getElementById('anfrage')) return '#anfrage';
      return '/grok-feinejungs/#anfrage';
    }
    var bar = document.createElement('nav');
    bar.id = 'fj-mobile-cta';
    bar.setAttribute('aria-label', 'Schnellkontakt');
    bar.innerHTML = ''
      + '<a class="fj-cta-inquire" href="' + inquiryHref() + '">Termin anfragen</a>'
      + '<a class="fj-cta-wa" href="https://wa.me/491777753688" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zm-7.01 15.24h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.22-.08-.39-.12-.55.12-.16.25-.63.81-.77.97-.14.17-.28.19-.53.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.28.37-.42.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.55-1.33-.75-1.82-.2-.48-.4-.41-.55-.42h-.47c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.07-.1-.25-.16-.5-.28z"/></svg>'
      + 'WhatsApp</a>';
    document.body.appendChild(bar);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountCta);
  else mountCta();
})();
