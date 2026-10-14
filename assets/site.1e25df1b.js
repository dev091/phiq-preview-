/* phi-Q Architects v2. Progressive enhancement: every page is complete without this file.
   Uses GSAP + ScrollTrigger + Lenis from the vendor bundle when present; degrades to a still, fully visible page. */
(function () {
  'use strict';
  var d = document, h = d.documentElement, W = window;
  W.PHIQ = 1;
  var motion = h.classList.contains('motion');
  var mqDesk = W.matchMedia('(min-width: 900px)');
  var mqFine = W.matchMedia('(hover: hover) and (pointer: fine)');
  var G = W.gsap, ST = W.ScrollTrigger;
  var anim = !!(G && ST && motion);
  if (G && ST) G.registerPlugin(ST);
  var lenis = null;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (x) { return null; } }

  /* ---------- page transition curtain ---------- */
  var cur = $('.curtain');
  if (cur && h.classList.contains('pt-in')) {
    W.requestAnimationFrame(function () {
      W.requestAnimationFrame(function () {
        cur.classList.add('is-out');
        h.classList.remove('pt-in');
        setTimeout(function () { cur.classList.remove('is-out'); }, 1000);
      });
    });
  }
  d.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a');
    if (!a || !motion || !cur || ev.defaultPrevented || ev.button || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-lb')) return;
    var u;
    try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.protocol !== location.protocol || u.origin !== location.origin) return;
    if (u.pathname === location.pathname && (u.hash || u.search === location.search)) return;
    if (!/(\.html|\/)$/.test(u.pathname)) return;
    ev.preventDefault();
    try { sessionStorage.setItem('pq-pt', '1'); } catch (x) {}
    cur.classList.add('is-go');
    setTimeout(function () { location.href = u.href; }, 640);
  });
  W.addEventListener('pageshow', function (e) {
    if (e.persisted && cur) { cur.classList.remove('is-go', 'is-out'); h.classList.remove('pt-in'); try { sessionStorage.removeItem('pq-pt'); } catch (x) {} }
  });

  /* ---------- smooth scroll (desktop pointers only) ---------- */
  if (motion && W.Lenis && mqFine.matches) {
    lenis = new W.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    if (anim) {
      lenis.on('scroll', ST.update);
      G.ticker.add(function (t) { lenis.raf(t * 1000); });
      G.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); W.requestAnimationFrame(raf); })(0);
    }
    W.PHIQ_LENIS = lenis;
  }

  /* ---------- header + mobile bar ---------- */
  var hd = $('[data-hd]'), mbar = $('[data-mbar]');
  var lead = $('[data-hero]') || $('[data-lead]');
  var lastY = W.scrollY, menuOpen = false;
  var isHome = !!$('[data-hero]');
  if (mbar && isHome) mbar.classList.add('is-away');
  function onScroll() {
    var y = W.scrollY;
    var lim = lead ? lead.offsetHeight - 90 : 10;
    if (hd) {
      hd.classList.toggle('is-solid', y > lim);
      hd.classList.toggle('is-hidden', !menuOpen && y > lastY + 2 && y > 320);
      if (y < lastY - 2) hd.classList.remove('is-hidden');
    }
    if (mbar && isHome) mbar.classList.toggle('is-away', y < (lead ? lead.offsetHeight * 0.45 : 0));
    lastY = y;
  }
  W.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- menu ---------- */
  var mb = $('[data-menu-btn]'), menu = $('[data-menu]');
  function setMenu(open) {
    if (!mb || !menu) return;
    menuOpen = open;
    mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    mb.querySelector('span').textContent = open ? 'Close' : 'Menu';
    hd.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      W.requestAnimationFrame(function () { menu.classList.add('is-open'); });
      d.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      var f = menu.querySelector('a'); if (f) f.focus();
      if (mbar) mbar.classList.add('is-away');
    } else {
      menu.classList.remove('is-open');
      d.body.style.overflow = '';
      if (lenis) lenis.start();
      setTimeout(function () { if (!menuOpen) menu.hidden = true; }, motion ? 700 : 0);
      onScroll();
      if (mbar && !isHome) mbar.classList.remove('is-away');
    }
  }
  if (mb) mb.addEventListener('click', function () { setMenu(!menuOpen); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); mb.focus(); } });
  mqDesk.addEventListener && mqDesk.addEventListener('change', function () { if (menuOpen) setMenu(false); });

  /* ---------- hero sequence ---------- */
  var hero = $('[data-hero]');
  if (hero) {
    var slides = $$('[data-slide]', hero), idx = 0, timer = null, playing = true, inView = true;
    var capA = $('[data-cap]', hero), capT = $('[data-capt]', hero), cnt = $('[data-count]', hero), bar = $('[data-bar]', hero), pause = $('[data-pause]', hero);
    var DUR = 6.5;
    var hydrate = function () {
      slides.forEach(function (s) {
        $$('[data-srcset]', s).forEach(function (el) { el.setAttribute('srcset', el.getAttribute('data-srcset')); el.removeAttribute('data-srcset'); });
        $$('img[data-src]', s).forEach(function (el) { el.src = el.getAttribute('data-src'); el.removeAttribute('data-src'); });
      });
    };
    var ready = function (img, cb) {
      if (img.complete && img.naturalWidth) return cb();
      var done = false, fin = function () { if (!done) { done = true; cb(); } };
      img.addEventListener('load', fin, { once: true }); img.addEventListener('error', fin, { once: true }); setTimeout(fin, 4000);
    };
    var setCap = function (s) {
      if (capA) capA.href = s.getAttribute('data-href');
      if (cnt) cnt.textContent = ('0' + (+s.getAttribute('data-slide') + 1)).slice(-2);
      if (!capT) return;
      if (anim) {
        G.to(capT, { yPercent: -110, opacity: 0, duration: .45, ease: 'power3.in', onComplete: function () {
          capT.textContent = s.getAttribute('data-cap');
          G.fromTo(capT, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, ease: 'expo.out' });
        } });
      } else capT.textContent = s.getAttribute('data-cap');
    };
    var go = function (n) {
      var a = slides[idx], b = slides[n], ib = b.querySelector('img'), ia = a.querySelector('img');
      ready(ib, function () {
        b.classList.add('is-on');
        G.set(b, { zIndex: 2, clipPath: 'inset(0% 0% 0% 100%)' }); G.set(a, { zIndex: 1 });
        ia.style.animation = 'none'; ib.style.animation = 'none';
        var tl = G.timeline({ onComplete: function () {
          a.classList.remove('is-on'); G.set(a, { clearProps: 'zIndex,clipPath' }); G.set(ia, { clearProps: 'transform' });
        } });
        tl.to(b, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.inOut' }, 0)
          .fromTo(ib, { scale: 1.2, xPercent: 6 }, { scale: 1.06, xPercent: 0, duration: 1.7, ease: 'expo.inOut' }, 0)
          .to(ia, { xPercent: -10, duration: 1.7, ease: 'expo.inOut' }, 0)
          .to(ib, { scale: 1, duration: DUR + 1, ease: 'none' }, 1.7);
        idx = n; setCap(b); tick();
      });
    };
    var tick = function () {
      if (timer) timer.kill();
      timer = G.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none', paused: !(playing && inView && !d.hidden), onComplete: function () { go((idx + 1) % slides.length); } });
    };
    var sync = function () { if (timer) { if (playing && inView && !d.hidden) timer.resume(); else timer.pause(); } };
    if (anim && slides.length > 1) {
      var start = function () { hydrate(); tick(); if (pause) pause.hidden = false; };
      if (d.readyState === 'complete') setTimeout(start, 600); else W.addEventListener('load', function () { setTimeout(start, 600); });
      if (pause) pause.addEventListener('click', function () { playing = !playing; pause.textContent = playing ? 'Pause' : 'Play'; pause.setAttribute('aria-pressed', playing ? 'false' : 'true'); sync(); });
      if ('IntersectionObserver' in W) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; sync(); }).observe(hero);
      d.addEventListener('visibilitychange', sync);
      G.to($('.hero__media', hero), { yPercent: 14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      G.to($('.hero__copy', hero), { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '70% top', scrub: true } });
    }
  }

  /* ---------- scroll choreography ---------- */
  if (anim) {
    var vh = W.innerHeight;
    var below = function (el) { return el.getBoundingClientRect().top > vh * 0.92; };
    // image mask reveals
    $$('.g__mask').forEach(function (m) {
      if (!below(m)) return;
      var img = m.querySelector('img');
      G.set(m, { clipPath: 'inset(100% 0% 0% 0%)' }); G.set(img, { scale: 1.22 });
      ST.create({ trigger: m, start: 'top 90%', once: true, onEnter: function () {
        G.to(m, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out' });
        G.to(img, { scale: 1, duration: 2, ease: 'expo.out', clearProps: 'transform' });
      } });
    });
    // fade-up items (index rows, disciplines, lists)
    var ups = $$('.rv-up, .idx__row, .duo__list li, .ct__blk, .pp, .sec-head, .cs-info > *').filter(below);
    if (ups.length) {
      G.set(ups, { opacity: 0, y: 44 });
      ST.batch(ups, { start: 'top 92%', once: true, onEnter: function (b) { G.to(b, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: .07, clearProps: 'transform' }); } });
    }
    // words light up as you read
    $$('[data-words]').forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.7) return;
      G.fromTo($$('.w', el), { opacity: .16 }, { opacity: 1, stagger: .06, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 55%', scrub: .6 } });
    });
    // parallax
    $$('[data-parallax]').forEach(function (f) {
      G.fromTo(f, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: f.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    var bl = $('.cs-lead--bleed');
    if (bl) {
      G.to($('.cs-lead__fig', bl), { yPercent: 16, ease: 'none', scrollTrigger: { trigger: bl, start: 'top top', end: 'bottom top', scrub: true } });
      G.to($('.cs-lead__t', bl), { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: bl, start: 'top top', end: '75% top', scrub: true } });
    }
    // horizontal "Selected work" (desktop)
    var hs = $('[data-hs]');
    if (hs) {
      var mm = G.matchMedia();
      mm.add('(min-width: 900px)', function () {
        h.classList.add('hs-on');
        var track = $('[data-hs-track]', hs), pin = $('[data-hs-pin]', hs), hb = $('[data-hs-bar]', hs);
        var dist = function () { return Math.max(0, track.scrollWidth - W.innerWidth); };
        var tw = G.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: {
          trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
          onUpdate: function (s) { if (hb) G.set(hb, { scaleX: s.progress }); } } });
        $$('.sel__main img', hs).forEach(function (img) {
          G.fromTo(img, { xPercent: 6, scale: 1.12 }, { xPercent: -6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.closest('.sel__item'), containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
        });
        return function () { h.classList.remove('hs-on'); };
      });
    }
    W.addEventListener('load', function () { ST.refresh(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
  }

  /* ---------- project index: cursor-following image (desktop) ---------- */
  var fl = $('[data-float]'), list = $('[data-idx]');
  if (fl && list && mqFine.matches && mqDesk.matches) {
    var fimg = fl.querySelector('img'), fw = 0, mx = 0, my = 0, on = false, tr = 0;
    var xTo = G ? G.quickTo(fl, 'x', { duration: .7, ease: 'power3' }) : function (v) { fl.style.left = v + 'px'; };
    var yTo = G ? G.quickTo(fl, 'y', { duration: .7, ease: 'power3' }) : function (v) { fl.style.top = v + 'px'; };
    var place = function () {
      fw = fl.offsetWidth;
      // keep the preview clear of the titles: right of the cursor, never left of 44% of the width
      var x = Math.max(mx + 48, tr + 40); if (x + fw > W.innerWidth - 24) x = W.innerWidth - fw - 24;
      var y = Math.min(Math.max(my - fl.offsetHeight / 2, 16), W.innerHeight - fl.offsetHeight - 16);
      xTo(x); yTo(y);
    };
    list.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; place(); });
    $$('.idx__row a', list).forEach(function (a) {
      a.addEventListener('mouseenter', function (e) {
        mx = e.clientX; my = e.clientY;
        tr = a.querySelector('.idx__t').getBoundingClientRect().right + 18;
        fimg.src = a.getAttribute('data-img');
        fimg.style.aspectRatio = a.getAttribute('data-ratio');
        if (!on && G) { G.set(fl, { x: Math.max(mx + 48, tr + 40), y: my - 120 }); }
        on = true; fl.classList.add('is-on'); place();
      });
    });
    list.addEventListener('mouseleave', function () { on = false; fl.classList.remove('is-on'); });
    W.addEventListener('scroll', function () { if (on) { on = false; fl.classList.remove('is-on'); } }, { passive: true });
    W.addEventListener('load', function () { setTimeout(function () { $$('.idx__row a', list).forEach(function (a) { var i = new Image(); i.src = a.getAttribute('data-img'); }); }, 1200); });
  }

  /* ---------- work index: filters + view ---------- */
  var ctl = $('[data-ctl]');
  if (ctl) {
    ctl.hidden = false;
    var grid = $('[data-grid]'), labels = $('.idx__labels');
    var applyF = function (f) {
      $$('[data-f]', ctl).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === f ? 'true' : 'false'); });
      $$('.idx__row, .grid__cell').forEach(function (r) { r.classList.toggle('is-out', f !== 'all' && (' ' + r.getAttribute('data-cats') + ' ').indexOf(' ' + f + ' ') < 0); });
      if (ST) ST.refresh();
    };
    var applyV = function (v) {
      $$('[data-v]', ctl).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false'); });
      if (grid) grid.hidden = v !== 'grid';
      list.hidden = v === 'grid';
      if (labels) labels.hidden = v === 'grid';
      store('pq-view', v);
      if (ST) ST.refresh();
    };
    $$('[data-f]', ctl).forEach(function (b) { b.addEventListener('click', function () { var f = b.getAttribute('data-f'); applyF(f); history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f); }); });
    $$('[data-v]', ctl).forEach(function (b) { b.addEventListener('click', function () { applyV(b.getAttribute('data-v')); }); });
    var hf = location.hash.slice(1);
    if (hf && $('[data-f="' + hf + '"]', ctl)) applyF(hf);
    if (store('pq-view') === 'grid') applyV('grid');
  }

  /* ---------- lightbox ---------- */
  var dlg = $('[data-lb-dialog]');
  if (dlg && typeof dlg.showModal === 'function') {
    var items = $$('[data-lb]'), li = 0, limg = $('[data-lb-img]', dlg), lcap = $('[data-lb-cap]', dlg), lcnt = $('[data-lb-count]', dlg);
    var show = function (i) {
      li = (i + items.length) % items.length;
      var a = items[li], im = a.querySelector('img');
      limg.removeAttribute('src');
      limg.width = +a.getAttribute('data-w'); limg.height = +a.getAttribute('data-h');
      limg.src = a.getAttribute('data-full');
      limg.alt = im ? im.alt : '';
      lcap.textContent = a.getAttribute('data-cap');
      lcnt.textContent = (li + 1) + ' / ' + items.length;
      if (anim) G.fromTo(limg, { opacity: 0, scale: .98 }, { opacity: 1, scale: 1, duration: .6, ease: 'expo.out' });
    };
    items.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); show(i); dlg.showModal(); if (lenis) lenis.stop(); }); });
    $('[data-lb-prev]', dlg).addEventListener('click', function () { show(li - 1); });
    $('[data-lb-next]', dlg).addEventListener('click', function () { show(li + 1); });
    $('[data-lb-close]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(li + 1); if (e.key === 'ArrowLeft') show(li - 1); });
    dlg.addEventListener('close', function () { if (lenis) lenis.start(); if (items[li]) items[li].focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb__fig')) dlg.close(); });
    var tx = null;
    dlg.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(li + (dx < 0 ? 1 : -1)); tx = null; });
  }

  /* ---------- enquiry form ---------- */
  var form = $('[data-form]');
  if (form) {
    var note = $('[data-form-note]', form), noteHTML = note.innerHTML;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      $$('[required]', form).forEach(function (el) { var ok = el.value.trim() !== ''; el.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok && !bad) bad = el; });
      var em = form.elements.email;
      if (em && em.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)) { em.setAttribute('aria-invalid', 'true'); bad = bad || em; }
      if (bad) { note.textContent = 'Please add your name and a few words about the project.'; note.setAttribute('role', 'alert'); bad.focus(); return; }
      var v = function (n) { return form.elements[n] ? form.elements[n].value.trim() : ''; };
      if (form.getAttribute('data-mode') === 'web3forms') {
        note.textContent = 'Sending…';
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j && j.success) { form.reset(); note.textContent = 'Thank you. The studio will get back to you shortly.'; } else throw 0; })
          .catch(function () { note.innerHTML = 'Sorry, that did not go through. ' + noteHTML; });
      } else {
        var body = 'Name: ' + v('name') + '\nPhone: ' + v('phone') + '\nEmail: ' + v('email') + '\nProject: ' + v('project') + '\n\n' + v('message');
        location.href = 'mailto:' + form.getAttribute('data-email') + '?subject=' + encodeURIComponent('Project enquiry from ' + v('name')) + '&body=' + encodeURIComponent(body);
        note.innerHTML = 'Your email app should open with the message ready. ' + noteHTML;
      }
    });
  }
})();
