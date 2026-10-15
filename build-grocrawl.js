// Build GroCrawl - Groniq SEO Spider & Technical Audit Suite
const fs = require('node:fs');
const path = require('node:path');

const rootHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const start = rootHtml.indexOf('<main>');
const end = rootHtml.indexOf('</main>', start);
if (start < 0 || end < 0) throw new Error('Site shell main element not found');

let before = rootHtml.slice(0, start).replace(/href="#/g, 'href="/#');
let after = rootHtml.slice(end + 7).replace(/href="#/g, 'href="/#');

// 1. Ensure Tailwind and base styles load correctly in all environments (HTTP & file://)
before = before.replace('<link rel="stylesheet" href="/tailwind.css">', `
    <link rel="stylesheet" href="/tailwind.css">
    <link rel="stylesheet" href="../../tailwind.css">
    <style>
      /* Prevent unstyled SVG explosion before CSS hydration */
      header svg, footer svg, #navbar svg { width: 32px !important; height: 32px !important; max-width: 32px !important; max-height: 32px !important; }
      header svg.lucide, footer svg.lucide, header [data-lucide] svg, footer [data-lucide] svg, .lucide { width: 16px !important; height: 16px !important; max-width: 16px !important; max-height: 16px !important; }
      #navbar { position: sticky !important; top: 0 !important; z-index: 50 !important; background: rgba(5, 5, 5, 0.95) !important; backdrop-filter: blur(14px) !important; -webkit-backdrop-filter: blur(14px) !important; border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important; }
      body { background: #050505 !important; color: #ffffff !important; margin: 0 !important; font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
      #splash-screen { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 99999 !important; background-color: #050505 !important; display: flex !important; flex-direction: column !important; align-items: center !important; justify-content: center !important; transition: opacity 0.6s ease-in-out !important; }
      body.loading { overflow: hidden !important; }
    </style>
`);

// 2. Add explicit width and height attributes to SVGs in header and footer
before = before.replace(/class="w-8 h-8([^"]*)"/g, 'width="32" height="32" class="w-8 h-8$1"');
after = after.replace(/class="w-8 h-8([^"]*)"/g, 'width="32" height="32" class="w-8 h-8$1"');

// 3. Set Tools navigation link as active in Groniq header
before = before.replace(
  'class="text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-white transition-colors">Tools</a>',
  'class="text-xs font-semibold uppercase tracking-wider text-brand-green transition-colors">Tools</a>'
);
before = before.replace(
  '<a href="/tools/" class="hover:text-white transition-colors">Tools</a>',
  '<a href="/tools/" class="text-brand-green transition-colors">Tools</a>'
);

const title = 'GroCrawl: SEO Crawler & Website Audit Tool | Groniq';
const description = 'Inspect website pages, links, redirects and SEO signals with GroCrawl. Review audit findings, explore supporting evidence and export results.';

before = before.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
  .replace(/<meta\s+name="description"\s+content="[^"]*"\s*>/, `<meta name="description" content="${description}">\n  <meta name="keywords" content="GroCrawl, SEO crawler, website crawler, SEO spider, website audit tool, technical SEO audit, redirect checker, canonical tag checker, internal link analysis">`)
  .replace(/<link rel="canonical" href="[^"]*"\s*>/, '<link rel="canonical" href="https://groniqdigital.com/tools/grocrawl/">')
  .replace(/<meta\s+(?:property|name)="(?:og|twitter):(?:title|description|url|image:alt)"[^>]*>/g, '')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
  .replace('</head>', `
    <link rel="stylesheet" href="grocrawl.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.28.1/cytoscape.min.js"></script>
    <script src="grocrawl-app.js" defer></script>
  </head>`);

