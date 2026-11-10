(function () {
  'use strict';
  var ES = document.documentElement.lang === 'es';
  var T = {
    copyKey: ES ? 'Presione Ctrl+C (o Cmd+C) para copiar la dirección seleccionada.' : 'Press Ctrl+C (or Cmd+C) to copy the selected address.',
    copied: ES ? 'Dirección copiada.' : 'Address copied.',
    inactive: ES ? 'No pudimos enviar su consulta en este momento. Inténtelo de nuevo en unos minutos.' : 'We could not send your enquiry right now. Please try again in a few minutes.',
    phone: ES ? 'Revise el número de teléfono o déjelo en blanco.' : 'Please check the phone number, or leave it blank.',
    sending: ES ? 'Enviando…' : 'Sending…',
    fail: ES ? 'No pudimos enviar su consulta. Revise su conexión e inténtelo de nuevo.' : 'We could not send your enquiry. Please check your connection and try again.'
  };
  var doc = document.documentElement;
  doc.classList.add('js');

  /* Mobile navigation */
  var button = document.querySelector('.menu-button');
  var nav = document.querySelector('#primary-nav');
  function setMenu(open) {
    if (!button || !nav) return;
    button.setAttribute('aria-expanded', String(open));
    nav.dataset.open = String(open);
  }
  if (button && nav) {
    button.addEventListener('click', function () {
      setMenu(button.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        button.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.site-header')) setMenu(false);
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function () { setMenu(false); });
  }

  /* Footer year */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Reveal on scroll */
  var items = document.querySelectorAll('.reveal');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* Table of contents: highlight current section */
  var tocLinks = document.querySelectorAll('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
          var a = map[en.target.id];
          if (a) { a.classList.add('active'); a.setAttribute('aria-current', 'true'); }
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) {
      var h = document.getElementById(id);
      if (h) spy.observe(h);
    });
  }

  /* Copy-to-clipboard buttons */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var status = btn.parentNode.querySelector('.copy-status');
      function done(msg) { if (status) status.textContent = msg; }
      function fallback() {
        var a = btn.parentNode.querySelector('.addr');
        if (a && window.getSelection) {
          var r = document.createRange(); r.selectNodeContents(a);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        }
        done(T.copyKey);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(T.copied); }, fallback);
      } else { fallback(); }
    });
  });

  /* Contact form: sends through a static-site form service (no server needed) */
  var form = document.querySelector('#contact-form');
  if (form) {
    var cc = document.querySelector('#cc'), view = document.querySelector('#cc-view');
    var status = document.querySelector('#form-status');
    var phone = document.querySelector('#phone');
    function syncCC() {
      var o = cc.options[cc.selectedIndex];
      view.textContent = cc.value + ' ' + o.getAttribute('data-dial');
    }
    if (cc && view) { cc.addEventListener('change', syncCC); syncCC(); }
    if (phone) phone.addEventListener('input', function () { phone.value = phone.value.replace(/[^0-9 ()\-.]/g, ''); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      var key = form.getAttribute('data-key') || '';
      var noKey = !key || key.indexOf('YOUR_') === 0;
      var f = form.elements;
      if (f.botcheck && f.botcheck.value) return;
      var digits = phone.value.replace(/\D/g, '');
      if (digits && (digits.length < 6 || digits.length > 14)) {
        status.className = 'form-status err';
        status.textContent = T.phone;
        phone.focus();
        return;
      }
      if (noKey) {
        var dbtn = form.querySelector('button[type=submit]');
        dbtn.disabled = true; dbtn.textContent = T.sending;
        setTimeout(function () {
          var dn = document.querySelector('#form-done');
          form.querySelector('.form-grid').hidden = true;
          dn.hidden = false; dn.focus();
        }, 900);
        return;
      }
      var dial = cc.options[cc.selectedIndex].getAttribute('data-dial');
      var data = {
        access_key: key,
        subject: 'CBDYNE website enquiry' + (ES ? ' [ES]' : '') + ': ' + f.topic.value,
        from_name: 'CBDYNE website',
        name: f.name.value, email: f.email.value,
        organization: f.organization.value, topic: f.topic.value,
        phone: digits ? dial + ' ' + phone.value.trim() : '',
        message: f.message.value, botcheck: ''
      };
      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true; var label = btn.innerHTML;
      btn.textContent = T.sending;
      status.textContent = '';
      fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (!r.success) throw new Error(r.message || 'failed');
          var done = document.querySelector('#form-done');
          form.querySelector('.form-grid').hidden = true;
          done.hidden = false; done.focus();
        })
        .catch(function () {
          btn.disabled = false; btn.innerHTML = label;
          status.className = 'form-status err';
          status.textContent = T.fail;
        });
    });
  }
})();
