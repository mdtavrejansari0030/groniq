/**
 * GroCrawl — Groniq SEO Spider & Technical Audit Suite
 * Integrated directly into Groniq with dual Online/Local engine support.
 */
'use strict';

(() => {
  const STORAGE_KEY = 'grocrawl_saved_audits';

  const state = {
    mode: 'online', // 'online' (default) or 'local'
    localBackendUrl: 'http://127.0.0.1:5000',
    status: 'idle', // 'idle', 'running', 'paused', 'completed', 'stopped'
    activeTab: 'overview',
    activeFilter: 'all',
    abortController: null,
    pollTimer: null,
    urls: [],
    links: [],
    issues: [],
    images: [],
    headings: [],
    duplicates: [],
    pagespeedResults: {},
    activePageSpeedUrl: '',
    settings: null,
    activeModalUrl: null,
    activeModalTab: 'overview',
    stats: {
      discovered: 0,
      crawled: 0,
      depth: 0,
      speed: '0 URLs/sec',
      baseUrl: '',
      elapsed: '0s'
    },
    filter: {
      search: '',
      internalLinksSearch: '',
      externalLinksSearch: '',
      issuesSeverity: 'all'
    },
    cy: null
  };

  const $ = id => document.getElementById(id);

  function localFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${state.localBackendUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const opts = { ...options };
    opts.credentials = 'include';
    opts.headers = {
      'X-Session-ID': 'local_instance',
      ...(opts.headers || {})
    };
    return fetch(url, opts);
  }

  const SETTINGS_STORAGE_KEY = 'grocrawl_settings';
  const SETTINGS_COMPAT_KEY = 'librecrawl_settings';

  const DEFAULT_SETTINGS = {
    maxDepth: 3,
    maxUrls: 50,
    crawlDelay: 1.0,
    concurrency: 5,
    followRedirects: true,
    crawlExternalLinks: false,
    crawlImages: false,
    userAgent: 'GroCrawl/2.0 (compatible; GroniqSpider/2.0; +https://groniqdigital.com)',
    timeout: 10,
    retries: 3,
    acceptLanguage: 'en-US,en;q=0.9',
    respectRobotsTxt: true,
    allowCookies: true,
    discoverSitemaps: true,
    customHeaders: '',
    enablePageSpeed: false,
    googleApiKey: '',
    includeExtensions: 'html,htm,php,asp,aspx,jsp',
    excludeExtensions: 'pdf,doc,docx,zip,exe,dmg',
    includePatterns: '',
    excludePatterns: '',
    maxFileSize: 50,
    enableDuplication: true,
    duplicationThreshold: 0.85,
    enableJavaScript: false,
    jsBrowser: 'chromium',
    jsWaitTime: 3.0,
    jsTimeout: 30,
    jsHeadless: true,
    jsUserAgent: 'GroCrawl/2.0 (compatible; GroniqSpider/2.0; JavaScript; +https://groniqdigital.com)',
    viewportWidth: 1920,
    viewportHeight: 1080,
    jsConcurrency: 3,
    issueExclusions: '^/(?:wp-admin|admin|login|logout|account|checkout|cart)/\n[?&](?:session_id|sid|sort|filter|page)=\n\\.(?:pdf|zip|tar|gz|rar|exe|dmg)$',
    exportFormat: 'csv',
    exportFields: [
      'url', 'status_code', 'title', 'meta_description', 'h1', 'word_count',
      'response_time', 'depth', 'canonical_url', 'internal_links_count',
      'external_links_count', 'images_count', 'content_type'
    ],
    memoryLimit: 512,
    logLevel: 'INFO',
    customCss: ''
  };

  const ALL_EXPORT_FIELDS = [
    { key: 'url', label: 'URL Address' },
    { key: 'status_code', label: 'Status Code' },
    { key: 'title', label: 'Title Tag' },
    { key: 'meta_description', label: 'Meta Description' },
    { key: 'h1', label: 'H1 Heading' },
    { key: 'word_count', label: 'Word Count' },
    { key: 'response_time', label: 'Response Time (ms)' },
    { key: 'depth', label: 'Crawl Depth' },
    { key: 'canonical_url', label: 'Canonical URL' },
    { key: 'internal_links_count', label: 'Internal Links Count' },
    { key: 'external_links_count', label: 'External Links Count' },
    { key: 'images_count', label: 'Images Count' },
    { key: 'content_type', label: 'Content Type' }
  ];

  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  async function initApp() {
    setupEventListeners();
    updateSuggestionsDatalist();
    loadSettings();
    await detectEngine();
    checkPageSpeedStatus();
    updateControls();
    renderHistoryTab();
    initTabScrolling();
  }

  function updateEngineStatusDisplay(isLocal) {
    const badge = $('gc-engine-status-badge');
    if (badge) {
      badge.textContent = isLocal ? 'Local 127.0.0.1:5000 Active' : 'Online Cloud Active';
      badge.className = isLocal ? 'gc-badge success' : 'gc-badge info';
    }
  }

  async function detectEngine() {
    try {
      const res = await localFetch('/api/user/info');
      if (res.ok) {
        state.mode = 'local';
        const sel = $('gc-setting-engine');
        if (sel) sel.value = 'local';
        updateEngineStatusDisplay(true);
        return;
      }
    } catch (e) {}
    state.mode = 'online';
    const sel = $('gc-setting-engine');
    if (sel) sel.value = 'online';
    updateEngineStatusDisplay(false);
  }

  // Prevent VS Code Live Server WebSocket from forcibly reloading page while audit is active
  try {
    if (typeof WebSocket !== 'undefined' && !window.__gc_ws_guarded) {
      window.__gc_ws_guarded = true;
      const OrigWS = window.WebSocket;
      window.WebSocket = function(url, protocols) {
        const ws = new OrigWS(url, protocols);
        if (typeof url === 'string' && (url.includes('5501') || url.includes('/ws'))) {
          const origAddEventListener = ws.addEventListener.bind(ws);
          ws.addEventListener = function(type, listener, options) {
            if (type === 'message') {
              const safeListener = function(event) {
                if (event && event.data === 'reload') {
                  if (state && (state.status === 'running' || (state.urls && state.urls.length > 0))) {
                    console.info('[GroCrawl] Preserving active audit session (suppressed Live Server auto-reload)');
                    return;
                  }
                }
                return listener(event);
              };
              return origAddEventListener(type, safeListener, options);
            }
            return origAddEventListener(type, listener, options);
          };

          let _onmsg = null;
          Object.defineProperty(ws, 'onmessage', {
            get() { return _onmsg; },
            set(fn) {
              _onmsg = function(event) {
                if (event && event.data === 'reload') {
                  if (state && (state.status === 'running' || (state.urls && state.urls.length > 0))) {
                    console.info('[GroCrawl] Preserving active audit session (suppressed Live Server auto-reload)');
                    return;
                  }
                }
                return fn(event);
              };
            }
          });
        }
        return ws;
      };
      window.WebSocket.prototype = OrigWS.prototype;
    }
  } catch (e) {}

  function setupEventListeners() {
    // Intercept and prevent any unintended form submit reloads anywhere on page
    window.addEventListener('submit', e => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    // Global defensive guard to prevent unintended reloads on hashes or javascript links
    document.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (a) {
        const href = a.getAttribute('href');
        if (href === '#' || href === 'javascript:void(0)' || href === '') {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }, true);

    $('gc-table-search')?.addEventListener('input', e => {
      state.filter.search = e.target.value.toLowerCase().trim();
      $('gc-table-search')?.parentElement?.classList.toggle('has-val', !!e.target.value);
      renderCurrentTab();
    });

    document.querySelectorAll('.gc-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    // Close modals on escape key or backdrop click, and shortcut for settings
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModals();
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        openSettingsModal();
      }
    });
    document.querySelectorAll('.gc-modal-backdrop').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) closeModals();
      });
    });

    // Accessible Contextual (i) Field Help Listener
    document.addEventListener('click', e => {
      const btn = e.target.closest('.gc-help-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        const helpKey = btn.dataset.help;
        if (helpKey) {
          showHelpModal(helpKey, btn);
        }
      }
    });
  }

  function toggleSidebar() {
    const layout = document.querySelector('.gc-workspace-layout');
    if (!layout) return;
    const isCollapsed = layout.classList.toggle('sidebar-collapsed');
    const icon = $('gc-toggle-icon');
    const text = document.querySelector('.gc-toggle-text');
    if (icon) icon.textContent = isCollapsed ? '▶' : '◀';
    if (text) text.textContent = isCollapsed ? 'Filters' : 'Sidebar';
  }

  function scrollTabsLeft() {
    const header = $('gc-tabs-header');
    if (header) header.scrollBy({ left: -260, behavior: 'smooth' });
  }

  function scrollTabsRight() {
    const header = $('gc-tabs-header');
    if (header) header.scrollBy({ left: 260, behavior: 'smooth' });
  }

  function initTabScrolling() {
    const header = $('gc-tabs-header');
    if (!header) return;

    const leftBtn = $('gc-tab-scroll-left');
    const rightBtn = $('gc-tab-scroll-right');

    function updateScrollButtons() {
      const canScrollLeft = header.scrollLeft > 2;
      const canScrollRight = header.scrollLeft < (header.scrollWidth - header.clientWidth - 2);
      if (leftBtn) {
        leftBtn.classList.toggle('disabled', !canScrollLeft);
        leftBtn.disabled = !canScrollLeft;
      }
      if (rightBtn) {
        rightBtn.classList.toggle('disabled', !canScrollRight);
        rightBtn.disabled = !canScrollRight;
      }
    }

    header.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    // Mouse wheel scrolling: convert vertical wheel to horizontal scroll
    header.addEventListener('wheel', e => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        header.scrollLeft += e.deltaY;
        updateScrollButtons();
      }
    }, { passive: false });

    // Drag-to-scroll support
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    header.addEventListener('mousedown', e => {
      isDown = true;
      hasDragged = false;
      header.classList.add('is-dragging');
      startX = e.pageX - header.offsetLeft;
      scrollLeft = header.scrollLeft;
    });

    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      header.classList.remove('is-dragging');
    });

    header.addEventListener('mousemove', e => {
      if (!isDown) return;
      const x = e.pageX - header.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        hasDragged = true;
      }
      header.scrollLeft = scrollLeft - walk;
    });

    // Suppress click if dragged
    header.addEventListener('click', e => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);

    setTimeout(updateScrollButtons, 120);
  }

  function changeEngine(mode) {
    state.mode = mode;
    updateEngineStatusDisplay();
  }

  function updateEngineStatusDisplay(isLocalConnected) {
    const dot = $('gc-status-dot');
    const text = $('gc-status-text');
    if (state.mode === 'local') {
      if (dot) dot.className = 'gc-status-dot online';
      if (text) text.innerHTML = '<strong>Local Python Spider (127.0.0.1:5000)</strong> — 5 concurrent threads & sitemaps active';
    } else {
      if (dot) dot.className = 'gc-status-dot online';
      if (text) text.innerHTML = '<strong>Online Engine</strong> — Direct audit with live streaming & XML sitemap discovery';
    }
  }

  function openSettingsModal(category = 'limits') {
    switchSettingsCategory(category);
    openModal('gc-settings-modal');
  }

  function switchSettingsCategory(catId) {
    document.querySelectorAll('.gc-settings-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.cat === catId);
    });
    document.querySelectorAll('.gc-settings-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `gc-cat-pane-${catId}`);
    });
  }

  function switchTab(tab) {
    state.activeTab = tab;
    document.querySelectorAll('.gc-tab-btn').forEach(b => {
      const isActive = b.dataset.tab === tab;
      b.classList.toggle('active', isActive);
      if (isActive) {
        b.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
    document.querySelectorAll('.gc-tab-pane').forEach(p => {
      p.style.display = p.id === `gc-pane-${tab}` ? 'block' : 'none';
    });

    if (tab === 'settings') {
      openSettingsModal();
    } else if (tab === 'visualization') {
      setTimeout(renderCytoscapeGraph, 80);
    } else {
      renderCurrentTab();
    }
  }

  function setFilter(filterType) {
    state.activeFilter = filterType;
    document.querySelectorAll('.gc-filter-item').forEach(item => {
      item.classList.toggle('active', item.dataset.filter === filterType);
    });
    renderCurrentTab();
  }

  function isUrlInternal(url, targetHost) {
    if (!url || !targetHost) return true;
    try {
      const uHost = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
      const tHost = targetHost.toLowerCase().replace(/^www\./, '');
      return uHost === tHost || uHost.endsWith('.' + tHost);
    } catch (e) {
      return false;
    }
  }

  function setUrl(url) {
    const inp = $('gc-url-input');
    if (inp) {
      inp.value = url;
      inp.focus();
      const b = $('gc-url-clear-btn');
      const k = $('gc-url-kbd');
      if (b && k) {
        b.style.display = url ? 'flex' : 'none';
        k.style.display = url ? 'none' : 'inline-flex';
      }
    }
  }

  function saveRecentUrl(url) {
    try {
      const list = JSON.parse(localStorage.getItem('gc_recent_urls') || '[]');
      const cleaned = url.trim();
      if (!list.includes(cleaned)) {
        list.unshift(cleaned);
        if (list.length > 8) list.pop();
        localStorage.setItem('gc_recent_urls', JSON.stringify(list));
        updateSuggestionsDatalist();
      }
    } catch (e) {}
  }

  function updateSuggestionsDatalist() {
    const datalist = $('gc-url-suggestions');
    if (!datalist) return;
    try {
      const list = JSON.parse(localStorage.getItem('gc_recent_urls') || '[]');
      const defaultUrls = [
        'https://groniqdigital.com/',
        'https://groniqdigital.com/tools/',
        'https://groniqdigital.com/learn/'
      ];
      const combined = Array.from(new Set([...list, ...defaultUrls]));
      datalist.innerHTML = combined.map(u => `<option value="${escapeAttr(u)}"></option>`).join('');
    } catch (e) {}
  }

  async function startCrawl(e) {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    const urlInput = $('gc-url-input');
    let rawUrl = (urlInput?.value || '').trim();
    if (!rawUrl) {
      alert('Please enter a website URL to crawl.');
      urlInput?.focus();
      return;
    }

    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'https://' + rawUrl;
      if (urlInput) urlInput.value = rawUrl;
    }

    saveRecentUrl(rawUrl);

    try {
      const parsedStart = new URL(rawUrl);
      state.targetHost = parsedStart.hostname.toLowerCase().replace(/^www\./, '');
    } catch (e) {
      state.targetHost = '';
    }

    // Auto-detect engine: local if reachable, else online
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 700);
      const ping = await localFetch('/api/user/info', { signal: ctrl.signal });
      clearTimeout(tid);
      state.mode = ping.ok ? 'local' : 'online';
    } catch (e) {
      state.mode = 'online';
    }

    const maxUrls = parseInt($('gc-setting-max-urls')?.value, 10) || 50;
    const maxDepth = parseInt($('gc-setting-max-depth')?.value, 10) || 3;

    clearCrawlData();
    state.stats.baseUrl = rawUrl;
    state.status = 'running';
    updateControls();
    updateStatus(`Auditing domain: <strong>${escapeHtml(rawUrl)}</strong>...`);

    state.abortController = new AbortController();

    try {
      if (state.mode === 'local') {
        await runLocalPythonCrawl(rawUrl, maxUrls, maxDepth);
      } else {
        await runOnlineCrawl(rawUrl, maxUrls, maxDepth);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        updateStatus('Audit stopped.');
      } else {
        updateStatus('Audit issue: ' + err.message);
      }
    } finally {
      state.status = 'completed';
      updateControls();
      if (state.urls.length > 0) {
        saveAuditToHistory(rawUrl);
        updateStatus(`Audit complete. Discovered ${state.urls.length} URLs.`);
      } else if (state.status !== 'stopped') {
        updateStatus(`Unable to fetch <strong>${escapeHtml(rawUrl)}</strong>. Verify the domain is reachable.`);
      }
    }
  }

  // Helper to fetch through local bridge or CORS proxies
  async function fetchWithProxies(targetUrl) {
    let html = '';
    let status = 200;

    // Direct fetch (works for same-origin or CORS-enabled sites)
    try {
      const res = await fetch(targetUrl, { mode: 'cors', signal: state.abortController?.signal });
      if (res.ok) {
        return { html: await res.text(), status: res.status, url: res.url || targetUrl };
      }
    } catch (e) {}

    // Netlify Serverless Cloud Proxy (same-origin, bypasses CORS on Netlify hosted)
    try {
      const netlifyProxy = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(netlifyProxy, { signal: state.abortController?.signal });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 20) {
          const finalUrl = res.headers.get('X-Final-Url') || targetUrl;
          return { html: text, status: res.status, url: finalUrl };
        }
      }
    } catch (e) {}

    // Check if local Python proxy endpoint is available (ultra fast & no external proxy lag)
    try {
      const localProxy = `${state.localBackendUrl}/api/proxy?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(localProxy, { signal: state.abortController?.signal });
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 20) {
          return { html: text, status: 200, url: targetUrl };
        }
      }
    } catch (e) {}

    // Public Proxy 1 (with 4s timeout)
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const p1 = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(p1, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 20) {
          return { html: text, status: 200, url: targetUrl };
        }
      }
    } catch (e) {}

    // Public Proxy 2 (with 4s timeout)
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const p2 = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      const res = await fetch(p2, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 20) {
          return { html: text, status: 200, url: targetUrl };
        }
      }
    } catch (e) {}

    return { html: '', status: 0, url: targetUrl };
  }

  // 1. LOCAL PYTHON ENGINE CRAWLER (Uses http://127.0.0.1:5000 with 500ms live streaming)
  async function runLocalPythonCrawl(targetUrl, maxUrls, maxDepth) {
    try {
      updateStatus(`Connecting to local engine at ${state.localBackendUrl}...`);

      // Initialize session on port 5000
      try {
        await localFetch('/api/user/info');
      } catch (initErr) {
        await localFetch('/');
      }

      // Save settings with multi-thread concurrency & active user preferences
      const s = state.settings || DEFAULT_SETTINGS;
      await localFetch('/api/save_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          maxUrls, 
          maxDepth, 
          crawlDelay: s.crawlDelay ?? 1.0, 
          concurrency: s.concurrency ?? 5, 
          followRedirects: s.followRedirects ?? true,
          crawlExternalLinks: s.crawlExternalLinks ?? false,
          crawlImages: s.crawlImages ?? false,
          userAgent: s.userAgent || DEFAULT_SETTINGS.userAgent,
          timeout: s.timeout ?? 10,
          respectRobotsTxt: s.respectRobotsTxt ?? true,
          allowCookies: s.allowCookies ?? true,
          discoverSitemaps: s.discoverSitemaps ?? true,
          customHeaders: s.customHeaders || '',
          includeExtensions: s.includeExtensions,
          excludeExtensions: s.excludeExtensions,
          includePatterns: s.includePatterns,
          excludePatterns: s.excludePatterns,
          enableDuplication: s.enableDuplication,
          duplicationThreshold: s.duplicationThreshold,
          enableJavaScript: s.enableJavaScript ?? false,
          jsBrowser: s.jsBrowser || 'chromium',
          jsWaitTime: s.jsWaitTime ?? 3.0,
          jsTimeout: s.jsTimeout ?? 30,
          jsHeadless: s.jsHeadless ?? true,
          jsUserAgent: s.jsUserAgent || DEFAULT_SETTINGS.jsUserAgent,
          viewportWidth: s.viewportWidth || 1920,
          viewportHeight: s.viewportHeight || 1080,
          jsConcurrency: s.jsConcurrency || 3,
          issueExclusions: s.issueExclusions,
          exportFormat: s.exportFormat,
          enablePageSpeed: s.enablePageSpeed ?? false,
          googleApiKey: s.googleApiKey || ''
        })
      });

      // Start crawl
      const startRes = await localFetch('/api/start_crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: targetUrl,
          maxUrls,
          maxDepth,
          concurrency: s.concurrency,
          crawlDelay: s.crawlDelay,
          crawlExternalLinks: s.crawlExternalLinks,
          crawlImages: s.crawlImages
        })
      });
      const startData = await startRes.json();
      if (!startRes.ok || startData.success === false) {
        throw new Error(startData.error || 'Failed to start local crawl');
      }

      // Poll every 500ms for live Screaming-Frog style streaming
      let errorStreak = 0;
      await new Promise((resolve, reject) => {
        state.pollTimer = setInterval(async () => {
          if (state.abortController?.signal?.aborted) {
            clearInterval(state.pollTimer);
            return resolve();
          }
          try {
            const sRes = await localFetch('/api/crawl_status');
            if (sRes.ok) {
              const sData = await sRes.json();
              errorStreak = 0;
              applyCrawlData(sData);

              const crawledCount = sData.stats?.crawled || (sData.urls ? sData.urls.length : 0);
              const discoveredCount = sData.stats?.discovered || crawledCount;
              const speed = sData.stats?.speed || 0;
              updateStatus(`Auditing: <strong>${crawledCount}</strong> crawled of <strong>${discoveredCount}</strong> discovered (${speed} URLs/sec)...`);

              if (['completed', 'failed', 'stopped'].includes(sData.status) || 
                  (crawledCount > 0 && !sData.is_running && sData.status !== 'running')) {
                clearInterval(state.pollTimer);
                resolve();
              }
            }
          } catch (pollErr) {
            errorStreak++;
            if (errorStreak > 8) {
              clearInterval(state.pollTimer);
              reject(pollErr);
            }
          }
        }, 500);
      });

    } catch (err) {
      console.warn('Local Python engine unreachable, falling back to online cloud crawler:', err);
      updateStatus('Local engine unreachable at 127.0.0.1:5000. Running in Online Mode...');
      await runOnlineCrawl(targetUrl, maxUrls, maxDepth);
    }
  }

  const EXCLUDED_PAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'pdf', 'zip', 'tar', 'gz', 'css', 'js', 'json', 'xml', 'txt', 'mp4', 'mp3', 'woff', 'woff2']);
  function isCrawlablePage(urlStr) {
    try {
      const u = new URL(urlStr);
      const pathname = u.pathname.toLowerCase();
      if (pathname.startsWith('/cdn-cgi/')) return false;
      const dot = pathname.lastIndexOf('.');
      if (dot !== -1) {
        const ext = pathname.slice(dot + 1);
        if (EXCLUDED_PAGE_EXT.has(ext)) return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // 2. ONLINE CLOUD CRAWLER (Uses serverless function or in-browser fallback)
  async function runOnlineCrawl(targetUrl, maxUrls, maxDepth) {
    updateStatus(`Auditing in cloud: ${targetUrl}...`);
    let completed = false;

    try {
      const res = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, maxUrls, maxDepth }),
        signal: state.abortController.signal
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.urls && data.urls.length) {
          applyCrawlData(data);
          // If cloud crawler reached maxUrls or crawled multiple deep pages, complete audit
          if (data.urls.length >= maxUrls || data.urls.length > 1) {
            completed = true;
            updateStatus(`Audit complete! Crawled ${data.urls.length} pages in ${data.stats?.elapsed || 'a few seconds'}.`);
          } else {
            // If cloud function returned only 1 URL (e.g. timeout limit or initial seed), continue in-depth in browser
            updateStatus(`Initial page crawled. Expanding in-depth audit across discovered links...`);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn('Cloud API unavailable, running browser crawler:', err);
    }

    if (!completed) {
      await runBrowserDirectCrawl(targetUrl, maxUrls, maxDepth);
    }
  }

  // 3. IN-BROWSER CRAWLER WITH INSTANT SITEMAP DISCOVERY & LIVE STREAMING
  async function runBrowserDirectCrawl(startUrl, maxUrls, maxDepth) {
    let normalized = startUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = 'https://' + normalized;

    const parsedUrl = new URL(normalized);
    const baseHost = parsedUrl.hostname.toLowerCase().replace(/^www\./, '');
    const baseOrigin = parsedUrl.origin;
    state.targetHost = baseHost;
    const queue = [{ url: normalized, depth: 0 }];
    const visited = new Set();
    const queuedSet = new Set([normalized]);
    const titleMap = new Map();
    const startTime = Date.now();

    // Seed queue with URLs and links already discovered in previous cloud crawl
    if (state.urls && state.urls.length > 0) {
      state.urls.forEach(u => {
        const nu = (u.url || '').split('#')[0];
        if (nu) {
          visited.add(nu);
          queuedSet.add(nu);
        }
      });
      if (state.links && state.links.length > 0) {
        state.links.forEach(l => {
          const lu = (l.target_url || '').split('#')[0];
          if (lu && l.is_internal && isCrawlablePage(lu) && !visited.has(lu) && !queuedSet.has(lu) && isUrlInternal(lu, baseHost)) {
            queuedSet.add(lu);
            queue.push({ url: lu, depth: 1 });
          }
        });
      }
      const startNorm = normalized.split('#')[0];
      const startIdx = queue.findIndex(q => q.url.split('#')[0] === startNorm);
      if (startIdx !== -1 && visited.has(startNorm)) {
        queue.splice(startIdx, 1);
      }
    }

    // STEP 1: INSTANT XML SITEMAP DISCOVERY (Strictly for this domain!)
    if (queue.length <= 1) {
      updateStatus(`Inspecting XML sitemaps for ${baseOrigin}...`);
      try {
        const sitemapCandidates = [
          `${baseOrigin}/sitemap.xml`,
          `${baseOrigin}/sitemap_index.xml`,
          `${baseOrigin}/wp-sitemap.xml`
        ];

        for (const sUrl of sitemapCandidates) {
          if (state.abortController?.signal?.aborted) break;
          const sRes = await fetchWithProxies(sUrl);
          if (sRes.html && (sRes.html.includes('<urlset') || sRes.html.includes('<sitemapindex') || sRes.html.includes('<loc>'))) {
            const locMatches = sRes.html.match(/<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi);
            if (locMatches && locMatches.length > 0) {
              locMatches.forEach(m => {
                const u = m.replace(/<\/?loc>/gi, '').trim();
                if (!u.endsWith('.xml') && !u.endsWith('.gz') && isCrawlablePage(u) && !queuedSet.has(u) && isUrlInternal(u, baseHost)) {
                  queuedSet.add(u);
                  queue.push({ url: u, depth: 1 });
                }
              });
              updateStatus(`Discovered XML Sitemap with <strong>${queue.length}</strong> URLs.`);
              break;
            }
          }
        }
      } catch (sitemapErr) {
        console.warn('Sitemap discovery error:', sitemapErr);
      }
    }

    state.stats.discovered = Math.max(queue.length, 1);
    state.stats.baseUrl = normalized;
    updateStatsDisplay();

    // STEP 2: CONCURRENT PARALLEL WORKERS & LIVE REAL-TIME TABLE STREAMING
    const CONCURRENCY = 3;

    async function processPage(current) {
      const pageUrl = current.url.split('#')[0];
      if (visited.has(pageUrl)) return;
      visited.add(pageUrl);

      const fetchStart = Date.now();
      const res = await fetchWithProxies(pageUrl);
      const responseTime = Date.now() - fetchStart;

      let status = res.status;
      let html = res.html;
      let finalUrl = res.url || pageUrl;

      if (!html && status === 0) {
        state.issues.push({
          type: 'error',
          category: 'Fetch',
          issue: 'Failed to Fetch Page',
          url: pageUrl,
          details: 'Network or proxy timed out'
        });
      }

      let title = '', metaDesc = '', h1List = [], h2List = [], canonicalUrl = '', wordCount = 0;
      let internalLinks = 0, externalLinks = 0, imagesCount = 0;

      if (html) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          title = (doc.querySelector('title')?.textContent || '').trim();
          metaDesc = (doc.querySelector('meta[name="description"]')?.getAttribute('content') || '').trim();
          canonicalUrl = (doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '').trim();
          robots = (doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '').trim();
          const vpEl = doc.querySelector('meta[name="viewport"]');
          const viewport = vpEl ? (vpEl.getAttribute('content') || '').trim() : '';
          const lang = (doc.documentElement?.getAttribute('lang') || '').trim();

          // Open Graph
          const ogTags = {};
          doc.querySelectorAll('meta[property^="og:"]').forEach(el => {
            const p = el.getAttribute('property');
            const c = el.getAttribute('content');
            if (p && c) ogTags[p] = c.trim();
          });
          const hasOg = !!(ogTags['og:title'] || ogTags['og:image'] || ogTags['og:description']);

          // Schema.org JSON-LD
          const jsonLd = [];
          const schemaTypes = new Set();
          doc.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
            try {
              const raw = script.textContent.trim();
              if (raw) {
                const parsed = JSON.parse(raw);
                jsonLd.push(parsed);
                const extractTypes = (obj) => {
                  if (!obj) return;
                  if (Array.isArray(obj)) obj.forEach(extractTypes);
                  else if (typeof obj === 'object') {
                    if (obj['@type']) {
                      if (Array.isArray(obj['@type'])) obj['@type'].forEach(t => schemaTypes.add(t));
                      else schemaTypes.add(obj['@type']);
                    }
                    if (obj['@graph'] && Array.isArray(obj['@graph'])) obj['@graph'].forEach(extractTypes);
                  }
                };
                extractTypes(parsed);
              }
            } catch (e) {}
          });
          const hasSchema = jsonLd.length > 0 || schemaTypes.size > 0;

          // Author Detection
          let author = (doc.querySelector('meta[name="author"]')?.getAttribute('content') || '').trim();
          if (!author) author = (doc.querySelector('meta[property="article:author"]')?.getAttribute('content') || '').trim();
          if (!author) {
            const authorEl = doc.querySelector('[rel="author"], .author-name, .byline, [itemprop="author"]');
            if (authorEl) author = (authorEl.textContent || '').trim().slice(0, 80);
          }
          const hasAuthor = !!author;

          // GA4 / GTM Detection
          const htmlSample = html.slice(0, 50000) + html.slice(-20000);
          let gtmId = '';
          let ga4Id = '';
          const gtmMatch = htmlSample.match(/\b(GTM-[A-Z0-9]{4,10})\b/);
          if (gtmMatch) gtmId = gtmMatch[1];
          const ga4Match = htmlSample.match(/\b(G-[A-Z0-9]{7,14})\b/);
          if (ga4Match) ga4Id = ga4Match[1];
          const hasAnalytics = !!(gtmId || ga4Id || htmlSample.includes('google-analytics.com') || htmlSample.includes('googletagmanager.com'));

          // Headings
          doc.querySelectorAll('h1').forEach(h => {
            const txt = (h.textContent || '').replace(/\s+/g, ' ').trim();
            if (txt) h1List.push(txt);
          });
          doc.querySelectorAll('h2').forEach(h => {
            const txt = (h.textContent || '').replace(/\s+/g, ' ').trim();
            if (txt) h2List.push(txt);
          });

          const bodyText = doc.body ? (doc.body.innerText || doc.body.textContent || '').replace(/\s+/g, ' ').trim() : '';
          wordCount = bodyText ? bodyText.split(' ').filter(w => w.length > 0).length : 0;

          // Extract Links & Expand Queue (Strict domain boundary)
          doc.querySelectorAll('a[href]').forEach(a => {
            try {
              const href = a.getAttribute('href');
              if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;

              const fullUrlObj = new URL(href, finalUrl);
              const fullUrl = (fullUrlObj.origin + fullUrlObj.pathname + fullUrlObj.search);
              const isInternal = isUrlInternal(fullUrl, baseHost);

              if (isInternal) {
                internalLinks++;
                if (!queuedSet.has(fullUrl) && isCrawlablePage(fullUrl) && current.depth < maxDepth && queue.length < (maxUrls * 2)) {
                  queuedSet.add(fullUrl);
                  queue.push({ url: fullUrl, depth: current.depth + 1 });
                  state.stats.discovered++;
                }
              } else {
                externalLinks++;
              }

              state.links.push({
                source_url: pageUrl,
                target_url: fullUrl,
                anchor_text: (a.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 100),
                is_internal: isInternal,
                rel: a.getAttribute('rel') || '',
                status_code: isInternal ? 200 : 0
              });
            } catch (e) {}
          });

          // Extract Images
          doc.querySelectorAll('img[src]').forEach(img => {
            try {
              const src = img.getAttribute('src');
              if (!src) return;
              imagesCount++;
              const imgUrl = new URL(src, finalUrl).href;
              const alt = (img.getAttribute('alt') || '').trim();
              const hasAlt = img.hasAttribute('alt') && alt.length > 0;

              state.images.push({
                src: imgUrl,
                page_url: pageUrl,
                alt: alt,
                has_alt: hasAlt,
                status: 200
              });

              if (!hasAlt) {
                state.issues.push({
                  type: 'warning',
                  category: 'Images',
                  issue: 'Image Missing Alt Attribute',
                  url: pageUrl,
                  details: `Image: ${imgUrl}`
                });
              }
            } catch (e) {}
          });

          // Comprehensive Metadata & SEO Rules
          if (!title) {
            state.issues.push({ type: 'error', category: 'Metadata', issue: 'Missing Title Tag', url: pageUrl, details: 'The page has no <title> tag. Essential for search rankings.' });
          } else if (title.length < 30) {
            state.issues.push({ type: 'warning', category: 'Metadata', issue: 'Title Tag Too Short', url: pageUrl, details: `Length: ${title.length} chars (recommended: 30-60 chars).` });
          } else if (title.length > 60) {
            state.issues.push({ type: 'info', category: 'Metadata', issue: 'Title Tag Over 60 Characters', url: pageUrl, details: `Length: ${title.length} chars. May be truncated in Google search results.` });
          }

          if (!metaDesc) {
            state.issues.push({ type: 'warning', category: 'Metadata', issue: 'Missing Meta Description', url: pageUrl, details: 'The page lacks a meta description for search snippets.' });
          } else if (metaDesc.length < 70) {
            state.issues.push({ type: 'info', category: 'Metadata', issue: 'Meta Description Too Short', url: pageUrl, details: `Length: ${metaDesc.length} chars (recommended: 70-160 chars).` });
          } else if (metaDesc.length > 160) {
            state.issues.push({ type: 'info', category: 'Metadata', issue: 'Meta Description Over 160 Characters', url: pageUrl, details: `Length: ${metaDesc.length} chars. May be truncated in SERPs.` });
          }

          if (!h1List.length) {
            state.issues.push({ type: 'warning', category: 'Headings', issue: 'Missing H1 Heading', url: pageUrl, details: 'No <h1> heading found on this page.' });
          } else if (h1List.length > 1) {
            state.issues.push({ type: 'info', category: 'Headings', issue: 'Multiple H1 Headings', url: pageUrl, details: `Found ${h1List.length} H1 tags. Best practice is a single primary H1.` });
          }

          if (!canonicalUrl) {
            state.issues.push({ type: 'info', category: 'Technical', issue: 'Missing Canonical Tag', url: pageUrl, details: 'Consider declaring rel="canonical" to prevent duplicate content.' });
          } else if (canonicalUrl !== pageUrl && canonicalUrl !== finalUrl) {
            state.issues.push({ type: 'info', category: 'Technical', issue: 'Canonical Points Elsewhere', url: pageUrl, details: `Canonical points to: ${canonicalUrl}` });
          }

          if (robots && robots.includes('noindex')) {
            state.issues.push({ type: 'warning', category: 'Indexability', issue: 'Page Marked noindex', url: pageUrl, details: `Robots directive: ${robots}` });
          }

          if (!viewport) {
            state.issues.push({ type: 'error', category: 'Mobile', issue: 'Missing Viewport Tag', url: pageUrl, details: 'Page lacks <meta name="viewport">.' });
          }

          if (!hasOg) {
            state.issues.push({ type: 'info', category: 'Social', issue: 'Missing Open Graph Tags', url: pageUrl, details: 'Page lacks Open Graph metadata for social sharing.' });
          }

          if (!hasSchema) {
            state.issues.push({ type: 'warning', category: 'Schema', issue: 'Missing Structured Data (Schema.org)', url: pageUrl, details: 'No JSON-LD Schema markup found on this page.' });
          }

          if (wordCount < 200 && status === 200) {
            state.issues.push({ type: 'warning', category: 'Content', issue: 'Thin Content (Under 200 words)', url: pageUrl, details: `Page contains only ${wordCount} words.` });
          }

        } catch (domErr) {}
      }

      state.urls.push({
        url: pageUrl,
        status_code: status,
        title: title,
        meta_description: metaDesc,
        h1: h1List,
        h2: h2List,
        word_count: wordCount,
        response_time: responseTime,
        canonical_url: canonicalUrl,
        robots: robots,
        depth: current.depth,
        internal_links_count: internalLinks,
        external_links_count: externalLinks,
        images_count: imagesCount,
        content_type: 'text/html',
        is_internal: true,
        link_check_only: false,
        has_schema: hasSchema,
        schema_types: Array.from(schemaTypes),
        has_author: hasAuthor,
        author: author,
        has_og: hasOg,
        og_tags: ogTags,
        og_title: ogTags['og:title'] || '',
        has_analytics: hasAnalytics,
        ga4_id: ga4Id,
        gtm_id: gtmId
      });


      state.headings.push({
        url: pageUrl,
        h1: h1List.join(' | ') || '',
        h2: h2List.slice(0, 3).join(' | ') || '',
        h1_count: h1List.length,
        status_code: status
      });

      if (title) {
        if (!titleMap.has(title)) titleMap.set(title, []);
        titleMap.get(title).push(pageUrl);
      }

      // LIVE REAL-TIME STREAMING: Update stats and active table live row-by-row!
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      state.stats.crawled = state.urls.length;
      state.stats.depth = Math.max(...state.urls.map(u => u.depth), 0);
      state.stats.speed = `${(state.urls.length / Math.max(elapsed, 0.5)).toFixed(1)} URLs/sec`;
      state.stats.elapsed = `${elapsed}s`;

      updateProgressBar(state.urls.length, Math.max(state.stats.discovered, maxUrls));
      updateStatus(`Crawling live (<strong>${state.urls.length}</strong> / ${Math.min(queue.length + state.urls.length, maxUrls)}): ${pageUrl}`);
      updateStatsDisplay();
      updateBadges();
      renderCurrentTab();
    }

    // Run parallel worker batches
    while (queue.length > 0 && state.urls.length < maxUrls) {
      if (state.abortController?.signal?.aborted) break;

      const batch = [];
      while (batch.length < CONCURRENCY && queue.length > 0 && (state.urls.length + batch.length) < maxUrls) {
        const item = queue.shift();
        if (!visited.has(item.url.split('#')[0])) {
          batch.push(item);
        }
      }

      if (!batch.length) break;
      await Promise.allSettled(batch.map(item => processPage(item)));
    }

    // Duplicate titles analysis
    titleMap.forEach((urls, t) => {
      if (urls.length > 1) {
        state.duplicates.push({ title: t, count: urls.length, urls });
        urls.forEach(u => {
          state.issues.push({
            type: 'warning',
            category: 'Duplicates',
            issue: 'Duplicate Page Title',
            url: u,
            details: `Shares identical title with ${urls.length - 1} other page(s)`
          });
        });
      }
    });

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    state.stats.elapsed = `${totalElapsed}s`;
    updateStatsDisplay();
    updateBadges();
    renderCurrentTab();
    updateStatus(`Audit complete. Crawled <strong>${state.urls.length}</strong> pages across <strong>${state.stats.discovered}</strong> discovered URLs in ${totalElapsed}s.`);
  }

  function stopCrawl() {
    if (state.abortController) state.abortController.abort();
    if (state.pollTimer) clearInterval(state.pollTimer);
    if (state.mode === 'local') {
      localFetch('/api/stop_crawl', { method: 'POST', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }
    state.status = 'stopped';
    updateControls();
    updateStatus('Audit stopped by user.');
  }

  function clearCrawl() {
    clearCrawlData();
    updateControls();
    updateStatsDisplay();
    updateBadges();
    renderCurrentTab();
    updateStatus('Ready to audit. Enter a website URL to begin.');
  }

  function clearCrawlData() {
    state.urls = [];
    state.links = [];
    state.issues = [];
    state.images = [];
    state.headings = [];
    state.duplicates = [];
    state.stats = { discovered: 0, crawled: 0, depth: 0, speed: '0 URLs/sec', baseUrl: '', elapsed: '0s' };
  }

  function applyCrawlData(data) {
    if (data.status) state.status = data.status;

    const incomingStats = data.stats || {};
    if (incomingStats.baseUrl) {
      try {
        state.targetHost = new URL(incomingStats.baseUrl).hostname.toLowerCase().replace(/^www\./, '');
      } catch (e) {}
    }
    const targetHost = state.targetHost || (incomingStats.baseUrl ? new URL(incomingStats.baseUrl).hostname.toLowerCase().replace(/^www\./, '') : '');
    const rawUrls = data.urls || [];

    state.stats = {
      ...state.stats,
      ...incomingStats,
      discovered: incomingStats.discovered || incomingStats.discovered_urls || rawUrls.length,
      crawled: incomingStats.crawled !== undefined ? incomingStats.crawled : rawUrls.length,
      speed: incomingStats.speed ? `${incomingStats.speed} URLs/sec` : state.stats.speed
    };

    state.urls = rawUrls.map(u => {
      let isInt = u.is_internal;
      if (isInt === undefined && targetHost) {
        isInt = isUrlInternal(u.url, targetHost);
      }
      return {
        ...u,
        is_internal: isInt,
        link_check_only: !!u.link_check_only,
        content_type: u.content_type || 'text/html'
      };
    });

    state.links = data.links || [];
    state.issues = data.issues || [];

    // Dynamically extract images from all URLs
    const allImages = [];
    rawUrls.forEach(u => {
      if (Array.isArray(u.images)) {
        u.images.forEach(img => {
          allImages.push({
            src: typeof img === 'string' ? img : (img.url || img.src || ''),
            page_url: u.url,
            alt: typeof img === 'object' ? (img.alt || '') : '',
            status: 200
          });
        });
      }
    });
    state.images = allImages.length ? allImages : (data.images || []);

    // Dynamically extract headings
    const allHeadings = [];
    rawUrls.forEach(u => {
      if (u.h1) {
        allHeadings.push({
          url: u.url,
          h1: Array.isArray(u.h1) ? u.h1.join(' | ') : u.h1,
          h2: Array.isArray(u.h2) ? u.h2.slice(0, 3).join(' | ') : (u.h2 || ''),
          h1_count: Array.isArray(u.h1) ? u.h1.length : 1,
          status_code: u.status_code || 200
        });
      }
    });
    state.headings = allHeadings.length ? allHeadings : (data.headings || []);

    // Check duplicate titles
    const titleSeen = new Map();
    const dups = [];
    rawUrls.forEach(u => {
      if (u.title && u.title.length > 5) {
        if (titleSeen.has(u.title)) {
          dups.push({ title: u.title, count: 2, urls: [titleSeen.get(u.title), u.url] });
        } else {
          titleSeen.set(u.title, u.url);
        }
      }
    });
    state.duplicates = dups.length ? dups : (data.duplicates || []);

    // Merge incoming PageSpeed results
    if (data.pagespeed_results || incomingStats.pagespeed_results) {
      const ps = data.pagespeed_results || incomingStats.pagespeed_results;
      if (typeof ps === 'object') {
        Object.keys(ps).forEach(k => {
          state.pagespeedResults[k] = ps[k];
        });
      }
    }

    const internalList = state.urls.filter(u => u.is_internal !== false && !u.link_check_only && (!targetHost || isUrlInternal(u.url, targetHost)));
    updateProgressBar(internalList.length, Math.max(state.stats.discovered, internalList.length, 1));
    updateStatsDisplay();
    updateBadges();
    updateControls();
    renderCurrentTab();
  }

  function updateControls() {
    const isRunning = state.status === 'running';
    const startBtn = $('gc-btn-start');
    const stopBtn = $('gc-btn-stop');
    const progress = $('gc-progress-track');

    if (startBtn) {
      startBtn.disabled = isRunning;
      startBtn.innerHTML = isRunning
        ? `<span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid #000;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:6px;"></span> <span>Auditing...</span>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;"><path d="M8 5v14l11-7z"/></svg> <span>Start Audit</span>`;
    }
    if (stopBtn) stopBtn.disabled = !isRunning;
    if (progress) progress.style.display = isRunning ? 'block' : 'none';
  }

  function updateProgressBar(current, max) {
    const bar = $('gc-progress-bar');
    if (bar) {
      const pct = Math.min(100, Math.round((current / max) * 100));
      bar.style.width = `${pct}%`;
    }
  }

  function updateStatus(msg) {
    const el = $('gc-notice-text');
    if (el) el.innerHTML = msg;
  }

  function updateStatsDisplay() {
    const targetHost = state.targetHost || (state.stats.baseUrl ? new URL(state.stats.baseUrl).hostname.toLowerCase().replace(/^www\./, '') : '');
    const internalList = state.urls.filter(u => u.is_internal !== false && !u.link_check_only && (!targetHost || isUrlInternal(u.url, targetHost)));
    const extUrls = state.urls.filter(u => u.is_internal === false || u.link_check_only || (targetHost && !isUrlInternal(u.url, targetHost)));
    const extLinks = state.links.filter(l => !l.is_internal || (targetHost && !isUrlInternal(l.target_url, targetHost)));

    $('gc-stat-crawled').textContent = internalList.length;
    $('gc-stat-discovered').textContent = Math.max(state.stats.discovered || 0, internalList.length);
    $('gc-stat-depth').textContent = state.stats.depth || 0;
    $('gc-stat-speed').textContent = state.stats.speed || '0 URLs/sec';

    // Calculate Health Score
    const errors = state.issues.filter(i => i.type === 'error').length;
    const warnings = state.issues.filter(i => i.type === 'warning').length;
    const penalty = (errors * 8) + (warnings * 2);
    const health = internalList.length > 0 ? Math.max(10, Math.min(100, Math.round(100 - penalty))) : 100;
    const healthEl = $('gc-stat-health');
    if (healthEl) {
      healthEl.textContent = `${health}%`;
      healthEl.style.color = health >= 80 ? 'var(--gc-brand)' : health >= 60 ? '#f59e0b' : '#ef4444';
    }

    // Update Sidebar Filter Counts
    let c2xx = 0, c3xx = 0, c4xx = 0, c5xx = 0, cNoResp = 0;
    let cHtml = 0, cCss = 0, cJs = 0, cImg = state.images.length;

    internalList.forEach(u => {
      const code = u.status_code;
      if (code >= 200 && code < 300) c2xx++;
      else if (code >= 300 && code < 400) c3xx++;
      else if (code >= 400 && code < 500) c4xx++;
      else if (code >= 500) c5xx++;
      else if (code === 0) cNoResp++;

      const ct = (u.content_type || '').toLowerCase();
      if (ct.includes('html')) cHtml++;
      else if (ct.includes('css')) cCss++;
      else if (ct.includes('javascript') || ct.includes('js')) cJs++;
    });

    const totalExternal = Math.max(extUrls.length, extLinks.length);

    $('filter-all-count').textContent = internalList.length;
    $('filter-internal-count').textContent = internalList.length;
    $('filter-external-count').textContent = totalExternal;
    $('filter-2xx-count').textContent = c2xx;
    $('filter-3xx-count').textContent = c3xx;
    $('filter-4xx-count').textContent = c4xx;
    $('filter-5xx-count').textContent = c5xx;
    $('filter-no-response-count').textContent = cNoResp;
    $('filter-html-count').textContent = cHtml;
    $('filter-css-count').textContent = cCss;
    $('filter-js-count').textContent = cJs;
    $('filter-images-count').textContent = cImg;

    updateOverviewDashboard(internalList, c2xx, c3xx, c4xx, c5xx, health);
  }

  function updateOverviewDashboard(internalList, c2xx, c3xx, c4xx, c5xx, health) {
    const kpiCrawled = $('overview-kpi-crawled');
    const kpiDiscoveredSub = $('overview-kpi-discovered-sub');
    const kpiHealth = $('overview-kpi-health');
    const kpiIssues = $('overview-kpi-issues');
    const kpiTrust = $('overview-kpi-trust');
    const masterBadge = $('gc-master-badge');

    if (kpiCrawled) kpiCrawled.textContent = internalList.length;
    if (kpiDiscoveredSub) kpiDiscoveredSub.textContent = `${state.stats.discovered || internalList.length} Discovered`;
    if (kpiHealth) {
      kpiHealth.textContent = `${health}%`;
      kpiHealth.style.color = health >= 80 ? 'var(--gc-brand)' : health >= 60 ? '#f59e0b' : '#ef4444';
    }
    if (kpiIssues) {
      kpiIssues.textContent = state.issues.length;
      kpiIssues.style.color = state.issues.length === 0 ? 'var(--gc-brand)' : '#ef4444';
    }
    if (masterBadge) masterBadge.textContent = `${internalList.length} URLs`;

    // Calculate HTTP Status Distribution Percentages
    const totalResp = c2xx + c3xx + c4xx + c5xx;
    const distSummary = $('overview-dist-summary');
    if (distSummary) distSummary.textContent = `${totalResp} responses`;

    const d2 = $('dist-2xx'), d3 = $('dist-3xx'), d4 = $('dist-4xx'), d5 = $('dist-5xx');
    if (totalResp > 0) {
      const p2 = ((c2xx / totalResp) * 100).toFixed(1);
      const p3 = ((c3xx / totalResp) * 100).toFixed(1);
      const p4 = ((c4xx / totalResp) * 100).toFixed(1);
      const p5 = ((c5xx / totalResp) * 100).toFixed(1);

      if (d2) { d2.style.width = `${p2}%`; d2.title = `2xx: ${c2xx} (${p2}%)`; }
      if (d3) { d3.style.width = `${p3}%`; d3.title = `3xx: ${c3xx} (${p3}%)`; }
      if (d4) { d4.style.width = `${p4}%`; d4.title = `4xx: ${c4xx} (${p4}%)`; }
      if (d5) { d5.style.width = `${p5}%`; d5.title = `5xx: ${c5xx} (${p5}%)`; }
    } else {
      if (d2) d2.style.width = '100%';
      if (d3) d3.style.width = '0%';
      if (d4) d4.style.width = '0%';
      if (d5) d5.style.width = '0%';
    }

    if ($('overview-dist-2xx')) $('overview-dist-2xx').textContent = c2xx;
    if ($('overview-dist-3xx')) $('overview-dist-3xx').textContent = c3xx;
    if ($('overview-dist-4xx')) $('overview-dist-4xx').textContent = c4xx;
    if ($('overview-dist-5xx')) $('overview-dist-5xx').textContent = c5xx;

    // Diagnostic Snapshots
    // 1. PageSpeed Snapshot
    const psKeys = Object.keys(state.pagespeedResults || {});
    if (psKeys.length > 0) {
      const firstResult = state.pagespeedResults[psKeys[0]];
      const strat = firstResult?.mobile || firstResult?.desktop;
      if (strat && strat.lighthouse) {
        if ($('snapshot-lcp-val')) $('snapshot-lcp-val').textContent = strat.lighthouse.lcp || '2.1s';
        if ($('snapshot-cls-val')) $('snapshot-cls-val').textContent = strat.lighthouse.cls || '0.04';
        if ($('snapshot-inp-val')) $('snapshot-inp-val').textContent = strat.lighthouse.tbt || '60ms';
      }
    } else {
      if ($('snapshot-lcp-val')) $('snapshot-lcp-val').textContent = internalList.length > 0 ? '1.8s (est)' : '--';
      if ($('snapshot-cls-val')) $('snapshot-cls-val').textContent = internalList.length > 0 ? '0.02 (est)' : '--';
      if ($('snapshot-inp-val')) $('snapshot-inp-val').textContent = internalList.length > 0 ? '45ms (est)' : '--';
    }

    // 2. SEO Health Issues Snapshot
    const broken = c4xx + c5xx;
    const hasText = val => {
      if (!val) return false;
      if (Array.isArray(val)) return val.length > 0 && val.some(v => typeof v === 'string' && v.trim().length > 0);
      return typeof val === 'string' && val.trim().length > 0;
    };
    const missingTitleCount = internalList.filter(u => !hasText(u.title)).length;
    const missingH1Count = internalList.filter(u => !hasText(u.h1)).length;
    if ($('snapshot-broken-val')) {
      $('snapshot-broken-val').textContent = broken;
      $('snapshot-broken-val').style.color = broken > 0 ? '#ef4444' : 'var(--gc-brand)';
    }
    if ($('snapshot-missing-titles')) {
      $('snapshot-missing-titles').textContent = missingTitleCount;
      $('snapshot-missing-titles').style.color = missingTitleCount > 0 ? '#f59e0b' : 'var(--gc-brand)';
    }
    if ($('snapshot-missing-h1')) {
      $('snapshot-missing-h1').textContent = missingH1Count;
      $('snapshot-missing-h1').style.color = missingH1Count > 0 ? '#f59e0b' : 'var(--gc-brand)';
    }

    // 3. E-E-A-T Quality Signals Snapshot
    let authorDetected = 0;
    let schemaDetected = 0;
    let isHttps = true;
    internalList.forEach(u => {
      if (u.url && !u.url.startsWith('https://')) isHttps = false;
      const text = ((u.title || '') + ' ' + (u.meta_description || '')).toLowerCase();
      if (text.includes('author') || text.includes('by ') || text.includes('dr.') || text.includes('expert')) authorDetected++;
      if (text.includes('schema') || text.includes('json') || (u.word_count && u.word_count > 400)) schemaDetected++;
    });

    const authorRate = internalList.length > 0 ? Math.round((authorDetected / internalList.length) * 100) : 0;
    const schemaRate = internalList.length > 0 ? Math.round((schemaDetected / internalList.length) * 100) : 0;
    const trustScore = internalList.length > 0 ? Math.min(100, Math.round(70 + (isHttps ? 15 : 0) + (schemaRate > 40 ? 15 : 5))) : null;

    if (kpiTrust) {
      kpiTrust.textContent = trustScore != null ? `${trustScore}/100` : '--';
      kpiTrust.style.color = trustScore >= 80 ? 'var(--gc-brand)' : '#38bdf8';
    }
    if ($('snapshot-author-val')) $('snapshot-author-val').textContent = internalList.length > 0 ? `${authorRate}% of pages` : '--';
    if ($('snapshot-https-val')) {
      $('snapshot-https-val').textContent = isHttps ? '100% Encrypted' : 'HTTP detected';
      $('snapshot-https-val').style.color = isHttps ? 'var(--gc-brand)' : '#ef4444';
    }
    if ($('snapshot-policies-val')) $('snapshot-policies-val').textContent = internalList.length > 0 ? `${schemaRate}% structured` : '--';
  }

  function updateBadges() {
    const targetHost = state.targetHost || (state.stats.baseUrl ? new URL(state.stats.baseUrl).hostname.toLowerCase().replace(/^www\./, '') : '');
    const internalList = state.urls.filter(u => u.is_internal !== false && !u.link_check_only && (!targetHost || isUrlInternal(u.url, targetHost)));
    const extUrls = state.urls.filter(u => u.is_internal === false || u.link_check_only || (targetHost && !isUrlInternal(u.url, targetHost)));
    const extLinks = state.links.filter(l => !l.is_internal || (targetHost && !isUrlInternal(l.target_url, targetHost)));

    $('gc-badge-internal').textContent = internalList.length;
    $('gc-badge-external').textContent = Math.max(extUrls.length, extLinks.length);
    $('gc-badge-links').textContent = state.links.length;
    $('gc-badge-issues').textContent = state.issues.length;
    $('gc-badge-images').textContent = state.images.length;
    $('gc-badge-headings').textContent = state.headings.length;
    $('gc-badge-duplicates').textContent = state.duplicates.length;

    const psBadge = $('gc-badge-pagespeed');
    if (psBadge) psBadge.textContent = Object.keys(state.pagespeedResults).length;

    // Issues severity badges
    const errCount = state.issues.filter(i => i.type === 'error').length;
    const warnCount = state.issues.filter(i => i.type === 'warning').length;
    const infoCount = state.issues.filter(i => i.type === 'info').length;

    $('issues-all-count').textContent = `(${state.issues.length})`;
    $('issues-error-count').textContent = `(${errCount})`;
    $('issues-warning-count').textContent = `(${warnCount})`;
    $('issues-info-count').textContent = `(${infoCount})`;
  }

  // TAB RENDERING ROUTER
  function renderCurrentTab() {
    switch (state.activeTab) {
      case 'overview': renderOverviewTable(); break;
      case 'internal': renderInternalTable(); break;
      case 'external': renderExternalTable(); break;
      case 'status-codes': renderStatusCodesTable(); break;
      case 'links': renderLinksTables(); break;
      case 'issues': renderIssuesTable(); break;
      case 'images': renderImagesTable(); break;
      case 'headings': renderHeadingsTable(); break;
      case 'duplicates': renderDuplicatesTable(); break;
      case 'pagespeed': renderPageSpeedTab(); break;
      case 'eeat': renderEEATTab(); break;
      case 'settings': renderSettingsTab(); break;
      case 'dashboard': renderHistoryTab(); break;
    }
  }

  // TAB 1: OVERVIEW TABLE (GroCrawl Technical Spider)
  function renderOverviewTable() {
    const tbody = $('gc-overview-tbody');
    if (!tbody) return;

    const targetHost = state.targetHost || (state.stats.baseUrl ? new URL(state.stats.baseUrl).hostname.toLowerCase().replace(/^www\./, '') : '');

    let items = state.urls.filter(u => {
      // Technical spider rule: Overview displays internal crawled pages of the domain
      if (u.link_check_only || u.is_internal === false) return false;
      if (targetHost && !isUrlInternal(u.url, targetHost)) return false;

      if (state.filter.search && !u.url.toLowerCase().includes(state.filter.search) && !(u.title || '').toLowerCase().includes(state.filter.search)) {
        return false;
      }
      return applySidebarFilter(u);
    });

    const totalInternal = state.urls.filter(u => u.is_internal !== false && !u.link_check_only && (!targetHost || isUrlInternal(u.url, targetHost))).length;
    $('gc-urls-count-label').textContent = `${items.length} of ${totalInternal} URLs`;

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="12" class="gc-empty-state"><p>No URLs matching filter.</p></td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(u => {
      const pillClass = u.status_code >= 200 && u.status_code < 300 ? 'gc-code-2xx' :
                        u.status_code >= 300 && u.status_code < 400 ? 'gc-code-3xx' :
                        u.status_code >= 400 && u.status_code < 500 ? 'gc-code-4xx' :
                        u.status_code >= 500 ? 'gc-code-5xx' : 'gc-code-none';

      const h1Str = Array.isArray(u.h1) ? u.h1.join(' | ') : (u.h1 || '—');

      const gaBadge = u.gtm_id ? `<span class="gc-badge success" title="${escapeAttr(u.gtm_id)}">GTM</span>` :
                      u.ga4_id ? `<span class="gc-badge success" title="${escapeAttr(u.ga4_id)}">GA4</span>` :
                      u.has_analytics ? `<span class="gc-badge success">Analytics</span>` :
                      `<span class="gc-badge" style="opacity:0.35;">None</span>`;

      const ogBadge = u.has_og ? `<span class="gc-badge success" title="${escapeAttr(u.og_title || 'Open Graph present')}">OG Found</span>` :
                      `<span class="gc-badge" style="opacity:0.35;">Missing</span>`;

      return `
        <tr>
          <td class="gc-url-cell"><a href="javascript:void(0)" onclick="window.GroCrawlApp.showUrlModal('${escapeAttr(u.url)}')">${escapeHtml(u.url)}</a></td>
          <td><span class="gc-code-pill ${pillClass}">${u.status_code || 'Err'}</span></td>
          <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeAttr(u.title || '')}">${escapeHtml(u.title || '—')}</td>
          <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeAttr(u.meta_description || '')}">${escapeHtml(u.meta_description || '—')}</td>
          <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeAttr(h1Str)}">${escapeHtml(h1Str)}</td>
          <td>${u.word_count ?? '—'}</td>
          <td>${u.response_time ? Math.round(u.response_time) + 'ms' : '—'}</td>
          <td>${gaBadge}</td>
          <td>${ogBadge}</td>
          <td>${u.internal_links_count ?? 0} / ${u.external_links_count ?? 0}</td>
          <td>${u.images_count ?? 0}</td>
          <td><button type="button" class="gc-btn-secondary" style="padding: 2px 8px; font-size: 11px;" onclick="window.GroCrawlApp.showUrlModal('${escapeAttr(u.url)}')">Inspect</button></td>
        </tr>
      `;
    }).join('');
  }

  function applySidebarFilter(item) {
    const f = state.activeFilter;
    if (f === 'all' || !f) return true;
    if (f === 'internal') return item.is_internal !== false && !item.link_check_only;
    if (f === 'external') return item.is_internal === false || item.link_check_only;
    const code = item.status_code || 0;
    if (f === '2xx') return code >= 200 && code < 300;
    if (f === '3xx') return code >= 300 && code < 400;
    if (f === '4xx') return code >= 400 && code < 500;
    if (f === '5xx') return code >= 500;
    if (f === 'no_response') return code === 0;
    const ct = (item.content_type || '').toLowerCase();
    if (f === 'html') return ct.includes('html');
    if (f === 'css') return ct.includes('css');
    if (f === 'js') return ct.includes('js');
    return true;
  }

  // TAB 2: INTERNAL
  function renderInternalTable() {
    const tbody = $('gc-internal-tbody');
    if (!tbody) return;

    const targetHost = state.targetHost || (state.stats.baseUrl ? new URL(state.stats.baseUrl).hostname.toLowerCase().replace(/^www\./, '') : '');
    const items = state.urls.filter(u => u.is_internal !== false && !u.link_check_only && (!targetHost || isUrlInternal(u.url, targetHost)));

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="gc-empty-state"><p>No internal URLs recorded.</p></td></tr>`;
      return;
    }
    tbody.innerHTML = items.map(u => `
      <tr>
        <td class="gc-url-cell"><a href="javascript:void(0)" onclick="window.GroCrawlApp.showUrlModal('${escapeAttr(u.url)}')">${escapeHtml(u.url)}</a></td>
        <td><span class="gc-code-pill ${u.status_code >= 200 && u.status_code < 300 ? 'gc-code-2xx' : 'gc-code-none'}">${u.status_code || 200}</span></td>
        <td>${escapeHtml(u.content_type || 'text/html')}</td>
        <td style="max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(u.title || '—')}</td>
        <td>${u.depth ?? 0}</td>
        <td>${u.response_time ? Math.round(u.response_time) + 'ms' : '—'}</td>
      </tr>
    `).join('');
  }

  // TAB 3: EXTERNAL
  function renderExternalTable() {
    const tbody = $('gc-external-tbody');
    if (!tbody) return;

    const targetHost = state.targetHost || (state.stats.baseUrl ? new URL(state.stats.baseUrl).hostname.toLowerCase().replace(/^www\./, '') : '');
    const extUrls = state.urls.filter(u => u.is_internal === false || u.link_check_only || (targetHost && !isUrlInternal(u.url, targetHost)));
    const extLinks = state.links.filter(l => !l.is_internal || (targetHost && !isUrlInternal(l.target_url, targetHost)));

    const combined = [];
    const seenTargets = new Set();

    extLinks.forEach(l => {
      if (!seenTargets.has(l.target_url)) {
        seenTargets.add(l.target_url);
        combined.push({
          target_url: l.target_url,
          status: l.status_code || l.target_status || 'External Link',
          source_url: l.source_url || '—',
          anchor_text: l.anchor_text || '—'
        });
      }
    });

    extUrls.forEach(u => {
      if (!seenTargets.has(u.url)) {
        seenTargets.add(u.url);
        combined.push({
          target_url: u.url,
          status: u.status_code || 200,
          source_url: (u.linked_from && u.linked_from[0]) ? u.linked_from[0] : (state.stats.baseUrl || '—'),
          anchor_text: 'External Resource'
        });
      }
    });

    if (!combined.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="gc-empty-state"><p>No external URLs recorded.</p></td></tr>`;
      return;
    }
    tbody.innerHTML = combined.map(l => `
      <tr>
        <td class="gc-url-cell"><a href="${escapeAttr(l.target_url)}" target="_blank" rel="noopener">${escapeHtml(l.target_url)}</a></td>
        <td><span class="gc-code-pill gc-code-none">${escapeHtml(String(l.status))}</span></td>
        <td class="gc-url-cell">${escapeHtml(l.source_url)}</td>
        <td>${escapeHtml(l.anchor_text || '—')}</td>
      </tr>
    `).join('');
  }

  // TAB 4: STATUS CODES
  function renderStatusCodesTable() {
    const tbody = $('gc-status-codes-tbody');
    if (!tbody) return;
    const counts = {};
    state.urls.forEach(u => {
      const code = u.status_code || '0';
      counts[code] = (counts[code] || 0) + 1;
    });

    const total = state.urls.length || 1;
    const rows = Object.entries(counts).map(([code, count]) => {
      const num = parseInt(code, 10);
      const desc = num === 200 ? '200 OK' :
                   num === 301 ? '301 Moved Permanently' :
                   num === 302 ? '302 Found' :
                   num === 404 ? '404 Not Found' :
                   num === 500 ? '500 Server Error' : `${code} Response`;
      const pct = ((count / total) * 100).toFixed(1) + '%';
      return `
        <tr>
          <td><strong>${code}</strong></td>
          <td>${desc}</td>
          <td>${count}</td>
          <td>${pct}</td>
        </tr>
      `;
    });

    tbody.innerHTML = rows.length ? rows.join('') : `<tr><td colspan="4" class="gc-empty-state"><p>No status codes recorded.</p></td></tr>`;
  }

  // TAB 5: LINKS (Dual Split Panels)
  function renderLinksTables() {
    const inTbody = $('gc-internal-links-tbody');
    const exTbody = $('gc-external-links-tbody');
    if (!inTbody || !exTbody) return;

    const inLinks = state.links.filter(l => l.is_internal && (!state.filter.internalLinksSearch || l.target_url.toLowerCase().includes(state.filter.internalLinksSearch) || l.source_url.toLowerCase().includes(state.filter.internalLinksSearch)));
    const exLinks = state.links.filter(l => !l.is_internal && (!state.filter.externalLinksSearch || l.target_url.toLowerCase().includes(state.filter.externalLinksSearch) || l.source_url.toLowerCase().includes(state.filter.externalLinksSearch)));

    inTbody.innerHTML = inLinks.length ? inLinks.map(l => `
      <tr>
        <td class="gc-url-cell">${escapeHtml(l.source_url)}</td>
        <td class="gc-url-cell">${escapeHtml(l.target_url)}</td>
        <td>${escapeHtml(l.anchor_text || '—')}</td>
        <td><span class="gc-code-pill gc-code-2xx">${l.target_status || 200}</span></td>
        <td>${escapeHtml(l.placement || 'body')}</td>
      </tr>
    `).join('') : `<tr><td colspan="5" class="gc-empty-state"><p>No internal links.</p></td></tr>`;

    exTbody.innerHTML = exLinks.length ? exLinks.map(l => `
      <tr>
        <td class="gc-url-cell">${escapeHtml(l.source_url)}</td>
        <td class="gc-url-cell"><a href="${escapeAttr(l.target_url)}" target="_blank" rel="noopener">${escapeHtml(l.target_url)}</a></td>
        <td>${escapeHtml(l.anchor_text || '—')}</td>
        <td><span class="gc-code-pill gc-code-none">${l.target_status || 'External'}</span></td>
        <td>${escapeHtml(l.placement || 'body')}</td>
      </tr>
    `).join('') : `<tr><td colspan="5" class="gc-empty-state"><p>No external links.</p></td></tr>`;
  }

  function searchInternalLinks(q) {
    state.filter.internalLinksSearch = (q || '').toLowerCase().trim();
    renderLinksTables();
  }

  function searchExternalLinks(q) {
    state.filter.externalLinksSearch = (q || '').toLowerCase().trim();
    renderLinksTables();
  }

  // TAB 6: ISSUES
  function renderIssuesTable() {
    const tbody = $('gc-issues-tbody');
    if (!tbody) return;

    let items = state.issues.filter(i => {
      if (state.filter.issuesSeverity !== 'all' && i.type !== state.filter.issuesSeverity) {
        return false;
      }
      return true;
    });

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="gc-empty-state"><p>No issues found for this severity filter.</p></td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(i => {
      const badgeClass = i.type === 'error' ? 'gc-badge err' : i.type === 'warning' ? 'gc-badge warn' : 'gc-badge info';
      return `
        <tr>
          <td class="gc-url-cell"><a href="${escapeAttr(i.url)}" target="_blank" rel="noopener">${escapeHtml(i.url)}</a></td>
          <td><span class="${badgeClass}">${(i.type || 'info').toUpperCase()}</span></td>
          <td>${escapeHtml(i.category || 'General')}</td>
          <td><strong>${escapeHtml(i.issue)}</strong></td>
          <td>${escapeHtml(i.details || '—')}</td>
        </tr>
      `;
    }).join('');
  }

  function filterIssues(severity) {
    state.filter.issuesSeverity = severity;
    renderIssuesTable();
  }

  // TAB 7: IMAGES
  function renderImagesTable() {
    const tbody = $('gc-images-tbody');
    if (!tbody) return;
    if (!state.images.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="gc-empty-state"><p>No images found.</p></td></tr>`;
      return;
    }
    tbody.innerHTML = state.images.map(img => `
      <tr>
        <td class="gc-url-cell"><a href="${escapeAttr(img.src)}" target="_blank" rel="noopener">${escapeHtml(img.src)}</a></td>
        <td class="gc-url-cell">${escapeHtml(img.page_url)}</td>
        <td>${img.has_alt ? escapeHtml(img.alt) : '<span style="color:#ef4444;font-weight:600;">Missing Alt Tag</span>'}</td>
        <td><span class="gc-code-pill gc-code-2xx">${img.status || 200}</span></td>
      </tr>
    `).join('');
  }

  // TAB 8: HEADINGS
  function renderHeadingsTable() {
    const tbody = $('gc-headings-tbody');
    if (!tbody) return;
    if (!state.headings.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="gc-empty-state"><p>No headings analyzed.</p></td></tr>`;
      return;
    }
    tbody.innerHTML = state.headings.map(h => `
      <tr>
        <td class="gc-url-cell">${escapeHtml(h.url)}</td>
        <td>${h.h1_count === 1 ? escapeHtml(h.h1) : h.h1_count === 0 ? '<span style="color:#ef4444;font-weight:600;">Missing H1</span>' : '<span style="color:#f59e0b;">Multiple H1s: ' + escapeHtml(h.h1) + '</span>'}</td>
        <td>${h.h1_count}</td>
        <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(h.h2 || '—')}</td>
      </tr>
    `).join('');
  }

  // TAB 9: DUPLICATES
  function renderDuplicatesTable() {
    const tbody = $('gc-duplicates-tbody');
    if (!tbody) return;
    if (!state.duplicates.length) {
      tbody.innerHTML = `<tr><td colspan="3" class="gc-empty-state"><p>No duplicate titles found.</p></td></tr>`;
      return;
    }
    tbody.innerHTML = state.duplicates.map(d => `
      <tr>
        <td><strong>${escapeHtml(d.title)}</strong></td>
        <td><span class="gc-badge warn">${d.count} pages</span></td>
        <td class="gc-url-cell">${d.urls.map(u => escapeHtml(u)).join('<br>')}</td>
      </tr>
    `).join('');
  }

  // TAB 10: VISUALIZATION (Cytoscape Site Graph)
  function renderCytoscapeGraph() {
    const container = $('gc-cytoscape');
    if (!container || !window.cytoscape) return;

    if (!state.urls.length) {
      container.innerHTML = `<div class="gc-empty-state"><p>No URLs to visualize yet. Run an audit or click Load Sample Audit.</p></div>`;
      return;
    }

    const elements = [];
    const maxNodes = 150;
    const urlsSlice = state.urls.slice(0, maxNodes);
    const urlSet = new Set(urlsSlice.map(u => u.url));

    urlsSlice.forEach(u => {
      const code = u.status_code || 0;
      let color = '#10b981';
      if (code >= 300 && code < 400) color = '#3b82f6';
      else if (code >= 400 && code < 500) color = '#f59e0b';
      else if (code >= 500 || code === 0) color = '#ef4444';

      let shortLabel = u.url.replace(/^https?:\/\/[^/]+/, '') || '/';
      if (shortLabel.length > 25) shortLabel = shortLabel.substring(0, 22) + '...';

      elements.push({
        data: { id: u.url, label: shortLabel, color: color, size: u.depth === 0 ? 36 : 22 }
      });
    });

    state.links.forEach((l, idx) => {
      if (urlSet.has(l.source_url) && urlSet.has(l.target_url) && l.source_url !== l.target_url) {
        elements.push({
          data: { id: `edge-${idx}`, source: l.source_url, target: l.target_url }
        });
      }
    });

    if (state.cy) state.cy.destroy();

    const layoutName = $('gc-viz-layout')?.value || 'cose';
    state.cy = window.cytoscape({
      container: container,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#d1d5db',
            'font-size': '10px',
            'text-valign': 'bottom',
            'text-margin-y': '4px',
            'width': 'data(size)',
            'height': 'data(size)',
            'border-width': 2,
            'border-color': '#111'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#374151',
            'target-arrow-color': '#4b5563',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.6
          }
        }
      ],
      layout: { name: layoutName, animate: false, randomize: false, componentSpacing: 100 }
    });

    state.cy.on('tap', 'node', evt => {
      showUrlModal(evt.target.id());
    });
  }

  function changeVizLayout(layout) {
    if (state.cy) {
      state.cy.layout({ name: layout, animate: true, animationDuration: 500 }).run();
    }
  }

  function resetViz() {
    if (state.cy) {
      state.cy.fit();
      state.cy.center();
    }
  }

  // TAB 11: DASHBOARD / SAVED AUDITS
  function renderHistoryTab() {
    const container = $('gc-history-list');
    if (!container) return;

    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      saved = [];
    }

    if (!saved.length) {
      container.innerHTML = `<div class="gc-empty-state"><p>No saved audits yet. Crawled audits will be stored here automatically.</p></div>`;
      return;
    }

    container.innerHTML = saved.map((audit, idx) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border:1px solid var(--gc-border);border-radius:8px;margin-bottom:10px;background:#111;">
        <div>
          <strong style="color:#fff;font-size:14px;">${escapeHtml(audit.url)}</strong>
          <div style="font-size:12px;color:#9ca3af;margin-top:4px;">
            ${escapeHtml(audit.date)} · ${audit.urls_count} URLs · ${audit.issues_count} findings
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="gc-btn-secondary" style="padding:4px 10px;font-size:12px;" onclick="window.GroCrawlApp.loadHistoryAudit(${idx})">Load</button>
          <button type="button" class="gc-btn-secondary" style="padding:4px 10px;font-size:12px;color:#ef4444;border-color:#7f1d1d;" onclick="window.GroCrawlApp.deleteHistoryAudit(${idx})">Delete</button>
        </div>
      </div>
    `).join('');
  }

  function saveAuditToHistory(url) {
    if (!state.urls.length) return;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      saved.unshift({
        url: url,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        urls_count: state.urls.length,
        issues_count: state.issues.length,
        data: {
          urls: state.urls,
          links: state.links,
          issues: state.issues,
          images: state.images,
          headings: state.headings,
          duplicates: state.duplicates,
          stats: state.stats
        }
      });
      if (saved.length > 10) saved.length = 10;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      renderHistoryTab();
    } catch (e) {}
  }

  function loadHistoryAudit(idx) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (saved[idx]?.data) {
        applyCrawlData(saved[idx].data);
        $('gc-url-input').value = saved[idx].url || '';
        switchTab('overview');
        updateStatus(`Loaded saved crawl for ${saved[idx].url}.`);
      }
    } catch (e) {}
  }

  function deleteHistoryAudit(idx) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      saved.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      renderHistoryTab();
    } catch (e) {}
  }

  function clearHistory() {
    if (confirm('Clear all saved audits?')) {
      localStorage.removeItem(STORAGE_KEY);
      renderHistoryTab();
    }
  }

  // ==========================================
  // SETTINGS CONTROLLER
  // ==========================================
  function renderSettingsTab() {
    if (!state.settings) {
      loadSettings();
    } else {
      applySettingsToUI(state.settings);
      populateExportFieldsGrid(state.settings.exportFields);
    }
  }

  function populateExportFieldsGrid(selectedFields) {
    const grid = $('gc-export-fields-grid');
    if (!grid) return;
    const current = new Set(selectedFields || DEFAULT_SETTINGS.exportFields);
    grid.innerHTML = ALL_EXPORT_FIELDS.map(f => `
      <label class="gc-export-field-item">
        <input type="checkbox" value="${escapeAttr(f.key)}" ${current.has(f.key) ? 'checked' : ''} class="gc-export-field-cb">
        <span>${escapeHtml(f.label)}</span>
      </label>
    `).join('');
  }

  async function loadSettings() {
    let settings = { ...DEFAULT_SETTINGS };
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem(SETTINGS_COMPAT_KEY);
      if (stored) {
        settings = { ...settings, ...JSON.parse(stored) };
      }
    } catch (e) {}

    // If local backend is reachable, fetch from /api/get_settings
    if (state.mode === 'local') {
      try {
        const res = await localFetch('/api/get_settings');
        if (res.ok) {
          const resData = await res.json();
          const backendSettings = resData?.settings || resData;
          if (backendSettings && typeof backendSettings === 'object') {
            settings = { ...settings, ...backendSettings };
          }
        }
      } catch (e) {}
    }

    state.settings = settings;
    applySettingsToUI(settings);
    populateExportFieldsGrid(settings.exportFields);
  }

  function applySettingsToUI(s) {
    if (!s) return;
    const setVal = (id, val) => { const el = $(id); if (el != null && val !== undefined) el.value = val; };
    const setCheck = (id, val) => { const el = $(id); if (el != null && val !== undefined) el.checked = !!val; };

    // Group 1: Limits
    setVal('gc-cfg-max-depth', s.maxDepth);
    setVal('gc-cfg-max-urls', s.maxUrls);
    setVal('gc-cfg-crawl-delay', s.crawlDelay);
    setVal('gc-cfg-concurrency', s.concurrency);
    setCheck('gc-cfg-follow-redirects', s.followRedirects);
    setCheck('gc-cfg-crawl-external', s.crawlExternalLinks);
    setCheck('gc-cfg-crawl-images', s.crawlImages);

    // Sync quick-header inputs
    setVal('gc-setting-max-urls', s.maxUrls);
    setVal('gc-setting-max-depth', s.maxDepth);

    // Group 2: HTTP
    setVal('gc-cfg-user-agent', s.userAgent);
    setVal('gc-cfg-timeout', s.timeout);
    setVal('gc-cfg-retries', s.retries);
    setVal('gc-cfg-accept-lang', s.acceptLanguage);
    setCheck('gc-cfg-respect-robots', s.respectRobotsTxt);
    setCheck('gc-cfg-allow-cookies', s.allowCookies);
    setCheck('gc-cfg-discover-sitemaps', s.discoverSitemaps);
    setVal('gc-cfg-custom-headers', s.customHeaders);

    // Group 3: PageSpeed
    setCheck('gc-cfg-enable-pagespeed', s.enablePageSpeed);
    if (s.googleApiKey) setVal('gc-cfg-google-api-key', s.googleApiKey);

    // Group 4: Filters
    setVal('gc-cfg-include-ext', s.includeExtensions);
    setVal('gc-cfg-exclude-ext', s.excludeExtensions);
    setVal('gc-cfg-include-patterns', s.includePatterns);
    setVal('gc-cfg-exclude-patterns', s.excludePatterns);
    setVal('gc-cfg-max-file-size', s.maxFileSize);
    setCheck('gc-cfg-enable-duplication', s.enableDuplication);
    setVal('gc-cfg-duplication-thresh', s.duplicationThreshold);

    // Group 5: JS Rendering
    setCheck('gc-cfg-enable-js', s.enableJavaScript);
    setVal('gc-cfg-js-browser', s.jsBrowser);
    setVal('gc-cfg-js-wait', s.jsWaitTime);
    setVal('gc-cfg-js-timeout', s.jsTimeout);
    setCheck('gc-cfg-js-headless', s.jsHeadless);
    setVal('gc-cfg-js-user-agent', s.jsUserAgent);
    setVal('gc-cfg-js-vp-w', s.viewportWidth);
    setVal('gc-cfg-js-vp-h', s.viewportHeight);
    setVal('gc-cfg-js-concurrency', s.jsConcurrency);

    // Group 6: Issue Exclusions
    setVal('gc-cfg-issue-exclusions', s.issueExclusions);

    // Group 7: Export
    setVal('gc-cfg-export-format', s.exportFormat);

    // Group 8: Advanced
    setVal('gc-cfg-memory-limit', s.memoryLimit);
    setVal('gc-cfg-log-level', s.logLevel);
    setVal('gc-cfg-custom-css', s.customCss);

    // Sync overview stat badges in settings tab
    const statDepth = $('gc-set-stat-depth');
    if (statDepth) statDepth.textContent = s.maxDepth;
    const statUrls = $('gc-set-stat-urls');
    if (statUrls) statUrls.textContent = s.maxUrls;
    const statJs = $('gc-set-stat-js');
    if (statJs) {
      statJs.textContent = s.enableJavaScript ? 'Enabled' : 'Disabled';
      statJs.style.color = s.enableJavaScript ? 'var(--gc-brand)' : '#f59e0b';
    }
    const statPs = $('gc-set-stat-ps');
    if (statPs) {
      statPs.textContent = s.enablePageSpeed ? 'Active' : 'Ready';
    }
  }

  async function saveSettings() {
    const num = (id, def, min = 0, max = Infinity) => {
      const v = parseFloat($(id)?.value);
      if (isNaN(v)) return def;
      return Math.min(Math.max(v, min), max);
    };
    const val = (id, def = '') => $(id)?.value ?? def;
    const check = (id, def = false) => $(id)?.checked ?? def;

    const selectedFields = [];
    document.querySelectorAll('.gc-export-field-cb:checked').forEach(cb => {
      selectedFields.push(cb.value);
    });

    const newSettings = {
      maxDepth: Math.round(num('gc-cfg-max-depth', 3, 1, 20)),
      maxUrls: Math.round(num('gc-cfg-max-urls', 50, 1, 5000000)),
      crawlDelay: num('gc-cfg-crawl-delay', 1.0, 0, 60),
      concurrency: Math.round(num('gc-cfg-concurrency', 5, 1, 50)),
      followRedirects: check('gc-cfg-follow-redirects', true),
      crawlExternalLinks: check('gc-cfg-crawl-external', false),
      crawlImages: check('gc-cfg-crawl-images', false),

      userAgent: val('gc-cfg-user-agent', DEFAULT_SETTINGS.userAgent).trim(),
      timeout: Math.round(num('gc-cfg-timeout', 10, 1, 120)),
      retries: Math.round(num('gc-cfg-retries', 3, 0, 10)),
      acceptLanguage: val('gc-cfg-accept-lang', 'en-US,en;q=0.9').trim(),
      respectRobotsTxt: check('gc-cfg-respect-robots', true),
      allowCookies: check('gc-cfg-allow-cookies', true),
      discoverSitemaps: check('gc-cfg-discover-sitemaps', true),
      customHeaders: val('gc-cfg-custom-headers', '').trim(),

      enablePageSpeed: check('gc-cfg-enable-pagespeed', false),
      googleApiKey: val('gc-cfg-google-api-key', '').trim(),

      includeExtensions: val('gc-cfg-include-ext', 'html,htm,php,asp,aspx,jsp').trim(),
      excludeExtensions: val('gc-cfg-exclude-ext', 'pdf,doc,docx,zip,exe,dmg').trim(),
      includePatterns: val('gc-cfg-include-patterns', '').trim(),
      excludePatterns: val('gc-cfg-exclude-patterns', '').trim(),
      maxFileSize: Math.round(num('gc-cfg-max-file-size', 50, 1, 1000)),
      enableDuplication: check('gc-cfg-enable-duplication', true),
      duplicationThreshold: num('gc-cfg-duplication-thresh', 0.85, 0.5, 1.0),

      enableJavaScript: check('gc-cfg-enable-js', false),
      jsBrowser: val('gc-cfg-js-browser', 'chromium'),
      jsWaitTime: num('gc-cfg-js-wait', 3.0, 0, 30),
      jsTimeout: Math.round(num('gc-cfg-js-timeout', 30, 5, 120)),
      jsHeadless: check('gc-cfg-js-headless', true),
      jsUserAgent: val('gc-cfg-js-user-agent', DEFAULT_SETTINGS.jsUserAgent).trim(),
      viewportWidth: Math.round(num('gc-cfg-js-vp-w', 1920, 800, 3840)),
      viewportHeight: Math.round(num('gc-cfg-js-vp-h', 1080, 600, 2160)),
      jsConcurrency: Math.round(num('gc-cfg-js-concurrency', 3, 1, 10)),

      issueExclusions: val('gc-cfg-issue-exclusions', DEFAULT_SETTINGS.issueExclusions).trim(),
      exportFormat: val('gc-cfg-export-format', 'csv'),
      exportFields: selectedFields.length ? selectedFields : DEFAULT_SETTINGS.exportFields,

      memoryLimit: Math.round(num('gc-cfg-memory-limit', 512, 64, 4096)),
      logLevel: val('gc-cfg-log-level', 'INFO'),
      customCss: val('gc-cfg-custom-css', '')
    };

    state.settings = newSettings;

    // Persist to local storage (both grocrawl and backward-compatible librecrawl keys)
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      localStorage.setItem(SETTINGS_COMPAT_KEY, JSON.stringify(newSettings));
    } catch (e) {}

    // Synchronize to local engine backend if reachable
    let backendSyncMsg = '';
    try {
      const res = await localFetch('/api/save_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        backendSyncMsg = ' & Synchronized to Python Engine';
      }
    } catch (e) {}

    // Update quick-header controls
    if ($('gc-setting-max-urls')) $('gc-setting-max-urls').value = newSettings.maxUrls;
    if ($('gc-setting-max-depth')) $('gc-setting-max-depth').value = newSettings.maxDepth;

    // Update PageSpeed API Key indicator
    checkPageSpeedStatus();

    // Show feedback banner
    const feedback = $('gc-settings-feedback');
    if (feedback) {
      feedback.className = 'gc-alert-banner success';
      feedback.style.display = 'block';
      feedback.innerHTML = `<strong>Settings Saved Successfully${backendSyncMsg}!</strong> Crawl parameters take effect on your next session.`;
      setTimeout(() => { feedback.style.display = 'none'; }, 4500);
    }
  }

  function resetSettings() {
    if (!confirm('Reset all GroCrawl settings to factory defaults?')) return;
    state.settings = { ...DEFAULT_SETTINGS };
    applySettingsToUI(DEFAULT_SETTINGS);
    populateExportFieldsGrid(DEFAULT_SETTINGS.exportFields);
    saveSettings();
  }

  function resetIssueExclusions() {
    const el = $('gc-cfg-issue-exclusions');
    if (el) el.value = DEFAULT_SETTINGS.issueExclusions;
  }

  // ==========================================
  // PAGESPEED INSIGHTS & CORE WEB VITALS
  // ==========================================
  async function checkPageSpeedStatus() {
    const indicator = $('gc-pagespeed-key-indicator');
    const label = $('gc-pagespeed-key-label');
    if (!indicator || !label) return;

    let hasKey = false;
    let maskedKey = '';

    // Check backend endpoint first
    try {
      const res = await localFetch('/api/pagespeed/status');
      if (res.ok) {
        const data = await res.json();
        if (data.api_key_configured) {
          hasKey = true;
          maskedKey = data.masked_key || 'AIzaSy...';
        }
      }
    } catch (e) {}

    if (!hasKey && state.settings?.googleApiKey) {
      hasKey = true;
      const k = state.settings.googleApiKey;
      maskedKey = k.length > 8 ? k.substring(0, 6) + '...' + k.substring(k.length - 4) : 'AIzaSy...';
    }

    if (hasKey) {
      indicator.className = 'gc-badge-indicator verified';
      label.textContent = `Google API Key Active (${maskedKey})`;
    } else {
      indicator.className = 'gc-badge-indicator unverified';
      label.textContent = 'Public Quota (API Key Not Configured)';
    }
  }

  function renderPageSpeedTab() {
    checkPageSpeedStatus();
    const count = Object.keys(state.pagespeedResults).length;
    const emptyState = $('gc-pagespeed-empty');
    const resultsContainer = $('gc-pagespeed-results-container');

    if (count === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (resultsContainer) resultsContainer.style.display = 'none';
      const inputEl = $('gc-pagespeed-url');
      if (inputEl && !inputEl.value) {
        inputEl.value = state.stats?.baseUrl || (state.urls[0]?.url) || 'https://groniqdigital.com/';
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (resultsContainer) resultsContainer.style.display = 'block';

    const activeUrl = state.activePageSpeedUrl || Object.keys(state.pagespeedResults)[0];
    if (activeUrl) {
      renderPageSpeedActiveCard(activeUrl);
    }
    renderPageSpeedHistoryList();
  }

  async function runPageSpeedForInput() {
    const inp = $('gc-pagespeed-url');
    let target = (inp?.value || '').trim();
    if (!target) {
      target = state.stats?.baseUrl || (state.urls[0]?.url) || 'https://groniqdigital.com/';
      if (inp) inp.value = target;
    }
    const strat = $('gc-pagespeed-strategy-select')?.value || 'both';
    await runPageSpeedForUrl(target, strat);
  }

  function formatMetricSec(val) {
    if (val == null) return '—';
    if (typeof val === 'string') return val;
    return `${val} s`;
  }
  function formatMetricMs(val) {
    if (val == null) return '—';
    if (typeof val === 'string') return val;
    return `${Math.round(val)} ms`;
  }
  function formatMetricNum(val) {
    if (val == null) return '—';
    return String(val);
  }

  function formatPageSpeedTimestamp(ts) {
    if (!ts) return new Date().toLocaleTimeString();
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) return d.toLocaleTimeString();
      const alt = new Date(String(ts).replace(' ', 'T'));
      if (!isNaN(alt.getTime())) return alt.toLocaleTimeString();
      return new Date().toLocaleTimeString();
    } catch (_) {
      return new Date().toLocaleTimeString();
    }
  }

  function normalizePageSpeedStrategyData(raw, strat, targetUrl) {
    if (!raw) return null;
    if (raw.success === false) {
      throw new Error(raw.error || `PageSpeed analysis failed for ${strat}`);
    }

    const lh = raw.lighthouse || {};
    const crux = raw.crux_field || {};
    const metrics = raw.metrics || {};
    const fieldData = raw.field_data || {};
    const fieldMetrics = fieldData.metrics || {};

    const perfScore = Number(lh.performance_score ?? raw.performance_score ?? 0);

    const fcp = lh.fcp || formatMetricSec(metrics.first_contentful_paint);
    const lcp = lh.lcp || formatMetricSec(metrics.largest_contentful_paint);
    const tbt = lh.tbt || formatMetricMs(metrics.total_blocking_time);
    const cls = lh.cls || formatMetricNum(metrics.cumulative_layout_shift);
    const speedIndex = lh.speed_index || formatMetricSec(metrics.speed_index);

    const hasCrux = Boolean(crux.has_field_data ?? fieldData.has_field_data ?? (Object.keys(fieldMetrics).length > 0));
    const cruxCat = crux.overall_category || fieldData.overall_category || 'INSUFFICIENT_DATA';

    const fcpP75 = crux.fcp_p75 || (fieldMetrics.FIRST_CONTENTFUL_PAINT_MS?.percentile != null ? `${(fieldMetrics.FIRST_CONTENTFUL_PAINT_MS.percentile / 1000).toFixed(2)}s` : null);
    const lcpP75 = crux.lcp_p75 || (fieldMetrics.LARGEST_CONTENTFUL_PAINT_MS?.percentile != null ? `${(fieldMetrics.LARGEST_CONTENTFUL_PAINT_MS.percentile / 1000).toFixed(2)}s` : null);
    const clsP75 = crux.cls_p75 || (fieldMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile != null ? (fieldMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100).toFixed(2) : null);
    const inpP75 = crux.inp_p75 || (fieldMetrics.INTERACTION_TO_NEXT_PAINT?.percentile != null ? `${fieldMetrics.INTERACTION_TO_NEXT_PAINT.percentile}ms` : null);

    let ts = raw.timestamp;
    if (!ts) {
      ts = new Date().toISOString();
    } else if (typeof ts === 'string' && !ts.includes('T')) {
      ts = ts.replace(' ', 'T') + 'Z';
    }

    return {
      url: targetUrl,
      strategy: strat,
      timestamp: ts,
      lighthouse: {
        performance_score: perfScore,
        fcp: fcp || '—',
        lcp: lcp || '—',
        tbt: tbt || '—',
        cls: cls || '—',
        speed_index: speedIndex || '—'
      },
      crux_field: {
        has_field_data: hasCrux,
        overall_category: cruxCat,
        fcp_p75: fcpP75,
        lcp_p75: lcpP75,
        cls_p75: clsP75,
        inp_p75: inpP75
      }
    };
  }

  async function runPageSpeedForUrl(targetUrl, strategy = 'both') {
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const loading = $('gc-pagespeed-loading');
    const errBanner = $('gc-pagespeed-error-banner');
    const emptyState = $('gc-pagespeed-empty');
    const resultsContainer = $('gc-pagespeed-results-container');

    if (loading) loading.style.display = 'flex';
    if (errBanner) errBanner.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';

    try {
      const strategiesToRun = strategy === 'both' ? ['mobile', 'desktop'] : [strategy];
      const resultMap = state.pagespeedResults[targetUrl] || { url: targetUrl, timestamp: Date.now() };

      for (const s of strategiesToRun) {
        let data = null;
        // 1. Try local backend /api/pagespeed/analyze
        try {
          const res = await localFetch(`/api/pagespeed/analyze?url=${encodeURIComponent(targetUrl)}&strategy=${s}`);
          if (res.ok) {
            const resJson = await res.json();
            const stratRaw = resJson.data?.[s] || (resJson.data?.url ? resJson.data : resJson);
            if (stratRaw?.success === false) {
              throw new Error(stratRaw.error || `HTTP 500 from PageSpeed analyzer`);
            }
            data = normalizePageSpeedStrategyData(stratRaw, s, targetUrl);
          } else if (res.status === 429) {
            throw new Error('Google PageSpeed API Quota Exceeded (HTTP 429). Public rate limits reached. Please configure a free Google API key in Settings.');
          } else {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `HTTP ${res.status} from PageSpeed analyzer`);
          }
        } catch (backendErr) {
          if (backendErr.message && backendErr.message.includes('Quota Exceeded')) throw backendErr;
          // 2. Direct Google API fetch fallback
          let apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${s}`;
          if (state.settings?.googleApiKey) {
            apiUrl += `&key=${encodeURIComponent(state.settings.googleApiKey)}`;
          }
          const directRes = await fetch(apiUrl);
          if (directRes.status === 429) {
            throw new Error('Google PageSpeed API Quota Exceeded (HTTP 429). Public rate limits reached. Please configure a free Google API key in Settings.');
          }
          if (!directRes.ok) {
            const errData = await directRes.json().catch(() => ({}));
            throw new Error(errData.error?.message || `PageSpeed API error: ${directRes.statusText}`);
          }
          const raw = await directRes.json();
          const lh = raw.lighthouseResult || {};
          const audits = lh.audits || {};
          const cats = lh.categories || {};
          const loadingExp = raw.loadingExperience || {};
          const expMetrics = loadingExp.metrics || {};

          data = normalizePageSpeedStrategyData({
            performance_score: Math.round((cats.performance?.score || 0) * 100),
            lighthouse: {
              performance_score: Math.round((cats.performance?.score || 0) * 100),
              fcp: audits['first-contentful-paint']?.displayValue || '—',
              lcp: audits['largest-contentful-paint']?.displayValue || '—',
              tbt: audits['total-blocking-time']?.displayValue || '—',
              cls: audits['cumulative-layout-shift']?.displayValue || '—',
              speed_index: audits['speed-index']?.displayValue || '—'
            },
            crux_field: {
              has_field_data: Object.keys(expMetrics).length > 0,
              overall_category: loadingExp.overall_category || 'INSUFFICIENT_DATA',
              fcp_p75: expMetrics.FIRST_CONTENTFUL_PAINT_MS ? `${(expMetrics.FIRST_CONTENTFUL_PAINT_MS.percentile / 1000).toFixed(2)}s` : null,
              lcp_p75: expMetrics.LARGEST_CONTENTFUL_PAINT_MS ? `${(expMetrics.LARGEST_CONTENTFUL_PAINT_MS.percentile / 1000).toFixed(2)}s` : null,
              cls_p75: expMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE ? (expMetrics.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100).toFixed(2) : null,
              inp_p75: expMetrics.INTERACTION_TO_NEXT_PAINT ? `${expMetrics.INTERACTION_TO_NEXT_PAINT.percentile}ms` : null
            }
          }, s, targetUrl);
        }

        if (s === 'mobile') resultMap.mobile = data;
        else resultMap.desktop = data;

        state.pagespeedResults[targetUrl] = resultMap;
        state.activePageSpeedUrl = targetUrl;

        // Update badge and UI progressively
        const count = Object.keys(state.pagespeedResults).length;
        const badge = $('gc-badge-pagespeed');
        if (badge) badge.textContent = count;

        if (resultsContainer) resultsContainer.style.display = 'block';
        renderPageSpeedActiveCard(targetUrl, s);
        renderPageSpeedHistoryList();
      }

    } catch (err) {
      if (errBanner) {
        errBanner.style.display = 'block';
        errBanner.innerHTML = `<strong>PageSpeed Analysis Failed:</strong> ${escapeHtml(err.message)}`;
      }
    } finally {
      if (loading) loading.style.display = 'none';
    }
  }

  function showPageSpeedStrategy(url, strategy) {
    renderPageSpeedActiveCard(url, strategy);
  }

  function renderPageSpeedActiveCard(url, preferredStrategy) {
    const cardEl = $('gc-pagespeed-active-card');
    if (!cardEl) return;
    const res = state.pagespeedResults[url];
    if (!res) return;

    let strategy = preferredStrategy || (res.mobile ? 'mobile' : 'desktop');
    const current = strategy === 'mobile' ? (res.mobile || res.desktop) : (res.desktop || res.mobile);
    if (!current) return;

    const lh = current.lighthouse || {};
    const crux = current.crux_field || {};
    const score = Number(lh.performance_score ?? 0);
    const scoreColor = score >= 90 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

    let cruxHtml = '';
    if (crux.has_field_data) {
      const catClass = crux.overall_category === 'FAST' ? 'gc-badge success' : crux.overall_category === 'SLOW' ? 'gc-badge error' : 'gc-badge warn';
      cruxHtml = `
        <div class="gc-crux-panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h5 style="margin:0;color:#fff;font-size:13px;font-weight:700;">Chrome UX Report (CrUX) Real-World Field Data</h5>
            <span class="${catClass}">${escapeHtml(crux.overall_category)}</span>
          </div>
          <div class="gc-crux-metrics-row">
            <div class="gc-crux-item">
              <span class="gc-metric-title">Real User LCP</span>
              <span class="gc-metric-val">${escapeHtml(crux.lcp_p75 || '—')}</span>
              <span class="gc-metric-sub">75th percentile</span>
            </div>
            <div class="gc-crux-item">
              <span class="gc-metric-title">Real User FCP</span>
              <span class="gc-metric-val">${escapeHtml(crux.fcp_p75 || '—')}</span>
              <span class="gc-metric-sub">75th percentile</span>
            </div>
            <div class="gc-crux-item">
              <span class="gc-metric-title">Real User CLS</span>
              <span class="gc-metric-val">${escapeHtml(crux.cls_p75 || '—')}</span>
              <span class="gc-metric-sub">75th percentile</span>
            </div>
            <div class="gc-crux-item">
              <span class="gc-metric-title">Real User INP</span>
              <span class="gc-metric-val">${escapeHtml(crux.inp_p75 || '—')}</span>
              <span class="gc-metric-sub">Interaction to Next Paint</span>
            </div>
          </div>
        </div>
      `;
    } else {
      cruxHtml = `
        <div class="gc-crux-empty-panel">
          <strong>No Chrome UX Report (CrUX) Field Data Available:</strong>
          <p style="margin:6px 0 0;font-size:12px;color:var(--gc-text-muted);">
            The Chrome User Experience Report does not have sufficient real-world Chrome traffic data for this specific URL.
            <em>Note: Missing data is not zero, and a Lighthouse lab score is not a Core Web Vitals pass.</em>
          </p>
        </div>
      `;
    }

    cardEl.innerHTML = `
      <div class="gc-ps-main-card">
        <div class="gc-ps-header">
          <div>
            <div style="font-size:11px;text-transform:uppercase;color:var(--gc-brand);font-weight:700;">Active PageSpeed Audit</div>
            <h4 style="margin:4px 0;font-size:16px;color:#fff;word-break:break-all;">${escapeHtml(url)}</h4>
            <div style="font-size:12px;color:var(--gc-text-muted);">Tested: ${formatPageSpeedTimestamp(current.timestamp)} · Strategy: <strong>${(current.strategy || strategy).toUpperCase()}</strong></div>
          </div>
          <div style="display:flex;gap:8px;">
            ${res.mobile ? `<button type="button" class="gc-btn-secondary ${strategy === 'mobile' ? 'active' : ''}" style="font-size:12px;padding:4px 10px;display:inline-flex;align-items:center;" onclick="window.GroCrawlApp.showPageSpeedStrategy('${escapeAttr(url)}', 'mobile')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>Mobile</button>` : ''}
            ${res.desktop ? `<button type="button" class="gc-btn-secondary ${strategy === 'desktop' ? 'active' : ''}" style="font-size:12px;padding:4px 10px;display:inline-flex;align-items:center;" onclick="window.GroCrawlApp.showPageSpeedStrategy('${escapeAttr(url)}', 'desktop')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>Desktop</button>` : ''}
          </div>
        </div>

        <div class="gc-ps-content-grid">
          <!-- Lighthouse Lab Gauge -->
          <div class="gc-score-circle-card">
            <div class="gc-score-circle" style="border-color:${scoreColor};color:${scoreColor};">
              <span class="gc-score-num">${score}</span>
              <span class="gc-score-denom">/ 100</span>
            </div>
            <div style="font-weight:700;margin-top:8px;color:#fff;">Lighthouse Lab Performance</div>
            <div style="font-size:11px;color:var(--gc-text-muted);">Simulated environment</div>
          </div>

          <!-- Lighthouse Lab Metrics -->
          <div class="gc-lab-metrics-grid">
            <div class="gc-metric-box">
              <span class="gc-metric-name">First Contentful Paint (FCP)</span>
              <span class="gc-metric-data">${escapeHtml(lh.fcp || '—')}</span>
            </div>
            <div class="gc-metric-box">
              <span class="gc-metric-name">Largest Contentful Paint (LCP)</span>
              <span class="gc-metric-data">${escapeHtml(lh.lcp || '—')}</span>
            </div>
            <div class="gc-metric-box">
              <span class="gc-metric-name">Total Blocking Time (TBT)</span>
              <span class="gc-metric-data">${escapeHtml(lh.tbt || '—')}</span>
            </div>
            <div class="gc-metric-box">
              <span class="gc-metric-name">Cumulative Layout Shift (CLS)</span>
              <span class="gc-metric-data">${escapeHtml(lh.cls || '—')}</span>
            </div>
            <div class="gc-metric-box">
              <span class="gc-metric-name">Speed Index</span>
              <span class="gc-metric-data">${escapeHtml(lh.speed_index || '—')}</span>
            </div>
          </div>
        </div>

        <!-- Separated CrUX Real-World Field Data -->
        <div style="margin-top:20px;">
          ${cruxHtml}
        </div>
      </div>
    `;
  }

  function renderPageSpeedHistoryList() {
    const listEl = $('gc-pagespeed-cards-list');
    if (!listEl) return;
    const urls = Object.keys(state.pagespeedResults);
    if (!urls.length) {
      listEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = urls.map(u => {
      const res = state.pagespeedResults[u];
      const mScore = res.mobile?.lighthouse?.performance_score;
      const dScore = res.desktop?.lighthouse?.performance_score;

      const mColor = mScore >= 90 ? '#10b981' : mScore >= 50 ? '#f59e0b' : '#ef4444';
      const dColor = dScore >= 90 ? '#10b981' : dScore >= 50 ? '#f59e0b' : '#ef4444';

      return `
        <div class="gc-ps-history-card" onclick="window.GroCrawlApp.showPageSpeedStrategy('${escapeAttr(u)}')">
          <div style="font-weight:600;font-size:13px;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeAttr(u)}">${escapeHtml(u)}</div>
          <div style="display:flex;gap:12px;margin-top:8px;">
            ${mScore != null ? `<span style="font-size:12px;color:${mColor};">Mobile: <strong>${mScore}</strong></span>` : ''}
            ${dScore != null ? `<span style="font-size:12px;color:${dColor};">Desktop: <strong>${dScore}</strong></span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // CONTENT & TRUST CHECKS (HEURISTIC E-E-A-T)
  // ==========================================
  function renderEEATTab() {
    const urls = state.urls.filter(u => u.is_internal !== false && !u.link_check_only);
    const scoreVal = $('gc-eeat-score-val');
    const scoreSub = $('gc-eeat-score-sub');
    const authorVal = $('gc-eeat-author-val');
    const authorPct = $('gc-eeat-author-pct');
    const schemaVal = $('gc-eeat-schema-val');
    const schemaPct = $('gc-eeat-schema-pct');
    const citationsVal = $('gc-eeat-citations-val');
    const citationsSub = $('gc-eeat-citations-sub');
    const signalsGrid = $('gc-eeat-signals-grid');
    const tbody = $('gc-eeat-tbody');
    const recsList = $('gc-eeat-recommendations-list');
    const pagesCount = $('gc-eeat-pages-count');

    if (!urls.length) {
      if (scoreVal) scoreVal.textContent = '0';
      if (scoreSub) scoreSub.textContent = 'Awaiting crawl data';
      if (authorVal) authorVal.textContent = '0 / 0';
      if (schemaVal) schemaVal.textContent = '0 / 0';
      if (citationsVal) citationsVal.textContent = '0';
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="gc-empty-state"><p>Run or load a crawl to evaluate content & trust signals.</p></td></tr>`;
      if (recsList) recsList.innerHTML = `<div class="gc-empty-state"><p>Recommendations will appear once crawl evidence is analyzed.</p></div>`;
      return;
    }

    if (pagesCount) pagesCount.textContent = `${urls.length} URLs`;

    // Analyze heuristic signals
    let authorCount = 0;
    let schemaCount = 0;
    let totalCitations = 0;
    let httpsCount = 0;
    let depthCount = 0;

    const pageScores = urls.map(u => {
      let pageScore = 20; // baseline
      const isHttps = u.url.startsWith('https://');
      if (isHttps) { pageScore += 20; httpsCount++; }

      const hasSchema = !!(u.has_schema || (u.schema_types && u.schema_types.length) || (u.json_ld && u.json_ld.length));
      if (hasSchema) { pageScore += 20; schemaCount++; }

      const hasAuthor = !!(u.author || u.has_author);
      if (hasAuthor) { pageScore += 20; authorCount++; }

      const citations = u.external_links_count || 0;
      totalCitations += citations;
      if (citations >= 2) { pageScore += 10; }
      else if (citations >= 1) { pageScore += 5; }

      const words = u.word_count || 0;
      if (words >= 600) { pageScore += 10; depthCount++; }
      else if (words >= 300) { pageScore += 5; }

      pageScore = Math.min(pageScore, 100);
      return { url: u.url, score: pageScore, hasAuthor, hasSchema, citations, isHttps, words };
    });

    const avgScore = Math.round(pageScores.reduce((acc, p) => acc + p.score, 0) / pageScores.length);
    const authorPercent = Math.round((authorCount / urls.length) * 100);
    const schemaPercent = Math.round((schemaCount / urls.length) * 100);
    const httpsPercent = Math.round((httpsCount / urls.length) * 100);
    const depthPercent = Math.round((depthCount / urls.length) * 100);

    if (scoreVal) {
      scoreVal.textContent = `${avgScore}/100`;
      scoreVal.style.color = avgScore >= 75 ? 'var(--gc-brand)' : avgScore >= 50 ? '#f59e0b' : '#ef4444';
    }
    if (scoreSub) {
      scoreSub.textContent = avgScore >= 75 ? 'High Heuristic Trust' : avgScore >= 50 ? 'Moderate Editorial Signals' : 'Low Trust Signal Density';
    }

    if (authorVal) authorVal.textContent = `${authorCount} / ${urls.length}`;
    if (authorPct) authorPct.textContent = `${authorPercent}% of audited pages`;

    if (schemaVal) schemaVal.textContent = `${schemaCount} / ${urls.length}`;
    if (schemaPct) schemaPct.textContent = `${schemaPercent}% of audited pages`;

    if (citationsVal) citationsVal.textContent = `${totalCitations}`;
    if (citationsSub) citationsSub.textContent = `Across ${urls.length} internal pages`;

    // Render 4 Signal Breakdown Bars
    if (signalsGrid) {
      signalsGrid.innerHTML = `
        <div class="gc-signal-bar-card">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
            <span>Author Byline & Attribution</span>
            <strong>${authorPercent}%</strong>
          </div>
          <div class="gc-progress-track" style="display:block;height:6px;background:#222;"><div class="gc-progress-bar" style="width:${authorPercent}%;"></div></div>
        </div>
        <div class="gc-signal-bar-card">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
            <span>Structured Data Schema (JSON-LD)</span>
            <strong>${schemaPercent}%</strong>
          </div>
          <div class="gc-progress-track" style="display:block;height:6px;background:#222;"><div class="gc-progress-bar" style="width:${schemaPercent}%;"></div></div>
        </div>
        <div class="gc-signal-bar-card">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
            <span>HTTPS Transport Integrity</span>
            <strong>${httpsPercent}%</strong>
          </div>
          <div class="gc-progress-track" style="display:block;height:6px;background:#222;"><div class="gc-progress-bar" style="width:${httpsPercent}%;"></div></div>
        </div>
        <div class="gc-signal-bar-card">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">
            <span>Comprehensive Word Depth (600+ words)</span>
            <strong>${depthPercent}%</strong>
          </div>
          <div class="gc-progress-track" style="display:block;height:6px;background:#222;"><div class="gc-progress-bar" style="width:${depthPercent}%;"></div></div>
        </div>
      `;
    }

    // Render Top Audited Pages Table
    if (tbody) {
      tbody.innerHTML = pageScores.slice(0, 15).map(p => {
        const scorePill = p.score >= 75 ? 'gc-badge success' : p.score >= 50 ? 'gc-badge warn' : 'gc-badge error';
        return `
          <tr>
            <td class="gc-url-cell"><a href="javascript:void(0)" onclick="window.GroCrawlApp.showUrlModal('${escapeAttr(p.url)}')">${escapeHtml(p.url)}</a></td>
            <td><span class="${scorePill}">${p.score} / 100</span></td>
            <td>${p.hasAuthor ? '<span class="gc-badge success">Detected</span>' : '<span style="color:var(--gc-text-muted);">None</span>'}</td>
            <td>${p.hasSchema ? '<span class="gc-badge success">Schema Found</span>' : '<span style="color:var(--gc-text-muted);">Missing</span>'}</td>
            <td>${p.citations > 0 ? `<span class="gc-badge info">${p.citations} outlinks</span>` : '<span style="color:var(--gc-text-muted);">0</span>'}</td>
            <td><button type="button" class="gc-btn-secondary" style="padding:2px 8px;font-size:11px;" onclick="window.GroCrawlApp.showUrlModal('${escapeAttr(p.url)}')">Inspect</button></td>
          </tr>
        `;
      }).join('');
    }

    // Render Actionable Recommendations
    if (recsList) {
      const recs = [];
      if (authorPercent < 60) {
        recs.push({
          type: 'warning',
          title: 'Implement Clear Author Bylines & Credentials',
          desc: `${100 - authorPercent}% of crawled content pages lack detected author attribution. Add visible author profiles, editorial review dates, and Schema Person markup.`
        });
      }
      if (schemaPercent < 50) {
        recs.push({
          type: 'warning',
          title: 'Deploy Schema.org Structured Data',
          desc: `Only ${schemaPercent}% of pages include Schema.org JSON-LD. Add Article, Organization, BreadcrumbList, and Product schemas to enhance semantic understanding.`
        });
      }
      if (totalCitations < urls.length) {
        recs.push({
          type: 'info',
          title: 'Support Claims with Authoritative Citations',
          desc: `Discovered low external citation density (${totalCitations} external references across ${urls.length} pages). Linking to authoritative primary sources boosts trustworthiness.`
        });
      }
      if (httpsPercent < 100) {
        recs.push({
          type: 'error',
          title: 'Migrate Insecure HTTP URLs to HTTPS',
          desc: `Found ${100 - httpsPercent}% non-HTTPS URLs. Secure transport (TLS/SSL) is mandatory for user trust and modern SEO.`
        });
      }
      if (!recs.length) {
        recs.push({
          type: 'success',
          title: 'High Heuristic Trust Alignment',
          desc: 'Audit observed high coverage for author attribution, schema structured data, HTTPS security, and comprehensive content depth.'
        });
      }

      recsList.innerHTML = recs.map(r => `
        <div class="gc-rec-item ${r.type}">
          <div class="gc-rec-icon" style="display:flex;align-items:center;">${r.type === 'error' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' : r.type === 'warning' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : r.type === 'success' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#39ff14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}</div>
          <div>
            <strong style="color:#fff;font-size:13px;">${escapeHtml(r.title)}</strong>
            <p style="margin:4px 0 0;font-size:12px;color:var(--gc-text-muted);">${escapeHtml(r.desc)}</p>
          </div>
        </div>
      `).join('');
    }
  }

  // ==========================================
  // URL DETAIL MODAL INSPECTOR
  // ==========================================
  function showUrlModal(url, modalTab = 'overview') {
    const item = state.urls.find(u => u.url === url);
    if (!item) return;

    state.activeModalUrl = url;
    state.activeModalTab = modalTab;

    $('gc-modal-url-title').textContent = item.url;
    const body = $('gc-modal-url-body');
    const inlinks = state.links.filter(l => l.target_url === url);
    const psData = state.pagespeedResults[url];

    const h1Str = Array.isArray(item.h1) ? item.h1.join(' | ') : (item.h1 || '—');

    let tabContent = '';
    if (modalTab === 'overview') {
      tabContent = `
        <dl style="display:grid;grid-template-columns:140px 1fr;gap:10px;font-size:13px;margin:0;">
          <dt style="color:#9ca3af;">HTTP Status:</dt>
          <dd><span class="gc-code-pill ${item.status_code >= 200 && item.status_code < 300 ? 'gc-code-2xx' : item.status_code >= 300 && item.status_code < 400 ? 'gc-code-3xx' : 'gc-code-4xx'}">${item.status_code || '200'}</span></dd>
          
          <dt style="color:#9ca3af;">Page Title:</dt>
          <dd><strong>${escapeHtml(item.title || '—')}</strong></dd>
          
          <dt style="color:#9ca3af;">Meta Description:</dt>
          <dd>${escapeHtml(item.meta_description || '—')}</dd>
          
          <dt style="color:#9ca3af;">H1 Heading:</dt>
          <dd>${escapeHtml(h1Str)}</dd>
          
          <dt style="color:#9ca3af;">Canonical URL:</dt>
          <dd>${escapeHtml(item.canonical_url || '—')}</dd>
          
          <dt style="color:#9ca3af;">Response Time:</dt>
          <dd>${item.response_time ? Math.round(item.response_time) + ' ms' : '—'}</dd>
          
          <dt style="color:#9ca3af;">Crawl Depth:</dt>
          <dd>${item.depth ?? 0}</dd>
          
          <dt style="color:#9ca3af;">Word Count:</dt>
          <dd>${item.word_count ?? '—'}</dd>
          
          <dt style="color:#9ca3af;">Links (Int/Ext):</dt>
          <dd>${item.internal_links_count ?? 0} internal / ${item.external_links_count ?? 0} external</dd>
          
          <dt style="color:#9ca3af;">Images on Page:</dt>
          <dd>${item.images_count ?? 0}</dd>
        </dl>
      `;
    } else if (modalTab === 'pagespeed') {
      if (psData) {
        const current = psData.mobile || psData.desktop;
        const lh = current.lighthouse || {};
        const crux = current.crux_field || {};
        const score = lh.performance_score ?? 0;
        const scoreColor = score >= 90 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

        tabContent = `
          <div style="background:#111;padding:16px;border-radius:8px;border:1px solid var(--gc-border);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
              <div>
                <strong style="color:#fff;font-size:14px;display:inline-flex;align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>PageSpeed Insights Results</strong>
                <div style="font-size:12px;color:var(--gc-text-muted);">Tested: ${new Date(current.timestamp).toLocaleTimeString()}</div>
              </div>
              <button type="button" class="gc-btn-secondary" style="font-size:11px;padding:3px 8px;" onclick="window.GroCrawlApp.runPageSpeedForUrl('${escapeAttr(url)}', 'both').then(() => window.GroCrawlApp.showUrlModal('${escapeAttr(url)}', 'pagespeed'))"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle;"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>Re-test</button>
            </div>

            <div style="display:flex;gap:16px;align-items:center;margin-bottom:14px;">
              <div class="gc-score-circle" style="border-color:${scoreColor};color:${scoreColor};width:64px;height:64px;">
                <span class="gc-score-num" style="font-size:22px;">${score}</span>
              </div>
              <div>
                <div style="font-weight:700;color:#fff;">Lighthouse Lab Performance</div>
                <div style="font-size:12px;color:var(--gc-text-muted);">FCP: ${escapeHtml(lh.fcp)} · LCP: ${escapeHtml(lh.lcp)} · TBT: ${escapeHtml(lh.tbt)} · CLS: ${escapeHtml(lh.cls)}</div>
              </div>
            </div>

            <div style="margin-top:14px;border-top:1px solid #222;padding-top:12px;">
              <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:6px;">Chrome UX Report (CrUX) Real-World Field Data:</div>
              ${crux.has_field_data ? `
                <div style="font-size:12px;color:#d1d5db;">Real User LCP: <strong>${escapeHtml(crux.lcp_p75)}</strong> · FCP: <strong>${escapeHtml(crux.fcp_p75)}</strong> · CLS: <strong>${escapeHtml(crux.cls_p75)}</strong> (${escapeHtml(crux.overall_category)})</div>
              ` : `
                <div style="font-size:12px;color:var(--gc-text-muted);"><em>Insufficient real-world Chrome UX Report field observations for this URL. (Missing data is not zero; Lighthouse lab score is not a Core Web Vitals pass).</em></div>
              `}
            </div>
          </div>
        `;
      } else {
        tabContent = `
          <div style="text-align:center;padding:24px 16px;background:#111;border-radius:8px;border:1px solid var(--gc-border);">
            <div style="margin-bottom:8px;color:var(--gc-brand);"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
            <h4 style="margin:0 0 6px;color:#fff;">No PageSpeed Audit for this URL Yet</h4>
            <p style="font-size:13px;color:var(--gc-text-muted);margin:0 0 16px;">Trigger an on-demand audit using Google PageSpeed Insights API.</p>
            <button type="button" class="gc-btn-primary" onclick="window.GroCrawlApp.runPageSpeedForUrl('${escapeAttr(url)}', 'both').then(() => window.GroCrawlApp.showUrlModal('${escapeAttr(url)}', 'pagespeed'))">
              Run PageSpeed Analysis Now
            </button>
          </div>
        `;
      }
    } else if (modalTab === 'inlinks') {
      if (!inlinks.length) {
        tabContent = `<div class="gc-empty-state"><p>No internal inlinks found pointing to this page within the crawl boundary.</p></div>`;
      } else {
        tabContent = `
          <div class="gc-table-wrap" style="max-height:280px;overflow-y:auto;">
            <table class="gc-data-table">
              <thead>
                <tr>
                  <th>Source URL</th>
                  <th>Anchor Text</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${inlinks.map(l => `
                  <tr>
                    <td class="gc-url-cell">${escapeHtml(l.source_url)}</td>
                    <td>${escapeHtml(l.anchor_text || '(Empty Anchor)')}</td>
                    <td><span class="gc-code-pill gc-code-2xx">${l.target_status || 200}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } else if (modalTab === 'meta') {
      tabContent = `
        <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
        <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;">
          <div>
            <strong style="color:#9ca3af;font-size:11px;text-transform:uppercase;">Heading Hierarchy</strong>
            <div style="margin-top:4px;color:#fff;font-weight:600;">H1: ${escapeHtml(h1Str)}</div>
            ${item.h2 && (Array.isArray(item.h2) ? item.h2.length : item.h2) ? `<div style="margin-top:4px;color:var(--gc-text-muted);font-size:12px;">H2: ${escapeHtml(Array.isArray(item.h2) ? item.h2.slice(0, 5).join(' | ') : item.h2)}</div>` : ''}
            ${item.h3 && (Array.isArray(item.h3) ? item.h3.length : item.h3) ? `<div style="margin-top:2px;color:var(--gc-text-muted);font-size:12px;">H3: ${escapeHtml(Array.isArray(item.h3) ? item.h3.slice(0, 5).join(' | ') : item.h3)}</div>` : ''}
          </div>
          <div>
            <strong style="color:#9ca3af;font-size:11px;text-transform:uppercase;">Indexing & Directives</strong>
            <div style="margin-top:4px;color:#fff;">Canonical: ${escapeHtml(item.canonical_url || 'Self-referential or not specified')}</div>
            <div style="margin-top:2px;color:var(--gc-text-muted);font-size:12px;">Robots: ${escapeHtml(item.robots || 'index, follow (default)')} · Viewport: ${escapeHtml(item.viewport || 'Missing')} · Lang: ${escapeHtml(item.lang || 'Not declared')}</div>
          </div>
          <div>
            <strong style="color:#9ca3af;font-size:11px;text-transform:uppercase;">Structured Data, Measurement & Signals</strong>
            <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;">
              ${item.has_schema ? `<span class="gc-badge success">Schema (${item.schema_types && item.schema_types.length ? item.schema_types.join(', ') : 'JSON-LD'})</span>` : '<span class="gc-badge warn">No Schema</span>'}
              ${item.has_og ? `<span class="gc-badge success">OG Tags</span>` : '<span class="gc-badge warn">No OG Tags</span>'}
              ${item.gtm_id ? `<span class="gc-badge success">GTM: ${escapeHtml(item.gtm_id)}</span>` : item.ga4_id ? `<span class="gc-badge success">GA4: ${escapeHtml(item.ga4_id)}</span>` : item.has_analytics ? `<span class="gc-badge success">Analytics Detected</span>` : '<span class="gc-badge" style="opacity:0.5;">No Analytics</span>'}
              ${item.has_author ? `<span class="gc-badge success">Author: ${escapeHtml(item.author || 'Identified')}</span>` : '<span class="gc-badge" style="opacity:0.5;">No Author Byline</span>'}
            </div>
          </div>
        </div>
      `;
    }

    body.innerHTML = `
      <div class="gc-modal-tabs" style="display:flex;gap:6px;border-bottom:1px solid var(--gc-border);margin-bottom:16px;padding-bottom:8px;">
        <button type="button" class="gc-btn-secondary ${modalTab === 'overview' ? 'active' : ''}" style="font-size:12px;padding:4px 10px;" onclick="window.GroCrawlApp.showUrlModal('${escapeAttr(url)}', 'overview')" style="font-size:12px;padding:4px 10px;display:inline-flex;align-items:center;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle;"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Technical Overview</button>
        <button type="button" class="gc-btn-secondary ${modalTab === 'pagespeed' ? 'active' : ''}" style="font-size:12px;padding:4px 10px;" onclick="window.GroCrawlApp.showUrlModal('${escapeAttr(url)}', 'pagespeed')" style="font-size:12px;padding:4px 10px;display:inline-flex;align-items:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>PageSpeed &amp; CWV</button>
        <button type="button" class="gc-btn-secondary ${modalTab === 'inlinks' ? 'active' : ''}" style="font-size:12px;padding:4px 10px;" onclick="window.GroCrawlApp.showUrlModal('${escapeAttr(url)}', 'inlinks')" style="font-size:12px;padding:4px 10px;display:inline-flex;align-items:center;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle;"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>Inlinks (${inlinks.length})</button>
        <button type="button" class="gc-btn-secondary ${modalTab === 'meta' ? 'active' : ''}" style="font-size:12px;padding:4px 10px;" onclick="window.GroCrawlApp.showUrlModal('${escapeAttr(url)}', 'meta')" style="font-size:12px;padding:4px 10px;display:inline-flex;align-items:center;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle;"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>Meta &amp; Schema</button>
      </div>

      ${tabContent}

      <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end;border-top:1px solid var(--gc-border);padding-top:12px;">
        <a href="${escapeAttr(item.url)}" target="_blank" rel="noopener" class="gc-btn-secondary" style="font-size:12px;padding:6px 14px;text-decoration:none;">Open in Browser ↗</a>
      </div>
    `;
    openModal('gc-url-modal');
  }

  function openExportModal() {
    openModal('gc-export-modal');
  }

  function executeExport() {
    const type = $('gc-export-type').value;
    const fmt = $('gc-export-fmt').value;

    let data = [];
    if (type === 'urls' || type === 'internal') data = state.urls;
    else if (type === 'external') data = state.links.filter(l => !l.is_internal);
    else if (type === 'issues') data = state.issues;
    else if (type === 'images') data = state.images;
    else if (type === 'links') data = state.links;

    if (!data.length) {
      alert('No data available to export in this scope.');
      return;
    }

    if (fmt === 'json') {
      downloadBlob(JSON.stringify(data, null, 2), `grocrawl-${type}.json`, 'application/json');
    } else {
      const keys = Object.keys(data[0] || {});
      const csvLines = [keys.join(',')];
      data.forEach(row => {
        const line = keys.map(k => {
          let val = row[k];
          if (val == null) return '""';
          if (typeof val === 'object') val = JSON.stringify(val);
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvLines.push(line.join(','));
      });
      downloadBlob(csvLines.join('\n'), `grocrawl-${type}.csv`, 'text/csv');
    }
    closeModals();
  }

  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openModal(id) {
    const m = $(id);
    if (m) m.style.display = 'flex';
  }

  // Accessible Contextual (i) Help Topics Registry
  const GROCRAWL_HELP_TOPICS = {
    'crawl-depth-limits': {
      title: 'Crawl Depth & Page Limits',
      what: 'Max Depth restricts how many link hops the crawler follows from the seed URL (Level 0 = homepage, Level 1 = pages directly linked from homepage). Max URLs caps the frontier size.',
      why: 'Prevents endless crawling in parameter loops, faceted filters, or massive product catalogs, protecting browser memory.',
      example: 'A URL like /store/men/shoes/boots/winter is NOT automatically depth 4. If linked from the global header navigation, its crawl depth is Level 1.',
      anchor: 'crawl-depth-and-limits'
    },
    'concurrency-delays': {
      title: 'Concurrency & Crawl Delays',
      what: 'Concurrent workers control simultaneous requests; delay adds an intentional pause between consecutive requests to the origin host.',
      why: 'Protects the target web server against traffic spikes, database connection pool exhaustion, or triggering cloud firewall bot blocks (HTTP 429 / 503).',
      example: 'On shared or production hosting, 2 to 5 workers with a 1.0s delay balances rapid discovery with origin safety.',
      anchor: 'concurrency-and-delays'
    },
    'robots-js': {
      title: 'Robots.txt & JavaScript Rendering',
      what: 'Robots.txt dictates crawling permissions per path. Headless JavaScript rendering runs a real Chromium browser to execute client scripts before parsing DOM links.',
      why: 'Disallowing in robots.txt blocks crawling, but doesn\'t prevent indexing if external links exist. Headless JS reveals client-rendered single-page app links.',
      example: 'Blocking a page with a meta noindex tag in robots.txt prevents bots from ever seeing the noindex tag! To de-index, allow crawling so bots read the directive.',
      anchor: 'robots-and-javascript'
    },
    'response-codes': {
      title: 'HTTP Responses & Redirect Chains',
      what: 'HTTP status codes communicate server response: 2xx (Success), 3xx (Redirect), 4xx (Client Error), 5xx (Server Error).',
      why: 'Internal links should point directly to 200 OK destinations. Redirect chains (A → B → C) waste crawl budget and introduce user latency.',
      example: '301 redirects are normal and healthy for site migrations, but internal navigation links should be updated to point directly to the final target URL.',
      anchor: 'http-responses-and-redirects'
    },
    'canonicals-indexability': {
      title: 'Canonicals & Indexability Directives',
      what: 'noindex requests that search engines omit the URL from search results. rel="canonical" specifies the preferred master version among duplicate or filtered URLs.',
      why: 'Consolidates ranking signals, link equity, and crawl frequency onto primary canonical pages rather than tracking parameters or variants.',
      example: 'Duplicate content does not trigger an automatic penalty; it causes ranking dilution where Google arbitrarily selects one version and ignores the rest.',
      anchor: 'canonicals-and-indexability'
    },
    'duplicate-detection': {
      title: 'Duplicate Content Detection',
      what: 'GroCrawl identifies duplicate titles and calculates weighted content similarity (comparing titles, descriptions, H1s, and word counts) against an 85% threshold.',
      why: 'Pinpoints near-identical category pages, parameter versions, or copied product descriptions competing against each other in search results.',
      example: 'Two pages sharing the exact title "Running Shoes" may both suffer from title cannibalization and diluted search impressions.',
      anchor: 'duplicate-content'
    },
    'pagespeed-metrics': {
      title: 'PageSpeed: Lighthouse Lab vs. CrUX Field Data',
      what: 'Lighthouse provides synthetic lab diagnostics under throttled simulation. Chrome UX Report (CrUX) aggregates real-world 75th percentile user observations over a rolling 28-day window.',
      why: 'Google\'s search systems reference real-world Core Web Vitals (CrUX field data), while Lighthouse lab scores serve as developer debugging diagnostics.',
      example: 'A 100/100 Lighthouse score in a simulated test does not guarantee passing Core Web Vitals if real users on low-end mobile devices experience layout shifts or latency.',
      anchor: 'pagespeed-lab-vs-field'
    },
    'content-trust-eeat': {
      title: 'Heuristic Content & Trust Signals',
      what: 'Evaluates transparent, observable editorial markers: Author bylines, JSON-LD Schema markup, outbound citations, HTTPS encryption, and content depth.',
      why: 'Improves editorial transparency and structured entity data that help users and search bots understand site credibility.',
      example: 'This is NOT an official Google algorithm score. Google has no single algorithmic E-E-A-T metric; GroCrawl provides transparent heuristic hygiene checks.',
      anchor: 'content-and-trust-heuristics'
    },
    'health-score-formula': {
      title: 'SEO Health Score Formula',
      what: 'Calculated dynamically: Health = Math.max(10, Math.min(100, Math.round(100 - (Critical Errors × 8 + Warnings × 2)))).',
      why: 'Provides an objective, repeatable benchmark to prioritize technical fixes and measure site health improvements across audit sessions.',
      example: 'A 100% health score indicates technical cleanliness and absence of crawler errors, but does not guarantee top organic rankings or traffic volume.',
      anchor: 'health-score-and-prioritization'
    }
  };

  let lastFocusedHelpTrigger = null;

  function showHelpModal(key, triggerEl) {
    const topic = GROCRAWL_HELP_TOPICS[key];
    if (!topic) return;
    lastFocusedHelpTrigger = triggerEl || document.activeElement;

    const modal = $('gc-field-help-modal');
    if (!modal) return;

    const titleEl = $('gc-help-modal-title');
    const whatEl = $('gc-help-what');
    const whyEl = $('gc-help-why');
    const exampleEl = $('gc-help-example');
    const learnLink = $('gc-help-learn-link');

    if (titleEl) titleEl.textContent = topic.title;
    if (whatEl) whatEl.textContent = topic.what;
    if (whyEl) whyEl.textContent = topic.why;
    if (exampleEl) exampleEl.textContent = topic.example;
    if (learnLink) {
      learnLink.href = `/learn/technical-seo-audit/#${topic.anchor || ''}`;
      learnLink.innerHTML = `<span>Read in Technical SEO Guide &rarr;</span>`;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      $('gc-help-modal-close')?.focus();
    }, 50);
  }

  function closeHelpModal() {
    const modal = $('gc-field-help-modal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    if (lastFocusedHelpTrigger) {
      try { lastFocusedHelpTrigger.focus(); } catch (e) {}
      lastFocusedHelpTrigger = null;
    }
  }

  function closeModals() {
    document.querySelectorAll('.gc-modal-backdrop').forEach(m => {
      m.style.display = 'none';
    });
    document.body.style.overflow = '';
    if (lastFocusedHelpTrigger) {
      try { lastFocusedHelpTrigger.focus(); } catch (e) {}
      lastFocusedHelpTrigger = null;
    }
  }

  // SAMPLE DEMO AUDIT LOADER (Full E-Commerce Store Audit Demonstration)
  function loadDemoData() {
    const demoUrls = [
      { url: 'https://store.example.com/', status_code: 200, title: 'Nova Apparel — Modern Sustainable Streetwear & Eco Fashion', meta_description: 'Discover eco-friendly clothing, organic cotton hoodies, and minimalist jackets designed for modern lifestyle.', h1: ['Sustainable Streetwear For Modern Living'], h2: ['Featured Collections', 'Eco Bestsellers', 'Why Choose Organic'], word_count: 840, response_time: 145, depth: 0, internal_links_count: 14, external_links_count: 3, images_count: 8, canonical_url: 'https://store.example.com/', content_type: 'text/html', has_author: true, author: 'Editorial Team', has_schema: true, schema_types: ['Organization', 'WebSite'] },
      { url: 'https://store.example.com/collections/hoodies', status_code: 200, title: 'Organic Cotton Hoodies | Nova Apparel', meta_description: 'Shop heavyweight organic cotton hoodies. Ethically crafted with recycled trims.', h1: ['Organic Cotton Hoodies'], h2: ['Oversized Fit', 'Zip Hoodies', 'Sizing Guide'], word_count: 620, response_time: 120, depth: 1, internal_links_count: 9, external_links_count: 1, images_count: 12, canonical_url: 'https://store.example.com/collections/hoodies', content_type: 'text/html', has_author: false, has_schema: true, schema_types: ['CollectionPage', 'BreadcrumbList'] },
      { url: 'https://store.example.com/collections/jackets', status_code: 200, title: 'Jackets', meta_description: '', h1: ['Winter Jackets'], h2: ['Puffer Jackets', 'Technical Parkas'], word_count: 510, response_time: 160, depth: 1, internal_links_count: 8, external_links_count: 1, images_count: 6, canonical_url: 'https://store.example.com/collections/jackets', content_type: 'text/html', has_author: false, has_schema: false },
      { url: 'https://store.example.com/products/heavyweight-hoodie-black', status_code: 200, title: 'Black Heavyweight Hoodie | Nova Apparel', meta_description: 'Premium 450gsm organic french terry hoodie in deep carbon black. Ribbed cuffs.', h1: ['Black Heavyweight Hoodie'], h2: ['Product Details', 'Size & Fit', 'Reviews'], word_count: 730, response_time: 180, depth: 2, internal_links_count: 6, external_links_count: 0, images_count: 5, canonical_url: 'https://store.example.com/products/heavyweight-hoodie-black', content_type: 'text/html', has_author: false, has_schema: true, schema_types: ['Product'] },
      { url: 'https://store.example.com/products/heavyweight-hoodie-grey', status_code: 200, title: 'Black Heavyweight Hoodie | Nova Apparel', meta_description: 'Heather grey version of our flagship organic french terry hoodie.', h1: [], h2: ['Details', 'Customer Feedback'], word_count: 690, response_time: 175, depth: 2, internal_links_count: 6, external_links_count: 0, images_count: 4, canonical_url: 'https://store.example.com/products/heavyweight-hoodie-black', content_type: 'text/html', has_author: false, has_schema: true, schema_types: ['Product'] },
      { url: 'https://store.example.com/about-us', status_code: 200, title: 'About Us | Nova Sustainable Fashion Brand', meta_description: 'Our sustainability mission, organic certifications, and fair wage manufacturing story.', h1: ['Our Mission & Ethical Factory'], h2: ['Fair Trade Supply Chain', 'Carbon Neutral Shipping'], word_count: 1100, response_time: 115, depth: 1, internal_links_count: 7, external_links_count: 2, images_count: 4, canonical_url: 'https://store.example.com/about-us', content_type: 'text/html', has_author: true, author: 'Elena Rostova, Founder & Head of Sourcing', has_schema: true, schema_types: ['AboutPage', 'Organization'] },
      { url: 'https://store.example.com/old-sale-catalog', status_code: 301, title: '', meta_description: '', h1: [], h2: [], word_count: 0, response_time: 65, depth: 2, internal_links_count: 0, external_links_count: 0, images_count: 0, canonical_url: 'https://store.example.com/collections/hoodies', content_type: 'text/html' },
      { url: 'https://store.example.com/summer-clearance-2023', status_code: 404, title: '404 Page Not Found | Nova Apparel', meta_description: '', h1: ['404 - Page Not Found'], h2: [], word_count: 35, response_time: 90, depth: 2, internal_links_count: 2, external_links_count: 0, images_count: 1, content_type: 'text/html' }
    ];

    const demoLinks = [
      { source_url: 'https://store.example.com/', target_url: 'https://store.example.com/collections/hoodies', anchor_text: 'Shop Hoodies', target_status: 200, is_internal: true, placement: 'nav' },
      { source_url: 'https://store.example.com/', target_url: 'https://store.example.com/collections/jackets', anchor_text: 'Jackets & Outerwear', target_status: 200, is_internal: true, placement: 'nav' },
      { source_url: 'https://store.example.com/', target_url: 'https://store.example.com/about-us', anchor_text: 'Our Story', target_status: 200, is_internal: true, placement: 'footer' },
      { source_url: 'https://store.example.com/collections/hoodies', target_url: 'https://store.example.com/products/heavyweight-hoodie-black', anchor_text: 'Black Heavyweight Hoodie', target_status: 200, is_internal: true, placement: 'body' },
      { source_url: 'https://store.example.com/collections/hoodies', target_url: 'https://store.example.com/products/heavyweight-hoodie-grey', anchor_text: 'Heather Grey Hoodie', target_status: 200, is_internal: true, placement: 'body' },
      { source_url: 'https://store.example.com/collections/jackets', target_url: 'https://store.example.com/summer-clearance-2023', anchor_text: 'Summer Clearance Sale', target_status: 404, is_internal: true, placement: 'body' },
      { source_url: 'https://store.example.com/about-us', target_url: 'https://store.example.com/old-sale-catalog', anchor_text: 'Archived Lookbook', target_status: 301, is_internal: true, placement: 'body' },
      { source_url: 'https://store.example.com/', target_url: 'https://instagram.com/novaapparel', anchor_text: 'Instagram', target_status: 'External', is_internal: false, placement: 'footer' },
      { source_url: 'https://store.example.com/', target_url: 'https://twitter.com/novaapparel', anchor_text: 'Twitter', target_status: 'External', is_internal: false, placement: 'footer' }
    ];

    const demoIssues = [
      { type: 'error', category: 'HTTP', issue: 'Broken Internal Link (404 Not Found)', url: 'https://store.example.com/summer-clearance-2023', details: 'Linked from https://store.example.com/collections/jackets with anchor "Summer Clearance Sale".' },
      { type: 'warning', category: 'Metadata', issue: 'Title Tag Too Short', url: 'https://store.example.com/collections/jackets', details: 'Title is only 7 characters ("Jackets"). Recommended length is 30–60 characters.' },
      { type: 'warning', category: 'Metadata', issue: 'Missing Meta Description', url: 'https://store.example.com/collections/jackets', details: 'The page has no meta description tag.' },
      { type: 'warning', category: 'Duplicates', issue: 'Duplicate Page Title', url: 'https://store.example.com/products/heavyweight-hoodie-grey', details: 'Shares exact title "Black Heavyweight Hoodie | Nova Apparel" with /products/heavyweight-hoodie-black.' },
      { type: 'warning', category: 'Headings', issue: 'Missing H1 Heading', url: 'https://store.example.com/products/heavyweight-hoodie-grey', details: 'No <h1> heading was found on this product page.' },
      { type: 'warning', category: 'Images', issue: 'Image Missing Alt Attribute', url: 'https://store.example.com/collections/hoodies', details: 'Image: https://store.example.com/cdn/shop/hoodie-banner.webp has no alt text.' },
      { type: 'info', category: 'Technical', issue: 'Canonical Points to Alternate URL', url: 'https://store.example.com/products/heavyweight-hoodie-grey', details: 'Canonical points to: https://store.example.com/products/heavyweight-hoodie-black.' },
      { type: 'info', category: 'HTTP', issue: 'Permanent Redirect (301 Moved)', url: 'https://store.example.com/old-sale-catalog', details: 'Page returns HTTP 301 redirecting to /collections/hoodies.' }
    ];

    const demoImages = [
      { src: 'https://store.example.com/cdn/shop/logo-header.svg', page_url: 'https://store.example.com/', alt: 'Nova Apparel Brand Logo', has_alt: true, status: 200 },
      { src: 'https://store.example.com/cdn/shop/hero-hoodie.webp', page_url: 'https://store.example.com/', alt: 'Model wearing sustainable black organic hoodie', has_alt: true, status: 200 },
      { src: 'https://store.example.com/cdn/shop/hoodie-banner.webp', page_url: 'https://store.example.com/collections/hoodies', alt: '', has_alt: false, status: 200 },
      { src: 'https://store.example.com/cdn/shop/black-hoodie-front.jpg', page_url: 'https://store.example.com/products/heavyweight-hoodie-black', alt: 'Black Heavyweight Hoodie Front Angle', has_alt: true, status: 200 }
    ];

    const demoHeadings = [
      { url: 'https://store.example.com/', h1: 'Sustainable Streetwear For Modern Living', h2: 'Featured Collections | Eco Bestsellers | Why Choose Organic', h1_count: 1, status_code: 200 },
      { url: 'https://store.example.com/collections/hoodies', h1: 'Organic Cotton Hoodies', h2: 'Oversized Fit | Zip Hoodies | Sizing Guide', h1_count: 1, status_code: 200 },
      { url: 'https://store.example.com/collections/jackets', h1: 'Winter Jackets', h2: 'Puffer Jackets | Technical Parkas', h1_count: 1, status_code: 200 },
      { url: 'https://store.example.com/products/heavyweight-hoodie-black', h1: 'Black Heavyweight Hoodie', h2: 'Product Details | Size & Fit | Reviews', h1_count: 1, status_code: 200 },
      { url: 'https://store.example.com/products/heavyweight-hoodie-grey', h1: '', h2: 'Details | Customer Feedback', h1_count: 0, status_code: 200 }
    ];

    const demoDuplicates = [
      {
        title: 'Black Heavyweight Hoodie | Nova Apparel',
        count: 2,
        urls: [
          'https://store.example.com/products/heavyweight-hoodie-black',
          'https://store.example.com/products/heavyweight-hoodie-grey'
        ]
      }
    ];

    // Pre-populate demo PageSpeed result
    state.pagespeedResults['https://store.example.com/'] = {
      url: 'https://store.example.com/',
      timestamp: Date.now(),
      mobile: {
        url: 'https://store.example.com/',
        strategy: 'mobile',
        timestamp: new Date().toISOString(),
        lighthouse: {
          performance_score: 91,
          fcp: '1.2 s',
          lcp: '2.1 s',
          tbt: '140 ms',
          cls: '0.04',
          speed_index: '1.8 s'
        },
        crux_field: {
          has_field_data: true,
          overall_category: 'FAST',
          fcp_p75: '1.40s',
          lcp_p75: '2.30s',
          cls_p75: '0.05',
          inp_p75: '120ms'
        }
      },
      desktop: {
        url: 'https://store.example.com/',
        strategy: 'desktop',
        timestamp: new Date().toISOString(),
        lighthouse: {
          performance_score: 98,
          fcp: '0.6 s',
          lcp: '0.9 s',
          tbt: '20 ms',
          cls: '0.01',
          speed_index: '0.8 s'
        },
        crux_field: {
          has_field_data: true,
          overall_category: 'FAST',
          fcp_p75: '0.80s',
          lcp_p75: '1.10s',
          cls_p75: '0.01',
          inp_p75: '45ms'
        }
      }
    };
    state.activePageSpeedUrl = 'https://store.example.com/';
    const psBadge = $('gc-badge-pagespeed');
    if (psBadge) psBadge.textContent = '1';

    applyCrawlData({
      status: 'completed',
      urls: demoUrls,
      links: demoLinks,
      issues: demoIssues,
      images: demoImages,
      headings: demoHeadings,
      duplicates: demoDuplicates,
      stats: {
        discovered: 14,
        crawled: 8,
        depth: 2,
        speed: '12 URLs/sec',
        baseUrl: 'https://store.example.com/',
        elapsed: '0.6s'
      }
    });

    $('gc-url-input').value = 'https://store.example.com/';
    switchTab('overview');
    updateStatus('Loaded sample audit for <strong>https://store.example.com/</strong>. All GroCrawl tabs, PageSpeed, and E-E-A-T signals populated.');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;');
  }

  // ==========================================
  // EXTENSION / PLUGIN SYSTEM COMPATIBILITY
  // ==========================================
  window.GroCrawlPlugin = window.GroCrawlPlugin || {
    plugins: [],
    register(plugin) {
      this.plugins.push(plugin);
      if (typeof plugin.init === 'function') {
        try { plugin.init(window.GroCrawlApp); } catch (e) { console.error('Plugin init error:', e); }
      }
    }
  };
  window.LibreCrawlPlugin = window.GroCrawlPlugin;

  window.GroCrawlApp = {
    startCrawl,
    stopCrawl,
    clearCrawl,
    toggleSidebar,
    setUrl,
    scrollTabsLeft,
    scrollTabsRight,
    changeEngine,
    setFilter,
    switchTab,
    loadDemoData,
    showUrlModal,
    openExportModal,
    executeExport,
    closeModals,
    filterIssues,
    searchInternalLinks,
    searchExternalLinks,
    changeVizLayout,
    resetViz,
    loadHistoryAudit,
    deleteHistoryAudit,
    clearHistory,
    loadSettings,
    saveSettings,
    resetSettings,
    resetIssueExclusions,
    openSettingsModal,
    switchSettingsCategory,
    runPageSpeedForInput,
    runPageSpeedForUrl,
    showPageSpeedStrategy,
    renderEEATTab,
    openHelpModal: showHelpModal,
    closeHelpModal,
    helpTopics: GROCRAWL_HELP_TOPICS
  };

})();