const toolMain = `
<main class="grocrawl-wrapper">
  <!-- Centered Hero Section with Ambient Green Glow (Groniq Theme) -->
  <section class="gc-hero-section bg-grid">
    <div class="gc-hero-glow-mat"></div>
    <div class="gc-hero-content">
      <nav class="gc-hero-breadcrumb">
        <a href="/tools/">TOOLS</a>
        <span>/</span>
        <span class="accent">WEBSITE CRAWLER & SEO AUDIT</span>
      </nav>
      <h1 class="gc-hero-h1">
        Gro<span class="accent">Crawl</span>
      </h1>
      <p class="gc-hero-paragraph">
        Inspect pages, links, redirects, metadata and performance signals. Review the evidence behind findings and export results to plan your next fixes.
      </p>
    </div>
  </section>

  <!-- Tool Workspace Container -->
  <div class="grocrawl-container">
    <!-- Top URL & Control Section -->
    <section class="gc-control-panel">
      <div id="gc-start-control">
        <div class="gc-url-row">
          <div class="gc-url-input-wrap">
            <span class="gc-url-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></span>
            <input type="url" class="gc-url-input" id="gc-url-input" list="gc-url-suggestions" required placeholder="Enter website URL (e.g. https://groniqdigital.com)" autocomplete="on" onkeydown="if(event.key==='Enter'){event.preventDefault();event.stopPropagation();window.GroCrawlApp&&window.GroCrawlApp.startCrawl(event);return false;}" oninput="const b=document.getElementById('gc-url-clear-btn');const k=document.getElementById('gc-url-kbd');if(b&&k){if(this.value){b.style.display='flex';k.style.display='none';}else{b.style.display='none';k.style.display='inline-flex';}}">
            <button type="button" class="gc-url-clear-btn" id="gc-url-clear-btn" title="Clear input" onclick="const i=document.getElementById('gc-url-input');if(i){i.value='';i.focus();this.style.display='none';const k=document.getElementById('gc-url-kbd');if(k)k.style.display='inline-flex';}" aria-label="Clear URL">✕</button>
            <span class="gc-url-kbd" id="gc-url-kbd">↵ Enter</span>
            <datalist id="gc-url-suggestions">
              <option value="https://groniqdigital.com/"></option>
              <option value="https://groniqdigital.com/tools/"></option>
              <option value="https://groniqdigital.com/learn/"></option>
              <option value="https://example.com/"></option>
            </datalist>
          </div>
          <button type="button" class="gc-btn-primary" id="gc-btn-start" onclick="event.preventDefault();event.stopPropagation();window.GroCrawlApp&&window.GroCrawlApp.startCrawl(event);return false;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;"><path d="M8 5v14l11-7z"/></svg>
            <span>Start Audit</span>
          </button>
          <button type="button" class="gc-btn-secondary" id="gc-btn-stop" disabled onclick="event.preventDefault();event.stopPropagation();window.GroCrawlApp&&window.GroCrawlApp.stopCrawl();return false;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
            <span>Stop</span>
          </button>
          <button type="button" class="gc-btn-secondary" id="gc-btn-clear" onclick="event.preventDefault();event.stopPropagation();window.GroCrawlApp&&window.GroCrawlApp.clearCrawl();return false;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            <span>Clear</span>
          </button>
          <button type="button" class="gc-btn-secondary gc-btn-demo" id="gc-btn-demo" onclick="event.preventDefault();event.stopPropagation();window.GroCrawlApp&&window.GroCrawlApp.loadDemoData();return false;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg><span>Sample Audit</span>
          </button>
          <button type="button" class="gc-btn-secondary" id="gc-quick-export-btn" onclick="event.preventDefault();event.stopPropagation();window.GroCrawlApp&&window.GroCrawlApp.openExportModal();return false;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Export</span>
          </button>
          <button type="button" class="gc-btn-secondary" id="gc-quick-settings-btn" onclick="event.preventDefault();event.stopPropagation();window.GroCrawlApp&&window.GroCrawlApp.openSettingsModal();return false;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg><span>Settings</span>
          </button>
        </div>
        <div class="gc-url-suggestions-bar">
          <span class="gc-suggestions-label">Suggestions:</span>
          <button type="button" class="gc-suggestion-btn" onclick="event.preventDefault();window.GroCrawlApp&&window.GroCrawlApp.setUrl('https://groniqdigital.com/');return false;">groniqdigital.com</button>
          <button type="button" class="gc-suggestion-btn" onclick="event.preventDefault();window.GroCrawlApp&&window.GroCrawlApp.setUrl('https://groniqdigital.com/tools/');return false;">groniqdigital.com/tools/</button>
          <button type="button" class="gc-suggestion-btn" onclick="event.preventDefault();window.GroCrawlApp&&window.GroCrawlApp.setUrl('https://groniqdigital.com/learn/');return false;">groniqdigital.com/learn/</button>
        </div>

        <div class="gc-settings-row">
          <input type="hidden" id="gc-setting-engine" value="auto">
          <div class="gc-setting-item">
            <label for="gc-setting-max-urls">Max URLs:</label>
            <input type="number" id="gc-setting-max-urls" class="gc-setting-number" min="1" max="1000" value="50" style="width: 75px;">
          </div>
          <div class="gc-setting-item">
            <label for="gc-setting-max-depth">Max Depth:</label>
            <input type="number" id="gc-setting-max-depth" class="gc-setting-number" min="1" max="10" value="3" style="width: 60px;">
            <button type="button" class="gc-help-btn" data-help="crawl-depth-limits" aria-label="Help: Crawl Depth & Page Limits" title="Learn about crawl limits"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
          </div>
        </div>

        <div class="gc-progress-track" id="gc-progress-track">
          <div class="gc-progress-bar" id="gc-progress-bar"></div>
        </div>
        <div id="gc-notice-text" style="font-size: 13px; color: #9ca3af; margin-top: 10px;">
          Ready to audit. Enter website URL or load sample audit.
        </div>
      </div>
    </section>

  <!-- Two-Column Workspace Layout (GroCrawl Spider) -->
  <div class="gc-workspace-layout">
    <!-- Left Sidebar: Filters & Stats -->
    <aside class="gc-sidebar">
      <div class="gc-sidebar-section">
        <h3 class="gc-sidebar-title">Filters</h3>
        <div class="gc-filter-group">
          <div class="gc-filter-item active" data-filter="all" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('all')">
            <span>All Crawled URLs</span>
            <span class="gc-filter-count" id="filter-all-count">0</span>
          </div>
          <div class="gc-filter-item" data-filter="internal" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('internal')">
            <span>Internal URLs</span>
            <span class="gc-filter-count" id="filter-internal-count">0</span>
          </div>
          <div class="gc-filter-item" data-filter="external" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('external')">
            <span>External URLs</span>
            <span class="gc-filter-count" id="filter-external-count">0</span>
          </div>
        </div>

        <div class="gc-filter-group">
          <div class="gc-filter-header">Response Codes</div>
          <div class="gc-filter-item" data-filter="2xx" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('2xx')">
            <span>2xx Success</span>
            <span class="gc-filter-count" id="filter-2xx-count">0</span>
          </div>
          <div class="gc-filter-item" data-filter="3xx" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('3xx')">
            <span>3xx Redirect</span>
            <span class="gc-filter-count" id="filter-3xx-count">0</span>
          </div>
          <div class="gc-filter-item" data-filter="4xx" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('4xx')">
            <span>4xx Client Error</span>
            <span class="gc-filter-count" id="filter-4xx-count">0</span>
          </div>
          <div class="gc-filter-item" data-filter="5xx" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('5xx')">
            <span>5xx Server Error</span>
            <span class="gc-filter-count" id="filter-5xx-count">0</span>
          </div>
          <div class="gc-filter-item" data-filter="no_response" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('no_response')">
            <span>No Response</span>
            <span class="gc-filter-count" id="filter-no-response-count">0</span>
          </div>
        </div>

        <div class="gc-filter-group">
          <div class="gc-filter-header">Content Type</div>
          <div class="gc-filter-item" data-filter="html" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('html')">
            <span>HTML Pages</span>
            <span class="gc-filter-count" id="filter-html-count">0</span>
          </div>
          <div class="gc-filter-item" data-filter="css" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('css')">
            <span>CSS Style</span>
            <span class="gc-filter-count" id="filter-css-count">0</span>
          </div>
          <div class="gc-filter-item" data-filter="js" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('js')">
            <span>JavaScript</span>
            <span class="gc-filter-count" id="filter-js-count">0</span>
          </div>
          <div class="gc-filter-item" data-filter="images" onclick="window.GroCrawlApp&&window.GroCrawlApp.setFilter('images')">
            <span>Images</span>
            <span class="gc-filter-count" id="filter-images-count">0</span>
          </div>
        </div>
      </div>

      <div class="gc-sidebar-section">
        <h3 class="gc-sidebar-title">Statistics</h3>
        <div class="gc-stat-list">
          <div class="gc-stat-row">
            <span>URLs Discovered</span>
            <strong id="gc-stat-discovered">0</strong>
          </div>
          <div class="gc-stat-row">
            <span>URLs Crawled</span>
            <strong id="gc-stat-crawled" style="color: var(--gc-brand);">0</strong>
          </div>
          <div class="gc-stat-row">
            <span>Crawl Depth</span>
            <strong id="gc-stat-depth">0</strong>
          </div>
          <div class="gc-stat-row">
            <span>Speed</span>
            <strong id="gc-stat-speed">0 URLs/sec</strong>
          </div>
          <div class="gc-stat-row">
            <span>Health Score</span>
            <strong id="gc-stat-health" style="color: var(--gc-brand);">100%</strong>
          </div>
        </div>
      </div>
    </aside>

    <!-- Right Column: Tabs & Tables -->
    <div class="gc-layout-content">
      <div class="gc-tabs-wrapper">
        <button type="button" class="gc-sidebar-toggle-btn" id="gc-sidebar-toggle-btn" onclick="window.GroCrawlApp&&window.GroCrawlApp.toggleSidebar()" title="Toggle Sidebar">
          <span id="gc-toggle-icon">◀</span>
          <span class="gc-toggle-text">Sidebar</span>
        </button>
        <button type="button" class="gc-tab-scroll-btn left" id="gc-tab-scroll-left" onclick="window.GroCrawlApp&&window.GroCrawlApp.scrollTabsLeft()" title="Scroll menu left" aria-label="Scroll menu left">&#10094;</button>
        <nav class="gc-tabs-header" id="gc-tabs-header">
          <button type="button" class="gc-tab-btn active" data-tab="overview"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span>Overview</span></button>
          <button type="button" class="gc-tab-btn" data-tab="internal"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span>Internal</span> <span class="gc-badge" id="gc-badge-internal">0</span></button>
          <button type="button" class="gc-tab-btn" data-tab="external"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span>External</span> <span class="gc-badge" id="gc-badge-external">0</span></button>
          <button type="button" class="gc-tab-btn" data-tab="status-codes"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><span>Status Codes</span></button>
          <button type="button" class="gc-tab-btn" data-tab="links"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg><span>Links</span> <span class="gc-badge" id="gc-badge-links">0</span></button>
          <button type="button" class="gc-tab-btn" data-tab="issues"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span>Issues</span> <span class="gc-badge err" id="gc-badge-issues">0</span></button>
          <button type="button" class="gc-tab-btn" data-tab="images"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Images</span> <span class="gc-badge" id="gc-badge-images">0</span></button>
          <button type="button" class="gc-tab-btn" data-tab="headings"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg><span>Headings</span> <span class="gc-badge" id="gc-badge-headings">0</span></button>
          <button type="button" class="gc-tab-btn" data-tab="duplicates"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg><span>Duplicates</span> <span class="gc-badge warn" id="gc-badge-duplicates">0</span></button>
          <button type="button" class="gc-tab-btn" data-tab="pagespeed"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>PageSpeed</span> <span class="gc-badge" id="gc-badge-pagespeed">0</span></button>
          <button type="button" class="gc-tab-btn" data-tab="eeat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg><span>Content & Trust (E-E-A-T)</span></button>
          <button type="button" class="gc-tab-btn" data-tab="visualization"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg><span>Visualization</span></button>
          <button type="button" class="gc-tab-btn" data-tab="dashboard"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg><span>Saved Crawls</span></button>
          <button type="button" class="gc-tab-btn" data-tab="settings"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg><span>Settings</span></button>
        </nav>
        <button type="button" class="gc-tab-scroll-btn right" id="gc-tab-scroll-right" onclick="window.GroCrawlApp&&window.GroCrawlApp.scrollTabsRight()" title="Scroll menu right" aria-label="Scroll menu right">&#10095;</button>
      </div>

      <!-- Tab 1: Overview (Executive Audit Dashboard & Spider) -->
      <div class="gc-tab-pane" id="gc-pane-overview">
        <!-- Executive KPI Cards -->
        <div class="gc-kpi-grid">
          <div class="gc-kpi-card highlight">
            <div class="gc-kpi-title">Discovered & Crawled</div>
            <div class="gc-kpi-num" id="overview-kpi-crawled">0</div>
            <div class="gc-kpi-sub" id="overview-kpi-discovered-sub">0 Discovered</div>
          </div>
          <div class="gc-kpi-card">
            <div class="gc-kpi-title" style="display:flex;align-items:center;justify-content:space-between;">
              <span>Site Health Score</span>
              <button type="button" class="gc-help-btn" data-help="health-score-formula" aria-label="Help: SEO Health Score Formula" title="How health score is calculated"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
            </div>
            <div class="gc-kpi-num" id="overview-kpi-health" style="color: var(--gc-brand);">100%</div>
            <div class="gc-kpi-sub" id="overview-kpi-health-sub">Technical SEO Index</div>
          </div>
          <div class="gc-kpi-card">
            <div class="gc-kpi-title">Critical Issues</div>
            <div class="gc-kpi-num" id="overview-kpi-issues" style="color: #ef4444;">0</div>
            <div class="gc-kpi-sub" id="overview-kpi-issues-sub">Errors & Warnings</div>
          </div>
          <div class="gc-kpi-card">
            <div class="gc-kpi-title">Trust & E-E-A-T</div>
            <div class="gc-kpi-num" id="overview-kpi-trust" style="color: #38bdf8;">--</div>
            <div class="gc-kpi-sub" id="overview-kpi-trust-sub">Quality Rater Score</div>
          </div>
        </div>

        <!-- HTTP Status Distribution Bar -->
        <div class="gc-status-dist-wrap">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--gc-text-muted);">HTTP Status Distribution</span>
            <span id="overview-dist-summary" style="font-size:12px; color:var(--gc-text-dim);">0 responses</span>
          </div>
          <div class="gc-status-dist-bar">
            <div class="gc-dist-seg c2xx" id="dist-2xx" style="width: 100%;" title="2xx Success"></div>
            <div class="gc-dist-seg c3xx" id="dist-3xx" style="width: 0%;" title="3xx Redirect"></div>
            <div class="gc-dist-seg c4xx" id="dist-4xx" style="width: 0%;" title="4xx Client Error"></div>
            <div class="gc-dist-seg c5xx" id="dist-5xx" style="width: 0%;" title="5xx Server Error"></div>
          </div>
          <div class="gc-status-legend">
            <div class="gc-legend-item"><span class="gc-legend-dot" style="background:var(--gc-2xx);"></span> 2xx Success: <strong id="overview-dist-2xx" style="margin-left:4px;">0</strong></div>
            <div class="gc-legend-item"><span class="gc-legend-dot" style="background:var(--gc-3xx);"></span> 3xx Redirect: <strong id="overview-dist-3xx" style="margin-left:4px;">0</strong></div>
            <div class="gc-legend-item"><span class="gc-legend-dot" style="background:var(--gc-4xx);"></span> 4xx Error: <strong id="overview-dist-4xx" style="margin-left:4px;">0</strong></div>
            <div class="gc-legend-item"><span class="gc-legend-dot" style="background:var(--gc-5xx);"></span> 5xx Error: <strong id="overview-dist-5xx" style="margin-left:4px;">0</strong></div>
          </div>
        </div>

        <!-- Diagnostic Snapshots Grid -->
        <div class="gc-diagnostic-grid">
          <div class="gc-diag-card" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchTab('pagespeed')">
            <div class="gc-diag-header">
              <span class="gc-diag-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
              <h4>Core Web Vitals & Speed</h4>
              <span class="gc-diag-link">View Tab →</span>
            </div>
            <div class="gc-diag-body" id="overview-snapshot-pagespeed">
              <div class="gc-diag-metric"><span>LCP Performance:</span> <strong id="snapshot-lcp-val">--</strong></div>
              <div class="gc-diag-metric"><span>CLS Stability:</span> <strong id="snapshot-cls-val">--</strong></div>
              <div class="gc-diag-metric"><span>INP Interactivity:</span> <strong id="snapshot-inp-val">--</strong></div>
            </div>
          </div>
          <div class="gc-diag-card" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchTab('issues')">
            <div class="gc-diag-header">
              <span class="gc-diag-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
              <h4>Critical SEO Health</h4>
              <span class="gc-diag-link">View Tab →</span>
            </div>
            <div class="gc-diag-body" id="overview-snapshot-issues">
              <div class="gc-diag-metric"><span>Broken Links (4xx/5xx):</span> <strong id="snapshot-broken-val">0</strong></div>
              <div class="gc-diag-metric"><span>Missing Meta Titles:</span> <strong id="snapshot-missing-titles">0</strong></div>
              <div class="gc-diag-metric"><span>Missing H1 Headings:</span> <strong id="snapshot-missing-h1">0</strong></div>
            </div>
          </div>
          <div class="gc-diag-card" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchTab('eeat')">
            <div class="gc-diag-header">
              <span class="gc-diag-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg></span>
              <h4>E-E-A-T Quality Signals</h4>
              <span class="gc-diag-link">View Tab →</span>
            </div>
            <div class="gc-diag-body" id="overview-snapshot-eeat">
              <div class="gc-diag-metric"><span>Author & Persona Schema:</span> <strong id="snapshot-author-val">--</strong></div>
              <div class="gc-diag-metric"><span>HTTPS & SSL Security:</span> <strong id="snapshot-https-val">Valid</strong></div>
              <div class="gc-diag-metric"><span>Trust & Policy Pages:</span> <strong id="snapshot-policies-val">--</strong></div>
            </div>
          </div>
        </div>

        <!-- Master URL Explorer Header & Table -->
        <div class="gc-master-explorer-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <h3 style="margin:0; font-size:15px; font-weight:700; color:#fff;">Master URL Explorer</h3>
            <span class="gc-badge success" id="gc-master-badge">0 URLs</span>
            <button type="button" class="gc-help-btn" data-help="canonicals-indexability" aria-label="Help: Canonicals and Indexability" title="Learn about canonicals and indexability"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
          </div>
          <div class="gc-table-controls">
            <div class="gc-search-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="gc-table-search" placeholder="Filter address, title, meta..." oninput="this.parentElement.classList.toggle('has-val', !!this.value)">
              <button type="button" class="gc-search-clear" id="gc-table-search-clear" title="Clear filter" onclick="const i=document.getElementById('gc-table-search');if(i){i.value='';i.dispatchEvent(new Event('input'));this.parentElement.classList.remove('has-val');i.focus();}">✕</button>
            </div>
            <span id="gc-urls-count-label" style="font-size: 13px; color: #9ca3af; font-weight: 500;">0 URLs</span>
          </div>
        </div>

        <div class="gc-table-wrap">
          <table class="gc-data-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Status</th>
                <th>Title</th>
                <th>Meta Desc</th>
                <th>H1</th>
                <th>Words</th>
                <th>Resp (ms)</th>
                <th>Analytics</th>
                <th>OG Tags</th>
                <th>Links (Int/Ext)</th>
                <th>Images</th>
                <th>Inspect</th>
              </tr>
            </thead>
            <tbody id="gc-overview-tbody">
              <tr><td colspan="12" class="gc-empty-state"><p>No audit data yet. Start an audit or load sample data.</p></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2: Internal -->
      <div class="gc-tab-pane" id="gc-pane-internal" style="display: none;">
        <div class="gc-table-wrap">
          <table class="gc-data-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Status</th>
                <th>Content Type</th>
                <th>Title</th>
                <th>Depth</th>
                <th>Response Time</th>
              </tr>
            </thead>
            <tbody id="gc-internal-tbody">
              <tr><td colspan="6" class="gc-empty-state"><p>No internal URLs recorded.</p></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 3: External -->
      <div class="gc-tab-pane" id="gc-pane-external" style="display: none;">
        <div class="gc-table-wrap">
          <table class="gc-data-table">
            <thead>
              <tr>
                <th>Destination URL</th>
                <th>Observed Status</th>
                <th>Linked From</th>
                <th>Anchor Text</th>
              </tr>
            </thead>
            <tbody id="gc-external-tbody">
              <tr><td colspan="4" class="gc-empty-state"><p>No external URLs recorded.</p></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 4: Status Codes -->
      <div class="gc-tab-pane" id="gc-pane-status-codes" style="display: none;">
        <div class="gc-pane-header" style="margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
          <h3 class="gc-pane-heading" style="margin: 0; font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">
            <span>HTTP Response Status Codes</span>
            <button type="button" class="gc-help-btn" data-help="response-codes" aria-label="Help: Status Codes & Redirects" title="Learn about HTTP status codes"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
          </h3>
        </div>
        <div class="gc-table-wrap">
          <table class="gc-data-table">
            <thead>
              <tr>
                <th>Status Code</th>
                <th>Status Meaning</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody id="gc-status-codes-tbody">
              <tr><td colspan="4" class="gc-empty-state"><p>No status codes recorded.</p></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 5: Links (Dual Section: Internal & External Links) -->
      <div class="gc-tab-pane" id="gc-pane-links" style="display: none;">
        <div class="gc-links-split-grid">
          <div class="gc-links-sub-panel">
            <div class="gc-links-sub-head">
              <h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg><span style="margin-left:6px;">Internal Links</span></h4>
              <div class="gc-search-box sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Filter internal links..." oninput="window.GroCrawlApp&&window.GroCrawlApp.searchInternalLinks(this.value)">
              </div>
            </div>
            <div class="gc-table-wrap" style="max-height: 440px;">
              <table class="gc-data-table">
                <thead>
                  <tr>
                    <th>Source Page</th>
                    <th>Destination URL</th>
                    <th>Anchor Text</th>
                    <th>Status</th>
                    <th>Placement</th>
                  </tr>
                </thead>
                <tbody id="gc-internal-links-tbody">
                  <tr><td colspan="5" class="gc-empty-state"><p>No internal links.</p></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="gc-links-sub-panel">
            <div class="gc-links-sub-head">
              <h4><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span style="margin-left:6px;">External Links</span></h4>
              <div class="gc-search-box sm">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Filter external links..." oninput="window.GroCrawlApp&&window.GroCrawlApp.searchExternalLinks(this.value)">
              </div>
            </div>
            <div class="gc-table-wrap" style="max-height: 440px;">
              <table class="gc-data-table">
                <thead>
                  <tr>
                    <th>Source Page</th>
                    <th>Destination URL</th>
                    <th>Anchor Text</th>
                    <th>Status</th>
                    <th>Placement</th>
                  </tr>
                </thead>
                <tbody id="gc-external-links-tbody">
                  <tr><td colspan="5" class="gc-empty-state"><p>No external links.</p></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 6: Issues -->
      <div class="gc-tab-pane" id="gc-pane-issues" style="display: none;">
        <div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
          <button type="button" class="gc-btn-secondary" onclick="window.GroCrawlApp&&window.GroCrawlApp.filterIssues('all')">All Issues <span id="issues-all-count">(0)</span></button>
          <button type="button" class="gc-btn-secondary" style="border-color:#7f1d1d;color:#ef4444;" onclick="window.GroCrawlApp&&window.GroCrawlApp.filterIssues('error')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span style="margin-left:4px;">Errors</span> <span id="issues-error-count">(0)</span></button>
          <button type="button" class="gc-btn-secondary" style="border-color:#78350f;color:#f59e0b;" onclick="window.GroCrawlApp&&window.GroCrawlApp.filterIssues('warning')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg><span style="margin-left:4px;">Warnings</span> <span id="issues-warning-count">(0)</span></button>
          <button type="button" class="gc-btn-secondary" style="border-color:#1e3a8a;color:#3b82f6;" onclick="window.GroCrawlApp&&window.GroCrawlApp.filterIssues('info')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg><span style="margin-left:4px;">Info</span> <span id="issues-info-count">(0)</span></button>
        </div>
        <div class="gc-table-wrap">
          <table class="gc-data-table">
            <thead>
              <tr>
                <th style="width: 32%;">URL</th>
                <th style="width: 10%;">Priority</th>
                <th style="width: 15%;">Category</th>
                <th style="width: 20%;">Finding</th>
                <th style="width: 23%;">Details / Evidence</th>
              </tr>
            </thead>
            <tbody id="gc-issues-tbody">
              <tr><td colspan="5" class="gc-empty-state"><p>No issues detected.</p></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 7: Images -->
      <div class="gc-tab-pane" id="gc-pane-images" style="display: none;">
        <div class="gc-table-wrap">
          <table class="gc-data-table">
            <thead>
              <tr>
                <th>Image URL</th>
                <th>Found On Page</th>
                <th>Alt Attribute</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="gc-images-tbody">
              <tr><td colspan="4" class="gc-empty-state"><p>No images found.</p></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 8: Headings -->
      <div class="gc-tab-pane" id="gc-pane-headings" style="display: none;">
        <div class="gc-table-wrap">
          <table class="gc-data-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>H1 Tag</th>
                <th>H1 Count</th>
                <th>H2 Sample Tags</th>
              </tr>
            </thead>
            <tbody id="gc-headings-tbody">
              <tr><td colspan="4" class="gc-empty-state"><p>No headings analyzed.</p></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 9: Duplicates -->
      <div class="gc-tab-pane" id="gc-pane-duplicates" style="display: none;">
        <div class="gc-pane-header" style="margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between;">
          <h3 class="gc-pane-heading" style="margin: 0; font-size: 15px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">
            <span>Duplicate Content &amp; Title Collisions</span>
            <button type="button" class="gc-help-btn" data-help="duplicate-detection" aria-label="Help: Duplicate Content Detection" title="How duplicate content is detected"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
          </h3>
        </div>
        <div class="gc-table-wrap">
          <table class="gc-data-table">
            <thead>
              <tr>
                <th>Duplicate Title / Item</th>
                <th>Occurrences</th>
                <th>Affected URLs</th>
              </tr>
            </thead>
            <tbody id="gc-duplicates-tbody">
              <tr><td colspan="3" class="gc-empty-state"><p>No duplicate titles found.</p></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab: PageSpeed Insights & Core Web Vitals -->
      <div class="gc-tab-pane" id="gc-pane-pagespeed" style="display: none;">
        <div class="gc-pagespeed-wrap">
          <div class="gc-pane-header">
            <div>
              <h3 class="gc-pane-heading" style="display:flex;align-items:center;gap:6px;">
                <span>Google PageSpeed Insights &amp; Core Web Vitals</span>
                <button type="button" class="gc-help-btn" data-help="pagespeed-metrics" aria-label="Help: PageSpeed Lab vs Field Data" title="Lighthouse lab vs CrUX field data"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
              </h3>
              <p class="gc-pane-subheading">Analyze real-world Core Web Vitals (CrUX Field Observations) and Lighthouse Lab diagnostics for any crawled URL or entered address.</p>
            </div>
            <div id="gc-pagespeed-key-indicator" class="gc-badge-indicator unverified">
              <span class="gc-dot"></span>
              <span id="gc-pagespeed-key-label">Public Quota (API Key Not Configured)</span>
              <button type="button" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchTab('settings')" style="background:none;border:none;color:var(--gc-brand);margin-left:6px;cursor:pointer;text-decoration:underline;">Configure Key in Settings</button>
            </div>
          </div>

          <div class="gc-pagespeed-control-bar">
            <div class="gc-ps-input-wrap">
              <span class="gc-url-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
              <input type="url" id="gc-pagespeed-url" class="gc-url-input" placeholder="Enter URL to audit with PageSpeed (e.g. https://groniqdigital.com)">
            </div>
            <div class="gc-ps-select-wrap">
              <label for="gc-pagespeed-strategy-select">Device:</label>
              <select id="gc-pagespeed-strategy-select" class="gc-setting-select">
                <option value="both" selected>Mobile &amp; Desktop</option>
                <option value="mobile">Mobile Only</option>
                <option value="desktop">Desktop Only</option>
              </select>
            </div>
            <button type="button" class="gc-btn-primary" id="gc-btn-run-ps" onclick="window.GroCrawlApp&&window.GroCrawlApp.runPageSpeedForInput()">
              <span>Run PageSpeed</span>
            </button>
          </div>

          <div id="gc-pagespeed-loading" class="gc-loading-banner" style="display: none;">
            <div class="gc-spinner"></div>
            <div>
              <strong>Querying Google PageSpeed Insights API...</strong>
              <div style="font-size: 12px; color: var(--gc-text-muted);">Simulating mobile and desktop Lighthouse diagnostics and querying Chrome UX Report field data. This may take 10–25 seconds.</div>
            </div>
          </div>

          <div id="gc-pagespeed-error-banner" class="gc-alert-banner error" style="display: none;"></div>

          <div id="gc-pagespeed-empty" class="gc-empty-card">
            <div style="margin-bottom: 12px; color: var(--gc-brand);"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
            <h4>No PageSpeed Results Yet</h4>
            <p>Enter any URL above and click <strong>Run PageSpeed</strong>, inspect any row's URL Details, or enable automatic post-crawl PageSpeed in Settings.</p>
          </div>

          <div id="gc-pagespeed-results-container" style="display: none;">
            <div id="gc-pagespeed-active-card"></div>
            <div id="gc-pagespeed-history-section" style="margin-top: 24px;">
              <h4 style="font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 12px;">Audited Pages in this Session</h4>
              <div id="gc-pagespeed-cards-list" class="gc-ps-cards-grid"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Content & Trust Checks (Heuristic E-E-A-T) -->
      <div class="gc-tab-pane" id="gc-pane-eeat" style="display: none;">
        <div class="gc-eeat-wrap">
          <div class="gc-pane-header">
            <div>
              <h3 class="gc-pane-heading" style="display:flex;align-items:center;gap:6px;">
                <span>Content &amp; Trust Checks (Heuristic E-E-A-T Signals)</span>
                <button type="button" class="gc-help-btn" data-help="content-trust-eeat" aria-label="Help: Content & Trust Heuristics" title="How Content & Trust heuristics work"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
              </h3>
              <p class="gc-pane-subheading">Automated heuristic analysis of author attribution, structured data schema, external citation outlinks, HTTPS integrity, and content depth.</p>
            </div>
          </div>

          <div class="gc-alert-banner info">
            <strong>Heuristic Audit Notice & Limitations:</strong>
            These checks evaluate automated on-page indicators (author metadata, structured data, outbound citations, HTTPS encryption, and content depth). These are technical heuristics to assist editorial audits. They do <strong>NOT</strong> represent Google's proprietary E-E-A-T score, ranking predictions, or verification of real-world human expertise.
          </div>

          <div class="gc-eeat-kpi-grid">
            <div class="gc-eeat-kpi-card highlight">
              <div class="gc-kpi-label">Heuristic Trust Index</div>
              <div class="gc-kpi-value" id="gc-eeat-score-val">0</div>
              <div class="gc-kpi-sub" id="gc-eeat-score-sub">Awaiting crawl data</div>
            </div>
            <div class="gc-eeat-kpi-card">
              <div class="gc-kpi-label">Author Attribution</div>
              <div class="gc-kpi-value" id="gc-eeat-author-val">0 / 0</div>
              <div class="gc-kpi-sub" id="gc-eeat-author-pct">0% of pages</div>
            </div>
            <div class="gc-eeat-kpi-card">
              <div class="gc-kpi-label">Structured Data Schema</div>
              <div class="gc-kpi-value" id="gc-eeat-schema-val">0 / 0</div>
              <div class="gc-kpi-sub" id="gc-eeat-schema-pct">0% of pages</div>
            </div>
            <div class="gc-eeat-kpi-card">
              <div class="gc-kpi-label">External Citations</div>
              <div class="gc-kpi-value" id="gc-eeat-citations-val">0</div>
              <div class="gc-kpi-sub" id="gc-eeat-citations-sub">Outbound reference links</div>
            </div>
          </div>

          <!-- Signals Progress Breakdown -->
          <div class="gc-card-panel" style="margin-top: 20px;">
            <h4 class="gc-card-title">Observed Trust Signals Breakdown</h4>
            <div class="gc-signals-grid" id="gc-eeat-signals-grid"></div>
          </div>

          <!-- Top Audited Pages Table -->
          <div class="gc-card-panel" style="margin-top: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h4 class="gc-card-title" style="margin: 0;">Audited Pages & Signal Observations</h4>
              <span id="gc-eeat-pages-count" style="font-size: 13px; color: var(--gc-text-muted);">0 URLs</span>
            </div>
            <div class="gc-table-wrap">
              <table class="gc-data-table">
                <thead>
                  <tr>
                    <th>URL Address</th>
                    <th>Signal Score</th>
                    <th>Author Info</th>
                    <th>Schema Markup</th>
                    <th>External Citations</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="gc-eeat-tbody">
                  <tr><td colspan="6" class="gc-empty-state"><p>Run or load a crawl to evaluate content & trust signals.</p></td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Recommendations -->
          <div class="gc-card-panel" style="margin-top: 20px;">
            <h4 class="gc-card-title">Actionable Heuristic Recommendations</h4>
            <div id="gc-eeat-recommendations-list" class="gc-recommendations-list">
              <div class="gc-empty-state"><p>Recommendations will appear once crawl evidence is analyzed.</p></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 10: Visualization (Cytoscape Graph) -->
      <div class="gc-tab-pane" id="gc-pane-visualization" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <h3 style="font-size: 15px; font-weight: 700; margin: 0; color: #fff;">Site Structure Network Visualization</h3>
          <div style="display: flex; gap: 8px; align-items: center;">
            <select id="gc-viz-layout" class="gc-setting-select" onchange="window.GroCrawlApp&&window.GroCrawlApp.changeVizLayout(this.value)">
              <option value="cose">Force-Directed</option>
              <option value="breadthfirst">Hierarchical Tree</option>
              <option value="circle">Circle</option>
              <option value="concentric">Concentric</option>
            </select>
            <button type="button" class="gc-btn-secondary" onclick="window.GroCrawlApp&&window.GroCrawlApp.resetViz()">Reset View</button>
          </div>
        </div>
        <div id="gc-cytoscape"></div>
        <div class="gc-graph-legend">
          <span style="font-weight: 600;">Legend:</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:#10b981;border-radius:50%;margin-right:4px;"></span> 2xx Success</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:#3b82f6;border-radius:50%;margin-right:4px;"></span> 3xx Redirect</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:#f59e0b;border-radius:50%;margin-right:4px;"></span> 4xx Error</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:#ef4444;border-radius:50%;margin-right:4px;"></span> 5xx Error</span>
        </div>
      </div>

      <!-- Tab 11: Dashboard / Saved History -->
      <div class="gc-tab-pane" id="gc-pane-dashboard" style="display: none;">
        <div style="background: var(--gc-card-bg); border: 1px solid var(--gc-border); border-radius: 14px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 15px; font-weight: 700; margin: 0; color: #fff;">Saved Audits Dashboard</h3>
            <button type="button" class="gc-btn-secondary" onclick="window.GroCrawlApp&&window.GroCrawlApp.clearHistory()">Clear All</button>
          </div>
          <div id="gc-history-list"></div>
        </div>
      </div>

            <!-- Tab 12: Settings Workspace Overview -->
      <div class="gc-tab-pane" id="gc-pane-settings" style="display: none;">
        <div style="background: var(--gc-card-surface); border: 1px solid var(--gc-border); border-radius: var(--gc-radius-lg); padding: 26px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
            <div>
              <h3 style="font-size: 18px; font-weight: 700; color: #fff; margin: 0 0 4px 0;">GroCrawl Preferences &amp; Engine Configuration</h3>
              <p style="font-size: 13px; color: var(--gc-text-muted); margin: 0;">Configure frontier limits, HTTP request headers, headless JavaScript rendering, filters, and diagnostics.</p>
            </div>
            <button type="button" class="gc-btn-primary" onclick="window.GroCrawlApp&&window.GroCrawlApp.openSettingsModal()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg><span style="margin-left:6px;">Open Settings Workspace</span>
            </button>
          </div>
          <div class="gc-kpi-grid">
            <div class="gc-kpi-card">
              <div class="gc-kpi-title">Active Crawl Depth</div>
              <div class="gc-kpi-num" id="gc-set-stat-depth">3</div>
              <div class="gc-kpi-sub">Levels from seed URL</div>
            </div>
            <div class="gc-kpi-card">
              <div class="gc-kpi-title">Max URL Frontier</div>
              <div class="gc-kpi-num" id="gc-set-stat-urls">50</div>
              <div class="gc-kpi-sub">Pages per audit session</div>
            </div>
            <div class="gc-kpi-card">
              <div class="gc-kpi-title">JS Rendering Engine</div>
              <div class="gc-kpi-num" id="gc-set-stat-js" style="font-size:1.4rem;color:#f59e0b;">Disabled</div>
              <div class="gc-kpi-sub">Fast HTTP stream mode</div>
            </div>
            <div class="gc-kpi-card">
              <div class="gc-kpi-title">PageSpeed Integration</div>
              <div class="gc-kpi-num" id="gc-set-stat-ps" style="font-size:1.4rem;color:var(--gc-brand);">Ready</div>
              <div class="gc-kpi-sub">CrUX & Lighthouse</div>
            </div>
          </div>
          <div style="margin-top: 14px; text-align: center;">
            <button type="button" class="gc-btn-secondary" style="padding: 10px 24px;" onclick="window.GroCrawlApp&&window.GroCrawlApp.openSettingsModal()">
              Launch Detailed Master-Category Settings Dialog ↗
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Dedicated Professional Settings Modal (Master-Detail Architecture) -->
  <div class="gc-modal-backdrop" id="gc-settings-modal" style="display: none;">
    <div class="gc-settings-modal-dialog">
      <!-- Modal Header -->
      <div class="gc-settings-modal-header">
        <div class="gc-settings-modal-title">
          <div class="gc-settings-badge-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg></div>
          <div>
            <h3>Crawler Settings</h3>
          </div>
        </div>
        <button type="button" class="gc-modal-close-btn" onclick="window.GroCrawlApp&&window.GroCrawlApp.closeModals()">✕</button>
      </div>

      <!-- Modal Body (2-Column Category Navigation + Content) -->
      <div class="gc-settings-modal-body">
        <!-- Left Sidebar Categories -->
        <nav class="gc-settings-sidebar">
          <button type="button" class="gc-settings-nav-item active" data-cat="limits" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchSettingsCategory('limits')">
            <span class="gc-settings-nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg></span>
            <span class="gc-settings-nav-title">Limits & Scope</span>
          </button>
          <button type="button" class="gc-settings-nav-item" data-cat="http" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchSettingsCategory('http')">
            <span class="gc-settings-nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg></span>
            <span class="gc-settings-nav-title">HTTP & Robots.txt</span>
          </button>
          <button type="button" class="gc-settings-nav-item" data-cat="js" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchSettingsCategory('js')">
            <span class="gc-settings-nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
            <span class="gc-settings-nav-title">JavaScript Rendering</span>
          </button>
          <button type="button" class="gc-settings-nav-item" data-cat="filters" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchSettingsCategory('filters')">
            <span class="gc-settings-nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg></span>
            <span class="gc-settings-nav-title">URL Filters</span>
          </button>
          <button type="button" class="gc-settings-nav-item" data-cat="exclusions" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchSettingsCategory('exclusions')">
            <span class="gc-settings-nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></span>
            <span class="gc-settings-nav-title">Issue Exclusions</span>
          </button>
          <button type="button" class="gc-settings-nav-item" data-cat="export" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchSettingsCategory('export')">
            <span class="gc-settings-nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
            <span class="gc-settings-nav-title">Export Fields</span>
          </button>
          <button type="button" class="gc-settings-nav-item" data-cat="pagespeed" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchSettingsCategory('pagespeed')">
            <span class="gc-settings-nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg></span>
            <span class="gc-settings-nav-title">PageSpeed API</span>
          </button>
          <button type="button" class="gc-settings-nav-item" data-cat="advanced" onclick="window.GroCrawlApp&&window.GroCrawlApp.switchSettingsCategory('advanced')">
            <span class="gc-settings-nav-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></span>
            <span class="gc-settings-nav-title">Advanced</span>
          </button>
        </nav>

        <!-- Right Content Area: Category Panes -->
        <div class="gc-settings-content">
          <div id="gc-settings-feedback" class="gc-alert-banner success" style="display: none;"></div>

          <!-- Category 1: Limits & Scope -->
          <div class="gc-settings-pane active" id="gc-cat-pane-limits">
            <div class="gc-settings-pane-head" style="display:flex;align-items:center;justify-content:space-between;">
              <h4>Limits &amp; Scope</h4>
              <button type="button" class="gc-help-btn" data-help="concurrency-delays" aria-label="Help: Concurrency & Delays" title="Learn about worker concurrency and delays"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
            </div>
            <div class="gc-form-grid-2">
              <div class="gc-field-group">
                <label for="gc-cfg-max-depth">Maximum Crawl Depth</label>
                <input type="number" id="gc-cfg-max-depth" class="gc-input" min="1" max="10" value="3">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-max-urls">Maximum URLs to Crawl</label>
                <input type="number" id="gc-cfg-max-urls" class="gc-input" min="1" max="5000000" value="50">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-crawl-delay">Crawl Delay (seconds)</label>
                <input type="number" id="gc-cfg-crawl-delay" class="gc-input" min="0" max="60" step="0.1" value="1.0">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-concurrency">Concurrent Worker Threads</label>
                <input type="number" id="gc-cfg-concurrency" class="gc-input" min="1" max="50" value="5">
              </div>
            </div>
            <div class="gc-field-checkbox">
              <label>
                <input type="checkbox" id="gc-cfg-follow-redirects" checked>
                <span>Follow HTTP 3xx Redirect Chains</span>
              </label>
            </div>
            <div class="gc-field-checkbox">
              <label>
                <input type="checkbox" id="gc-cfg-crawl-external">
                <span>Crawl External Destination Links</span>
              </label>
            </div>
            <div class="gc-field-checkbox">
              <label>
                <input type="checkbox" id="gc-cfg-crawl-images">
                <span>Crawl & Download Images as Targets</span>
              </label>
            </div>
          </div>

          <!-- Category 2: HTTP & Robots.txt -->
          <div class="gc-settings-pane" id="gc-cat-pane-http">
            <div class="gc-settings-pane-head">
              <h4>HTTP Requests & Robots Compliance</h4>
              <button type="button" class="gc-help-btn" data-help="robots-js" aria-label="Help: Robots.txt & JS Rendering" title="Learn about robots compliance and rendering"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
            </div>
            <div class="gc-field-group" style="margin-bottom: 14px;">
              <label for="gc-cfg-user-agent">User-Agent Header</label>
              <input type="text" id="gc-cfg-user-agent" class="gc-input" value="GroCrawl/2.0 (compatible; GroniqSpider/2.0; +https://groniqdigital.com)">
            </div>
            <div class="gc-form-grid-2">
              <div class="gc-field-group">
                <label for="gc-cfg-timeout">Request Timeout (seconds)</label>
                <input type="number" id="gc-cfg-timeout" class="gc-input" min="1" max="120" value="10">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-retries">Retry Attempts</label>
                <input type="number" id="gc-cfg-retries" class="gc-input" min="0" max="10" value="3">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-accept-lang">Accept-Language</label>
                <input type="text" id="gc-cfg-accept-lang" class="gc-input" value="en-US,en;q=0.9">
              </div>
            </div>
            <div class="gc-field-checkbox">
              <label>
                <input type="checkbox" id="gc-cfg-respect-robots" checked>
                <span>Respect robots.txt Directives</span>
              </label>
            </div>
            <div class="gc-field-checkbox">
              <label>
                <input type="checkbox" id="gc-cfg-allow-cookies" checked>
                <span>Preserve Session Cookies</span>
              </label>
            </div>
            <div class="gc-field-checkbox">
              <label>
                <input type="checkbox" id="gc-cfg-discover-sitemaps" checked>
                <span>Automatically Discover XML Sitemaps</span>
              </label>
            </div>
            <div class="gc-field-group" style="margin-top: 14px;">
              <label for="gc-cfg-custom-headers">Custom HTTP Headers (one per line)</label>
              <textarea id="gc-cfg-custom-headers" class="gc-textarea" rows="2" placeholder="X-Custom-Auth: token&#10;Authorization: Bearer xyz"></textarea>
            </div>
          </div>

          <!-- Category 3: Headless JavaScript Rendering -->
          <div class="gc-settings-pane" id="gc-cat-pane-js">
            <div class="gc-settings-pane-head">
              <h4>JavaScript Rendering</h4>
              <button type="button" class="gc-help-btn" data-help="robots-js" aria-label="Help: Robots.txt & JS Rendering" title="Learn about JavaScript rendering limitations"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
            </div>
            <div class="gc-field-checkbox" style="margin-bottom: 16px;">
              <label>
                <input type="checkbox" id="gc-cfg-enable-js">
                <span>Enable JavaScript Rendering (Playwright Engine)</span>
              </label>
            </div>
            <div class="gc-form-grid-2">
              <div class="gc-field-group">
                <label for="gc-cfg-js-browser">Browser Engine</label>
                <select id="gc-cfg-js-browser" class="gc-input">
                  <option value="chromium" selected>Chromium (Google Chrome)</option>
                  <option value="firefox">Firefox (Gecko)</option>
                  <option value="webkit">WebKit (Apple Safari)</option>
                </select>
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-js-wait">Post-Load Script Wait (seconds)</label>
                <input type="number" id="gc-cfg-js-wait" class="gc-input" min="0" max="30" step="0.5" value="3.0">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-js-timeout">Page Timeout (seconds)</label>
                <input type="number" id="gc-cfg-js-timeout" class="gc-input" min="5" max="120" value="30">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-js-concurrency">Concurrent Browser Pages</label>
                <input type="number" id="gc-cfg-js-concurrency" class="gc-input" min="1" max="10" value="3">
              </div>
            </div>
            <div class="gc-form-grid-2">
              <div class="gc-field-group">
                <label for="gc-cfg-js-vp-w">Viewport Width (px)</label>
                <input type="number" id="gc-cfg-js-vp-w" class="gc-input" min="800" max="3840" value="1920">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-js-vp-h">Viewport Height (px)</label>
                <input type="number" id="gc-cfg-js-vp-h" class="gc-input" min="600" max="2160" value="1080">
              </div>
            </div>
            <div class="gc-field-checkbox">
              <label>
                <input type="checkbox" id="gc-cfg-js-headless" checked>
                <span>Run Headless Mode</span>
              </label>
            </div>
            <div class="gc-field-group" style="margin-top: 10px;">
              <label for="gc-cfg-js-user-agent">JavaScript User Agent</label>
              <input type="text" id="gc-cfg-js-user-agent" class="gc-input" value="GroCrawl/2.0 (compatible; GroniqSpider/2.0; JavaScript; +https://groniqdigital.com)">
            </div>
          </div>

          <!-- Category 4: Filters -->
          <div class="gc-settings-pane" id="gc-cat-pane-filters">
            <div class="gc-settings-pane-head">
              <h4>URL & File Filtering</h4>
            </div>
            <div class="gc-form-grid-2">
              <div class="gc-field-group">
                <label for="gc-cfg-include-ext">Include Extensions (comma-separated)</label>
                <input type="text" id="gc-cfg-include-ext" class="gc-input" value="html,htm,php,asp,aspx,jsp">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-exclude-ext">Exclude Extensions (comma-separated)</label>
                <input type="text" id="gc-cfg-exclude-ext" class="gc-input" value="pdf,doc,docx,zip,exe,dmg">
              </div>
            </div>
            <div class="gc-form-grid-2">
              <div class="gc-field-group">
                <label for="gc-cfg-include-patterns">Include Regex / Substring Patterns</label>
                <textarea id="gc-cfg-include-patterns" class="gc-textarea" rows="3" placeholder="^/blog/&#10;^/products/"></textarea>
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-exclude-patterns">Exclude Regex / Substring Patterns</label>
                <textarea id="gc-cfg-exclude-patterns" class="gc-textarea" rows="3" placeholder="^/cart/&#10;\?sort=&#10;^/tag/"></textarea>
              </div>
            </div>
            <div class="gc-form-grid-2" style="margin-top: 10px;">
              <div class="gc-field-group">
                <label for="gc-cfg-max-file-size">Maximum Response Size (MB)</label>
                <input type="number" id="gc-cfg-max-file-size" class="gc-input" min="1" max="1000" value="50">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-duplication-thresh">Duplicate Similarity Threshold (0.5 – 1.0)</label>
                <input type="number" id="gc-cfg-duplication-thresh" class="gc-input" min="0.5" max="1.0" step="0.05" value="0.85">
              </div>
            </div>
            <div class="gc-field-checkbox">
              <label>
                <input type="checkbox" id="gc-cfg-enable-duplication" checked>
                <span>Near-Duplicate Content Detection</span>
              </label>
            </div>
          </div>

          <!-- Category 5: Issue Exclusions -->
          <div class="gc-settings-pane" id="gc-cat-pane-exclusions">
            <div class="gc-settings-pane-head">
              <h4>Issue Exclusion Patterns</h4>
            </div>
            <div class="gc-field-group">
              <label for="gc-cfg-issue-exclusions">Exclusion Regex Rules (one per line)</label>
              <textarea id="gc-cfg-issue-exclusions" class="gc-textarea" rows="7"></textarea>
            </div>
            <div style="margin-top: 12px;">
              <button type="button" class="gc-btn-secondary" style="font-size: 12px; padding: 6px 14px;" onclick="window.GroCrawlApp&&window.GroCrawlApp.resetIssueExclusions()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg><span style="margin-left:5px;">Reset Exclusion Patterns</span>
              </button>
            </div>
          </div>

          <!-- Category 6: Export Configuration -->
          <div class="gc-settings-pane" id="gc-cat-pane-export">
            <div class="gc-settings-pane-head">
              <h4>Export Configuration</h4>
            </div>
            <div class="gc-field-group" style="margin-bottom: 16px;">
              <label for="gc-cfg-export-format">Default Export Format</label>
              <select id="gc-cfg-export-format" class="gc-input" style="max-width: 320px;">
                <option value="csv" selected>CSV (Comma Separated Values)</option>
                <option value="xlsx">Excel Workbook (.xlsx)</option>
                <option value="json">JSON (Structured Data)</option>
                <option value="xml">XML (Extensible Markup)</option>
              </select>
            </div>
            <div class="gc-field-group">
              <label>Export Columns (30 Fields)</label>
              <div class="gc-checkbox-grid" id="gc-export-fields-grid"></div>
            </div>
          </div>

          <!-- Category 7: Google PageSpeed Insights -->
          <div class="gc-settings-pane" id="gc-cat-pane-pagespeed">
            <div class="gc-settings-pane-head">
              <h4>Google PageSpeed API</h4>
            </div>
            <div class="gc-field-checkbox" style="margin-bottom: 16px;">
              <label>
                <input type="checkbox" id="gc-cfg-enable-pagespeed">
                <span>Enable Google PageSpeed Insights</span>
              </label>
            </div>
            <div class="gc-field-group">
              <label for="gc-cfg-google-api-key">PageSpeed API Key</label>
              <input type="password" id="gc-cfg-google-api-key" class="gc-input" placeholder="AIzaSy..." autocomplete="off">
            </div>
          </div>

          <!-- Category 8: Advanced & Diagnostics -->
          <div class="gc-settings-pane" id="gc-cat-pane-advanced">
            <div class="gc-settings-pane-head">
              <h4>Advanced Engine</h4>
            </div>
            <div class="gc-form-grid-2">
              <div class="gc-field-group">
                <label for="gc-cfg-memory-limit">Memory Cap (MB)</label>
                <input type="number" id="gc-cfg-memory-limit" class="gc-input" min="64" max="4096" value="512">
              </div>
              <div class="gc-field-group">
                <label for="gc-cfg-log-level">Logger Verbosity</label>
                <select id="gc-cfg-log-level" class="gc-input">
                  <option value="DEBUG">Debug (Detailed trace)</option>
                  <option value="INFO" selected>Info (Standard events)</option>
                  <option value="WARNING">Warning (Anomalies only)</option>
                  <option value="ERROR">Error (Critical failures only)</option>
                </select>
              </div>
            </div>
            <div class="gc-field-group" style="margin-top: 12px;">
              <label for="gc-cfg-custom-css">Custom Workspace CSS</label>
              <textarea id="gc-cfg-custom-css" class="gc-textarea" rows="3" placeholder="/* Injected custom styling rules */"></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Sticky Footer -->
      <div class="gc-settings-modal-footer">
        <div class="gc-settings-footer-info">
          <span>Settings apply to new crawl sessions.</span>
        </div>
        <div class="gc-settings-footer-actions">
          <button type="button" class="gc-btn-secondary" onclick="window.GroCrawlApp&&window.GroCrawlApp.resetSettings()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg><span style="margin-left:5px;">Reset Defaults</span></button>
          <button type="button" class="gc-btn-primary" onclick="window.GroCrawlApp&&window.GroCrawlApp.saveSettings()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg><span style="margin-left:5px;">Save Settings</span></button>
        </div>
      </div>
    </div>
  </div>

  <!-- URL Detail Modal -->
  <div class="gc-modal-backdrop" id="gc-url-modal" style="display: none;">
    <div class="gc-modal">
      <div class="gc-modal-head">
        <h3 class="gc-modal-title" id="gc-modal-url-title">URL Inspection</h3>
        <button type="button" class="gc-modal-close" onclick="window.GroCrawlApp&&window.GroCrawlApp.closeModals()">✕</button>
      </div>
      <div id="gc-modal-url-body"></div>
    </div>
  </div>

  <!-- Export Modal -->
  <div class="gc-modal-backdrop" id="gc-export-modal" style="display: none;">
    <div class="gc-modal" style="max-width: 440px;">
      <div class="gc-modal-head">
        <h3 class="gc-modal-title">Export Audit Data</h3>
        <button type="button" class="gc-modal-close" onclick="window.GroCrawlApp&&window.GroCrawlApp.closeModals()">✕</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 14px;">
        <label>
          Data Scope:
          <select id="gc-export-type" class="gc-setting-select" style="width: 100%; margin-top: 6px;">
            <option value="urls">All Crawled URLs</option>
            <option value="internal">Internal Pages</option>
            <option value="external">External Links</option>
            <option value="issues">SEO Issues & Findings</option>
            <option value="images">Extracted Images</option>
            <option value="links">All Link Connections</option>
          </select>
        </label>
        <label>
          Format:
          <select id="gc-export-fmt" class="gc-setting-select" style="width: 100%; margin-top: 6px;">
            <option value="csv">CSV (Spreadsheet / Excel)</option>
            <option value="json">JSON</option>
          </select>
        </label>
        <button type="button" class="gc-btn-primary" style="margin-top: 10px; justify-content: center;" onclick="window.GroCrawlApp&&window.GroCrawlApp.executeExport()">
          Download Export File ↓
        </button>
      </div>
    </div>
  </div>

  <!-- Contextual (i) Field Help Modal -->
  <div class="gc-modal-backdrop" id="gc-field-help-modal" style="display: none;" role="presentation" onclick="if(event.target===this)window.GroCrawlApp&&window.GroCrawlApp.closeHelpModal();">
    <div class="gc-field-help-dialog" role="dialog" aria-modal="true" aria-labelledby="gc-help-modal-title">
      <div class="gc-field-help-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="gc-help-badge-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
          <h3 class="gc-modal-title" id="gc-help-modal-title" style="margin: 0; font-size: 15px; font-weight: 700;">Contextual Technical Guide</h3>
        </div>
        <button type="button" class="gc-modal-close" id="gc-help-modal-close" aria-label="Close Help Modal" onclick="window.GroCrawlApp&&window.GroCrawlApp.closeHelpModal()">✕</button>
      </div>
      <div class="gc-field-help-body">
        <div class="gc-help-section">
          <div class="gc-help-label">What it is</div>
          <p class="gc-help-text" id="gc-help-what"></p>
        </div>
        <div class="gc-help-section">
          <div class="gc-help-label">Why it matters</div>
          <p class="gc-help-text" id="gc-help-why"></p>
        </div>
        <div class="gc-help-section gc-help-highlight">
          <div class="gc-help-label">Example &amp; Common Misunderstanding</div>
          <p class="gc-help-text" id="gc-help-example"></p>
        </div>
      </div>
      <div class="gc-field-help-footer">
        <a href="/learn/technical-seo-audit/" class="gc-help-learn-btn" id="gc-help-learn-link">
          <span>Read in Technical SEO Guide &rarr;</span>
        </a>
      </div>
    </div>
  </div>

  </div>

</main>
`;

const directory = path.join(__dirname, 'tools/grocrawl');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'index.html'), before + toolMain + after);
console.log('Successfully generated complete integrated GroCrawl tool at tools/grocrawl/index.html');
