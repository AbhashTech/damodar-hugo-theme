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
    var threshold = 120;
    var idx = -1;

    for (var i = 0; i < heads.length; i++) {
      if (heads[i] && heads[i].getBoundingClientRect().top <= threshold) {
        idx = i;
      }
    }

    // Only if at the absolute bottom of the entire page and the last heading couldn't scroll past the threshold
    var isAbsoluteBottom = (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 20);
    if (isAbsoluteBottom && heads.length > 0) {
      var lastIdx = heads.length - 1;
      if (heads[lastIdx] && heads[lastIdx].getBoundingClientRect().top <= window.innerHeight * 0.6) {
        idx = lastIdx;
      }
    }

    return idx;
  }

  // Instant active state on TOC link click
  links.forEach(function (link, index) {
    link.addEventListener('click', function () {
      setActiveHeading(index);
    });
  });

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
    // Delegated click handler for code copy buttons (supports render hooks & dynamic blocks)
    document.addEventListener('click', function (e) {
      var copyBtn = e.target.closest('.code-copy');
      if (!copyBtn) return;

      var wrapper = copyBtn.closest('.code-block-wrapper') || copyBtn.closest('.highlight') || copyBtn.closest('pre');
      if (!wrapper) return;

      var text = '';
      var codeTd = wrapper.querySelector('td.lntd:last-child code');
      var code = wrapper.querySelector('pre code') || wrapper.querySelector('code');
      if (codeTd) {
        text = codeTd.innerText || codeTd.textContent;
      } else if (code) {
        text = code.innerText || code.textContent;
      } else {
        var pre = wrapper.querySelector('pre') || wrapper;
        text = pre.innerText || pre.textContent;
      }

      if (!text) return;
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

    // Fallback: inject header for any pre/highlight blocks not handled by render-codeblock hook
    var codeBlocks = document.querySelectorAll('.prose .highlight, .prose pre');
    codeBlocks.forEach(function (block) {
      if (block.closest('.code-block-wrapper')) return;
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

      var meta = document.createElement('div');
      meta.className = 'code-meta';
      var langEl = document.createElement('span');
      langEl.className = 'code-lang';
      langEl.textContent = lang || 'code';
      meta.appendChild(langEl);
      header.appendChild(meta);

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'code-copy';
      copyBtn.setAttribute('aria-label', 'Copy code to clipboard');
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span class="copy-text">Copy</span>';

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
      caution: { label: 'Caution', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
      danger: { label: 'Danger', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' }
    };

    bqs.forEach(function (bq) {
      var p = bq.querySelector('p:first-child');
      if (!p) return;
      var match = p.innerHTML.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|DANGER)\](?:\s*<br\s*\/?>)?\s*(.*)$/is);
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

  /* Floating back to top button */
  function initBackToTop() {
    var btt = document.getElementById('back-to-top');
    if (!btt) return;
    function checkBtt() {
      btt.classList.toggle('visible', window.scrollY > 300);
    }
    window.addEventListener('scroll', checkBtt, { passive: true });
    checkBtt();
    btt.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  initBackToTop();

  /* Tabs component initialization */
  function initTabs() {
    var wrappers = document.querySelectorAll('.tabs-wrapper');
    wrappers.forEach(function (wrapper) {
      if (wrapper.dataset.tabsInit) return;
      wrapper.dataset.tabsInit = 'true';

      var nav = wrapper.querySelector('.tabs-nav');
      var panels = Array.prototype.slice.call(wrapper.querySelectorAll('.tabs-content > .tab-panel'));
      if (!nav || panels.length === 0) return;

      nav.innerHTML = '';
      var buttons = [];

      panels.forEach(function (panel, idx) {
        var name = panel.getAttribute('data-tab-name') || ('Tab ' + (idx + 1));
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tab-btn' + (idx === 0 ? ' active' : '');
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
        btn.textContent = name;
        buttons.push(btn);
        nav.appendChild(btn);

        panel.classList.toggle('active', idx === 0);

        btn.addEventListener('click', function () {
          selectTab(idx);
        });
      });

      function selectTab(index) {
        buttons.forEach(function (b, i) {
          var isCurrent = (i === index);
          b.classList.toggle('active', isCurrent);
          b.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
        });
        panels.forEach(function (p, i) {
          p.classList.toggle('active', i === index);
        });
      }

      nav.addEventListener('keydown', function (e) {
        var currentIdx = buttons.findIndex(function (b) { return b.classList.contains('active'); });
        if (currentIdx === -1) return;
        if (e.key === 'ArrowRight') {
          var nextIdx = (currentIdx + 1) % buttons.length;
          selectTab(nextIdx);
          buttons[nextIdx].focus();
        } else if (e.key === 'ArrowLeft') {
          var prevIdx = (currentIdx - 1 + buttons.length) % buttons.length;
          selectTab(prevIdx);
          buttons[prevIdx].focus();
        }
      });
    });
  }
  initTabs();

  /* Image Lightbox / Zoom */
  function initImageZoom() {
    var overlay = document.createElement('div');
    overlay.className = 'image-zoom-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    var zoomImg = document.createElement('img');
    zoomImg.className = 'image-zoom-img';
    zoomImg.alt = '';
    overlay.appendChild(zoomImg);
    document.body.appendChild(overlay);

    function closeZoom() {
      overlay.classList.remove('active');
      document.body.classList.remove('zoom-open');
    }

    overlay.addEventListener('click', closeZoom);
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        closeZoom();
      }
    });

    document.querySelectorAll('.prose img').forEach(function (img) {
      if (img.closest('a')) return;
      img.classList.add('zoomable');
      img.addEventListener('click', function () {
        zoomImg.src = img.currentSrc || img.src;
        zoomImg.alt = img.alt || '';
        overlay.classList.add('active');
        document.body.classList.add('zoom-open');
      });
    });
  }
  initImageZoom();

  /* Footnote Popovers */
  function initFootnotes() {
    var refs = document.querySelectorAll('.prose .footnote-ref');
    if (refs.length === 0) return;

    var popover = document.createElement('div');
    popover.className = 'footnote-popover';
    popover.setAttribute('role', 'tooltip');
    document.body.appendChild(popover);

    var activeRef = null;

    function hidePopover() {
      popover.classList.remove('visible');
      activeRef = null;
    }

    document.addEventListener('click', function (e) {
      if (!popover.contains(e.target) && (!activeRef || !activeRef.contains(e.target))) {
        hidePopover();
      }
    });

    window.addEventListener('scroll', hidePopover, { passive: true });
    window.addEventListener('resize', hidePopover);

    refs.forEach(function (ref) {
      var targetId = ref.getAttribute('href');
      if (!targetId || targetId.charAt(0) !== '#') return;
      var fnLi = document.getElementById(targetId.slice(1));
      if (!fnLi) return;

      var clone = fnLi.cloneNode(true);
      var backref = clone.querySelector('.footnote-backref');
      if (backref) backref.remove();
      var contentHtml = clone.innerHTML.trim();

      function show(e) {
        if (activeRef === ref && popover.classList.contains('visible')) {
          hidePopover();
          return;
        }
        activeRef = ref;
        popover.innerHTML = contentHtml;
        popover.classList.add('visible');

        var rect = ref.getBoundingClientRect();
        var popRect = popover.getBoundingClientRect();

        var top = rect.top - popRect.height - 8;
        var left = rect.left + (rect.width / 2) - (popRect.width / 2);

        if (top < 10) {
          top = rect.bottom + 8;
        }
        if (left < 10) left = 10;
        if (left + popRect.width > window.innerWidth - 10) {
          left = window.innerWidth - popRect.width - 10;
        }

        popover.style.top = (top + window.scrollY) + 'px';
        popover.style.left = (left + window.scrollX) + 'px';
      }

      ref.addEventListener('click', function (e) {
        e.preventDefault();
        show(e);
      });

      ref.addEventListener('mouseenter', show);
      ref.addEventListener('mouseleave', function () {
        setTimeout(function () {
          if (!popover.matches(':hover')) hidePopover();
        }, 200);
      });
    });

    popover.addEventListener('mouseleave', hidePopover);
  }
  initFootnotes();

  /* Global keyboard navigation & shortcuts modal */
  function initShortcuts() {
    var modal = document.getElementById('shortcuts-modal');
    var closeBtn = modal ? modal.querySelector('.shortcuts-modal-close') : null;

    function openModal() {
      if (!modal) return;
      if (typeof modal.showModal === 'function') {
        modal.showModal();
      } else {
        modal.setAttribute('open', '');
      }
    }

    function closeModal() {
      if (!modal) return;
      if (typeof modal.close === 'function') {
        modal.close();
      } else {
        modal.removeAttribute('open');
      }
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }

    window.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        if (modal && modal.open) closeModal(); else openModal();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        var themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.click();
      } else if (e.key === 'j' || e.key === 'J') {
        var next = document.querySelector('.pager-next');
        if (next && next.href) window.location.href = next.href;
      } else if (e.key === 'k' || e.key === 'K') {
        var prev = document.querySelector('.pager-prev');
        if (prev && prev.href) window.location.href = prev.href;
      } else if (e.key === 'h' || e.key === 'H') {
        window.location.href = '/';
      }
    });
  }
  initShortcuts();
})();

