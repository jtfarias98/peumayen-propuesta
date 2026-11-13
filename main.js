/* Peumayen Lodge & Termas — interacciones (sin librerías, ~8 KB) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- MODO DEMO ----------
     true  = versión de prueba para la propuesta: solo abren/cierran Menú y Reservar, nada más funciona.
     false = versión final: todos los botones funcionan y Reservar lleva al motor del cliente (ENGINE). */
  const DEMO = true;

  /* ---------- Demo: solo funcionan Menú y Reservar (abrir y cerrar paneles) ---------- */
  const ALLOWED = '#burger, .header__book, [data-close-panel], #veil';
  const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="button"], [data-full], [data-filter], [data-i], #masonry figure, .carousel, [tabindex]';
  const block = e => {
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (!el || el.closest(ALLOWED)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  if (DEMO) ['click', 'mousedown', 'keydown', 'submit'].forEach(t => addEventListener(t, e => {
    if (t === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
    block(e);
  }, true));

  /* ---------- Header: siempre fijo arriba; se vuelve sólido al bajar ---------- */
  const header = $('#header');
  // la barra de secciones queda justo bajo el header
  const placeSubnav = () => document.documentElement.style.setProperty('--subnav-top', header.offsetHeight + 'px');
  const onScroll = () => { header.classList.toggle('is-solid', scrollY > 60); placeSubnav(); };
  addEventListener('scroll', onScroll, { passive: true });
  header.addEventListener('transitionend', placeSubnav);
  addEventListener('resize', placeSubnav);
  onScroll();

  /* ---------- Paneles laterales: menú y reservas ---------- */
  const burger = $('#burger'), veil = $('#veil'), heroText = $('.hero__content');
  const panels = { menu: $('#menu'), book: $('#reservas') };
  let current = null;

  // cascada: cada elemento del panel entra un poco después del anterior
  $$('#menu .menu__list li, #menu .menu__foot').forEach((el, i) => { el.dataset.stagger = ''; el.style.setProperty('--i', i); });
  $$('#reservas .panel__body > *').forEach((el, i) => { el.dataset.stagger = ''; el.style.setProperty('--i', i); });

  // la portada se corre a la izquierda (y se achica un poco si no cabe) para dar espacio al panel
  const shiftHero = on => {
    if (!on || innerWidth <= 720) { heroText.style.transform = ''; return; }
    const pw = panels.menu.getBoundingClientRect().width;
    const avail = innerWidth - pw - 96;
    const w = Math.max(heroText.offsetWidth, ...[...heroText.children].map(c => c.scrollWidth));
    const s = Math.min(1, avail / w);
    heroText.style.transform = `translateX(${-pw / 2}px) scale(${s.toFixed(3)})`;
  };

  const openPanel = name => {
    if (current === name) return closePanel();
    if (current) { panels[current].classList.remove('is-open'); panels[current].setAttribute('aria-hidden', 'true'); }
    current = name;
    const el = panels[name];
    el.classList.add('is-open'); el.setAttribute('aria-hidden', 'false');
    body.classList.add('panel-open', 'is-locked');
    burger.setAttribute('aria-expanded', name === 'menu');
    shiftHero(true);
    setTimeout(() => (el.querySelector('.menu__list a, input, select') || el).focus({ preventScroll: true }), 650);
  };
  const closePanel = () => {
    if (!current) return;
    const el = panels[current];
    el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true');
    body.classList.remove('panel-open', 'is-locked');
    burger.setAttribute('aria-expanded', 'false');
    shiftHero(false);
    const was = current; current = null;
    (was === 'menu' ? burger : $('.header__book')).focus({ preventScroll: true });
  };

  burger.addEventListener('click', () => openPanel('menu'));
  veil.addEventListener('click', closePanel);
  $$('[data-close-panel]').forEach(b => b.addEventListener('click', closePanel));
  addEventListener('keydown', e => { if (e.key === 'Escape' && current) closePanel(); });
  addEventListener('resize', () => { if (current) shiftHero(true); });

  // Todo botón o link "Reservar" abre el panel de reservas (sin recorrer la página)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href="#reservas"]');
    if (!a) return;
    e.preventDefault();
    if (a.dataset.room) {
      const sel = $('#reservas select[name=room]');
      if (sel) { sel.value = a.dataset.room; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    openPanel('book');
  });

  // Demo: los links de secciones del menú lateral no hacen nada
  $$('#menu a[href^="#"]:not([href="#reservas"])').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (DEMO) return;
    const target = a.hash && a.hash.length > 1 ? $(a.hash) : null;
    if (!target) return;
    closePanel();
    setTimeout(() => target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }), 450);
  }));

  /* ---------- Revelado al hacer scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Contadores ---------- */
  const countIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = reduce ? 1 : 1600;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * e) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countIO.unobserve(el);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Subnav: sección actual ---------- */
  const subLinks = $$('.subnav a');
  const secIO = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) subLinks.forEach(a => a.classList.toggle('is-current', a.hash === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  subLinks.forEach(a => { const s = $(a.hash); if (s) secIO.observe(s); });

  /* ---------- Carrusel con fundido ---------- */
  $$('[data-carousel]').forEach(c => {
    const slides = $$('.carousel__slide', c), cur = $('[data-current]', c);
    $('[data-total]', c).textContent = slides.length;
    let i = 0, timer;
    const go = n => {
      slides[i].classList.remove('is-active');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      cur.textContent = i + 1;
    };
    const auto = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 6000); };
    $('[data-prev]', c).addEventListener('click', () => { go(i - 1); auto(); });
    $('[data-next]', c).addEventListener('click', () => { go(i + 1); auto(); });
    // swipe
    let x0 = null;
    c.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    c.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); auto(); } x0 = null; });
    auto();
  });

  /* ---------- Riel de habitaciones ---------- */
  const rail = $('[data-rail]');
  if (rail) {
    const bar = $('.rail__progress span');
    const step = () => rail.querySelector('.room').getBoundingClientRect().width + 28;
    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const vis = rail.clientWidth / rail.scrollWidth;
      bar.style.width = (vis * 100) + '%';
      bar.style.transform = `translateX(${max ? (rail.scrollLeft / max) * ((1 - vis) / vis) * 100 : 0}%)`;
    };
    rail.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
    $('[data-rail-prev]').addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('[data-rail-next]').addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
  }

  /* ---------- Galería ---------- */
  const photos = [
    ['lodge-panoramica', 'lodge', 'El lodge'],
    ['pozones-rio', 'termas', 'Pozones junto al río Liucura'],
    ['suite-cabana-terraza', 'habitaciones', 'Suite en cabaña'],
    ['fleur-de-sel', 'restaurant', 'Restaurant La Fleur de Sel'],
    ['piscina-termal-techada', 'termas', 'Piscina termal techada'],
    ['musgo', 'entorno', 'Bosque nativo'],
    ['entrada-lodge', 'lodge', 'Llegada al lodge'],
    ['postre', 'restaurant', 'Cocina de autor'],
    ['bano-suite', 'habitaciones', 'Baño con hidromasaje'],
    ['mirador-rio', 'entorno', 'Mirador al río'],
    ['restaurant-salon', 'restaurant', 'El salón del restaurant'],
    ['termal-techada-luz', 'termas', 'Piscina termal techada'],
    ['lodge-octogonal', 'lodge', 'El lodge'],
    ['desayuno', 'restaurant', 'El desayuno'],
    ['suite-dosel', 'habitaciones', 'Suite Matrimonial'],
    ['rio-liucura', 'entorno', 'Río Liucura'],
    ['fogon', 'lodge', 'El fogón'],
    ['terraza-restaurant', 'restaurant', 'Terraza del restaurant'],
    ['lodge-bosque', 'lodge', 'El lodge'],
    ['plato', 'restaurant', 'Cocina de autor'],
    ['termal-reposeras', 'termas', 'Termas'],
    ['desayuno-bosque', 'restaurant', 'Desayuno en el bosque'],
    ['habitacion-triple', 'habitaciones', 'Habitación Triple'],
    ['productos-locales', 'restaurant', 'Productos de la zona'],
    ['lodge-la-montana', 'lodge', 'El lodge'],
    ['tabla', 'restaurant', 'Tabla de la casa'],
  ];
  const masonry = $('#masonry');
  // Fotos locales optimizadas: -800.webp en la grilla, -1600.webp en el lightbox
  const stem = src => 'img/' + src;
  masonry.innerHTML = photos.map(([src, cat, cap], k) =>
    `<figure class="ph" data-cat="${cat}" data-i="${k}"><img src="${stem(src)}-800.webp" data-full="${stem(src)}-1600.webp" alt="${cap}" loading="lazy" decoding="async"></figure>`).join('');
  $$('.ph img', masonry).forEach(img => {
    const done = () => img.classList.add('is-loaded');
    img.complete ? done() : img.addEventListener('load', done, { once: true });
  });

  const applyFilter = f => {
    $$('.filter').forEach(b => b.classList.toggle('is-active', b.dataset.filter === f));
    $$('.ph', masonry).forEach((ph, k) => {
      const show = f === 'all' || ph.dataset.cat === f;
      if (show && ph.classList.contains('is-hidden')) {
        ph.classList.remove('is-hidden'); ph.classList.add('is-entering');
        requestAnimationFrame(() => requestAnimationFrame(() => { ph.style.transitionDelay = (k % 6) * 40 + 'ms'; ph.classList.remove('is-entering'); }));
      } else if (!show) { ph.classList.add('is-hidden'); ph.style.transitionDelay = ''; }
    });
  };
  $$('.filter').forEach(b => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
  $$('[data-filter-link]').forEach(a => a.addEventListener('click', () => applyFilter(a.dataset.filterLink)));

  /* Lightbox */
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let lbList = [], lbI = 0;
  const show = n => {
    lbI = (n + lbList.length) % lbList.length;
    const ph = lbList[lbI], im = $('img', ph);
    lbImg.classList.remove('is-loaded');
    setTimeout(() => {
      lbImg.src = im.dataset.full || im.src; lbImg.alt = im.alt; lbCap.textContent = im.alt;
      lbImg.decode ? lbImg.decode().then(() => lbImg.classList.add('is-loaded')).catch(() => lbImg.classList.add('is-loaded')) : lbImg.classList.add('is-loaded');
    }, 180);
  };
  const openLb = ph => {
    lbList = $$('.ph:not(.is-hidden)', masonry);
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); body.classList.add('is-locked');
    show(lbList.indexOf(ph));
  };
  const closeLb = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); body.classList.remove('is-locked'); };
  masonry.addEventListener('click', e => { const ph = e.target.closest('.ph'); if (ph) openLb(ph); });
  $('[data-lb-close]').addEventListener('click', closeLb);
  $('[data-lb-prev]').addEventListener('click', () => show(lbI - 1));
  $('[data-lb-next]').addEventListener('click', () => show(lbI + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(lbI - 1);
    if (e.key === 'ArrowRight') show(lbI + 1);
  });
  let lx = null;
  lb.addEventListener('touchstart', e => lx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { if (lx === null) return; const dx = e.changedTouches[0].clientX - lx; if (Math.abs(dx) > 40) show(lbI + (dx < 0 ? 1 : -1)); lx = null; });

  /* ---------- Reservas ---------- */
  const iso = d => d.toISOString().slice(0, 10);
  const today = new Date(); today.setHours(12);
  const plus = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  $$('form[data-booking]').forEach(form => {
    const fin = form.elements.in, fout = form.elements.out;
    fin.min = iso(today); fin.value = iso(plus(today, 14));
    fout.min = iso(plus(today, 1)); fout.value = iso(plus(today, 16));
    const summary = $('[data-nights]', form);
    const update = () => {
      if (fin.value) { fout.min = iso(plus(new Date(fin.value + 'T12:00'), 1)); if (fout.value <= fin.value) fout.value = fout.min; }
      if (!summary) return;
      const n = Math.round((new Date(fout.value) - new Date(fin.value)) / 864e5);
      const fmt = s => new Date(s + 'T12:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
      const a = +form.elements.adults.value, c = +(form.elements.children?.value || 0);
      summary.parentElement.classList.remove('is-error');
      summary.textContent = n > 0
        ? `${n} ${n === 1 ? 'noche' : 'noches'} · ${fmt(fin.value)} → ${fmt(fout.value)} · ${a} ${a === 1 ? 'adulto' : 'adultos'}${c ? ` y ${c} ${c === 1 ? 'niño' : 'niños'}` : ''}`
        : 'Selecciona tus fechas';
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    $$('[data-step]', form).forEach(b => b.addEventListener('click', () => {
      const inp = b.parentElement.querySelector('input');
      inp.value = Math.min(+inp.max, Math.max(+inp.min, +inp.value + +b.dataset.step));
      update();
    }));
    update();

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!fin.value || !fout.value || fout.value <= fin.value) {
        if (summary) { summary.parentElement.classList.add('is-error'); summary.textContent = 'La salida debe ser posterior a la llegada'; }
        return;
      }
      if (DEMO) return; // demo: sin conexión al motor de reservas
      // Versión final: abre el motor de reservas del cliente con los datos cargados.
      // Peumayen no tiene motor propio: la opción simple es abrir WhatsApp con la consulta armada.
      // Si contratan un motor (SiteMinder, Cloudbeds…), ajustar ENGINE y sus parámetros.
      const ENGINE = 'https://direct-book.com/properties/[id-del-hotel]';
      const p = new URLSearchParams({
        locale: 'es',
        'items[0][adults]': form.elements.adults.value,
        'items[0][children]': form.elements.children?.value || 0,
        'items[0][infants]': 0,
        currency: form.elements.currency?.value || 'CLP',
        checkInDate: fin.value,
        checkOutDate: fout.value
      });
      window.open(`${ENGINE}?${p}`, '_blank', 'noopener');
    });
  });

  /* ---------- Reseñas en vivo desde Google (Places API) ----------
     Para activarlas al publicar: crear una API key de Google Places (New),
     restringida al dominio termaspeumayen.cl, y completar estos dos datos.
     Google entrega hasta 5 reseñas recientes, con autor y atribución. */
  const GOOGLE = { key: '', placeId: '' };
  const live = $('#reviews-live');
  if (live && GOOGLE.key && GOOGLE.placeId) {
    const loadReviews = async () => {
      try {
        const r = await fetch(`https://places.googleapis.com/v1/places/${GOOGLE.placeId}?languageCode=es`, {
          headers: { 'X-Goog-Api-Key': GOOGLE.key, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews' }
        });
        if (!r.ok) return;
        const d = await r.json();
        if (d.rating) $('[data-g-rating]').textContent = d.rating.toLocaleString('es-CL', { minimumFractionDigits: 1 });
        if (d.userRatingCount) $('[data-g-count]').textContent = d.userRatingCount;
        const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        const items = (d.reviews || []).filter(v => v.rating >= 4 && v.text?.text).slice(0, 3);
        if (!items.length) return;
        live.innerHTML = items.map(v => `
          <article class="rcard">
            <div class="rcard__head">
              ${v.authorAttribution?.photoUri ? `<img src="${esc(v.authorAttribution.photoUri)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}
              <div><p class="rcard__name"><a href="${esc(v.authorAttribution?.uri)}" target="_blank" rel="noopener">${esc(v.authorAttribution?.displayName)}</a></p>
              <p class="rcard__when">${esc(v.relativePublishTimeDescription)} · Google</p></div>
            </div>
            <span class="stars stars--sm" aria-label="${v.rating} de 5 estrellas"><span style="--r:${v.rating}"></span></span>
            <p class="rcard__text">${esc(v.text.text)}</p>
          </article>`).join('');
        live.hidden = false;
      } catch (_) { /* sin conexión: se mantiene la nota estática */ }
    };
    // se piden sólo cuando el visitante se acerca a la sección
    new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { o.disconnect(); loadReviews(); } }, { rootMargin: '400px' }).observe(live.parentElement);
  }

  /* ---------- Mapa bajo demanda ---------- */
  const mapBtn = $('[data-map]');
  mapBtn?.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=Peumayen+Lodge+%26+Termas+Puc%C3%B3n&output=embed';
    f.loading = 'lazy'; f.title = 'Mapa Peumayen Lodge & Termas'; f.referrerPolicy = 'no-referrer-when-downgrade';
    mapBtn.replaceWith(f);
  });
})();
