(function () {
  var root = document.documentElement;

  var toggle = document.getElementById('theme-toggle');
  var label = document.getElementById('theme-label');
  function paint() {
    var dark = root.getAttribute('data-theme') === 'dark';
    if (toggle) {
      toggle.setAttribute('aria-checked', String(dark));
      toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }
  paint();
  if (toggle) toggle.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    paint();
  });

  var menuBtn = document.getElementById('menu-btn');
  var sidebar = document.getElementById('sidebar');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = sidebar.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });

  function closeMenu() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }
  if (sidebar) sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sub = btn.closest('li').querySelector(':scope > .sub');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      if (sub) sub.hidden = open;
    });
  });

  /* read progress: hidden when the page is not scrollable (already 100% on load) */
  var wrap = document.getElementById('progress');
  var bar = document.getElementById('progress-bar');
  var pct = document.getElementById('progress-pct');
  function progress() {
    if (!wrap) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 4) { wrap.hidden = true; return; }
    wrap.hidden = false;
    var p = Math.max(0, Math.min(100, Math.round(window.scrollY / max * 100)));
    bar.style.setProperty('--p', p + '%');
    pct.textContent = p + '%';
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('#TableOfContents a'));
  var heads = links.map(function (a) {
    return document.getElementById(decodeURIComponent(a.hash.slice(1)));
  });
  function spy() {
    var idx = -1;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i] && heads[i].getBoundingClientRect().top < 120) idx = i;
    }
    links.forEach(function (a, i) { a.classList.toggle('active', i === idx); });
    /* expand only the branch the reader is currently in */
    var open = [];
    if (idx >= 0) {
      for (var li = links[idx].closest('li'); li; li = li.parentElement && li.parentElement.closest('li')) open.push(li);
    }
    document.querySelectorAll('#TableOfContents li').forEach(function (li) {
      li.classList.toggle('open', open.indexOf(li) !== -1);
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { progress(); spy(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  onScroll();
})();
