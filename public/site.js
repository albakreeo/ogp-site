
(function () {
  var app = document.getElementById('app');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* language */
  function setLang(l, animate) {
    app.setAttribute('lang', l);
    app.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
    document.querySelectorAll('#f-need option').forEach(function (o) { o.textContent = o.getAttribute('data-' + l); });
    if (animate && !reduce) { app.classList.remove('swap'); void app.offsetWidth; app.classList.add('swap'); }
    try { localStorage.setItem('ogp-lang', l); } catch (e) {}
  }
  var saved = 'ar';
  try { saved = localStorage.getItem('ogp-lang') || 'ar'; } catch (e) {}
  setLang(saved === 'ar' ? 'ar' : 'en');
  document.getElementById('lang').addEventListener('click', function () { setLang(app.getAttribute('lang') === 'ar' ? 'en' : 'ar', true); });

  /* hero light that follows the cursor */
  var hero = document.getElementById('hero');
  if (hero && !reduce) {
    var tx = 0.5, ty = 0.3, cx = tx, cy = ty, t = 0, idle = true;
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width;
      ty = (e.clientY - r.top) / r.height;
      idle = false;
    });
    hero.addEventListener('pointerleave', function () { idle = true; });
    (function tick() {
      if (idle) { t += 0.005; tx = 0.5 + 0.28 * Math.sin(t); ty = 0.3 + 0.12 * Math.cos(t * 1.3); }
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      hero.style.setProperty('--x', (cx * 100).toFixed(2) + '%');
      hero.style.setProperty('--y', (cy * 100).toFixed(2) + '%');
      requestAnimationFrame(tick);
    })();
  }

  /* service cards: light under the pointer */
  document.querySelectorAll('.svc').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* clients marquee: duplicate once for a seamless loop */
  var track = document.getElementById('marquee');
  if (track && !reduce) {
    Array.prototype.slice.call(track.children).forEach(function (n) {
      var c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c);
    });
  }

  /* growth equation calculator */
  var v = document.getElementById('vis'), c = document.getElementById('conv'), a = document.getElementById('aov'), b = document.getElementById('boost');
  function fmt(n) { return Math.round(n).toLocaleString('en-US'); }
  /* revenue figure eases to its new value, so a changed lever reads as cause and effect */
  var revEl = document.getElementById('rev'), shown = 300000, raf = 0;
  function showRev(to) {
    cancelAnimationFrame(raf);
    if (reduce) { shown = to; revEl.textContent = fmt(to); return; }
    var from = shown, t0 = performance.now(), dur = 420;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      shown = from + (to - from) * e;
      revEl.textContent = fmt(shown);
      if (p < 1) raf = requestAnimationFrame(step); else shown = to;
    })(t0);
  }
  function calc() {
    var vv = +v.value, cc = +c.value, aa = +a.value;
    var base = vv * cc / 100 * aa, on = b.checked;
    document.getElementById('vOut').textContent = fmt(vv);
    document.getElementById('cOut').textContent = cc.toFixed(1) + '%';
    document.getElementById('aOut').textContent = fmt(aa);
    showRev(on ? base * 1.331 : base);
    document.getElementById('gain').hidden = !on;
    document.getElementById('was').textContent = on ? '(' + fmt(base) + ')' : '';
  }
  [v, c, a, b].forEach(function (el) { el.addEventListener('input', calc); el.addEventListener('change', calc); });
  /* screen readers hear the final figure once, not every frame of the animation */
  [v, c, a, b].forEach(function (el) {
    el.addEventListener('change', function () {
      var base = +v.value * +c.value / 100 * +a.value, on = b.checked;
      var ar = app.getAttribute('lang') === 'ar';
      document.getElementById('calc-sr').textContent = (ar ? 'الإيرادات الشهرية: ' : 'Monthly revenue: ') + fmt(on ? base * 1.331 : base) + (ar ? ' ر.س' : ' SAR');
    });
  });
  calc();

  /* lead form: sends the request to /api/lead (email) */
  var leadForm = document.getElementById('lead');
  leadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var ar = app.getAttribute('lang') === 'ar';
    var statusEl = document.getElementById('status');
    var btn = leadForm.querySelector('button[type="submit"]');
    var name = document.getElementById('f-name').value.trim(), phone = document.getElementById('f-phone').value.trim();
    if (!name || !phone) {
      statusEl.textContent = ar ? 'يرجى إدخال الاسم ورقم الجوال.' : 'Please enter your name and phone number.';
      return;
    }
    btn.disabled = true;
    statusEl.textContent = ar ? 'جارٍ الإرسال…' : 'Sending…';
    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        phone: phone,
        site: document.getElementById('f-site').value.trim(),
        need: document.getElementById('f-need').value,
        company: (leadForm.querySelector('[name="company"]') || {}).value || '',
        lang: ar ? 'ar' : 'en'
      })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok && d.ok, status: r.status }; }); })
      .then(function (res) {
        if (res.ok) {
          statusEl.textContent = ar ? 'شكراً لك! استلمنا طلبك وسنتواصل معك قريباً.' : 'Thank you! We received your request and will contact you soon.';
          /* offer to continue the conversation on WhatsApp, prefilled */
          var old = document.getElementById('wa-follow'); if (old) old.remove();
          var msg = ar
            ? 'مرحباً OGP، أرسلت طلب تحليل مجاني.\nالاسم: ' + name + '\nالجوال: ' + phone
            : 'Hello OGP, I just sent a free audit request.\nName: ' + name + '\nPhone: ' + phone;
          var wa = document.createElement('a');
          wa.id = 'wa-follow';
          wa.className = 'btn';
          wa.target = '_blank';
          wa.rel = 'noopener';
          wa.style.marginTop = '12px';
          wa.href = 'https://wa.me/966579294514?text=' + encodeURIComponent(msg);
          wa.textContent = ar ? 'تابع المحادثة عبر واتساب' : 'Continue on WhatsApp';
          statusEl.insertAdjacentElement('afterend', wa);
          leadForm.reset();
        } else if (res.status === 422) {
          statusEl.textContent = ar ? 'يرجى التحقق من الاسم ورقم الجوال.' : 'Please check your name and phone number.';
        } else {
          statusEl.textContent = ar ? 'حدث خطأ. حاول مرة أخرى أو راسلنا عبر واتساب.' : 'Something went wrong. Please try again or message us on WhatsApp.';
        }
      })
      .catch(function () {
        statusEl.textContent = ar ? 'حدث خطأ. حاول مرة أخرى أو راسلنا عبر واتساب.' : 'Something went wrong. Please try again or message us on WhatsApp.';
      })
      .then(function () { btn.disabled = false; });
  });

  /* list reveals: services, process steps, results, reasons. Content stays readable if the observer never runs. */
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.svc, .steps li, .case, .why > div');
    var seen = new Map();
    app.classList.add('js-rv');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) {
      var n = seen.get(el.parentNode) || 0;
      seen.set(el.parentNode, n + 1);
      el.style.setProperty('--i', Math.min(n, 6));
      if (!el.parentNode.classList.contains('steps')) el.classList.add('rv');
      io.observe(el);
    });
  }
})();
