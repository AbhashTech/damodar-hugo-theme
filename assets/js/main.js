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

  /* Code copy button and language badge */
  function initCodeCopy() {
    var codeBlocks = document.querySelectorAll('.prose .highlight, .prose pre');
    codeBlocks.forEach(function (block) {
      if (block.tagName === 'PRE' && block.closest('.highlight')) return;
      if (block.querySelector('.code-header')) return;

      var code = block.querySelector('code');
      var lang = '';
      if (code) {
        var match = code.className.match(/language-([a-z0-9+#-]+)/i) || (code.dataset.lang ? ['', code.dataset.lang] : null);
        if (match) lang = match[1];
      }

      var header = document.createElement('div');
      header.className = 'code-header';

      var langEl = document.createElement('span');
      langEl.className = 'code-lang';
      langEl.textContent = lang || 'code';
      header.appendChild(langEl);

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'code-copy';
      copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span class="copy-text">Copy</span>';

      copyBtn.addEventListener('click', function () {
        var text = '';
        var codeTd = block.querySelector('td.lntd:last-child code');
        if (codeTd) {
          text = codeTd.innerText || codeTd.textContent;
        } else if (code) {
          text = code.innerText || code.textContent;
        } else {
          text = block.innerText || block.textContent;
        }
        navigator.clipboard.writeText(text.replace(/\n$/, '')).then(function () {
          copyBtn.classList.add('copied');
          var textSpan = copyBtn.querySelector('.copy-text');
          if (textSpan) textSpan.textContent = 'Copied!';
          setTimeout(function () {
            copyBtn.classList.remove('copied');
            if (textSpan) textSpan.textContent = 'Copy';
          }, 2000);
        }).catch(function () {});
      });

      header.appendChild(copyBtn);
      block.insertBefore(header, block.firstChild);
    });
  }
  initCodeCopy();
})();

