/* ══════════════════════════════════════════════════════════════════
   Night Dream AI — scroll is the playhead.
   Preloader plays the title card ("introducing → Night Dream → AI");
   the home stage is a LIVE photo-sphere (auto-rotates, drag to spin,
   hover lifts a tile, click opens it); the seven pinned stages after it
   replay the film's beats against scroll.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var COLORS = ['#ff8ad4', '#ffe86a', '#7dffb2', '#7ec6ff', '#b18cff', '#ffb27a', '#ff6b6b', '#63e6e2'];
  var mobile = window.matchMedia('(max-width: 900px)').matches;
  var SPHERE = { cards: [], R: 0 };

  if (!hasGSAP || REDUCED) {
    document.documentElement.classList.add('is-static');
    buildWalls(); buildSphere(); splitText();
    var st = $('#ball'); if (st) st.style.transform = 'rotateX(10deg) rotateY(30deg)';
    $$('.card').forEach(function (c) { c.style.opacity = '1'; });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ nullTargetWarn: false });
  if (window.CustomEase) { try { CustomEase.create('pop', '0.34,1.56,0.64,1'); } catch (e) { } }
  var POP = window.CustomEase ? 'pop' : 'back.out(1.7)';
  var SCRUB = 1.2;

  /* ── 1 · SMOOTH SCROLL ─────────────────────────────────── */
  var lenis = null;
  function initLenis() {
    if (typeof window.Lenis === 'undefined') return;
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.3 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ── 2 · CURSOR ────────────────────────────────────────── */
  function initCursor() {
    var dot = $('#cur'), ring = $('#curRing'), label = $('#curLabel');
    if (!dot || window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
    var mx = innerWidth / 2, my = innerHeight / 2, dx = mx, dy = my, rx = mx, ry = my, shown = false;
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; dot.style.opacity = '1'; ring.style.opacity = '1'; }
    }, { passive: true });
    document.addEventListener('mouseleave', function () { dot.style.opacity = '0'; ring.style.opacity = '0'; shown = false; });
    gsap.ticker.add(function () {
      dx += (mx - dx) * 0.34; dy += (my - dy) * 0.34; rx += (mx - rx) * 0.14; ry += (my - ry) * 0.14;
      dot.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    });
    var T = 'a, button, [data-cursor]';
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest(T) : null; if (!t) return;
      ring.classList.add('is-active'); label.textContent = t.getAttribute('data-cursor') || '';
    });
    document.addEventListener('mouseout', function (e) {
      var t = e.target.closest ? e.target.closest(T) : null; if (!t) return;
      if (e.relatedTarget && t.contains(e.relatedTarget)) return;
      ring.classList.remove('is-active'); label.textContent = '';
    });
  }

  /* ── 3 · PRELOADER = title card ────────────────────────── */
  function preloader(done) {
    var pre = $('#pre'), word = $('#preWord'), intro = $('#preIntro'), brand = $('#preBrand');
    var mark = $$('#preMark i'), badge = $('#preBadge'), cf = $$('#preBadge .cf'), skip = $('#preSkip');
    var finished = false;
    var finish = function () {
      if (finished) return; finished = true;
      tl.kill();
      gsap.to(pre, { opacity: 0, duration: 0.5, ease: 'power2.inOut', onComplete: function () { pre.classList.add('is-done'); } });
      done();
    };
    skip.addEventListener('click', finish);

    word.innerHTML = 'introducing'.split('').map(function (c) { return '<i>' + c + '</i>'; }).join('');
    var letters = $$('i', word);
    var hues = ['#7ec6ff', '#63e6e2', '#7dffb2', '#b6ff7a', '#ffe86a', '#ffb27a', '#ff8ad4', '#b18cff', '#7ec6ff', '#7dffb2', '#b18cff'];

    var tl = gsap.timeline({ onComplete: finish, delay: 0.1 });
    tl.fromTo(word, { scale: 3.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.42, ease: 'expo.out' });
    letters.forEach(function (l, i) {
      var t = 0.28 + i * 0.055;
      tl.to(l, { color: hues[i], textShadow: '0 0 18px ' + hues[i] + ', 0 0 4px ' + hues[i], duration: 0.11, ease: 'power1.out' }, t);
      tl.to(l, { color: '#fff', textShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.18, ease: 'power1.in' }, t + 0.16);
    });
    tl.to(intro, { opacity: 0, duration: 0.12 }, 0.98);
    tl.set(brand, { opacity: 1 }, 1.02);
    tl.set('#preMark', { letterSpacing: '0.42em' }, 1.02);
    tl.fromTo(mark, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.16, ease: POP, stagger: 0.05 }, 1.05);
    tl.to('#preMark', { letterSpacing: '0.02em', duration: 0.3, ease: 'expo.inOut' }, 1.42);
    tl.to(badge, { opacity: 1, scale: 1, duration: 0.38, ease: 'back.out(2.2)' }, 1.5);
    tl.to(cf, { opacity: 1, scale: 1, duration: 0.18, ease: 'back.out(2)', stagger: 0.03 }, 1.62);
    tl.to(badge, { backgroundColor: '#ffffff', duration: 0.18 }, 1.72);
    tl.to($('b', badge), { opacity: 1, duration: 0.14 }, 1.74);
    tl.to(cf, { opacity: 0, scale: 0.4, duration: 0.16, stagger: 0.02 }, 1.92);
    tl.to({}, { duration: 0.32 });
    return tl;
  }

  /* ── 4 · helpers ───────────────────────────────────────── */
  function splitChars(el) {
    if (!el || el.dataset.split) return $$('i', el);
    var txt = el.textContent; el.dataset.split = '1';
    el.setAttribute('aria-label', txt);
    el.innerHTML = txt.split('').map(function (c) { return '<i aria-hidden="true">' + (c === ' ' ? ' ' : c) + '</i>'; }).join('');
    return $$('i', el);
  }
  function splitText() {
    splitChars($('#createTxt'));
    splitChars($('#uniType em'));
  }
  function buildWalls() {
    var a = $('#wallA'), b = $('#wallB');
    if (!a || a.children.length) return;
    var mk = function (i, seed, tall) {
      var d = document.createElement('div');
      d.className = 'tile' + (tall ? ' tile--tall' : '');
      d.style.setProperty('--c', COLORS[i % COLORS.length]);
      var im = document.createElement('img');
      im.alt = ''; im.loading = 'lazy';
      im.src = 'https://picsum.photos/seed/oodles-' + seed + '/420/560';
      d.appendChild(im); return d;
    };
    for (var i = 0; i < 15; i++) a.appendChild(mk(i, 'w' + (i % 10), false));
    for (var j = 0; j < 26; j++) b.appendChild(mk(j + 3, 'w' + ((j + 4) % 10), j % 7 === 2));
  }

  /* Sphere geometry: Fibonacci lattice → (lon, lat, R) per card. Each card gets a unit normal
     in ball space so we can compute "facing" every frame (depth fade + hit-testing). */
  function buildSphere() {
    var ball = $('#ball'); if (!ball || ball.children.length) return SPHERE.cards;
    var N = mobile ? 40 : 58;
    var vmin = Math.min(innerWidth, innerHeight);
    var R = vmin * (mobile ? 0.36 : 0.33); SPHERE.R = R;
    var golden = Math.PI * (3 - Math.sqrt(5));
    var frag = document.createDocumentFragment();
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2;
      var latR = Math.asin(y), lonR = i * golden;
      var lat = latR * 180 / Math.PI, lon = lonR * 180 / Math.PI;
      var pos = document.createElement('div');
      pos.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d;transform:rotateY(' + lon.toFixed(2) + 'deg) rotateX(' + (-lat).toFixed(2) + 'deg) translateZ(' + R.toFixed(1) + 'px)';
      var c = document.createElement('div');
      c.className = 'card';
      c.setAttribute('data-cursor', 'view');
      var s = ((mobile ? 0.09 : 0.07) + ((i * 7919) % 100) / 100 * (mobile ? 0.08 : 0.075)) * vmin;
      c.style.setProperty('--s', s.toFixed(0) + 'px');
      c.style.setProperty('--c', COLORS[i % COLORS.length]);
      var inr = document.createElement('div'); inr.className = 'card__in';
      var im = document.createElement('img'); im.alt = ''; im.draggable = false;
      im.src = 'https://picsum.photos/seed/oodles-s' + (i % 14) + '/240/240';
      inr.appendChild(im); c.appendChild(inr); pos.appendChild(c); frag.appendChild(pos);
      // unit normal in ball space (matches rotateY(lon) rotateX(-lat) translateZ(R))
      SPHERE.cards.push({
        el: c, inr: inr, img: im, i: i, seed: i % 14, color: COLORS[i % COLORS.length],
        nx: Math.cos(latR) * Math.sin(lonR), ny: Math.sin(latR), nz: Math.cos(latR) * Math.cos(lonR), back: false
      });
    }
    ball.appendChild(frag);
    return SPHERE.cards;
  }

  /* ── 5 · HOME: live sphere runtime ────────────────────────── */
  function initHomeSphere() {
    var scene = $('#scene'), ball = $('#ball'); if (!scene || !ball) return {};
    var cards = buildSphere();
    var rotY = -20, rotX = 12, velY = 0, velX = 0;
    var IDLE = 0.11, idle = 1, idleTarget = 1;     // idle spin (deg/frame @60), eased toward target
    var dragging = false, px = 0, py = 0, moved = 0, active = true;
    var hotCard = null;

    var setBall = function () {
      ball.style.transform = 'translate3d(0,0,0) rotateX(' + rotX.toFixed(3) + 'deg) rotateY(' + rotY.toFixed(3) + 'deg)';
    };
    var shade = function () {
      var ry = rotY * Math.PI / 180, rx = rotX * Math.PI / 180;
      var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      for (var k = 0; k < cards.length; k++) {
        var c = cards[k];
        var z1 = -c.nx * sy + c.nz * cy;                       // after rotateY
        var z2 = c.ny * sx + z1 * cx;                          // after rotateX → facing (1 = toward viewer)
        var f = (z2 + 1) * 0.5;                                // 0..1
        var op = 0.05 + Math.pow(f, 2.4) * 0.95;
        c.el.style.opacity = op.toFixed(3);
        var back = z2 < -0.05;
        if (back !== c.back) { c.back = back; c.el.classList.toggle('is-back', back); }
      }
    };

    // per-frame integrator (runs on gsap.ticker; dt-normalised to 60 fps)
    gsap.ticker.add(function (t, dtMs) {
      if (!active) return;
      var k = Math.min(dtMs / 16.667, 3);
      idle += (idleTarget - idle) * 0.06 * k;
      if (!dragging) {
        rotY += (IDLE * idle + velY) * k;
        rotX += velX * k;
        velY *= Math.pow(0.955, k); velX *= Math.pow(0.94, k);
        // ease tilt back toward a resting 12°
        rotX += (12 - rotX) * 0.01 * k;
      }
      setBall(); shade();
    });

    // pointer: drag to spin with inertia
    var onDown = function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = 0; px = e.clientX; py = e.clientY; velY = velX = 0;
      scene.classList.add('is-dragging');
      scene.setPointerCapture && scene.setPointerCapture(e.pointerId);
    };
    var onMove = function (e) {
      if (!dragging) return;
      var dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      var sY = 0.32, sX = 0.18;
      rotY += dx * sY; rotX = Math.max(-40, Math.min(48, rotX - dy * sX));
      velY = velY * 0.5 + dx * sY * 0.5; velX = velX * 0.5 + (-dy * sX) * 0.5;
      setBall();
    };
    var onUp = function (e) {
      if (!dragging) return;
      dragging = false; scene.classList.remove('is-dragging');
      velY = Math.max(-9, Math.min(9, velY)); velX = Math.max(-4, Math.min(4, velX));
      // click (not drag) on a card → lightbox
      if (moved < 7) {
        var card = e.target.closest ? e.target.closest('.card') : null;
        if (card) openLightbox(card);
      }
    };
    scene.addEventListener('pointerdown', onDown);
    scene.addEventListener('pointermove', onMove);
    scene.addEventListener('pointerup', onUp);
    scene.addEventListener('pointercancel', onUp);
    scene.addEventListener('lostpointercapture', function () { if (dragging) { dragging = false; scene.classList.remove('is-dragging'); } });
    // hover a tile → slow the spin so it can be inspected
    scene.addEventListener('mouseover', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (card) { idleTarget = 0.18; hotCard = card; }
    });
    scene.addEventListener('mouseout', function (e) {
      var card = e.target.closest ? e.target.closest('.card') : null;
      if (card && !(e.relatedTarget && card.contains(e.relatedTarget))) { idleTarget = 1; hotCard = null; }
    });

    // lightbox
    var lb = $('#lb'), lbBg = $('#lbBg'), lbFig = $('#lbFig'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbClose = $('#lbClose');
    var lbOpen = false, lbFrom = null;
    function openLightbox(card) {
      if (lbOpen) return; lbOpen = true;
      var data = null; for (var i = 0; i < cards.length; i++) if (cards[i].el === card) data = cards[i];
      var r = card.getBoundingClientRect(); lbFrom = r;
      lbImg.src = 'https://picsum.photos/seed/oodles-s' + (data ? data.seed : 0) + '/900/900';
      lbCap.textContent = 'Night Dream #' + String((data ? data.i : 0) + 1041).padStart(4, '0');
      lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
      if (lenis) lenis.stop();
      var W = lbFig.offsetWidth, H = lbFig.offsetHeight;
      var tx = (innerWidth - W) / 2, ty = (innerHeight - H) / 2;
      gsap.set(lbFig, { x: r.left, y: r.top, scaleX: r.width / W, scaleY: r.height / H, opacity: 1, borderRadius: '12%' });
      gsap.timeline()
        .to(lbBg, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0)
        .to(lbFig, { x: tx, y: ty, scaleX: 1, scaleY: 1, borderRadius: '6vmin', duration: 0.75, ease: 'expo.inOut' }, 0)
        .fromTo(lbCap, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.5)
        .to(lbClose, { opacity: 1, duration: 0.3 }, 0.4);
    }
    function closeLightbox() {
      if (!lbOpen) return; lbOpen = false;
      var r = lbFrom, W = lbFig.offsetWidth, H = lbFig.offsetHeight;
      gsap.timeline({ onComplete: function () { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); if (lenis) lenis.start(); } })
        .to([lbClose, lbCap], { opacity: 0, duration: 0.2 }, 0)
        .to(lbFig, { x: r.left, y: r.top, scaleX: r.width / W, scaleY: r.height / H, borderRadius: '12%', duration: 0.6, ease: 'expo.inOut' }, 0)
        .to(lbFig, { opacity: 0, duration: 0.15 }, 0.5)
        .to(lbBg, { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, 0.15);
    }
    lbBg.addEventListener('click', closeLightbox);
    lbClose.addEventListener('click', closeLightbox);
    addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });

    setBall(); shade();

    // scroll-out: sphere recedes + copy lifts as the reimagine stage slides over it
    gsap.timeline({ scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: SCRUB } })
      .to(scene, { scale: 0.78, yPercent: -12, opacity: 0, ease: 'power2.in' }, 0)
      .to('#homeCopy', { yPercent: -30, opacity: 0, ease: 'power2.in' }, 0)
      .to('.home__glow', { opacity: 0, ease: 'none' }, 0);
    ScrollTrigger.create({ trigger: '#home', start: 'top bottom', end: 'bottom top', onToggle: function (s) { active = s.isActive; } });

    return {
      // "preview" assembly: tiles fly in from scattered off-screen positions and snap onto the sphere
      assemble: function () {
        var vw = innerWidth, vh = innerHeight;
        var tl = gsap.timeline();
        tl.fromTo('.home__glow', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'expo.out' }, 0);
        cards.forEach(function (c, i) {
          var ang = (i * 2.399963) % (Math.PI * 2), dist = Math.max(vw, vh) * (0.75 + ((i * 37) % 10) / 10 * 0.6);
          tl.fromTo(c.el, { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, z: -500 + ((i * 53) % 10) / 10 * 900, rotation: -50 + ((i * 29) % 10) * 10, scale: 0.4 },
            { x: 0, y: 0, z: 0, rotation: 0, scale: 1, duration: 1.4, ease: 'expo.out' }, 0.05 + ((i * 17) % 20) / 20 * 0.55);
        });
        // a little launch spin that decays into the idle spin
        velY = 5.5;
        tl.fromTo('#homeCopy > *', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09 }, 0.55);
        tl.fromTo('.home .scrollcue', { opacity: 0 }, { opacity: 1, duration: 0.8 }, 1.4);
        return tl;
      }
    };
  }

  /* ── 6 · STAGES ─────────────────────────────────────────── */
  function pinTL(section, lengthVh) {
    return gsap.timeline({
      defaults: { ease: 'none', immediateRender: false },
      scrollTrigger: { trigger: section, start: 'top top', end: '+=' + lengthVh + '%', pin: true, scrub: SCRUB, anticipatePin: 1 }
    });
  }

  /* 01 · REIMAGINE (phone) */
  function stageReimagine() {
    var tl = pinTL('#reimagine', mobile ? 440 : 540);
    var ground = '#heroGround', phone = $('#phone'), pill = '#reimaginePill';
    var ph = phone.getBoundingClientRect().height || innerHeight * 0.46;
    var BIG = mobile ? 3.0 : 4.2;
    var yBig = ph * BIG / 2 - innerHeight * 0.48;   // top of the phone lands ~2vh below the viewport top
    gsap.set(phone, { transformOrigin: '50% 50%' });
    // 0–0.7: pink ground + phone settles in
    tl.set(ground, { opacity: 1, backgroundColor: '#f79ad9' }, 0);
    tl.fromTo(phone, { opacity: 0, scale: 1.22, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'expo.out' }, 0);
    // 1.0–1.7: ground washes to yellow while the phone pushes to 4× (top-cropped)
    tl.to(ground, { backgroundColor: '#ffe86a', duration: 0.5, ease: 'power2.inOut' }, 1.0);
    tl.to(phone, { scale: BIG, y: yBig, duration: 0.7, ease: 'expo.inOut' }, 1.0);
    tl.fromTo(pill, { opacity: 0, y: '0.6em' }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 1.75);
    // 2.4–3.5: photo blurs → pastel wash → cartoon de-blurs
    tl.to('#phoneImg', { filter: 'blur(22px)', duration: 0.5, ease: 'power2.inOut' }, 2.4);
    tl.to('#phoneWash', { opacity: 1, duration: 0.45, ease: 'power2.inOut' }, 2.55);
    tl.set('#phoneToon', { opacity: 1, filter: 'url(#toon) blur(22px)' }, 2.95);
    tl.to('#phoneWash', { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, 3.0);
    tl.to('#phoneToon', { filter: 'url(#toon) blur(0px)', duration: 0.5, ease: 'power2.out' }, 3.05);
    tl.to(pill, { opacity: 0, duration: 0.25 }, 3.4);
    // 3.8: crossfade to full-bleed cartoon plate on black
    tl.set('#toonPlate', { opacity: 1 }, 3.8);
    tl.to([ground, phone], { opacity: 0, duration: 0.3, ease: 'power2.inOut' }, 3.8);
    // 4.2–4.8: plate shrinks to app-icon chip with rim glow
    tl.to('#toonPlate', { width: mobile ? '46vw' : '34vh', height: mobile ? '46vw' : '34vh', borderRadius: mobile ? '10vw' : '7.5vh', duration: 0.6, ease: 'expo.inOut' }, 4.2);
    tl.to('#toonPlate', { boxShadow: '0 0 60px rgba(255,255,255,0.28)', duration: 0.4 }, 4.5);
    tl.to('#toonPlate .toonplate__rim', { opacity: 1, duration: 0.3 }, 4.6);
    // 5.0–5.9: neon squiggle draws behind chip, hue cycling
    var sq = '#squiggle1', sqPath = '#squiggle1 path';
    tl.set(sq, { opacity: 1 }, 5.0);
    tl.fromTo(sqPath, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 5.0);
    tl.fromTo(sq, { filter: 'hue-rotate(0deg) drop-shadow(0 0 14px rgba(140,255,220,0.55))' }, { filter: 'hue-rotate(200deg) drop-shadow(0 0 14px rgba(140,255,220,0.55))', duration: 1.1 }, 5.0);
    // 6.1: chip + squiggle fall away; "artistic intelligence" slides in from the right
    tl.to([sq, '#toonPlate'], { opacity: 0, scale: 0.9, duration: 0.3, ease: 'power2.in' }, 6.1);
    tl.set('#aiText', { opacity: 1 }, 6.2);
    tl.fromTo('#aiText', { xPercent: -50 + 34, yPercent: -50 }, { xPercent: -50, duration: 0.45, ease: 'expo.out' }, 6.2);
    tl.to({}, { duration: 0.6 });
    return tl;
  }

  /* 02 · DEMO */
  function stageDemo() {
    var tl = pinTL('#demo', mobile ? 380 : 460);
    tl.fromTo('#beatA .demo__bg', { scale: 1 }, { scale: 1.05, duration: 2.4 }, 0);
    tl.to('#beatA .demo__bg', { filter: 'blur(18px) brightness(0.9)', duration: 0.5, ease: 'power2.inOut' }, 0.8);
    tl.fromTo('#glassA', { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }, 0.85);
    tl.to('#glassA .glass__img', { filter: 'blur(20px)', duration: 0.4, ease: 'power2.inOut' }, 1.3);
    tl.to('#glassA .wash', { opacity: 1, duration: 0.35, ease: 'power2.inOut' }, 1.4);
    tl.set('#glassA .glass__img--toon', { opacity: 1, filter: 'url(#toon) blur(20px)' }, 1.72);
    tl.to('#glassA .wash', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 1.75);
    tl.to('#glassA .glass__img--toon', { filter: 'url(#toon) blur(0px)', duration: 0.45, ease: 'power2.out' }, 1.8);
    tl.to('#demoCap', { opacity: 1, duration: 0.3 }, 2.0);
    // 2.6: cut to photo B sharp; glass SCALES DOWN from full-bleed while bg blurs
    tl.to('#beatA', { opacity: 0, duration: 0.15 }, 2.6);
    tl.to('#beatB', { opacity: 1, duration: 0.15 }, 2.6);
    tl.fromTo('#beatB .demo__bg', { scale: 1 }, { scale: 1.05, duration: 2.4 }, 2.6);
    tl.set('#glassB', { opacity: 1 }, 3.0);
    tl.fromTo('#glassB', { scale: 3.2, borderRadius: '0vh' }, { scale: 1, borderRadius: '6vh', duration: 0.7, ease: 'expo.inOut' }, 3.0);
    tl.to('#beatB .demo__bg', { filter: 'blur(18px) brightness(0.9)', duration: 0.5, ease: 'power2.inOut' }, 3.1);
    tl.to('#glassB .glass__img', { filter: 'blur(20px)', duration: 0.4, ease: 'power2.inOut' }, 3.7);
    tl.to('#glassB .wash', { opacity: 1, duration: 0.35, ease: 'power2.inOut' }, 3.8);
    tl.set('#glassB .glass__img--toon', { opacity: 1, filter: 'url(#toon) blur(20px)' }, 4.12);
    tl.to('#glassB .wash', { opacity: 0, duration: 0.35, ease: 'power2.inOut' }, 4.15);
    tl.to('#glassB .glass__img--toon', { filter: 'url(#toon) blur(0px)', duration: 0.45, ease: 'power2.out' }, 4.2);
    tl.to({}, { duration: 0.6 });
    return tl;
  }

  /* 03 · WALL */
  function stageWall() {
    buildWalls();
    var tl = pinTL('#wall', mobile ? 300 : 340);
    var pill = '#wallPill', pillTxt = '#wallPill em';
    tl.fromTo('#wallA', { yPercent: -50 + 6 }, { yPercent: -50 - 6, duration: 2.0 }, 0);
    tl.fromTo(pill, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.35, ease: POP }, 0.15);
    tl.to('#wallA', { opacity: 0, duration: 0.25, ease: 'power2.inOut' }, 1.7);
    tl.fromTo('#wallB', { opacity: 0, yPercent: -50 + 8, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 1.7);
    tl.to('#wallB', { yPercent: -50 - 8, duration: 1.9 }, 1.7);
    tl.to(pill, { scale: 0.7, duration: 0.12, ease: 'power2.in' }, 1.72);
    tl.call(function () { $(pillTxt).textContent = tl.scrollTrigger.direction >= 0 ? 'effortless.' : 'instant.'; }, null, 1.84);
    tl.to(pill, { scale: 1, duration: 0.3, ease: POP }, 1.86);
    var tilesB = $$('#wallB .tile');
    tilesB.forEach(function (t, i) { if (i % 3 === 0) tl.fromTo(t, { y: 0 }, { y: -60 - (i % 5) * 20, duration: 1.9 }, 1.7); });
    tl.to({}, { duration: 0.2 });
    return tl;
  }

  /* 04 · WHEEL */
  function stageWheel() {
    var tl = pinTL('#wheel', mobile ? 220 : 260);
    var word_lead = '#wheelLead', words = $$('#wheelCol span');
    var hero = words.indexOf($('#wheelCol span.is-hero'));
    var gap = 1.12;
    words.forEach(function (w, i) { gsap.set(w, { yPercent: 0, y: (i - hero) * gap + 'em', opacity: 0, xPercent: mobile ? -50 : 0 }); });
    tl.fromTo(word_lead, { opacity: 0, scale: 0.92, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'expo.out' }, 0);
    tl.fromTo(words[hero], { opacity: 0, y: '0.6em' }, { opacity: 1, y: '0em', duration: 0.4, ease: POP }, 0.6);
    words.forEach(function (w, i) {
      if (i === hero) return;
      var d = Math.abs(i - hero);
      tl.fromTo(w, { opacity: 0, y: (i - hero) * gap * 0.35 + 'em' }, { opacity: 1, y: (i - hero) * gap + 'em', duration: 0.55, ease: 'back.out(1.4)' }, 0.75 + d * 0.1);
    });
    tl.to({}, { duration: 0.8 });
    return tl;
  }

  /* 05 · UNIVERSE */
  function stageUniverse() {
    var chars = splitChars($('#uniType em'));
    var caret = document.createElement('span'); caret.className = 'caret'; $('#uniType em').appendChild(caret);
    var plates = $$('.uni__plate');
    var tl = pinTL('#universe', mobile ? 340 : 400);
    var seg = 1.0;
    plates.forEach(function (p, i) {
      if (i > 0) {
        tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.12 }, i * seg);
        tl.to(plates[i - 1], { opacity: 0, duration: 0.12 }, i * seg + 0.02);
      }
      tl.fromTo(p, { scale: 1 }, { scale: 1.06, duration: seg + 0.15 }, i * seg);
    });
    tl.fromTo('#uniType', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'expo.out' }, 0.15);
    tl.to(chars, { opacity: 1, duration: 0.01, stagger: 2.2 / chars.length }, 0.3);
    tl.to({}, { duration: 0.6 });
    return tl;
  }

  /* 06 · CREATE */
  function stageCreate() {
    var chars = splitChars($('#createTxt'));
    var tl = pinTL('#create', mobile ? 240 : 300);
    chars.forEach(function (ch, i) {
      var col = COLORS[i % COLORS.length];
      var t = 0.1 + ((i * 31) % 14) / 14 * 0.9;
      tl.fromTo(ch, { opacity: 0, x: -140 + ((i * 47) % 10) / 10 * 280, y: -120 + ((i * 23) % 10) / 10 * 240, color: col, scale: 0.8 },
        { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.6, ease: 'expo.out' }, t);
      tl.to(ch, { color: '#ffffff', duration: 0.4 }, t + 0.55);
    });
    tl.set('#squiggle2', { opacity: 1 }, 0.3);
    tl.fromTo('#squiggle2 path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut' }, 0.3);
    tl.fromTo('#squiggle2', { filter: 'hue-rotate(0deg) drop-shadow(0 0 22px rgba(126,198,255,0.6))' }, { filter: 'hue-rotate(160deg) drop-shadow(0 0 22px rgba(126,198,255,0.6))', duration: 2.0 }, 0.3);
    tl.to({}, { duration: 0.6 });
    return tl;
  }

  /* 07 · FINALE */
  function vmin(v) { return parseFloat(v) * Math.min(innerWidth, innerHeight) / 100; }
  function stageFinale() {
    var tl = pinTL('#finale', mobile ? 420 : 520);
    var letters = $$('#logoMark > i'), toys = $$('#toys span'), mark = '#logoMark';
    toys.forEach(function (t, i) { t.style.setProperty('--i', i); });
    tl.set(mark, { letterSpacing: '0.42em' }, 0);
    tl.fromTo(letters, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.16, ease: POP, stagger: 0.09 }, 0.05);
    tl.fromTo('#blobW', { opacity: 1, scale: 0 }, { scale: 1, duration: 0.25, ease: POP }, 0.35);
    tl.to('#blobW', { opacity: 0, scale: 0.4, duration: 0.2 }, 0.75);
    tl.fromTo('#blobB', { opacity: 1, scale: 0 }, { scale: 1, duration: 0.25, ease: POP }, 0.5);
    tl.to('#blobB', { opacity: 0, scale: 0.4, duration: 0.2 }, 0.95);
    tl.to(mark, { letterSpacing: '0.02em', duration: 0.4, ease: 'expo.inOut' }, 0.7);
    tl.fromTo('#hand', { opacity: 0, x: 0, y: 0 }, { opacity: 1, duration: 0.15 }, 1.0);
    tl.to('#hand', { x: mobile ? '-58vw' : '-5.1em', y: '1.05em', duration: 0.5, ease: 'power3.inOut' }, 1.1);
    tl.to('#hand', { scale: 0.85, duration: 0.08, yoyo: true, repeat: 1 }, 1.62);
    tl.to('#logoMark .o1 .glyph', { opacity: 0, duration: 0.05 }, 1.7);
    tl.to('#globe', { opacity: 1, scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)' }, 1.7);
    tl.to('#logoBadge', { opacity: 1, x: 0, duration: 0.45, ease: 'expo.out' }, 1.75);
    tl.to(mark, { color: '#ffffff', duration: 0.3 }, 2.2);
    tl.to('#hand', { x: mobile ? '-70vw' : '-6.2em', y: '1.9em', duration: 0.6, ease: 'power3.inOut' }, 2.2);
    tl.to('#hand', { opacity: 0, duration: 0.2 }, 3.0);
    tl.to('#logo', { scale: 0.82, duration: 0.35, ease: 'power3.inOut' }, 3.0);
    toys.forEach(function (t, i) {
      tl.fromTo(t, { opacity: 0, xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 0 },
        { opacity: 1, x: vmin(t.style.getPropertyValue('--x')), y: vmin(t.style.getPropertyValue('--y')), scale: 1, duration: 0.55, ease: 'back.out(2)' }, 3.2 + i * 0.03);
    });
    tl.call(function () { $('#toys').classList.toggle('is-live', tl.scrollTrigger.direction >= 0); }, null, 3.7);
    tl.to(mark, { color: '#ffe86a', duration: 0.25 }, 3.9);
    tl.to(mark, { color: '#b18cff', duration: 0.35 }, 4.25);
    tl.to(mark, { color: '#7dffb2', duration: 0.3 }, 4.6);
    tl.to(mark, { color: '#ffffff', duration: 0.3 }, 4.9);
    tl.to('#logo', { scale: 1.12, duration: 0.5, ease: 'power3.inOut' }, 5.2);
    tl.to('#toys', { scale: 1.3, duration: 0.5, ease: 'power3.inOut' }, 5.2);
    tl.to('#logo', { scale: 0.9, duration: 0.35, ease: 'power3.inOut' }, 5.7);
    tl.to('#toys', { opacity: 0, duration: 0.15 }, 6.0);
    tl.to(mark, { color: '#ff8ad4', duration: 0.12 }, 6.05);
    tl.to(mark, { color: '#7dffb2', duration: 0.12 }, 6.25);
    tl.to(mark, { color: '#ffffff', duration: 0.12 }, 6.45);
    tl.to({}, { duration: 0.6 });
    return tl;
  }

  /* ── 7 · progress rail ─────────────────────────────────── */
  function initRail() {
    var fill = $('#railFill'); if (!fill) return;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) { fill.style.transform = 'scaleY(' + s.progress + ')'; } });
  }

  /* ── boot ───────────────────────────────────────────────── */
  function boot() {
    initLenis(); initCursor();
    ScrollTrigger.defaults({ invalidateOnRefresh: false });
    var home = initHomeSphere();
    stageReimagine(); stageDemo(); stageWall(); stageWheel(); stageUniverse(); stageCreate(); stageFinale();
    initRail();
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var el = $(id); if (!el) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } }); else el.scrollIntoView();
      });
    });
    var start = function () {
      if (home.assemble) home.assemble();
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    };
    var began = false;
    var begin = function () { if (began) return; began = true; preloader(start); };
    if (document.fonts && document.fonts.ready) {
      setTimeout(begin, 1400);
      document.fonts.ready.then(begin);
    } else begin();
    addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
