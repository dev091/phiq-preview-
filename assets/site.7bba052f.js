/* phi-Q Architects v3. Progressive enhancement: every page is complete without this file.
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
    var lbl = $('[data-cl]', cur), t = a.querySelector('.idx__t, .feat__t, .prop__t, .cs-next__t');
    var name = (a.getAttribute('data-label') || (t ? t.textContent : a.textContent) || '').replace(/\s+/g, ' ').replace(/^\d{2}\s*/, '').trim();
    if (!name || name.length > 60 || /^home$/i.test(name)) name = 'phi-Q Architects';
    if (lbl) lbl.textContent = name;
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

  /* ---------- header + phone action bar ---------- */
  var hd = $('[data-hd]'), mbar = $('[data-mbar]');
  var lead = $('[data-hero]') || $('[data-lead]');
  var endEls = [$('[data-cb]'), $('[data-ft]')].filter(Boolean);
  var lastY = W.scrollY, menuOpen = false;
  function onScroll() {
    var y = W.scrollY, vh = W.innerHeight;
    var lim = lead ? lead.offsetHeight - 90 : 10;
    if (hd) {
      hd.classList.toggle('is-solid', y > lim);
      hd.classList.toggle('is-hidden', !menuOpen && y > lastY + 2 && y > 320);
      if (y < lastY - 2) hd.classList.remove('is-hidden');
    }
    if (mbar) {
      var after = lead ? (lead.getBoundingClientRect().bottom < vh * 0.35) : (y > vh * 0.5);
      var nearEnd = endEls.some(function (el) { return el.getBoundingClientRect().top < vh - 40; });
      // only on an upward scroll, so it never sits over what is being read; never over the opening or the contact block
      if (y > lastY + 2) mbar.classList.remove('is-on');
      else if (y < lastY - 2 && after && !nearEnd && !menuOpen) mbar.classList.add('is-on');
      if (!after || nearEnd || menuOpen) mbar.classList.remove('is-on');
    }
    lastY = y;
  }
  W.addEventListener('scroll', onScroll, { passive: true });
  W.addEventListener('resize', onScroll);
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
    } else {
      menu.classList.remove('is-open');
      d.body.style.overflow = '';
      if (lenis) lenis.start();
      setTimeout(function () { if (!menuOpen) menu.hidden = true; }, motion ? 700 : 0);
    }
    onScroll();
  }
  if (mb) mb.addEventListener('click', function () { setMenu(!menuOpen); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { setMenu(false); mb.focus(); } });
  if (mqDesk.addEventListener) mqDesk.addEventListener('change', function () { if (menuOpen) setMenu(false); });

  /* ---------- hero film (muted loop from their photographs; never for reduced motion or data saver) ---------- */
  var hero = $('[data-hero]'), film = hero && $('.hero__film', hero);
  if (hero && film && motion && !(navigator.connection && navigator.connection.saveData)) {
    var caps = [];
    try { caps = JSON.parse(hero.getAttribute('data-caps')) || []; } catch (x) {}
    var capA = $('[data-cap]', hero), capT = $('[data-capt]', hero), cnt = $('[data-count]', hero), bar = $('[data-bar]', hero), pause = $('[data-pause]', hero);
    var shown = 0, userPaused = false, inView = true;
    var setCap = function (i) {
      if (i === shown || !caps[i]) return;
      shown = i;
      if (capA) capA.href = caps[i].u;
      if (cnt) cnt.textContent = ('0' + (i + 1)).slice(-2);
      if (!capT) return;
      if (G) {
        G.to(capT, { yPercent: -110, opacity: 0, duration: .4, ease: 'power3.in', onComplete: function () {
          capT.textContent = caps[i].t;
          G.fromTo(capT, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .8, ease: 'expo.out' });
        } });
      } else capT.textContent = caps[i].t;
    };
    var sync = function () { if (userPaused || !inView || d.hidden) film.pause(); else { var pr = film.play(); if (pr && pr.catch) pr.catch(function () {}); } };
    var start = function () {
      var port = W.innerWidth / W.innerHeight < 0.8;
      [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(function (t) {
        var s = d.createElement('source');
        s.src = film.getAttribute('data-' + t[0] + (port ? 'p' : '')); s.type = t[1];
        film.appendChild(s);
      });
      film.preload = 'auto';
      film.load();
      film.addEventListener('playing', function () { film.classList.add('is-playing'); if (pause) pause.hidden = false; }, { once: true });
      film.addEventListener('timeupdate', function () {
        var t = film.currentTime, D = film.duration || 12.75;
        if (bar) bar.style.transform = 'scaleX(' + Math.min(1, t / D) + ')';
        setCap(Math.floor((t + 0.375) / 3) % caps.length);
      });
      sync();
    };
    if (d.readyState === 'complete') setTimeout(start, 300); else W.addEventListener('load', function () { setTimeout(start, 300); });
    if (pause) pause.addEventListener('click', function () { userPaused = !userPaused; pause.textContent = userPaused ? 'Play film' : 'Pause film'; pause.setAttribute('aria-pressed', userPaused ? 'true' : 'false'); sync(); });
    if ('IntersectionObserver' in W) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; if (film.currentSrc) sync(); }).observe(hero);
    d.addEventListener('visibilitychange', function () { if (film.currentSrc) sync(); });
  }

  /* ---------- scroll choreography ---------- */
  if (anim) {
    var vh = W.innerHeight;
    var below = function (el) { return el.getBoundingClientRect().top > vh * 0.92; };
    $$('.g__mask').forEach(function (m) {
      if (!below(m) || m.closest('.wk__pv')) return;
      var img = m.querySelector('img');
      G.set(m, { clipPath: 'inset(100% 0% 0% 0%)' }); if (img) G.set(img, { scale: 1.18 });
      ST.create({ trigger: m, start: 'top 92%', once: true, onEnter: function () {
        G.to(m, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out' });
        if (img) G.to(img, { scale: 1, duration: 2, ease: 'expo.out', clearProps: 'transform' });
      } });
    });
    var ups = $$('.rv-up, .idx__row, .prop__card, .ct__blk, .sec-head, .cs-info > *, .feat__cap, .wk__head, .stmt > *').filter(below);
    if (ups.length) {
      G.set(ups, { opacity: 0, y: 40 });
      ST.batch(ups, { start: 'top 94%', once: true, onEnter: function (b) { G.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: .07, clearProps: 'transform' }); } });
    }
    if (hero) {
      G.to($('.hero__media', hero), { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      G.to($('.hero__copy', hero), { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '70% top', scrub: true } });
    }
    var bl = $('.cs-lead--bleed');
    if (bl) {
      G.to($('.cs-lead__fig', bl), { yPercent: 14, ease: 'none', scrollTrigger: { trigger: bl, start: 'top top', end: 'bottom top', scrub: true } });
      G.to($('.cs-lead__t', bl), { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: bl, start: 'top top', end: '75% top', scrub: true } });
    }
    W.addEventListener('load', function () { ST.refresh(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
  }

  /* ---------- work: preview column (desktop) ---------- */
  var pv = $('[data-pv]'), list = $('[data-idx]');
  if (pv && list) {
    var pimg = $('[data-pv-img]'), pcap = $('[data-pv-cap]'), pcur = null, tm = null;
    var show = function (a) {
      if (a === pcur) return; pcur = a;
      clearTimeout(tm);
      pv.classList.add('is-swap');
      tm = setTimeout(function () {
        var n = new Image(); n.src = a.getAttribute('data-img');
        var go = function () { pimg.src = n.src; if (pcap) pcap.textContent = a.getAttribute('data-cap'); pv.classList.remove('is-swap'); };
        if (n.complete) go(); else { n.onload = go; n.onerror = go; }
      }, motion ? 180 : 0);
    };
    $$('.idx__row a', list).forEach(function (a) { a.addEventListener('mouseenter', function () { show(a); }); a.addEventListener('focus', function () { show(a); }); });
    W.addEventListener('load', function () { setTimeout(function () { $$('.idx__row a', list).forEach(function (a) { var i = new Image(); i.src = a.getAttribute('data-img'); }); }, 1200); });
  }

  /* ---------- work: sector filters (both groups) ---------- */
  var ctl = $('[data-ctl]');
  if (ctl) {
    ctl.hidden = false;
    var applyF = function (f) {
      $$('[data-f]', ctl).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-f') === f ? 'true' : 'false'); });
      $$('.idx__row, .prop__card').forEach(function (r) { r.classList.toggle('is-out', f !== 'all' && (' ' + r.getAttribute('data-cats') + ' ').indexOf(' ' + f + ' ') < 0); });
      $$('[data-group]').forEach(function (g) { g.hidden = !$$('.idx__row:not(.is-out), .prop__card:not(.is-out)', g).length; });
      var firstRow = $('.idx__row:not(.is-out) a');
      if (firstRow && pv) firstRow.dispatchEvent(new Event('focus'));
      if (ST) ST.refresh();
    };
    $$('[data-f]', ctl).forEach(function (b) { b.addEventListener('click', function () { var f = b.getAttribute('data-f'); applyF(f); history.replaceState(null, '', f === 'all' ? location.pathname : '#' + f); }); });
    var hf = location.hash.slice(1);
    if (hf && $('[data-f="' + hf + '"]', ctl)) applyF(hf);
  }

  /* ---------- lightbox ---------- */
  var dlg = $('[data-lb-dialog]');
  if (dlg && typeof dlg.showModal === 'function') {
    var items = $$('[data-lb]'), li = 0, limg = $('[data-lb-img]', dlg), lcap = $('[data-lb-cap]', dlg), lcnt = $('[data-lb-count]', dlg);
    var showLb = function (i) {
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
    items.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); showLb(i); dlg.showModal(); if (lenis) lenis.stop(); }); });
    $('[data-lb-prev]', dlg).addEventListener('click', function () { showLb(li - 1); });
    $('[data-lb-next]', dlg).addEventListener('click', function () { showLb(li + 1); });
    $('[data-lb-close]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') showLb(li + 1); if (e.key === 'ArrowLeft') showLb(li - 1); });
    dlg.addEventListener('close', function () { if (lenis) lenis.start(); if (items[li]) items[li].focus(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb__fig')) dlg.close(); });
    var tx = null;
    dlg.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) showLb(li + (dx < 0 ? 1 : -1)); tx = null; });
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
