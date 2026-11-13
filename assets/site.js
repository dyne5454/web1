(function () {
  'use strict';
  /* Every normal page change starts at the top (back/forward and #links keep their position) */
  try {
    var navEntry = window.performance && performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (!location.hash && (!navEntry || navEntry.type === 'navigate')) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted && !location.hash && (!navEntry || navEntry.type === 'navigate')) window.scrollTo(0, 0);
    });
  } catch (err) { window.scrollTo(0, 0); }

  var L = (document.documentElement.lang || 'en').slice(0, 2);
  var I = {
    en: { copyKey: 'Press Ctrl+C (or Cmd+C) to copy the selected address.', copied: 'Address copied.', phone: 'Please check the phone number, or leave it blank.', sending: 'Sending…', fail: 'We could not send your enquiry. Please check your connection and try again.' },
    es: { copyKey: 'Presione Ctrl+C (o Cmd+C) para copiar la dirección seleccionada.', copied: 'Dirección copiada.', phone: 'Revise el número de teléfono o déjelo en blanco.', sending: 'Enviando…', fail: 'No pudimos enviar su consulta. Revise su conexión e inténtelo de nuevo.' },
    de: { copyKey: 'Drücken Sie Strg+C (oder Cmd+C), um die markierte Adresse zu kopieren.', copied: 'Adresse kopiert.', phone: 'Bitte prüfen Sie die Telefonnummer oder lassen Sie das Feld leer.', sending: 'Wird gesendet…', fail: 'Ihre Anfrage konnte nicht gesendet werden. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.' },
    fr: { copyKey: 'Appuyez sur Ctrl+C (ou Cmd+C) pour copier l’adresse sélectionnée.', copied: 'Adresse copiée.', phone: 'Veuillez vérifier le numéro de téléphone ou laissez le champ vide.', sending: 'Envoi en cours…', fail: 'Nous n’avons pas pu envoyer votre demande. Vérifiez votre connexion et réessayez.' },
    pt: { copyKey: 'Pressione Ctrl+C (ou Cmd+C) para copiar o endereço selecionado.', copied: 'Endereço copiado.', phone: 'Verifique o número de telefone ou deixe o campo em branco.', sending: 'Enviando…', fail: 'Não foi possível enviar sua solicitação. Verifique sua conexão e tente novamente.' }
  };
  var T = I[L] || I.en;
  var lm = document.querySelector('.lang-menu');
  if (lm) {
    var mq = window.matchMedia('(max-width: 860px)');
    var syncLang = function () { if (mq.matches) lm.setAttribute('open', ''); else lm.removeAttribute('open'); };
    syncLang();
    if (mq.addEventListener) mq.addEventListener('change', syncLang); else if (mq.addListener) mq.addListener(syncLang);
    document.addEventListener('click', function (e) { if (!mq.matches && !lm.contains(e.target)) lm.removeAttribute('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mq.matches) lm.removeAttribute('open'); });
  }
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
    if (cc && view) {
      ['change', 'input', 'keyup', 'blur'].forEach(function (ev) { cc.addEventListener(ev, syncCC); });
      window.addEventListener('pageshow', syncCC);
      syncCC();
    }
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
        subject: 'CBDYNE website enquiry' + (L !== 'en' ? ' [' + L.toUpperCase() + ']' : '') + ': ' + f.topic.value,
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
