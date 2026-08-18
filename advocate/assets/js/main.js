/* =============================================================================
   Adv. Krishna Kant Chaturvedy — site behaviour
   No dependencies. No build step. Works from file:// or any static host.
   ============================================================================= */
(function () {
  'use strict';

  var PHONE_E164 = '919012222346';
  var STORE = {
    lang: 'kkc.lang',
    gate: 'kkc.disclaimerAcceptedV1'
  };

  /* ---------------------------------------------------------------------------
     Small helpers
     ------------------------------------------------------------------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function on(el, evt, fn) { if (el) el.addEventListener(evt, fn); }
  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) { /* private mode — degrade silently */ }
    return null;
  }

  /* ---------------------------------------------------------------------------
     1. Language switcher (English <-> Hindi)
     Any element with data-hi swaps its text. data-hi-html swaps innerHTML.
     data-hi-placeholder swaps input/textarea placeholders.
     ------------------------------------------------------------------------- */
  var Lang = {
    current: 'en',

    cache: function () {
      $$('[data-hi]').forEach(function (el) {
        if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.textContent.trim());
      });
      $$('[data-hi-html]').forEach(function (el) {
        if (!el.hasAttribute('data-en-html')) el.setAttribute('data-en-html', el.innerHTML);
      });
      $$('[data-hi-placeholder]').forEach(function (el) {
        if (!el.hasAttribute('data-en-placeholder')) el.setAttribute('data-en-placeholder', el.placeholder || '');
      });
    },

    apply: function (lang) {
      this.current = lang === 'hi' ? 'hi' : 'en';
      var hi = this.current === 'hi';

      $$('[data-hi]').forEach(function (el) {
        var next = hi ? el.getAttribute('data-hi') : el.getAttribute('data-en');
        if (next !== null) el.textContent = next;
      });
      $$('[data-hi-html]').forEach(function (el) {
        var next = hi ? el.getAttribute('data-hi-html') : el.getAttribute('data-en-html');
        if (next !== null) el.innerHTML = next;
      });
      $$('[data-hi-placeholder]').forEach(function (el) {
        var next = hi ? el.getAttribute('data-hi-placeholder') : el.getAttribute('data-en-placeholder');
        if (next !== null) el.placeholder = next;
      });

      document.documentElement.lang = hi ? 'hi' : 'en';
      document.body.classList.toggle('lang-hi', hi);

      $$('.lang-switch button').forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(btn.dataset.lang === Lang.current));
      });

      store(STORE.lang, this.current);
    },

    init: function () {
      this.cache();
      var saved = store(STORE.lang);
      // First visit: default to Hindi for Indian browsers/devices, English otherwise.
      if (!saved) {
        var nav = (navigator.language || 'en').toLowerCase();
        saved = nav.indexOf('hi') === 0 ? 'hi' : 'en';
      }
      this.apply(saved);

      $$('.lang-switch button').forEach(function (btn) {
        on(btn, 'click', function () { Lang.apply(btn.dataset.lang); });
      });
    }
  };

  /* ---------------------------------------------------------------------------
     2. Header shadow on scroll
     ------------------------------------------------------------------------- */
  function initHeader() {
    var header = $('.header');
    if (!header) return;
    var tick = function () { header.classList.toggle('is-stuck', window.scrollY > 8); };
    tick();
    window.addEventListener('scroll', tick, { passive: true });
  }

  /* ---------------------------------------------------------------------------
     3. Mobile drawer
     ------------------------------------------------------------------------- */
  function initDrawer() {
    var toggle = $('.nav-toggle');
    var drawer = $('.drawer');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      drawer.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('no-scroll', open);
      if (open) {
        var first = $('.drawer__close', drawer);
        if (first) first.focus();
      }
    }

    on(toggle, 'click', function () { setOpen(!drawer.classList.contains('is-open')); });
    on($('.drawer__close', drawer), 'click', function () { setOpen(false); });
    on(drawer, 'click', function (e) { if (e.target === drawer) setOpen(false); });
    $$('a', drawer).forEach(function (a) { on(a, 'click', function () { setOpen(false); }); });
    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ---------------------------------------------------------------------------
     4. FAQ accordion (one open at a time)
     ------------------------------------------------------------------------- */
  function initFaq() {
    var items = $$('.faq__item');
    items.forEach(function (item) {
      var btn = $('.faq__q', item);
      if (!btn) return;
      on(btn, 'click', function () {
        var isOpen = item.classList.contains('is-open');
        items.forEach(function (other) {
          other.classList.remove('is-open');
          var b = $('.faq__q', other);
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (!isOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------------------------------------------------------------------------
     5. Scroll reveal
     ------------------------------------------------------------------------- */
  function initReveal() {
    var targets = $$('.reveal');
    if (!targets.length) return;
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------------
     6. Animated stat counters
     ------------------------------------------------------------------------- */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var target = parseFloat(el.dataset.count);
        var suffix = el.dataset.suffix || '';
        var dur = 1400;
        var start = null;
        function frame(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.4 });

    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------------
     7. Consultation form -> WhatsApp / Email
     No backend needed: composes a structured message and hands it to WhatsApp.
     ------------------------------------------------------------------------- */
  function initForm() {
    var form = $('#consultForm');
    if (!form) return;
    var status = $('#formStatus');

    function say(msg, isError) {
      if (!status) return;
      status.textContent = msg;
      status.classList.add('is-visible');
      status.classList.toggle('is-error', !!isError);
    }

    function compose(data) {
      var lines = [
        'Namaste Adv. Krishna Kant Chaturvedy,',
        '',
        'I would like to book a consultation.',
        '',
        'Name: ' + data.name,
        'Phone: ' + data.phone,
        'Matter type: ' + data.matter
      ];
      if (data.city) lines.push('City / Court: ' + data.city);
      if (data.stage) lines.push('Case stage: ' + data.stage);
      lines.push('', 'Details:', data.details || '(will explain on the call)');
      lines.push('', '- Sent from krishnakantchaturvedy.com');
      return lines.join('\n');
    }

    on(form, 'submit', function (e) {
      e.preventDefault();

      var data = {
        name: (form.name_.value || '').trim(),
        phone: (form.phone.value || '').trim(),
        matter: form.matter.value || '',
        city: (form.city.value || '').trim(),
        stage: form.stage.value || '',
        details: (form.details.value || '').trim()
      };

      if (!data.name || !data.phone || !data.matter) {
        say(Lang.current === 'hi'
          ? 'कृपया नाम, मोबाइल नंबर और मामले का प्रकार भरें।'
          : 'Please fill your name, mobile number and type of matter.', true);
        return;
      }
      if (!/^[0-9+\-\s()]{10,16}$/.test(data.phone)) {
        say(Lang.current === 'hi'
          ? 'कृपया सही मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid mobile number.', true);
        return;
      }

      var text = compose(data);
      var channel = form.channel ? form.channel.value : 'whatsapp';

      if (channel === 'email') {
        window.location.href = 'mailto:advkrishna9012@gmail.com'
          + '?subject=' + encodeURIComponent('Consultation request — ' + data.matter + ' — ' + data.name)
          + '&body=' + encodeURIComponent(text);
      } else {
        window.open('https://wa.me/' + PHONE_E164 + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      }

      say(Lang.current === 'hi'
        ? 'धन्यवाद! आपका संदेश तैयार है — भेजने के लिए "Send" दबाएँ। तुरंत बात करने के लिए 90122 22346 पर कॉल करें।'
        : 'Thank you! Your message is ready — press Send to deliver it. For an urgent matter, call 90122 22346.', false);
      form.reset();
    });
  }

  /* ---------------------------------------------------------------------------
     8. Bar Council of India disclaimer gate
     Indian advocates may not solicit work (BCI Rules, Ch. II, Part VI, R.36).
     A "no solicitation" acknowledgement is the standard practice.
     ------------------------------------------------------------------------- */
  function initGate() {
    var gate = $('#gate');
    if (!gate) return;

    if (store(STORE.gate) === 'yes') return;

    var lastFocus = document.activeElement;
    gate.classList.add('is-open');
    document.body.classList.add('no-scroll');
    var agree = $('#gateAgree', gate);
    if (agree) agree.focus();

    function close() {
      store(STORE.gate, 'yes');
      gate.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    on(agree, 'click', close);
    on(document, 'keydown', function (e) {
      if (!gate.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        var f = $$('button, a[href]', gate);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------------------------------------------------------------------------
     9. Highlight nav link for the section in view (landing page only)
     ------------------------------------------------------------------------- */
  function initScrollSpy() {
    var links = $$('.nav a[href^="#"]');
    if (links.length < 2 || !('IntersectionObserver' in window)) return;

    var map = {};
    links.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) map[sec.id] = a;
    });
    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); });
    if (!sections.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        map[entry.target.id].classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------------------------------------------------------------------------
     10. Current year in footer
     ------------------------------------------------------------------------- */
  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* --------------------------------------------------------------------------- */
  function boot() {
    Lang.init();
    initHeader();
    initDrawer();
    initFaq();
    initReveal();
    initCounters();
    initForm();
    initGate();
    initScrollSpy();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
