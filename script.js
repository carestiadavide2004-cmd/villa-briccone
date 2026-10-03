/* =========================================================
   Villa Briccone — interazioni
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.remove('no-js');

  /* ---------- Intro cinematografica ---------- */
  function ready() {
    if (body.classList.contains('is-ready')) return;
    body.classList.add('is-ready');
    body.classList.remove('is-loading');
  }
  var introDelay = reduceMotion ? 0 : 1700;
  window.addEventListener('load', function () { setTimeout(ready, introDelay); });
  // Paracadute: se il caricamento è lento, non bloccare l'utente sull'intro
  setTimeout(ready, 4000);

  /* ---------- Header: stato allo scroll ---------- */
  var header = document.getElementById('header');
  var lastY = window.scrollY;

  function onHeaderScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    var goingDown = y > lastY && y > window.innerHeight * 0.6;
    header.classList.toggle('is-hidden', goingDown && !body.classList.contains('menu-open'));
    lastY = y;
  }

  /* ---------- Menu mobile ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  }
  burger.addEventListener('click', function () {
    setMenu(!nav.classList.contains('is-open'));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });

  /* ---------- Link attivo nella navigazione ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  /* ---------- Reveal allo scroll ---------- */
  // I contenitori [data-stagger] fanno apparire i figli in cascata:
  // data-stagger = intervallo tra un elemento e l'altro (s),
  // data-stagger-base = ritardo iniziale, data-stagger-cols = ripartenza per riga.
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    var step = parseFloat(group.getAttribute('data-stagger')) || 0.1;
    var base = parseFloat(group.getAttribute('data-stagger-base')) || 0;
    var cols = parseInt(group.getAttribute('data-stagger-cols'), 10) || 0;
    Array.prototype.forEach.call(group.children, function (child, i) {
      var index = cols ? i % cols : i;
      child.classList.add('reveal');
      child.style.setProperty('--d', (base + index * step).toFixed(2) + 's');
    });
  });

  var reveals = document.querySelectorAll('.reveal');

  function settle(el) {
    // Dopo l'ingresso azzera il ritardo, così gli hover rispondono subito
    var delay = parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0;
    setTimeout(function () {
      el.style.setProperty('--d', '0s');
      el.classList.add('is-settled');
    }, (delay + 1.6) * 1000);
  }

  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        settle(entry.target);
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible', 'is-settled'); });
  }

  /* ---------- Parallax leggero ---------- */
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var ticking = false;

  function updateParallax() {
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -100 || box.top > vh + 100) return;
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
      var offset = (box.top + box.height / 2 - vh / 2) * -speed;
      el.style.translate = '0 ' + offset.toFixed(1) + 'px';
    });
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onHeaderScroll();
      if (!reduceMotion) updateParallax();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Lightbox galleria ---------- */
  var gallery = document.getElementById('gallery');
  var lightbox = document.getElementById('lightbox');
  var lbImg = lightbox.querySelector('.lightbox__img');
  var lbCaption = lightbox.querySelector('.lightbox__caption');
  var lbCount = lightbox.querySelector('.lightbox__count');
  var items = Array.prototype.slice.call(gallery.querySelectorAll('.masonry__item'));
  var current = 0;
  var lastFocus = null;

  function show(index) {
    current = (index + items.length) % items.length;
    var item = items[current];
    var alt = item.querySelector('img').alt;
    lbImg.classList.add('is-swapping');
    setTimeout(function () {
      lbImg.src = item.getAttribute('data-full');
      lbImg.alt = alt;
      lbCaption.textContent = alt;
      lbCount.textContent = (current + 1) + ' / ' + items.length;
      lbImg.onload = function () { lbImg.classList.remove('is-swapping'); };
      if (lbImg.complete) lbImg.classList.remove('is-swapping');
    }, reduceMotion ? 0 : 220);
  }

  function openLightbox(index) {
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    body.classList.add('menu-open');
    requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
    show(index);
    lightbox.querySelector('.lightbox__close').focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    body.classList.remove('menu-open');
    setTimeout(function () { lightbox.hidden = true; }, reduceMotion ? 0 : 450);
    if (lastFocus) lastFocus.focus();
  }

  items.forEach(function (item, i) {
    item.addEventListener('click', function () { openLightbox(i); });
  });
  lightbox.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.lightbox__nav--prev').addEventListener('click', function () { show(current - 1); });
  lightbox.querySelector('.lightbox__nav--next').addEventListener('click', function () { show(current + 1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false);
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
    if (e.key === 'Tab') {
      // Mantiene il focus dentro la lightbox
      var focusables = lightbox.querySelectorAll('button');
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Swipe su mobile
  var touchX = null;
  lightbox.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
    touchX = null;
  });

  /* ---------- Form preventivo ---------- */
  var form = document.getElementById('quote-form');
  var status = form.querySelector('.form__status');

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle('is-error', !!isError);
  }

  function validate() {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (input) {
      var wrapper = input.closest('.field') || input.closest('.check');
      var valid = input.type === 'checkbox' ? input.checked : input.checkValidity();
      wrapper.classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  form.addEventListener('input', function (e) {
    var wrapper = e.target.closest('.is-invalid');
    if (wrapper) wrapper.classList.remove('is-invalid');
  });
  form.addEventListener('change', function (e) {
    var wrapper = e.target.closest('.is-invalid');
    if (wrapper) wrapper.classList.remove('is-invalid');
  });

  function buildMailto(data) {
    var lines = [
      'Nome: ' + data.get('nome'),
      'Email: ' + data.get('email'),
      'Telefono: ' + (data.get('telefono') || '-'),
      'Tipo di evento: ' + data.get('tipo_evento'),
      'Data indicativa: ' + (data.get('data_evento') || '-'),
      'Numero di ospiti: ' + (data.get('ospiti') || '-'),
      '',
      data.get('messaggio') || ''
    ];
    return 'mailto:' + form.getAttribute('data-email') +
      '?subject=' + encodeURIComponent('Richiesta preventivo — ' + data.get('tipo_evento')) +
      '&body=' + encodeURIComponent(lines.join('\n'));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      setStatus('Per favore completa i campi contrassegnati.', true);
      return;
    }

    var data = new FormData(form);
    var endpoint = form.getAttribute('data-endpoint');
    var button = form.querySelector('button[type="submit"]');

    if (!endpoint) {
      // Nessun servizio configurato: apre il client email con la richiesta già compilata
      window.location.href = buildMailto(data);
      setStatus('Grazie! Si aprirà il tuo programma di posta per completare l’invio.');
      return;
    }

    button.disabled = true;
    setStatus('Invio in corso…');
    fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        setStatus('Grazie! Abbiamo ricevuto la tua richiesta: ti ricontatteremo al più presto.');
      })
      .catch(function () {
        setStatus('Si è verificato un problema. Scrivici a ' + form.getAttribute('data-email') + '.', true);
      })
      .then(function () { button.disabled = false; });
  });

  /* ---------- Anno nel footer ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
