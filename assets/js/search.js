(function () {
  var modal = document.getElementById('search-modal');
  if (!modal) return;

  var backdrop = document.getElementById('search-backdrop');
  var input = document.getElementById('search-input');
  var closeBtn = document.getElementById('search-close');
  var resultsList = document.getElementById('search-results');
  var emptyState = document.getElementById('search-empty');
  var errorState = document.getElementById('search-error');
  var initialState = document.getElementById('search-initial');
  var queryText = document.getElementById('search-query-text');

  var indexData = null;
  var isLoading = false;
  var loadFailed = false;
  var activeIndex = -1;
  var previousActiveElement = null;
  var pendingCallbacks = [];

  var pagefindInstance = null;
  var pagefindChecked = false;

  async function getPagefind() {
    if (pagefindChecked) return pagefindInstance;
    pagefindChecked = true;
    var pfPath = modal.getAttribute('data-pagefind-path') || '/pagefind/pagefind.js';
    try {
      var pf = await import(pfPath);
      if (pf && typeof pf.search === 'function') {
        if (typeof pf.init === 'function') await pf.init();
        pagefindInstance = pf;
        return pagefindInstance;
      }
    } catch (e) {
      pagefindInstance = null;
    }
    return null;
  }

  function loadIndex(callback) {
    if (indexData) {
      if (callback) callback(null, indexData);
      return;
    }
    if (loadFailed) {
      if (callback) callback(new Error('Index failed to load'), []);
      return;
    }

    if (callback) pendingCallbacks.push(callback);
    if (isLoading) return;
    isLoading = true;

    var primaryUrl = modal.getAttribute('data-index') || '/index.json';

    function flushCallbacks(err, data) {
      isLoading = false;
      var queue = pendingCallbacks.slice();
      pendingCallbacks = [];
      queue.forEach(function (cb) {
        try { cb(err, data); } catch (e) { console.error(e); }
      });
    }

    function doFetch(targetUrl, isFallback) {
      fetch(targetUrl)
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          indexData = Array.isArray(data) ? data : [];
          loadFailed = false;
          flushCallbacks(null, indexData);
        })
        .catch(function (err) {
          if (!isFallback && targetUrl.startsWith('/')) {
            var relUrl = targetUrl.replace(/^\/+/, '');
            doFetch(relUrl, true);
            return;
          }
          console.warn('Search index load error:', err);
          loadFailed = true;
          flushCallbacks(err, []);
        });
    }

    doFetch(primaryUrl, false);
  }

  function openSearch() {
    previousActiveElement = document.activeElement;
    modal.hidden = false;
    document.body.classList.add('search-open');
    if (errorState) errorState.hidden = true;

    // Check for Pagefind or preload fallback index
    getPagefind().then(function (pf) {
      if (!pf) loadIndex();
      if (!modal.hidden && input.value.trim()) {
        executeSearch(input.value);
      }
    });

    setTimeout(function () {
      input.focus();
      input.select();
    }, 50);
  }

  function closeSearch() {
    modal.hidden = true;
    document.body.classList.remove('search-open');
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
  }

  // Bind all search trigger elements across the page
  document.querySelectorAll('#search-trigger, .search-trigger, [data-search-trigger]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openSearch();
    });
    btn.addEventListener('mouseenter', function () {
      getPagefind().then(function (pf) {
        if (!pf) loadIndex();
      });
    }, { once: true });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
  if (backdrop) backdrop.addEventListener('click', closeSearch);

  // Global keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modal.hidden) openSearch();
      else closeSearch();
      return;
    }
    if (e.key === '/' && modal.hidden) {
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      var editable = document.activeElement && document.activeElement.isContentEditable;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !editable) {
        e.preventDefault();
        openSearch();
        return;
      }
    }
    if (e.key === 'Escape' && !modal.hidden) {
      e.preventDefault();
      closeSearch();
    }
  });

  function escapeHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightMatches(text, tokens) {
    var safeText = escapeHtml(text);
    if (!tokens || tokens.length === 0) return safeText;
    var regex = new RegExp('(' + tokens.map(function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|') + ')', 'gi');
    return safeText.replace(regex, '<mark class="search-hl">$1</mark>');
  }

  function createSnippet(content, tokens) {
    if (!content) return '';
    var lower = content.toLowerCase();
    var firstIdx = -1;
    for (var i = 0; i < tokens.length; i++) {
      var idx = lower.indexOf(tokens[i]);
      if (idx !== -1 && (firstIdx === -1 || idx < firstIdx)) {
        firstIdx = idx;
      }
    }
    var start = Math.max(0, firstIdx - 50);
    var end = Math.min(content.length, firstIdx + 110);
    if (firstIdx === -1) {
      start = 0;
      end = Math.min(content.length, 120);
    }
    var snippet = content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    return highlightMatches(snippet, tokens);
  }

  async function executeSearch(query) {
    var q = query.trim();
    if (!q) {
      resultsList.innerHTML = '';
      initialState.hidden = false;
      emptyState.hidden = true;
      if (errorState) errorState.hidden = true;
      activeIndex = -1;
      return;
    }

    initialState.hidden = true;
    if (errorState) errorState.hidden = true;
    var tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

    var pf = await getPagefind();
    if (pf) {
      try {
        var searchRes = await pf.search(q);
        if (!searchRes || !searchRes.results || searchRes.results.length === 0) {
          renderResults([], tokens, q);
          return;
        }
        var topResults = searchRes.results.slice(0, 15);
        var loaded = await Promise.all(topResults.map(function (r) { return r.data(); }));
        var formatted = loaded.map(function (d) {
          var tags = (d.filters && d.filters.tag) ? (Array.isArray(d.filters.tag) ? d.filters.tag : [d.filters.tag]) : [];
          return {
            page: {
              title: (d.meta && d.meta.title) ? d.meta.title : 'Untitled',
              permalink: d.url,
              summary: '',
              excerpt: d.excerpt,
              section: (d.meta && d.meta.section) ? d.meta.section : '',
              tags: tags
            },
            score: 100
          };
        });
        renderResults(formatted, tokens, q);
        return;
      } catch (err) {
        console.warn('Pagefind search failed, falling back to local index:', err);
      }
    }

    loadIndex(function (err, pages) {
      if (err) {
        resultsList.innerHTML = '';
        emptyState.hidden = true;
        if (errorState) {
          errorState.hidden = false;
          errorState.textContent = 'Unable to load search index (/index.json). Ensure outputs.home = ["HTML", "RSS", "JSON"] is set in hugo.toml.';
        }
        return;
      }

      var matched = [];
      for (var i = 0; i < pages.length; i++) {
        var page = pages[i];
        var title = (page.title || '').toLowerCase();
        var content = (page.content || '').toLowerCase();
        var summary = (page.summary || '').toLowerCase();
        var section = (page.section || '').toLowerCase();
        var tags = Array.isArray(page.tags) ? page.tags.join(' ').toLowerCase() : '';

        var allMatch = true;
        var score = 0;

        for (var t = 0; t < tokens.length; t++) {
          var token = tokens[t];
          var inTitle = title.indexOf(token);
          var inTags = tags.indexOf(token);
          var inSection = section.indexOf(token);
          var inContent = content.indexOf(token);
          var inSummary = summary.indexOf(token);

          if (inTitle === -1 && inTags === -1 && inSection === -1 && inContent === -1 && inSummary === -1) {
            allMatch = false;
            break;
          }

          if (inTitle !== -1) score += (inTitle === 0 ? 120 : 60);
          if (inTags !== -1) score += 40;
          if (inSection !== -1) score += 20;
          if (inSummary !== -1) score += 15;
          if (inContent !== -1) score += 8;
        }

        if (allMatch) {
          matched.push({
            page: page,
            score: score
          });
        }
      }

      matched.sort(function (a, b) { return b.score - a.score; });
      renderResults(matched.slice(0, 15), tokens, q);
    });
  }

  function renderResults(results, tokens, rawQuery) {
    resultsList.innerHTML = '';
    if (results.length === 0) {
      emptyState.hidden = false;
      if (queryText) queryText.textContent = rawQuery;
      activeIndex = -1;
      return;
    }

    emptyState.hidden = true;
    var frag = document.createDocumentFragment();

    results.forEach(function (res, idx) {
      var p = res.page;
      var li = document.createElement('li');
      li.className = 'search-item';
      li.setAttribute('role', 'option');
      li.setAttribute('id', 'search-opt-' + idx);
      if (idx === 0) {
        li.classList.add('selected');
        li.setAttribute('aria-selected', 'true');
      }

      var a = document.createElement('a');
      a.className = 'search-item-link';
      a.href = p.permalink;

      var header = document.createElement('div');
      header.className = 'search-item-header';

      var titleSpan = document.createElement('span');
      titleSpan.className = 'search-item-title';
      titleSpan.innerHTML = highlightMatches(p.title || 'Untitled', tokens);
      header.appendChild(titleSpan);

      if (p.section) {
        var sectionSpan = document.createElement('span');
        sectionSpan.className = 'search-item-section';
        sectionSpan.textContent = p.section;
        header.appendChild(sectionSpan);
      }
      a.appendChild(header);

      var snippetHtml = p.excerpt ? p.excerpt : createSnippet(p.summary || p.content || '', tokens);
      if (snippetHtml) {
        var snippetP = document.createElement('p');
        snippetP.className = 'search-item-snippet';
        snippetP.innerHTML = snippetHtml;
        a.appendChild(snippetP);
      }

      if (Array.isArray(p.tags) && p.tags.length > 0) {
        var tagsDiv = document.createElement('div');
        tagsDiv.className = 'search-item-tags';
        p.tags.slice(0, 4).forEach(function (t) {
          var tagSpan = document.createElement('span');
          tagSpan.className = 'search-tag';
          tagSpan.textContent = '#' + t;
          tagsDiv.appendChild(tagSpan);
        });
        a.appendChild(tagsDiv);
      }

      li.appendChild(a);
      frag.appendChild(li);
    });

    resultsList.appendChild(frag);
    activeIndex = 0;
  }

  function updateSelection(index) {
    var items = resultsList.querySelectorAll('.search-item');
    if (items.length === 0) return;
    items.forEach(function (item, i) {
      if (i === index) {
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
        item.removeAttribute('aria-selected');
      }
    });
    activeIndex = index;
  }

  input.addEventListener('input', function () {
    executeSearch(input.value);
  });
  input.addEventListener('search', function () {
    executeSearch(input.value);
  });
  input.addEventListener('keyup', function () {
    executeSearch(input.value);
  });

  input.addEventListener('keydown', function (e) {
    var items = resultsList.querySelectorAll('.search-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        var next = (activeIndex + 1) % items.length;
        updateSelection(next);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        var prev = (activeIndex - 1 + items.length) % items.length;
        updateSelection(prev);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items.length > 0 && activeIndex >= 0 && activeIndex < items.length) {
        var link = items[activeIndex].querySelector('a');
        if (link) window.location.href = link.href;
      }
    }
  });

  resultsList.addEventListener('mousemove', function (e) {
    var item = e.target.closest('.search-item');
    if (!item) return;
    var items = Array.prototype.slice.call(resultsList.querySelectorAll('.search-item'));
    var idx = items.indexOf(item);
    if (idx !== -1 && idx !== activeIndex) {
      updateSelection(idx);
    }
  });
})();
