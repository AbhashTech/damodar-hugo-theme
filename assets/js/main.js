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
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      try {
        if (!localStorage.getItem('theme')) {
          root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
          paint();
        }
      } catch (err) {}
    });
  } catch (e) {}

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

  /* read progress: measures reading through the article up to 100% */
  var wrap = document.getElementById('progress');
  var bar = document.getElementById('progress-bar');
  var pct = document.getElementById('progress-pct');
  function progress() {
    if (!wrap) return;
    var article = document.getElementById('post-body') || document.querySelector('article.post');
    var p = 0;
    if (article) {
      var rect = article.getBoundingClientRect();
      var articleTop = window.scrollY + rect.top;
      var articleHeight = article.offsetHeight;
      var scrollable = articleTop + articleHeight - window.innerHeight;
      if (scrollable <= 10) {
        wrap.hidden = true;
        return;
      }
      wrap.hidden = false;
      if (window.scrollY <= 10) {
        p = 0;
      } else if (window.scrollY >= scrollable) {
        p = 100;
      } else {
        p = Math.round((window.scrollY / scrollable) * 100);
      }
    } else {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 4) { wrap.hidden = true; return; }
      wrap.hidden = false;
      p = window.scrollY <= 10 ? 0 : Math.round((window.scrollY / max) * 100);
    }

    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 30) {
      p = 100;
    }

    p = Math.max(0, Math.min(100, p));
    bar.style.setProperty('--p', p + '%');
    pct.textContent = p + '%';
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('#TableOfContents a'));
  var heads = links.map(function (a) {
    return document.getElementById(decodeURIComponent(a.hash.slice(1)));
  }).filter(Boolean);

  function setActiveHeading(idx) {
    links.forEach(function (a, i) { a.classList.toggle('active', i === idx); });
    /* expand only the branch the reader is currently in */
    var open = [];
    if (idx >= 0 && links[idx]) {
      for (var li = links[idx].closest('li'); li; li = li.parentElement && li.parentElement.closest('li')) open.push(li);
    }
    document.querySelectorAll('#TableOfContents li').forEach(function (li) {
      li.classList.toggle('open', open.indexOf(li) !== -1);
    });
  }

  function getActiveIndex() {
    var isBottom = (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 50);
    var article = document.getElementById('post-body') || document.querySelector('article.post');
    if (article) {
      var rect = article.getBoundingClientRect();
      var articleTop = window.scrollY + rect.top;
      var articleHeight = article.offsetHeight;
      if (window.scrollY >= articleTop + articleHeight - window.innerHeight - 30) {
        isBottom = true;
      }
    }
    if (isBottom && heads.length > 0) {
      for (var j = heads.length - 1; j >= 0; j--) {
        if (heads[j] && heads[j].getBoundingClientRect().top <= window.innerHeight) {
          return j;
        }
      }
    }

    var idx = -1;
    var threshold = Math.min(220, window.innerHeight * 0.35);
    for (var i = 0; i < heads.length; i++) {
      if (heads[i] && heads[i].getBoundingClientRect().top <= threshold) idx = i;
    }
    return idx;
  }

  // IntersectionObserver for modern heading observation
  if ('IntersectionObserver' in window && heads.length > 0) {
    var observer = new IntersectionObserver(function () {
      var idx = getActiveIndex();
      if (idx >= 0) setActiveHeading(idx);
    }, {
      rootMargin: '0px 0px -65% 0px',
      threshold: [0, 1]
    });
    heads.forEach(function (h) { observer.observe(h); });
  }

  function spy() {
    var idx = getActiveIndex();
    if (idx >= 0) setActiveHeading(idx);
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

  /* Support for GitHub-style markdown alerts in blockquotes */
  function initAlerts() {
    var bqs = document.querySelectorAll('.prose blockquote');
    var alertTypes = {
      note: { label: 'Note', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' },
      tip: { label: 'Tip', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>' },
      important: { label: 'Important', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
      warning: { label: 'Warning', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
      caution: { label: 'Caution', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' }
    };

    bqs.forEach(function (bq) {
      var p = bq.querySelector('p:first-child');
      if (!p) return;
      var match = p.innerHTML.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*<br\s*\/?>)?\s*(.*)$/is);
      if (match) {
        var type = match[1].toLowerCase();
        var conf = alertTypes[type] || alertTypes.note;
        bq.classList.add('callout', 'callout-' + type);
        var remainingHtml = match[2];
        p.innerHTML = remainingHtml;
        var header = document.createElement('div');
        header.className = 'callout-header';
        header.innerHTML = '<span class="callout-icon">' + conf.icon + '</span><strong class="callout-title">' + conf.label + '</strong>';
        bq.insertBefore(header, bq.firstChild);
      }
    });
  }
  initAlerts();
})();

