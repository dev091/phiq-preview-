
(function () {
  "use strict";
  window.PHIQ = 1;
  var d = document, html = d.documentElement;
  var motion = html.classList.contains("motion");
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };

  var header = $(".site-header"), hero = $(".hero");
  if (header) {
    var overlay = header.classList.contains("site-header--overlay"), lastY = window.scrollY, ticking = false;
    var update = function () {
      var y = window.scrollY, limit = hero ? hero.offsetHeight - header.offsetHeight - 8 : 8;
      if (overlay) header.classList.toggle("is-solid", y > limit);
      if (!html.classList.contains("menu-open")) {
        if (y > 320 && y > lastY + 4) header.classList.add("is-hidden");
        else if (y < lastY - 4 || y < 320) header.classList.remove("is-hidden");
      }
      lastY = y; ticking = false;
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
    update();
  }

  var menuBtn = $(".menu-btn"), panel = $("#menu");
  if (menuBtn && panel) {
    panel.inert = true;
    var setMenu = function (open) {
      html.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
      $(".menu-label", menuBtn).textContent = open ? "Close" : "Menu";
      panel.inert = !open;
      d.body.style.overflow = open ? "hidden" : "";
      if (open) { header.classList.remove("is-hidden"); var f = $("a", panel); if (f) f.focus({ preventScroll: true }); }
    };
    menuBtn.addEventListener("click", function () { setMenu(!html.classList.contains("menu-open")); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && html.classList.contains("menu-open")) { setMenu(false); menuBtn.focus(); } });
    window.matchMedia("(min-width: 901px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  if (hero) {
    var slides = $$(".slide", hero), cap = $(".hero__caption", hero), count = $(".hero__count", hero);
    var controls = $(".hero__controls", hero), pauseBtn = $(".hero__pause", hero), bar = $(".hero__progress i", hero);
    var MS = 7000, i = 0, timer = 0, playing = false, inView = true;
    var saveData = navigator.connection && navigator.connection.saveData;
    slides[0].classList.add("is-active");
    hero.style.setProperty("--slide-ms", MS + "ms");
    var hydrate = function (s) {
      $$("[data-srcset]", s).forEach(function (el) { el.srcset = el.getAttribute("data-srcset"); el.removeAttribute("data-srcset"); });
      var img = $("img[data-src]", s); if (img) { img.src = img.getAttribute("data-src"); img.removeAttribute("data-src"); }
    };
    var restartBar = function () { if (!bar) return; bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; };
    var show = function (n) {
      var k = (n + slides.length) % slides.length, img = $("img", slides[k]);
      if (img && !img.complete) { img.addEventListener("load", function () { show(k); }, { once: true }); return; }
      var prev = slides[i];
      slides.forEach(function (s) { s.classList.remove("is-prev"); });
      prev.classList.remove("is-active"); prev.classList.add("is-prev");
      hero.classList.add("is-cycling");
      setTimeout(function () { prev.classList.remove("is-prev"); }, 2000);
      i = k; slides[i].classList.add("is-active");
      cap.textContent = slides[i].getAttribute("data-caption"); cap.href = slides[i].getAttribute("data-href");
      count.textContent = pad(i + 1) + " / " + pad(slides.length);
      restartBar(); schedule();
    };
    var schedule = function () {
      clearTimeout(timer);
      if (playing && inView && !d.hidden) timer = setTimeout(function () { show(i + 1); }, MS);
    };
    var setPlaying = function (p) {
      playing = p; hero.classList.toggle("is-playing", p);
      pauseBtn.setAttribute("aria-label", p ? "Pause slideshow" : "Play slideshow");
      pauseBtn.innerHTML = p ? '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1h3v12H3zM8 1h3v12H8z" fill="currentColor"/></svg>'
                             : '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1l10 6-10 6z" fill="currentColor"/></svg>';
      restartBar(); schedule();
    };
    var video = $(".hero__video", hero);
    if (video && motion && !saveData) {

      var startVideo = function () {
        $$("source[data-src]", video).forEach(function (el) { el.src = el.getAttribute("data-src"); });
        video.load();
        video.addEventListener("playing", function () { hero.classList.add("has-video"); }, { once: true });
        var pr = video.play(); if (pr && pr.catch) pr.catch(function () {});
        controls.hidden = false; count.hidden = true; if (bar) bar.parentNode.hidden = true;
        pauseBtn.setAttribute("aria-label", "Pause video");
        pauseBtn.innerHTML = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1h3v12H3zM8 1h3v12H8z" fill="currentColor"/></svg>';
        pauseBtn.addEventListener("click", function () {
          var p = video.paused; if (p) { var q = video.play(); if (q && q.catch) q.catch(function () {}); } else video.pause();
          pauseBtn.setAttribute("aria-label", p ? "Pause video" : "Play video");
          pauseBtn.innerHTML = p ? '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1h3v12H3zM8 1h3v12H8z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1l10 6-10 6z" fill="currentColor"/></svg>';
        });
        if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { if (!es[0].isIntersecting) video.pause(); else if (pauseBtn.getAttribute("aria-label") === "Pause video") { var q = video.play(); if (q && q.catch) q.catch(function () {}); } }).observe(hero);
      };
      if (d.readyState === "complete") setTimeout(startVideo, 600); else window.addEventListener("load", function () { setTimeout(startVideo, 600); });
    } else if (slides.length > 1 && motion && !saveData) {
      var start = function () {
        slides.slice(1).forEach(hydrate);
        controls.hidden = false; setPlaying(true);
      };
      if (d.readyState === "complete") setTimeout(start, 1200); else window.addEventListener("load", function () { setTimeout(start, 1200); });
      pauseBtn.addEventListener("click", function () { setPlaying(!playing); });
      d.addEventListener("visibilitychange", schedule);
      if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; schedule(); }).observe(hero);
    }
  }

  var revealEls = $$("[data-reveal]");
  if (motion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.01 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else revealEls.forEach(function (el) { el.classList.add("is-in"); });

  var filters = $(".filters");
  if (filters) {
    var buttons = $$("[data-filter]", filters), cards = $$(".index-grid .card"), status = $(".index-count");
    filters.hidden = false;
    var apply = function (f, write) {
      var n = 0;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-filter") === f)); });
      cards.forEach(function (c) {
        var on = f === "all" || (" " + c.getAttribute("data-cats") + " ").indexOf(" " + f + " ") > -1;
        if (on && c.hidden) { c.hidden = false; c.classList.remove("is-entering"); void c.offsetWidth; c.classList.add("is-entering"); }
        else if (!on) c.hidden = true;
        if (on) n++;
      });
      if (status) status.textContent = n + (n === 1 ? " project" : " projects");
      if (write) history.replaceState(null, "", f === "all" ? location.pathname : "#" + f);
    };
    filters.addEventListener("click", function (e) { var b = e.target.closest("[data-filter]"); if (b) apply(b.getAttribute("data-filter"), true); });
    var h = location.hash.slice(1);
    if (h && buttons.some(function (b) { return b.getAttribute("data-filter") === h; })) apply(h, false);
  }

  var gallery = $("[data-gallery]");
  if (gallery && typeof HTMLDialogElement === "function") {
    var items = $$("a[data-lb]", gallery), idx = 0;
    var ico = function (p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="' + p + '"/></svg>'; };
    var dlg = d.createElement("dialog");
    dlg.className = "lb"; dlg.setAttribute("aria-label", "Image viewer");
    dlg.innerHTML = '<div class="lb__top"><span class="lb__count" aria-live="polite"></span>' +
      '<button class="lb__btn lb__close" type="button" aria-label="Close viewer">' + ico("M5 5l14 14M19 5L5 19") + "</button></div>" +
      '<div class="lb__stage"><picture><source type="image/avif"><source type="image/webp"><img alt="" decoding="async"></picture>' +
      '<button class="lb__btn lb__prev" type="button" aria-label="Previous image">' + ico("M15 5l-7 7 7 7") + "</button>" +
      '<button class="lb__btn lb__next" type="button" aria-label="Next image">' + ico("M9 5l7 7-7 7") + "</button></div>" +
      '<div class="lb__bottom"><p class="lb__caption"></p></div>';
    d.body.appendChild(dlg);
    var stage = $(".lb__stage", dlg), srcs = $$("source", dlg), img = $("img", dlg);
    var sizesFor = function (a) {
      var r = (+a.getAttribute("data-w")) / (+a.getAttribute("data-h"));
      var w = Math.min(window.innerWidth - 16, (window.innerHeight - 150) * r);
      return Math.max(320, Math.round(w)) + "px";
    };
    var preload = function (k) {
      var a = items[(k + items.length) % items.length], p = new Image();
      p.sizes = sizesFor(a); p.srcset = a.getAttribute("data-jpg");
    };
    var render = function () {
      var a = items[idx], thumb = $("img", a);
      img.classList.add("is-loading");
      srcs[0].srcset = a.getAttribute("data-avif"); srcs[1].srcset = a.getAttribute("data-webp");
      srcs.forEach(function (s) { s.sizes = sizesFor(a); });
      img.sizes = sizesFor(a); img.srcset = a.getAttribute("data-jpg"); img.src = a.href;
      img.width = +a.getAttribute("data-w"); img.height = +a.getAttribute("data-h");
      img.alt = thumb ? thumb.alt : "";
      $(".lb__count", dlg).textContent = pad(idx + 1) + " / " + pad(items.length);
      $(".lb__caption", dlg).textContent = a.getAttribute("data-caption") || "";
      if (items.length > 1) { preload(idx + 1); preload(idx - 1); }
    };
    img.addEventListener("load", function () { img.classList.remove("is-loading"); });
    var go = function (step) { idx = (idx + step + items.length) % items.length; render(); };
    if (items.length < 2) { $(".lb__prev", dlg).hidden = true; $(".lb__next", dlg).hidden = true; }
    items.forEach(function (a, k) {
      a.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault(); idx = k; render(); dlg.showModal(); d.body.classList.add("lb-open");
      });
    });
    $(".lb__close", dlg).addEventListener("click", function () { dlg.close(); });
    $(".lb__prev", dlg).addEventListener("click", function () { go(-1); });
    $(".lb__next", dlg).addEventListener("click", function () { go(1); });
    dlg.addEventListener("close", function () { d.body.classList.remove("lb-open"); items[idx].focus({ preventScroll: false }); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });
    stage.addEventListener("click", function (e) { if (e.target === stage) dlg.close(); });
    var x0 = null, y0 = 0;
    stage.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") { x0 = e.clientX; y0 = e.clientY; } });
    stage.addEventListener("pointermove", function (e) { if (x0 !== null) img.style.transform = "translateX(" + (e.clientX - x0) * 0.6 + "px)"; });
    var end = function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null; img.style.transform = "";
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    };
    stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
  }

  $$("form[data-enquiry]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var st = $(".form__status", f), btn = $("button[type=submit]", f), fd = new FormData(f);
      if (fd.get("botcheck")) return;
      var v = function (k) { return String(fd.get(k) || "").trim(); };
      var body = "Name: " + v("name") + "\nPhone: " + v("phone") + (v("email") ? "\nEmail: " + v("email") : "") +
        "\nProject: " + v("project_type") + (v("location") ? "\nSite / location: " + v("location") : "") + "\n\n" + v("message");
      var mail = f.getAttribute("data-mailto"), wa = f.getAttribute("data-wa");
      var mailto = "mailto:" + mail + "?subject=" + encodeURIComponent("Project enquiry from " + v("name")) + "&body=" + encodeURIComponent(body);
      var waLink = "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hello phi-Q Architects,\n\n" + body);
      var fallback = function (lead) {
        st.classList.remove("is-ok");
        st.innerHTML = lead + ' You can also <a href="' + waLink + '" target="_blank" rel="noopener">send it on WhatsApp</a> or email <a href="mailto:' + mail + '">' + mail + "</a>.";
      };
      var key = f.getAttribute("data-key");
      if (!key) { window.location.href = mailto; fallback("Your email app should open with the message ready to send."); return; }
      btn.disabled = true; st.classList.remove("is-ok"); st.textContent = "Sending…";
      var payload = {}; fd.forEach(function (val, k) { payload[k] = val; }); payload.access_key = key;
      fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.success) throw new Error(j.message || "failed");
          f.reset(); st.classList.add("is-ok"); st.textContent = "Thank you. Your enquiry has been sent to phi-Q Architects.";
        })
        .catch(function () { fallback("Sorry, the message could not be sent from this page."); })
        .then(function () { btn.disabled = false; });
    });
  });
})();
