const fs = require('fs');
const path = require('path');

const rootHtmlPath = path.join(__dirname, 'index.html');
const rootHtml = fs.readFileSync(rootHtmlPath, 'utf8');

const mainStart = rootHtml.indexOf('<main>');
const mainEnd = rootHtml.indexOf('</main>') + '</main>'.length;

if (mainStart === -1 || mainEnd === -1) {
    console.error('Could not find <main> tags');
    process.exit(1);
}

let beforeMain = rootHtml.substring(0, mainStart);
let afterMain = rootHtml.substring(mainEnd);

// FIX NAV/FOOTER LINKS IN AFTERMAIN (so they work from /tools/utm-builder/)
beforeMain = beforeMain.replace(/href="#/g, 'href="/#');
afterMain = afterMain.replace(/href="#/g, 'href="/#');

// Ensure Tailwind and base styles load correctly in all environments (HTTP & file://)
beforeMain = beforeMain.replace('<link rel="stylesheet" href="/tailwind.css">', `
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
beforeMain = beforeMain.replace(/class="w-8 h-8([^"]*)"/g, 'width="32" height="32" class="w-8 h-8$1"');
afterMain = afterMain.replace(/class="w-8 h-8([^"]*)"/g, 'width="32" height="32" class="w-8 h-8$1"');

// UPDATE SEO & STRUCTURED DATA (JSON-LD)
const schemaPath = path.join(__dirname, 'scratch', 'utm-builder-schema.json');
const utmSchema = fs.readFileSync(schemaPath, 'utf8');

// Replace old schema with comprehensive @graph schema (Organization, WebApplication, BreadcrumbList, FAQPage)
const oldSchemaRegex = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
beforeMain = beforeMain.replace(
    oldSchemaRegex,
    `<script type="application/ld+json">\n${utmSchema}\n    </script>`
);

const newMetaBlock = `<title>Free UTM Builder & GA4 Campaign URL Generator | Groniq</title>
    <meta name="description"
        content="Create consistent UTM tracking links for GA4, Google Ads, Meta and other campaigns. Free campaign URL builder with bulk creation and QR codes.">
    <meta name="keywords"
        content="utm builder, campaign url generator, google analytics url builder, utm code generator, utm link builder, ga4 campaign url builder, campaign tracking url, bulk utm generator, qr code url generator, free utm builder, groniq">
    <meta name="author" content="Groniq Digital Solutions">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <link rel="canonical" href="https://groniqdigital.com/tools/utm-builder/">

    <!-- Open Graph / Social Sharing -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Groniq">
    <meta property="og:locale" content="en_US">
    <meta property="og:url" content="https://groniqdigital.com/tools/utm-builder/">
    <meta property="og:title" content="Free UTM Builder & GA4 Campaign URL Generator | Groniq">
    <meta property="og:description"
        content="Create consistent UTM tracking links for GA4, Google Ads, Meta and other campaigns. Free campaign URL builder with bulk creation and QR codes.">
    <meta property="og:image" content="https://res.cloudinary.com/deaammmyy/image/upload/w_1200,h_630,c_pad,b_rgb:050505/v1765349123/favicon.png">
    <meta property="og:image:secure_url" content="https://res.cloudinary.com/deaammmyy/image/upload/w_1200,h_630,c_pad,b_rgb:050505/v1765349123/favicon.png">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Free UTM Builder & GA4 Campaign URL Generator | Groniq">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@groniq">
    <meta name="twitter:creator" content="@groniq">
    <meta name="twitter:url" content="https://groniqdigital.com/tools/utm-builder/">
    <meta name="twitter:title" content="Free UTM Builder & GA4 Campaign URL Generator | Groniq">
    <meta name="twitter:description"
        content="Create consistent UTM tracking links for GA4, Google Ads, Meta and other campaigns. Free campaign URL builder with bulk creation and QR codes.">
    <meta name="twitter:image" content="https://res.cloudinary.com/deaammmyy/image/upload/w_1200,h_630,c_pad,b_rgb:050505/v1765349123/favicon.png">
    <meta name="twitter:image:alt" content="Free UTM Builder & GA4 Campaign URL Generator | Groniq">`;

const oldMetaRegex = /<title>[\s\S]*?(?=<link rel="icon")/;
beforeMain = beforeMain.replace(oldMetaRegex, `${newMetaBlock}\n\n    `);



// ACTIVE STATES FOR NAVIGATION (Tools)
beforeMain = beforeMain.replace(
    `<a href="/tools/"\n                    class="text-xs font-semibold uppercase tracking-wider text-brand-muted hover:text-white transition-colors">Tools</a>`,
    `<a href="/tools/"\n                    class="text-xs font-semibold uppercase tracking-wider text-brand-green transition-colors">Tools</a>`
);
beforeMain = beforeMain.replace(
    `<a href="/tools/" class="hover:text-white transition-colors">Tools</a>`,
    `<a href="/tools/" class="text-brand-green transition-colors">Tools</a>`
);
beforeMain = beforeMain.replace(
    `<a href="/tools/" onclick="toggleMenu()"\n                            class="text-xl font-bold uppercase tracking-tight hover:text-brand-green transition-colors">Tools</a>`,
    `<a href="/tools/" onclick="toggleMenu()"\n                            class="text-xl font-bold uppercase tracking-tight text-brand-green transition-colors">Tools</a>`
);

// Inject QR Modal CSS
beforeMain = beforeMain.replace(
    `        /* Drawer overlay animation */`,
    `        /* UTM keyboard focus */
        button:focus-visible, select:focus-visible { outline: 2px solid #b4ff39; outline-offset: 3px; }
        /* QR Modal & Overlay States */
        #qr-modal {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1rem !important;
            background: rgba(0, 0, 0, 0.8) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
        }
        #qr-modal.hidden {
            display: none !important;
        }
        #qr-canvas {
            width: 180px !important;
            height: 180px !important;
            max-width: 100% !important;
            display: block !important;
            margin: 0 auto !important;
        }
        @keyframes qrModalEnter {
            from {
                opacity: 0;
                transform: scale(0.96) translateY(12px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        .qr-modal-enter {
            animation: qrModalEnter 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Drawer overlay animation */`
);

const mainContent = `
    <main class="flex-grow bg-[#050505]">
        <!-- BREADCRUMB & HERO -->
        <section class="relative pt-12 pb-14 md:pt-16 md:pb-16 px-6 bg-grid border-b border-[#181818] overflow-hidden text-center">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-green/10 rounded-full blur-[140px] pointer-events-none"></div>
            <div class="max-w-4xl mx-auto relative z-10 space-y-4">
                <nav class="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">
                    <a href="/tools/" class="hover:text-white transition-colors">Tools</a>
                    <span>/</span>
                    <span class="text-brand-green">CAMPAIGN TRACKING & UTM BUILDER</span>
                </nav>
                <h1 class="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
                    UTM <span class="text-brand-green">Builder</span> Workspace
                </h1>
                <p class="text-sm md:text-base text-brand-muted max-w-2xl mx-auto leading-relaxed">
                    Build clean, consistent campaign URLs for Google Analytics, Meta, and paid media without memorizing UTM conventions.
                </p>
                <div class="pt-4 flex items-center justify-center gap-1.5 sm:gap-2 bg-[#111] p-1.5 rounded-xl border border-[#222] max-w-fit mx-auto overflow-x-auto">
                    <button type="button" id="mode-guided" class="px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all bg-brand-green text-black cursor-pointer shrink-0 whitespace-nowrap">Guided</button>
                    <button type="button" id="mode-advanced" class="px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-all cursor-pointer shrink-0 whitespace-nowrap">Advanced</button>
                    <button type="button" id="mode-bulk" class="px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-all cursor-pointer shrink-0 whitespace-nowrap">Bulk</button>
                    <button type="button" id="mode-campaigns" class="px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-all cursor-pointer shrink-0 whitespace-nowrap">Campaigns</button>
                    <button type="button" id="mode-checker" class="px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-all cursor-pointer shrink-0 whitespace-nowrap">Check URL</button>
                </div>
            </div>
        </section>

        <!-- WORKSPACE -->
        <section class="py-8 px-6 min-h-[60vh]">
            <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <!-- LEFT: BUILDER INPUTS -->
                <div class="lg:col-span-7 space-y-6" id="workspace-left">
                    <div class="flex items-center justify-between pb-3 border-b border-[#181818]">
                        <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-muted">Campaign Workspace</span>
                        <div class="flex items-center gap-2">
                            <button id="btn-open-saved" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111] border border-[#262626] text-xs font-semibold text-brand-muted hover:text-white hover:border-brand-green/40 transition-all focus:outline-none focus:ring-1 focus:ring-brand-green cursor-pointer" aria-haspopup="dialog" aria-expanded="false">
                                <i data-lucide="bookmark" class="w-3.5 h-3.5 text-brand-green pointer-events-none"></i>
                                <span class="pointer-events-none">Saved</span>
                            </button>
                            <button id="btn-naming-settings" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111] border border-[#262626] text-xs font-semibold text-brand-muted hover:text-white hover:border-brand-green/40 transition-all focus:outline-none focus:ring-1 focus:ring-brand-green cursor-pointer" aria-haspopup="dialog" aria-expanded="false">
                                <i data-lucide="settings" class="w-3.5 h-3.5 text-brand-green pointer-events-none"></i>
                                <span class="pointer-events-none">Naming settings</span>
                            </button>
                        </div>
                    </div>

                    <!-- ACTIVE CAMPAIGN EDITING BANNER -->
                    <div id="campaign-editing-banner" class="hidden p-3.5 rounded-xl bg-brand-green/10 border border-brand-green/30 flex items-center justify-between gap-3 text-xs">
                        <div class="flex items-center gap-2 text-white">
                            <i data-lucide="edit-3" class="w-4 h-4 text-brand-green shrink-0"></i>
                            <span>Editing saved campaign: <strong id="campaign-editing-name" class="text-brand-green font-bold"></strong></span>
                        </div>
                        <button id="btn-cancel-campaign-edit" type="button" class="text-[10px] font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded bg-[#161616] border border-[#262626] hover:border-white/30">Cancel edit</button>
                    </div>
                    
                    <!-- GUIDED MODE CONTENT -->
                    <div class="p-3 border border-[#2A2A2A] rounded-xl text-xs space-y-2 min-w-0"><label for="single-conflict-policy" class="block text-white font-bold">Existing UTM values</label><select id="single-conflict-policy" data-conflict-policy class="w-full bg-[#141414] text-white border border-[#333] rounded-lg p-2"><option value="replace">Replace with entered campaign values</option><option value="keep">Keep existing values; fill missing fields</option></select><p class="text-brand-muted">Replace removes old UTM values, including fields left blank. Keep retains the first non-empty value when a field repeats. Other query parameters and fragments stay intact.</p><p id="single-conflict-details" role="status" class="text-amber-400 break-all"></p></div>
<div id="guided-mode-container" class="space-y-6">
                        <!-- Step 1 -->
                        <div class="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="w-6 h-6 rounded bg-brand-green/10 text-brand-green text-xs font-black flex items-center justify-center">1</span>
                                <h2 class="text-sm font-bold uppercase tracking-wider text-white">Destination URL</h2>
                            </div>
                            <p class="text-[11px] text-brand-muted mb-4 ml-9">The page you want people to visit.</p>
                            <input type="url" id="dest-url" aria-label="Landing page URL" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-3 text-white placeholder-brand-muted outline-none text-sm transition-colors" placeholder="https://example.com/landing-page" required>
                            <div class="mt-2.5 flex items-center gap-1.5 flex-wrap">
                                <span class="text-[10px] uppercase font-bold tracking-wider text-brand-muted">Try sample:</span>
                                <button type="button" class="btn-sample-url text-[10px] font-mono px-2 py-1 rounded bg-[#161616] hover:bg-[#222] text-brand-mutedLight hover:text-brand-green border border-[#262626] transition-colors cursor-pointer" data-url="https://groniqdigital.com/pricing">groniqdigital.com/pricing</button>
                                <button type="button" class="btn-sample-url text-[10px] font-mono px-2 py-1 rounded bg-[#161616] hover:bg-[#222] text-brand-mutedLight hover:text-brand-green border border-[#262626] transition-colors cursor-pointer" data-url="https://mystore.com/summer-sale">mystore.com/summer-sale</button>
                            </div>
                            <p id="url-warning" class="text-[11px] text-yellow-500 mt-2 hidden flex items-center gap-1"><i data-lucide="alert-triangle" class="w-3 h-3"></i> Existing UTM parameters detected. They will be overwritten.</p>
                            <p id="guided-dest-error" class="hidden text-xs text-red-400 mt-2 flex items-center gap-1.5"><i data-lucide="alert-circle" class="w-3.5 h-3.5 shrink-0"></i> <span id="guided-dest-error-msg">Please enter a valid destination URL.</span></p>
                        </div>

                        <!-- Step 2 -->
                        <div class="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="w-6 h-6 rounded bg-brand-green/10 text-brand-green text-xs font-black flex items-center justify-center">2</span>
                                <h2 class="text-sm font-bold uppercase tracking-wider text-white">Channel</h2>
                            </div>
                            <p class="text-[11px] text-brand-muted mb-4 ml-9">Choose where this campaign will run.</p>
                            <div class="flex flex-wrap gap-2" id="platform-presets">
                                <!-- Rendered by JS -->
                            </div>
                            <p id="guided-channel-error" class="hidden text-xs text-red-400 mt-2 flex items-center gap-1.5"><i data-lucide="alert-circle" class="w-3.5 h-3.5 shrink-0"></i> <span>Please select a channel preset.</span></p>
                            <div id="dynamic-placement-container" class="mt-4 hidden p-4 bg-[#141414] border border-[#222] rounded-xl border-l-2 border-l-brand-green">
                                <!-- Rendered by JS -->
                            </div>
                        </div>

                        <!-- Step 3 -->
                        <div class="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="w-6 h-6 rounded bg-brand-green/10 text-brand-green text-xs font-black flex items-center justify-center">3</span>
                                <h2 class="text-sm font-bold uppercase tracking-wider text-white">Campaign Name</h2>
                            </div>
                            <p class="text-[11px] text-brand-muted mb-4 ml-9">Give this campaign a clear, recognizable name.</p>
                            <div class="flex flex-wrap gap-3 text-xs mb-3"><span data-preset-save-slot></span><button type="button" data-preset-load class="text-brand-green font-bold">Load / manage presets</button></div>
<input type="text" id="guided-campaign" aria-label="Campaign name" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-3 text-white placeholder-brand-muted outline-none text-sm transition-colors" placeholder="e.g. Summer Launch 2026">
                            <div id="campaign-preview-container" class="hidden mt-3 p-3 bg-brand-green/5 border border-brand-green/20 rounded-lg">
                                <span class="text-[10px] font-bold uppercase tracking-widest text-brand-green block mb-1">Tracking value</span>
                                <span id="campaign-preview" class="font-mono text-xs text-brand-mutedLight"></span>
                            </div>
                        </div>

                        <!-- Step 4 -->
                        <div class="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
                            <details class="group">
                                <summary class="flex items-center gap-2 cursor-pointer list-none text-brand-muted hover:text-white transition-colors">
                                    <i data-lucide="plus-circle" class="w-5 h-5 text-brand-green group-open:hidden"></i>
                                    <i data-lucide="minus-circle" class="w-5 h-5 text-brand-green hidden group-open:block"></i>
                                    <span class="text-sm font-bold uppercase tracking-wider text-brand-green">Optional details</span>
                                </summary>
                                <p class="text-[11px] text-brand-muted mt-3 mb-4">Add more detail when you need to distinguish ads, creatives, keywords, or campaign variations.</p>
                                <div class="mt-4 grid grid-cols-1 gap-6 border-t border-[#1C1C1C] pt-6">
                                    <div>
                                        <div class="flex items-center justify-between mb-1">
                                            <label class="text-[11px] font-bold uppercase tracking-widest text-white block">Campaign Content</label>
                                            <span class="text-[10px] font-mono text-brand-muted">utm_content</span>
                                        </div>
                                        <p class="text-[10px] text-brand-muted mb-2">Distinguish creatives, ads, links, or variations.</p>
                                        <input type="text" id="guided-content" aria-label="Campaign content" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-3 text-white placeholder-brand-muted outline-none text-sm transition-colors" placeholder="e.g. Video Ad 01">
                                    </div>
                                    <div>
                                        <div class="flex items-center justify-between mb-1">
                                            <label class="text-[11px] font-bold uppercase tracking-widest text-white block">Campaign Term</label>
                                            <span class="text-[10px] font-mono text-brand-muted">utm_term</span>
                                        </div>
                                        <p class="text-[10px] text-brand-muted mb-2">Optionally identify a keyword, audience, or targeting detail.</p>
                                        <input type="text" id="guided-term" aria-label="Campaign term" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-3 text-white placeholder-brand-muted outline-none text-sm transition-colors" placeholder="e.g. Search Keyword">
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>

                    <!-- ADVANCED MODE CONTENT (Hidden by default) -->
                    <div id="advanced-mode-container" class="hidden space-y-6">
                        <div class="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-5">
                            <div>
                                <label class="text-[11px] font-bold uppercase tracking-widest text-brand-green block mb-1">Destination URL *</label>
                                <p class="text-[10px] text-brand-muted mb-2">The page this campaign should send traffic to.</p>
                                <input type="url" id="adv-url" aria-label="Landing page URL" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-3 text-white placeholder-brand-muted outline-none text-sm transition-colors" placeholder="https://example.com/landing-page">
                                <div class="mt-2.5 flex items-center gap-1.5 flex-wrap">
                                    <span class="text-[10px] uppercase font-bold tracking-wider text-brand-muted">Try sample:</span>
                                    <button type="button" class="btn-sample-url text-[10px] font-mono px-2 py-1 rounded bg-[#161616] hover:bg-[#222] text-brand-mutedLight hover:text-brand-green border border-[#262626] transition-colors cursor-pointer" data-url="https://groniqdigital.com/pricing">groniqdigital.com/pricing</button>
                                    <button type="button" class="btn-sample-url text-[10px] font-mono px-2 py-1 rounded bg-[#161616] hover:bg-[#222] text-brand-mutedLight hover:text-brand-green border border-[#262626] transition-colors cursor-pointer" data-url="https://mystore.com/summer-sale">mystore.com/summer-sale</button>
                                </div>
                                <p id="adv-url-error" class="hidden text-xs text-red-400 mt-2 flex items-center gap-1.5"><i data-lucide="alert-circle" class="w-3.5 h-3.5 shrink-0"></i> <span id="adv-url-error-msg">Please enter a valid destination URL.</span></p>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <div class="flex items-center justify-between mb-1">
                                        <label class="text-[11px] font-bold uppercase tracking-widest text-brand-green">Campaign Source *</label>
                                        <span class="text-[10px] font-mono text-brand-muted">utm_source</span>
                                    </div>
                                    <p class="text-[10px] text-brand-muted mb-1.5">Identifies where the traffic comes from.</p>
                                    <input type="text" id="adv-source" aria-label="Campaign source" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-2.5 text-white placeholder-brand-muted outline-none text-sm font-mono" placeholder="e.g. google">
                                    <p id="adv-source-error" class="hidden text-xs text-red-400 mt-1.5 flex items-center gap-1.5"><i data-lucide="alert-circle" class="w-3.5 h-3.5 shrink-0"></i> <span>Campaign Source is required.</span></p>
                                </div>
                                <div>
                                    <div class="flex items-center justify-between mb-1">
                                        <label class="text-[11px] font-bold uppercase tracking-widest text-brand-green">Campaign Medium *</label>
                                        <span class="text-[10px] font-mono text-brand-muted">utm_medium</span>
                                    </div>
                                    <p class="text-[10px] text-brand-muted mb-1.5">Identifies the marketing channel or traffic type.</p>
                                    <input type="text" id="adv-medium" aria-label="Campaign medium" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-2.5 text-white placeholder-brand-muted outline-none text-sm font-mono" placeholder="e.g. cpc">
                                    <p id="adv-medium-error" class="hidden text-xs text-red-400 mt-1.5 flex items-center gap-1.5"><i data-lucide="alert-circle" class="w-3.5 h-3.5 shrink-0"></i> <span>Campaign Medium is required.</span></p>
                                </div>
                                <div>
                                    <div class="flex items-center justify-between mb-1">
                                        <label class="text-[11px] font-bold uppercase tracking-widest text-brand-green">Campaign Name</label>
                                        <span class="text-[10px] font-mono text-brand-muted">utm_campaign</span>
                                    </div>
                                    <p class="text-[10px] text-brand-muted mb-1.5">Identifies the campaign this traffic belongs to.</p>
                                    <div class="flex flex-wrap gap-3 text-xs mb-3"><span data-preset-save-slot></span><button type="button" data-preset-load class="text-brand-green font-bold">Load / manage presets</button></div>
<input type="text" id="adv-campaign" aria-label="Campaign name" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-2.5 text-white placeholder-brand-muted outline-none text-sm font-mono" placeholder="e.g. Summer Launch 2026">
                                </div>
                                <div>
                                    <div class="flex items-center justify-between mb-1">
                                        <label class="text-[11px] font-bold uppercase tracking-widest text-white">Campaign Content</label>
                                        <span class="text-[10px] font-mono text-brand-muted">utm_content</span>
                                    </div>
                                    <p class="text-[10px] text-brand-muted mb-1.5">Distinguish creatives, ads, links, or variations.</p>
                                    <input type="text" id="adv-content" aria-label="Campaign content" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-2.5 text-white placeholder-brand-muted outline-none text-sm font-mono" placeholder="e.g. Video Ad 01">
                                </div>
                                <div>
                                    <div class="flex items-center justify-between mb-1">
                                        <label class="text-[11px] font-bold uppercase tracking-widest text-white">Campaign Term</label>
                                        <span class="text-[10px] font-mono text-brand-muted">utm_term</span>
                                    </div>
                                    <p class="text-[10px] text-brand-muted mb-1.5">Optionally identify a keyword, audience, or targeting detail.</p>
                                    <input type="text" id="adv-term" aria-label="Campaign term" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-2.5 text-white placeholder-brand-muted outline-none text-sm font-mono" placeholder="e.g. Search Keyword">
                                </div>
                                <div>
                                    <div class="flex items-center justify-between mb-1">
                                        <label class="text-[11px] font-bold uppercase tracking-widest text-white">Campaign ID</label>
                                        <span class="text-[10px] font-mono text-brand-muted">utm_id</span>
                                    </div>
                                    <p class="text-[10px] text-brand-muted mb-1.5">Optionally store an internal or platform campaign identifier.</p>
                                    <input type="text" id="adv-id" aria-label="Campaign ID" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-2.5 text-white placeholder-brand-muted outline-none text-sm font-mono" placeholder="e.g. CMP-001">
                                </div>
                            </div>
                            
                            <!-- Custom Params -->
                            <div class="pt-6 border-t border-[#1C1C1C]">
                                <div class="flex items-center justify-between mb-1">
                                    <label class="text-[11px] font-bold uppercase tracking-widest text-white block">Custom parameters</label>
                                    <button id="add-custom-param" class="text-[10px] uppercase font-bold text-brand-green hover:text-white transition-colors cursor-pointer">+ Add parameter</button>
                                </div>
                                <p class="text-[10px] text-brand-muted mb-4">Add additional query parameters when your campaign or platform requires them.</p>
                                <div id="custom-params-container" class="space-y-3">
                                    <!-- Dynamic -->
                                </div>
                                <div id="custom-params-error" class="hidden text-xs text-red-400 mt-2.5 p-2.5 rounded-xl bg-red-950/40 border border-red-900/50 flex items-center gap-2">
                                    <i data-lucide="alert-circle" class="w-4 h-4 text-red-500 shrink-0"></i>
                                    <span id="custom-params-error-msg">Please fix custom parameter errors.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- CHECKER MODE CONTENT (Hidden by default) -->
                    <div id="checker-mode-container" class="hidden space-y-6">
                        <div class="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
                            <h2 class="text-base font-bold uppercase tracking-wider text-white mb-1">Check a campaign URL</h2>
                            <p class="text-xs text-brand-muted mb-6">Paste a URL to inspect its tracking parameters and spot common issues.</p>

                            <div class="space-y-4">
                                <div>
                                    <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted block mb-2">Campaign URL</label>
                                    <input type="text" id="checker-input" 
                                        class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-3.5 text-white placeholder-brand-muted outline-none text-xs sm:text-sm font-mono transition-colors" 
                                        placeholder="Paste a campaign URL">
                                </div>

                                <div id="checker-error" class="hidden text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-3.5 rounded-xl flex items-center gap-2.5">
                                    <i data-lucide="alert-circle" class="w-4 h-4 text-red-500 shrink-0"></i>
                                    <span id="checker-error-msg">Enter a URL to check.</span>
                                </div>

                                <button id="checker-parse-btn" class="w-full py-3.5 bg-brand-green text-black font-extrabold uppercase tracking-wider text-xs rounded-xl hover:bg-brand-greenHover transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <span>Check URL</span>
                                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                                </button>
                            </div>

                            <div id="checker-results" class="mt-8 hidden space-y-6 pt-6 border-t border-[#1C1C1C]">
                                <!-- Rendered dynamically by JS -->
                            </div>
                        </div>
                    </div>

                </div>

                <!-- RIGHT: LIVE PREVIEW & ACTIONS -->
                <div class="lg:col-span-5" id="workspace-right">
                    <div class="sticky top-24 space-y-4">
                        
                        <!-- GENERATED URL -->
                        <div class="p-5 sm:p-6 rounded-2xl bg-[#050505] border border-brand-green/40 shadow-[0_0_30px_rgba(57,255,20,0.05)] flex flex-col h-full relative overflow-hidden group">
                            <!-- Background glow -->
                            <div class="absolute -top-10 -right-10 w-32 h-32 bg-brand-green/10 rounded-full blur-2xl pointer-events-none"></div>
                            
                            <div class="flex items-center justify-between mb-4 relative z-10">
                                <span class="text-[10px] font-black uppercase tracking-widest text-brand-green flex items-center gap-2">
                                    <span class="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse"></span> Campaign URL
                                </span>
                                <div id="utm-health-badge" class="px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest bg-[#1A1A1A] text-brand-muted border border-[#333]">Waiting</div>
                            </div>
                            
                            <div class="bg-[#111] border border-[#222] rounded-xl p-4 mb-2 relative group-hover:border-[#333] transition-colors">
                                <p id="final-url-display" class="font-mono text-xs text-brand-mutedLight break-all leading-relaxed min-h-[60px]">
                                    Enter a destination URL to begin...
                                </p>
                            </div>
                            <p class="text-[10px] text-brand-muted mb-5 relative z-10">Your tracking URL updates as you build the campaign.</p>

                            <div class="space-y-2 mb-5 relative z-10">
                                <button id="btn-save-campaign" type="button" class="w-full py-3.5 bg-brand-green text-black font-extrabold uppercase tracking-wider text-xs sm:text-sm rounded-xl hover:bg-brand-greenHover active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(57,255,20,0.15)]">
                                    <i data-lucide="bookmark" class="w-4 h-4 pointer-events-none"></i>
                                    <span id="btn-save-campaign-text" class="pointer-events-none">Save Campaign</span>
                                </button>
                                <button id="btn-copy" class="w-full py-3.5 bg-white text-black font-extrabold uppercase tracking-wider text-xs sm:text-sm rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                    <i data-lucide="copy" class="w-4 h-4 pointer-events-none"></i> <span class="pointer-events-none">Copy URL</span>
                                </button>
                                <div class="grid grid-cols-2 gap-2">
                                    <button id="btn-open-url" type="button" class="py-2.5 px-3 bg-[#141414] hover:bg-[#1f1f1f] text-white border border-[#262626] hover:border-brand-green/40 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer opacity-40">
                                        <i data-lucide="external-link" class="w-3.5 h-3.5 text-brand-green pointer-events-none"></i>
                                        <span class="pointer-events-none">Open URL</span>
                                    </button>
                                    <button id="btn-show-qr" type="button" class="py-2.5 px-3 bg-[#141414] hover:bg-[#1f1f1f] text-white border border-[#262626] hover:border-brand-green/40 font-bold uppercase tracking-wider text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer opacity-40">
                                        <i data-lucide="qr-code" class="w-3.5 h-3.5 text-brand-green pointer-events-none"></i>
                                        <span class="pointer-events-none">QR code</span>
                                    </button>
                                </div>
                            </div>

                            <div class="flex items-center justify-between border-t border-[#1C1C1C] pt-4 mt-auto">
                                <button id="btn-save-as-template" type="button" class="text-[10px] font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                                    <i data-lucide="bookmark-plus" class="w-3.5 h-3.5 text-brand-green pointer-events-none"></i>
                                    <span class="pointer-events-none">Save campaign preset</span>
                                </button>
                                <button id="btn-reset" class="text-[10px] font-bold uppercase tracking-wider text-red-500/80 hover:text-red-500 transition-colors flex items-center gap-1 cursor-pointer">
                                    <i data-lucide="rotate-ccw" class="w-3 h-3 pointer-events-none"></i>
                                    <span class="pointer-events-none">Reset</span>
                                </button>
                            </div>
                        </div>

                        <!-- PARAMETER BREAKDOWN -->
                        <div class="p-5 sm:p-6 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C]">
                            <h3 class="text-xs font-bold uppercase tracking-widest text-brand-muted mb-4 border-b border-[#222] pb-4">Tracking breakdown</h3>
                            <div class="space-y-4 text-xs" id="measurement-preview">
                                <!-- Dynamic Preview -->
                                <p class="text-[#555] italic">Your tracking URL will appear here.</p>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- BULK MODE CONTENT (Full Width 12 cols when active) -->
                <div id="bulk-mode-container" class="lg:col-span-12 hidden space-y-6">
<div class="p-3 border border-[#2A2A2A] rounded-xl text-xs space-y-2 min-w-0"><label for="bulk-conflict-policy" class="block text-white font-bold">Existing UTM values</label><select id="bulk-conflict-policy" data-conflict-policy class="w-full bg-[#141414] text-white border border-[#333] rounded-lg p-2"><option value="replace">Replace with entered campaign values</option><option value="keep">Keep existing values; fill missing fields</option></select><p class="text-brand-muted">Replace removes old UTM values, including fields left blank. Keep retains the first non-empty value when a field repeats. Other query parameters and fragments stay intact.</p></div><button type="button" data-preset-load class="text-brand-green text-xs font-bold py-3">Fill bulk fields from a saved preset</button>
                    <!-- Bulk Intro & Toolbar Card -->
                    <div class="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-6">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-6">
                            <div>
                                <h2 class="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-1.5">Build campaign URLs in bulk</h2>
                                <p class="text-xs sm:text-sm text-brand-muted">Create tracking URLs for multiple campaigns, links, or variations at once.</p>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button id="btn-bulk-add-row" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider hover:bg-brand-greenHover transition-all cursor-pointer">
                                    <i data-lucide="plus" class="w-4 h-4 pointer-events-none"></i>
                                    <span class="pointer-events-none">Add row</span>
                                </button>
                                <button id="btn-bulk-paste" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white hover:border-brand-green/40 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                                    <i data-lucide="clipboard" class="w-3.5 h-3.5 text-brand-green pointer-events-none"></i>
                                    <span class="pointer-events-none">Paste from spreadsheet</span>
                                </button>
                                <button id="btn-bulk-import-csv" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141414] border border-[#2A2A2A] text-white hover:border-brand-green/40 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                                    <i data-lucide="upload" class="w-3.5 h-3.5 text-brand-green pointer-events-none"></i>
                                    <span class="pointer-events-none">Import CSV</span>
                                </button>
                                <input type="file" id="bulk-csv-file-input" accept=".csv,text/csv" class="hidden">
                            </div>
                        </div>

                        <!-- Summary & Batch Actions Bar -->
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#111] border border-[#222]">
                            <div class="flex items-center gap-3 text-xs flex-wrap">
                                <span id="bulk-summary-counts" role="status" class="font-bold text-white">1 row · 0 ready · 1 needs attention</span>
                                <span class="text-brand-muted hidden sm:inline">|</span>
                                <button id="bulk-naming-shortcut" type="button" class="text-brand-muted hover:text-brand-green transition-colors text-[11px] font-mono flex items-center gap-1 cursor-pointer">
                                    <i data-lucide="settings" class="w-3 h-3 text-brand-green"></i>
                                    <span id="bulk-naming-label">Naming: lowercase, underscore</span>
                                </button>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <button id="btn-bulk-copy-all" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all cursor-pointer">
                                    <i data-lucide="copy" class="w-3.5 h-3.5 pointer-events-none"></i>
                                    <span class="pointer-events-none">Copy all URLs</span>
                                </button>
                                <button id="btn-bulk-export-csv" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181818] border border-[#333] text-white hover:border-brand-green/40 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                                    <i data-lucide="download" class="w-3.5 h-3.5 text-brand-green pointer-events-none"></i>
                                    <span class="pointer-events-none">Export CSV</span>
                                </button>
                                <button id="btn-bulk-clear-all" type="button" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500/80 hover:text-red-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i>
                                    <span class="pointer-events-none">Clear rows</span>
                                </button>
                            </div>
                        </div>

                        <!-- DESKTOP TABLE VIEW -->
                        <div class="hidden lg:block overflow-x-auto rounded-xl border border-[#222]">
                            <table class="w-full text-left border-collapse" id="bulk-desktop-table">
                                <thead>
                                    <tr class="bg-[#141414] text-[10px] font-bold uppercase tracking-wider text-brand-muted border-b border-[#222]">
                                        <th class="p-3 w-10 text-center">#</th>
                                        <th class="p-3 min-w-[200px]">Destination URL *</th>
                                        <th class="p-3 min-w-[120px]">Source *</th>
                                        <th class="p-3 min-w-[120px]">Medium *</th>
                                        <th class="p-3 min-w-[160px]">Campaign *</th>
                                        <th class="p-3 min-w-[130px]">Content</th>
                                        <th class="p-3 min-w-[130px]">Term</th>
                                        <th class="p-3 min-w-[200px]">Campaign URL / Status</th>
                                        <th class="p-3 w-28 text-right pr-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="bulk-table-body" class="divide-y divide-[#1A1A1A] bg-[#0D0D0D] text-xs">
                                    <!-- Rendered dynamically -->
                                </tbody>
                            </table>
                        </div>

                        <!-- MOBILE STACKED CARDS VIEW -->
                        <div class="block lg:hidden space-y-4" id="bulk-mobile-container">
                            <!-- Rendered dynamically -->
                        </div>
                    </div>
                </div>

                <!-- CAMPAIGNS MODE CONTENT (Full Width 12 cols when active) -->
                <div id="campaigns-mode-container" class="lg:col-span-12 hidden space-y-6">
                    
                    <!-- VIEW 1: CAMPAIGNS LIST VIEW -->
                    <div id="campaigns-list-view" class="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-6">
                        <!-- Header & Top Action Bar -->
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C1C1C] pb-6">
                            <div>
                                <h2 class="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-1.5">Campaign workspace</h2>
                                <p class="text-xs sm:text-sm text-brand-muted">Keep tracking links for the same campaign organized across channels.</p>
                            </div>
                            <div class="flex items-center gap-3 flex-wrap">
                                <div class="relative w-full sm:w-64">
                                    <i data-lucide="search" class="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                                    <input type="text" id="campaigns-search-input" placeholder="Search campaigns..." class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl pl-9 pr-4 py-2 text-white placeholder-brand-muted outline-none text-xs transition-colors">
                                </div>
                                <button id="btn-create-campaign" type="button" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider hover:bg-brand-greenHover transition-all cursor-pointer">
                                    <i data-lucide="plus" class="w-4 h-4 pointer-events-none"></i>
                                    <span class="pointer-events-none">Create campaign</span>
                                </button>
                            </div>
                        </div>

                        <!-- Storage notice bar -->
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#111] border border-[#222]">
                            <div class="flex items-center gap-2 text-xs text-brand-muted">
                                <i data-lucide="shield-check" class="w-4 h-4 text-brand-green shrink-0"></i>
                                <span>Campaigns are stored locally in this browser.</span>
                            </div>
                            <span id="campaigns-count-badge" class="text-xs font-mono font-bold text-white">0 campaigns</span>
                        </div>

                        <!-- Empty state -->
                        <div id="campaigns-empty-state" class="hidden text-center py-16 px-4 space-y-4 rounded-xl border border-dashed border-[#222] bg-[#0A0A0A]">
                            <div class="w-12 h-12 rounded-2xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center mx-auto text-brand-green">
                                <i data-lucide="folder-kanban" class="w-6 h-6"></i>
                            </div>
                            <div class="space-y-1">
                                <h3 class="text-base font-bold text-white">No campaigns yet.</h3>
                                <p class="text-xs text-brand-muted max-w-sm mx-auto">Create a campaign to keep related tracking links organized in one place.</p>
                            </div>
                            <div>
                                <button id="btn-empty-create-campaign" type="button" class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider hover:bg-brand-greenHover transition-all cursor-pointer">
                                    <i data-lucide="plus" class="w-4 h-4 pointer-events-none"></i>
                                    <span class="pointer-events-none">Create campaign</span>
                                </button>
                            </div>
                        </div>

                        <!-- Campaigns Cards Grid -->
                        <div id="campaigns-items-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <!-- Populated dynamically -->
                        </div>
                    </div>

                    <!-- VIEW 2: CAMPAIGN DETAIL VIEW -->
                    <div id="campaign-detail-view" class="hidden space-y-6">
                        <!-- Navigation Back Button -->
                        <div>
                            <button id="btn-back-to-campaigns" type="button" class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted hover:text-white transition-colors cursor-pointer group">
                                <i data-lucide="arrow-left" class="w-4 h-4 text-brand-green group-hover:-translate-x-0.5 transition-transform"></i>
                                <span>Back to campaigns</span>
                            </button>
                        </div>

                        <!-- Campaign Header Card -->
                        <div class="p-6 sm:p-8 rounded-2xl bg-[#0D0D0D] border border-[#1C1C1C] space-y-6">
                            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-[#1C1C1C] pb-6">
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2">
                                        <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded">Campaign</span>
                                    </div>
                                    <h2 id="campaign-detail-name" class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">Summer Launch 2026</h2>
                                    <div class="flex items-center gap-2 flex-wrap pt-1">
                                        <div class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141414] border border-[#262626] text-xs font-mono text-brand-mutedLight">
                                            <span class="text-brand-muted text-[10px] uppercase">Tracking value:</span>
                                            <span id="campaign-detail-tracking-value" class="text-brand-green font-bold">summer_launch_2026</span>
                                        </div>
                                        <div id="campaign-detail-id-container" class="hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141414] border border-[#262626] text-xs font-mono text-brand-mutedLight">
                                            <span class="text-brand-muted text-[10px] uppercase">utm_id:</span>
                                            <span id="campaign-detail-id-badge" class="text-white font-bold">CMP-001</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center gap-2 flex-wrap">
                                    <button id="btn-add-tracking-link" type="button" class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider hover:bg-brand-greenHover transition-all cursor-pointer">
                                        <i data-lucide="plus" class="w-4 h-4 pointer-events-none"></i>
                                        <span class="pointer-events-none">Add tracking link</span>
                                    </button>
                                    <button id="btn-campaign-copy-all" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-gray-200 transition-all cursor-pointer">
                                        <i data-lucide="copy" class="w-4 h-4 pointer-events-none"></i>
                                        <span class="pointer-events-none">Copy all URLs</span>
                                    </button>
                                    <button id="btn-campaign-export-csv" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-white hover:border-brand-green/40 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                                        <i data-lucide="download" class="w-4 h-4 text-brand-green pointer-events-none"></i>
                                        <span class="pointer-events-none">Export CSV</span>
                                    </button>
                                    <button id="btn-campaign-open-bulk" type="button" class="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-brand-muted hover:text-white hover:border-brand-green/40 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                                        <i data-lucide="external-link" class="w-4 h-4 text-brand-green pointer-events-none"></i>
                                        <span class="pointer-events-none">Open in Bulk</span>
                                    </button>
                                    <button id="btn-campaign-rename-header" type="button" class="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-brand-muted hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer">
                                        <i data-lucide="pencil" class="w-3.5 h-3.5 pointer-events-none"></i>
                                        <span class="pointer-events-none">Rename</span>
                                    </button>
                                    <button id="btn-campaign-duplicate-header" type="button" class="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#141414] border border-[#262626] text-brand-muted hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer">
                                        <i data-lucide="copy-plus" class="w-3.5 h-3.5 pointer-events-none"></i>
                                        <span class="pointer-events-none">Duplicate</span>
                                    </button>
                                    <button id="btn-campaign-delete-header" type="button" class="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-red-500/80 hover:text-red-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
                                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                                        <span class="pointer-events-none">Delete</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Summary Counts Bar -->
                            <div class="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#111] border border-[#222]">
                                <span id="campaign-detail-status-counts" class="text-xs font-bold text-white">0 tracking links</span>
                                <span class="text-[11px] text-brand-muted">Campaign context is shared across all links</span>
                            </div>

                            <!-- Tracking links section -->
                            <div class="space-y-4">
                                <h3 class="text-xs font-bold uppercase tracking-widest text-brand-muted">Tracking links</h3>
                                
                                <!-- Empty state for links -->
                                <div id="campaign-links-empty-state" class="hidden text-center py-12 px-4 space-y-4 rounded-xl border border-dashed border-[#222] bg-[#0A0A0A]">
                                    <p class="text-sm font-bold text-white">No tracking links yet.</p>
                                    <p class="text-xs text-brand-muted">Add your first channel or campaign link.</p>
                                    <div>
                                        <button id="btn-empty-add-link" type="button" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider hover:bg-brand-greenHover transition-all cursor-pointer">
                                            <i data-lucide="plus" class="w-4 h-4 pointer-events-none"></i>
                                            <span class="pointer-events-none">Add tracking link</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Links Cards Container -->
                                <div id="campaign-links-container" class="space-y-3">
                                    <!-- Populated dynamically -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>

        <!-- FAQ SECTION -->
        <section id="utm-faq" class="py-16 px-4 sm:px-6 border-t border-[#181818] bg-[#050505]">
            <div class="max-w-4xl mx-auto w-full">
                <div class="mb-10 text-left">
                    <span class="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-green mb-2 block">FAQ</span>
                    <h2 class="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-2">Frequently Asked Questions</h2>
                    <p class="text-xs sm:text-sm text-brand-muted max-w-xl">Frequently asked questions about UTM tracking and the Groniq UTM Builder.</p>
                </div>

                <div class="space-y-3" id="faq-accordion-group">
                    <!-- FAQ 1 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-1" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-1" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">What is a UTM builder?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-1" 
                             role="region" 
                             aria-labelledby="faq-btn-1" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                A UTM builder creates campaign URLs with tracking parameters such as utm_source, utm_medium and utm_campaign. These parameters help analytics tools identify where campaign traffic came from and how links were used across different channels.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 2 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-2" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-2" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">What makes Groniq an advanced UTM builder?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-2" 
                             role="region" 
                             aria-labelledby="faq-btn-2" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Groniq supports both guided and advanced campaign URL creation. Advanced mode gives you direct control over source, medium, campaign, content, term and additional tracking parameters, while keeping URL generation and naming consistent.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 3 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-3" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-3" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">Can I create UTM links in bulk?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-3" 
                             role="region" 
                             aria-labelledby="faq-btn-3" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Yes. Bulk mode lets you create multiple campaign URLs together, add or duplicate rows, paste spreadsheet data, validate links, copy generated URLs and export campaign data to CSV.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 4 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-4" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-4" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">Can I build UTM links for Google Ads?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-4" 
                             role="region" 
                             aria-labelledby="faq-btn-4" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Yes. You can create campaign URLs for Google Ads using parameters such as source, medium, campaign, content and term. Groniq also preserves existing query parameters and lets you apply consistent naming rules across generated UTM values.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 5 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-5" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-5" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">Can I create UTM links for Meta Ads?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-5" 
                             role="region" 
                             aria-labelledby="faq-btn-5" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Yes. Groniq can create campaign URLs for Meta advertising and distinguish traffic sources such as Instagram or Facebook while using tracking values such as paid_social for the campaign medium.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 6 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-6" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-6" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">Can I check an existing UTM URL?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-6" 
                             role="region" 
                             aria-labelledby="faq-btn-6" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Yes. Check URL lets you inspect an existing campaign link, review its UTM parameters and identify common issues such as missing core parameters, duplicate UTM keys or inconsistent formatting without silently changing the original URL.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 7 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-7" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-7" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">Can I organize multiple tracking links under one campaign?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-7" 
                             role="region" 
                             aria-labelledby="faq-btn-7" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Yes. Campaign Workspace lets you keep multiple channel-specific tracking links under the same campaign so campaign naming stays consistent while source, medium, content and other link-level values can differ.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 8 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-8" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-8" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">Can I generate a QR code for a UTM link?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-8" 
                             role="region" 
                             aria-labelledby="faq-btn-8" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Yes. A generated campaign URL can be turned into a QR code and downloaded as a PNG. QR generation happens locally in the browser and uses the current generated campaign URL.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 9 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-9" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-9" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">What UTM naming convention can I use?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-9" 
                             role="region" 
                             aria-labelledby="faq-btn-9" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Groniq Naming Settings let you control how tracking values are formatted. You can use lowercase or preserve the original case, and choose underscores or hyphens as separators. The same naming rules are applied consistently when campaign URLs are generated.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 10 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-10" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-10" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">Does Groniq track clicks or conversions from my UTM links?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-10" 
                             role="region" 
                             aria-labelledby="faq-btn-10" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                No. The UTM Builder creates tracking URLs but does not currently measure clicks, sessions, conversions or revenue from those links. Analytics platforms on the destination website, such as GA4, can use UTM parameters for campaign attribution.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 11 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-11" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-11" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">Where are my saved UTM history, templates and campaigns stored?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-11" 
                             role="region" 
                             aria-labelledby="faq-btn-11" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Saved UTM data is stored locally in your browser. It is not currently presented as cloud-synced storage or cross-device backup.
                            </p>
                        </div>
                    </div>

                    <!-- FAQ 12 -->
                    <div class="faq-item rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] overflow-hidden transition-all duration-200 hover:border-[#2A2A2A]">
                        <h3>
                            <button type="button" 
                                    id="faq-btn-12" 
                                    aria-expanded="false" 
                                    aria-controls="faq-ans-12" 
                                    class="faq-trigger w-full flex items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold uppercase tracking-wider text-white hover:text-brand-green transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-green cursor-pointer">
                                <span class="pr-4 leading-snug">Can Groniq preserve existing URL parameters?</span>
                                <span class="faq-chevron ml-2 flex-shrink-0 text-brand-muted transition-transform duration-200" aria-hidden="true">
                                    <svg class="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </span>
                            </button>
                        </h3>
                        <div id="faq-ans-12" 
                             role="region" 
                             aria-labelledby="faq-btn-12" 
                             class="faq-content hidden px-4 sm:px-5 pb-5 pt-1 border-t border-[#141414]">
                            <p class="text-xs sm:text-sm text-brand-muted leading-relaxed font-normal normal-case">
                                Yes. When a valid destination URL already contains legitimate query parameters or a URL fragment, the UTM Builder preserves them while adding or updating the campaign tracking parameters.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-[#181818] flex items-center justify-between flex-wrap gap-4">
                    <a href="/learn/utm-tracking/" class="inline-flex items-center gap-2 text-xs font-semibold text-brand-muted hover:text-brand-green transition-colors group">
                        <span>Learn more about UTM tracking</span>
                        <span class="transition-transform group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
                    </a>
                </div>
            </div>
        </section>

        <!-- NAMING SETTINGS MODAL -->
        <div id="naming-settings-modal" class="fixed inset-0 z-[100] hidden flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="naming-settings-title">
            <div class="w-full max-w-md bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
                <div class="flex items-center justify-between border-b border-[#1C1C1C] pb-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="settings" class="w-4 h-4 text-brand-green"></i>
                        <h3 id="naming-settings-title" class="text-sm font-bold uppercase tracking-wider text-white">Naming settings</h3>
                    </div>
                    <button id="close-naming-settings" type="button" class="p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" aria-label="Close settings">
                        <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>

                <p class="text-xs text-brand-muted leading-relaxed">Control how UTM values are formatted in generated URLs.</p>

                <div class="space-y-6">
                    <!-- 1. Case Preference -->
                    <div>
                        <label class="text-[11px] font-bold uppercase tracking-widest text-brand-green block mb-2">Case</label>
                        <div class="grid grid-cols-2 gap-3">
                            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-[#141414] border border-[#222] cursor-pointer hover:border-brand-green/40 transition-all group">
                                <input type="radio" name="opt-casing" value="lowercase" class="accent-brand-green" checked>
                                <span class="text-xs font-semibold text-white">Lowercase</span>
                            </label>
                            <label class="flex items-center gap-2.5 p-3 rounded-xl bg-[#141414] border border-[#222] cursor-pointer hover:border-brand-green/40 transition-all group">
                                <input type="radio" name="opt-casing" value="preserve" class="accent-brand-green">
                                <span class="text-xs font-semibold text-white">Preserve original</span>
                            </label>
                        </div>
                    </div>

                    <!-- 2. Separator Preference -->
                    <div>
                        <label class="text-[11px] font-bold uppercase tracking-widest text-brand-green block mb-2">Separator</label>
                        <div class="space-y-2">
                            <label class="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#222] cursor-pointer hover:border-brand-green/40 transition-all group">
                                <div class="flex items-center gap-2.5">
                                    <input type="radio" name="opt-separator" value="underscore" class="accent-brand-green" checked>
                                    <span class="text-xs font-semibold text-white">Underscore (_)</span>
                                </div>
                                <span class="text-[10px] font-mono text-brand-muted">summer_launch_2026</span>
                            </label>

                            <label class="flex items-center justify-between p-3 rounded-xl bg-[#141414] border border-[#222] cursor-pointer hover:border-brand-green/40 transition-all group">
                                <div class="flex items-center gap-2.5">
                                    <input type="radio" name="opt-separator" value="hyphen" class="accent-brand-green">
                                    <span class="text-xs font-semibold text-white">Hyphen (-)</span>
                                </div>
                                <span class="text-[10px] font-mono text-brand-muted">summer-launch-2026</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="pt-4 border-t border-[#1C1C1C] flex items-center justify-between">
                    <button id="reset-naming-settings" type="button" class="text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">
                        Reset to recommended
                    </button>
                    <button id="close-naming-settings-btn" type="button" class="px-5 py-2.5 bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-greenHover transition-colors cursor-pointer">
                        Done
                    </button>
                </div>
            </div>
        </div>

        <!-- SAVED MODAL (HISTORY & TEMPLATES) -->
        <div id="saved-modal" class="fixed inset-0 z-[100] hidden flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="saved-modal-title">
            <div class="w-full max-w-2xl bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] flex flex-col">
                <!-- Header -->
                <div class="flex items-center justify-between border-b border-[#1C1C1C] pb-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="bookmark" class="w-4 h-4 text-brand-green"></i>
                        <h3 id="saved-modal-title" class="text-sm font-bold uppercase tracking-wider text-white">Saved</h3>
                    </div>
                    <button id="close-saved-modal" type="button" class="p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" aria-label="Close saved modal">
                        <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>

                <!-- Local Storage Notice -->
                <div class="p-3 rounded-xl bg-[#141414] border border-[#222] text-[11px] text-brand-muted flex items-center gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-brand-green shrink-0"></i>
                    <span>Campaigns, templates, and history are stored locally in this browser.</span>
                </div>

                <!-- Tabs -->
                <div class="flex items-center justify-between border-b border-[#222]">
                    <div class="flex gap-6">
                        <button id="saved-tab-campaigns" type="button" class="pb-2 text-xs font-bold uppercase tracking-widest text-brand-green border-b-2 border-brand-green transition-colors cursor-pointer">
                            Campaigns
                        </button>
                        <button id="saved-tab-templates" type="button" class="pb-2 text-xs font-bold uppercase tracking-widest text-brand-muted hover:text-white border-b-2 border-transparent transition-colors cursor-pointer">
                            Templates
                        </button>
                        <button id="saved-tab-history" type="button" class="pb-2 text-xs font-bold uppercase tracking-widest text-brand-muted hover:text-white border-b-2 border-transparent transition-colors cursor-pointer">
                            History
                        </button>
                    </div>
                    <button id="btn-clear-history-only" type="button" class="text-[10px] font-bold text-red-500/80 hover:text-red-400 uppercase tracking-wider transition-colors cursor-pointer pb-2 flex items-center gap-1 hidden">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5 pointer-events-none"></i> <span class="pointer-events-none">Clear history</span>
                    </button>
                </div>

                <!-- Tab Contents (Scrollable) -->
                <div class="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[240px]">
                    <!-- Campaigns Container -->
                    <div id="saved-campaigns-container" class="space-y-3">
                        <!-- Rendered dynamically -->
                    </div>

                    <!-- Templates Container -->
                    <p id="preset-storage-feedback" role="status" class="text-xs text-amber-400 break-words"></p><p class="text-xs text-brand-muted mb-3">Campaign presets reuse source, medium, campaign, term and content while preserving your landing URL. Presets stay in this browser and may be lost when browser data is cleared. Bulk preview shows validation issues before export; CSV includes all rows and their status.</p><div id="saved-templates-container" class="space-y-3 hidden">
                        <!-- Rendered dynamically -->
                    </div>

                    <!-- History Container -->
                    <div id="saved-history-container" class="space-y-3 hidden">
                        <!-- Rendered dynamically -->
                    </div>
                </div>
            </div>
        </div>

        <!-- TEMPLATE NAME MODAL -->
        <div id="template-name-modal" class="fixed inset-0 z-[120] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="template-name-title">
            <div class="w-full max-w-sm bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 space-y-4 shadow-2xl relative">
                <h3 id="template-name-title" class="text-sm font-bold uppercase tracking-wider text-white">Save as template</h3>
                <p class="text-xs text-brand-muted">Enter a name for this template configuration:</p>
                <div>
                    <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted block mb-1">Template name</label>
                    <input type="text" id="template-name-input" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-2.5 text-white outline-none text-xs font-mono" placeholder="e.g. Meta Paid Social">
                </div>
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1C1C]">
                    <button id="btn-cancel-template-name" type="button" class="px-4 py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                    <button id="btn-confirm-template-name" type="button" class="px-4 py-2 bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-greenHover transition-colors cursor-pointer">Save</button>
                </div>
            </div>
        </div>

        <!-- BULK PASTE FROM SPREADSHEET MODAL -->
        <div id="bulk-paste-modal" class="fixed inset-0 z-[120] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="bulk-paste-title">
            <div class="w-full max-w-2xl bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between border-b border-[#1C1C1C] pb-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="clipboard" class="w-4 h-4 text-brand-green"></i>
                        <h3 id="bulk-paste-title" class="text-sm font-bold uppercase tracking-wider text-white">Paste from spreadsheet</h3>
                    </div>
                    <button id="close-bulk-paste" type="button" class="p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" aria-label="Close modal">
                        <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>
                <p class="text-xs text-brand-muted">Paste tab-separated columns copied from Excel or Google Sheets. Header row is detected automatically.</p>
                <div class="p-2.5 rounded-lg bg-[#141414] border border-[#222] text-[11px] text-brand-muted">
                    <span class="text-brand-green font-bold">Default column order:</span> Destination URL &bull; Source &bull; Medium &bull; Campaign &bull; Content &bull; Term
                </div>
                <textarea id="bulk-paste-textarea" rows="6" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl p-3 text-white placeholder-brand-muted outline-none text-xs font-mono transition-colors resize-y" placeholder="https://example.com/landing&#9;google&#9;cpc&#9;Summer Launch 2026&#10;https://example.com/signup&#9;linkedin&#9;paid_social&#9;Summer Launch 2026"></textarea>
                <div id="bulk-paste-feedback" class="hidden text-xs space-y-2">
                    <!-- dynamic preview counts & columns -->
                </div>
                <div class="flex items-center justify-between pt-4 border-t border-[#1C1C1C] mt-auto">
                    <span id="bulk-paste-row-count" class="text-xs font-mono text-brand-muted">0 rows detected</span>
                    <div class="flex items-center gap-2">
                        <button id="btn-cancel-bulk-paste" type="button" class="px-4 py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                        <button id="btn-confirm-bulk-paste" type="button" class="px-5 py-2 bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-greenHover transition-colors cursor-pointer">Import rows</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- BULK CSV IMPORT PREVIEW MODAL -->
        <div id="bulk-csv-modal" class="fixed inset-0 z-[120] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="bulk-csv-title">
            <div class="w-full max-w-xl bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between border-b border-[#1C1C1C] pb-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="file-text" class="w-4 h-4 text-brand-green"></i>
                        <h3 id="bulk-csv-title" class="text-sm font-bold uppercase tracking-wider text-white">Import CSV</h3>
                    </div>
                    <button id="close-bulk-csv" type="button" class="p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" aria-label="Close modal">
                        <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>
                <div id="bulk-csv-summary-box" class="space-y-3 text-xs">
                    <!-- Populated dynamically -->
                </div>
                <div class="flex items-center justify-end gap-2 pt-4 border-t border-[#1C1C1C] mt-auto">
                    <button id="btn-cancel-bulk-csv" type="button" class="px-4 py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                    <button id="btn-confirm-bulk-csv" type="button" class="px-5 py-2 bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-greenHover transition-colors cursor-pointer">Import rows</button>
                </div>
            </div>
        </div>

        <!-- BULK CLEAR CONFIRM MODAL -->
        <div id="bulk-clear-modal" class="fixed inset-0 z-[120] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="bulk-clear-title">
            <div class="w-full max-w-sm bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 space-y-4 shadow-2xl relative">
                <h3 id="bulk-clear-title" class="text-sm font-bold uppercase tracking-wider text-white">Clear all rows?</h3>
                <p class="text-xs text-brand-muted leading-relaxed">This removes the current Bulk workspace. Saved templates and history will not be affected.</p>
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1C1C]">
                    <button id="btn-cancel-bulk-clear" type="button" class="px-4 py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                    <button id="btn-confirm-bulk-clear" type="button" class="px-4 py-2 bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-red-500 transition-colors cursor-pointer">Clear rows</button>
                </div>
            </div>
        </div>

        <!-- BULK ROW DETAILS (MORE FIELDS) MODAL -->
        <div id="bulk-details-modal" class="fixed inset-0 z-[120] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="bulk-details-title">
            <div class="w-full max-w-md bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 space-y-4 shadow-2xl relative">
                <div class="flex items-center justify-between border-b border-[#1C1C1C] pb-3">
                    <h3 id="bulk-details-title" class="text-sm font-bold uppercase tracking-wider text-white">Additional campaign details</h3>
                    <button id="close-bulk-details" type="button" class="p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" aria-label="Close modal">
                        <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>
                <div class="space-y-3 text-xs">
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Campaign ID</label>
                            <span class="text-[10px] font-mono text-brand-muted">utm_id</span>
                        </div>
                        <input type="text" id="bulk-detail-id" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3 py-2 text-white outline-none font-mono" placeholder="e.g. CMP-001">
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Source Platform</label>
                            <span class="text-[10px] font-mono text-brand-muted">utm_source_platform</span>
                        </div>
                        <input type="text" id="bulk-detail-source-platform" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3 py-2 text-white outline-none font-mono" placeholder="e.g. Google Ads">
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Creative Format</label>
                            <span class="text-[10px] font-mono text-brand-muted">utm_creative_format</span>
                        </div>
                        <input type="text" id="bulk-detail-creative-format" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3 py-2 text-white outline-none font-mono" placeholder="e.g. Video">
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Marketing Tactic</label>
                            <span class="text-[10px] font-mono text-brand-muted">utm_marketing_tactic</span>
                        </div>
                        <input type="text" id="bulk-detail-marketing-tactic" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3 py-2 text-white outline-none font-mono" placeholder="e.g. Retargeting">
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 pt-3 border-t border-[#1C1C1C]">
                    <button id="btn-cancel-bulk-details" type="button" class="px-4 py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                    <button id="btn-save-bulk-details" type="button" class="px-4 py-2 bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-greenHover transition-colors cursor-pointer">Save details</button>
                </div>
            </div>
        </div>

        <!-- QR CODE PROFESSIONAL POPUP (Balanced 2-Column Desktop, Centered Mobile) -->
        <div id="qr-modal" class="fixed inset-0 z-[9999] hidden items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md transition-opacity" style="display: none;" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
            <div class="w-full max-w-xl sm:max-w-2xl bg-[#0E0E0E] border border-[#242424] rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(57,255,20,0.06)] relative overflow-hidden qr-modal-enter flex flex-col my-auto mx-auto max-h-[92dvh]">
                <!-- Top neon green accent line -->
                <div class="h-[2px] w-full bg-gradient-to-r from-transparent via-brand-green to-transparent opacity-80"></div>

                <!-- Modal Header -->
                <div class="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#1C1C1C] bg-[#0E0E0E] shrink-0">
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-xl bg-brand-green/10 border border-brand-green/20 flex items-center justify-center text-brand-green shrink-0">
                            <i data-lucide="qr-code" class="w-4 h-4"></i>
                        </span>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <h3 id="qr-modal-title" class="text-sm sm:text-base font-black uppercase tracking-wider text-white">Campaign QR Code</h3>
                                <span id="qr-modal-badge" class="hidden text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-green/10 border border-brand-green/20 text-brand-green truncate max-w-[140px]"></span>
                            </div>
                            <p id="qr-modal-subtitle" class="text-[11px] text-brand-muted mt-0.5">Scan to open or download high-resolution marketing assets.</p>
                        </div>
                    </div>
                    <button id="close-qr-modal" type="button" class="w-8 h-8 rounded-xl bg-[#161616] hover:bg-[#222] text-brand-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#262626] shrink-0" aria-label="Close QR code popup">
                        <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>

                <!-- Modal Body (Two-Column on sm/desktop, Clean Stack on Mobile) -->
                <div class="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center overflow-y-auto">
                    
                    <!-- LEFT COLUMN: QR Code Showcase & Fast Copy -->
                    <div class="sm:col-span-5 flex flex-col items-center justify-center text-center">
                        <div class="p-3.5 bg-white rounded-2xl shadow-xl border border-gray-200 flex items-center justify-center">
                            <canvas id="qr-canvas" class="w-[180px] h-[180px] block" width="1024" height="1024"></canvas>
                        </div>
                        <span class="text-[10px] font-mono uppercase tracking-widest text-brand-muted mt-2 font-semibold">Scan to visit instantly</span>
                        
                        <!-- URL Preview & One-click Copy -->
                        <div class="w-full mt-3 bg-[#141414] border border-[#262626] rounded-xl p-2 flex items-center justify-between gap-2">
                            <p id="qr-url-text" class="font-mono text-[10px] text-brand-mutedLight truncate select-all flex-1 text-left px-1"></p>
                            <button id="btn-copy-qr-url" type="button" class="px-2.5 py-1.5 bg-[#1f1f1f] hover:bg-brand-green hover:text-black text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[#333] hover:border-brand-green transition-all flex items-center gap-1 cursor-pointer shrink-0">
                                <i data-lucide="copy" class="w-3 h-3 pointer-events-none"></i>
                                <span class="pointer-events-none">Copy</span>
                            </button>
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: Download & Share Actions -->
                    <div class="sm:col-span-7 flex flex-col justify-between space-y-4">
                        
                        <!-- Resolution Selector -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Resolution</label>
                                <span class="text-[10px] font-mono text-brand-green font-semibold" id="qr-resolution-label">1024px HD</span>
                            </div>
                            <div class="grid grid-cols-3 gap-2" id="qr-size-selector">
                                <button type="button" data-qr-size="512" class="qr-size-btn py-2 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border bg-[#141414] border-[#262626] text-brand-muted hover:border-brand-green/40 hover:text-white text-center">
                                    512px
                                </button>
                                <button type="button" data-qr-size="1024" class="qr-size-btn active py-2 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border bg-brand-green/10 border-brand-green/30 text-brand-green text-center">
                                    1024px HD
                                </button>
                                <button type="button" data-qr-size="2048" class="qr-size-btn py-2 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border bg-[#141414] border-[#262626] text-brand-muted hover:border-brand-green/40 hover:text-white text-center">
                                    2048px Print
                                </button>
                            </div>
                        </div>

                        <!-- Download Buttons -->
                        <div class="space-y-2">
                            <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted block">Download Asset</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button id="btn-download-qr" type="button" class="py-3 px-3 bg-brand-green hover:bg-brand-greenHover active:scale-95 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_16px_rgba(57,255,20,0.2)]">
                                    <i data-lucide="download" class="w-4 h-4 pointer-events-none"></i>
                                    <span class="pointer-events-none">Download PNG</span>
                                </button>
                                <button id="btn-download-qr-svg" type="button" class="py-3 px-3 bg-[#141414] hover:bg-[#1f1f1f] active:scale-95 text-white border border-[#262626] hover:border-brand-green/40 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <i data-lucide="file-code" class="w-4 h-4 text-brand-green pointer-events-none"></i>
                                    <span class="pointer-events-none">Vector SVG</span>
                                </button>
                            </div>
                        </div>

                        <!-- Share Options -->
                        <div>
                            <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted block mb-2">Share With Team / Client</label>
                            <div class="grid grid-cols-3 gap-2">
                                <button id="btn-share-whatsapp" type="button" class="py-2.5 px-2 bg-[#141414] hover:bg-[#1c2e20] active:scale-95 text-white border border-[#262626] hover:border-[#25D366]/50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                    <svg class="w-4 h-4 text-[#25D366] pointer-events-none shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                <span class="pointer-events-none">WhatsApp</span>
                            </button>
                            <button id="btn-share-email" type="button" class="py-2.5 px-2 bg-[#141414] hover:bg-[#1a2233] active:scale-95 text-white border border-[#262626] hover:border-blue-400/50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                <i data-lucide="mail" class="w-4 h-4 text-blue-400 pointer-events-none shrink-0"></i>
                                <span class="pointer-events-none">Email</span>
                            </button>
                            <button id="btn-share-native" type="button" class="py-2.5 px-2 bg-[#141414] hover:bg-[#251a33] active:scale-95 text-white border border-[#262626] hover:border-purple-400/50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                                <i data-lucide="share" class="w-4 h-4 text-purple-400 pointer-events-none shrink-0"></i>
                                <span class="pointer-events-none">Share</span>
                            </button>
                        </div>
                    </div>

                    <!-- Close Button -->
                    <button id="btn-close-qr" type="button" class="w-full py-2 text-[11px] font-bold uppercase tracking-wider text-brand-muted hover:text-white active:scale-98 transition-colors cursor-pointer text-center rounded-xl hover:bg-white/5 border border-transparent hover:border-[#262626]">
                        Close
                    </button>
                </div>

            </div>
        </div>

        <!-- CAMPAIGN CREATE / RENAME MODAL -->
        <div id="campaign-modal" class="fixed inset-0 z-[120] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="campaign-modal-title">
            <div class="w-full max-w-md bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
                <div class="flex items-center justify-between border-b border-[#1C1C1C] pb-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="folder-kanban" class="w-4 h-4 text-brand-green"></i>
                        <h3 id="campaign-modal-title" class="text-sm font-bold uppercase tracking-wider text-white">Create campaign</h3>
                    </div>
                    <button id="close-campaign-modal" type="button" class="p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" aria-label="Close modal">
                        <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>
                <div class="space-y-4 text-xs">
                    <div>
                        <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted block mb-1.5">Campaign Name *</label>
                        <input type="text" id="campaign-modal-name-input" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-3 text-white placeholder-brand-muted outline-none text-xs font-semibold" placeholder="e.g. Summer Launch 2026">
                        <p class="text-[10px] text-brand-muted mt-1">Stored in raw form; tracking value is derived automatically.</p>
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Campaign ID (optional)</label>
                            <span class="text-[10px] font-mono text-brand-muted">utm_id</span>
                        </div>
                        <input type="text" id="campaign-modal-id-input" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-3 text-white placeholder-brand-muted outline-none text-xs font-mono" placeholder="e.g. CMP-001">
                    </div>
                    <div id="campaign-modal-error" class="hidden text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-xl">
                        Please enter a campaign name.
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 pt-4 border-t border-[#1C1C1C] mt-auto">
                    <button id="btn-cancel-campaign-modal" type="button" class="px-4 py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                    <button id="btn-confirm-campaign-modal" type="button" class="px-5 py-2.5 bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-greenHover transition-colors cursor-pointer">Create campaign</button>
                </div>
            </div>
        </div>

        <!-- CAMPAIGN DELETE CONFIRMATION MODAL -->
        <div id="campaign-delete-modal" class="fixed inset-0 z-[130] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="campaign-delete-title">
            <div class="w-full max-w-sm bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 space-y-4 shadow-2xl relative">
                <h3 id="campaign-delete-title" class="text-sm font-bold uppercase tracking-wider text-white">Delete campaign?</h3>
                <p class="text-xs text-brand-muted leading-relaxed">This permanently removes this campaign and its tracking links from this browser.</p>
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1C1C]">
                    <button id="btn-cancel-campaign-delete" type="button" class="px-4 py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                    <button id="btn-confirm-campaign-delete" type="button" class="px-4 py-2 bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-red-500 transition-colors cursor-pointer">Delete campaign</button>
                </div>
            </div>
        </div>

        <!-- TRACKING LINK CREATE / EDIT MODAL -->
        <div id="tracking-link-modal" class="fixed inset-0 z-[120] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="tracking-link-modal-title">
            <div class="w-full max-w-lg bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
                <div class="flex items-center justify-between border-b border-[#1C1C1C] pb-4">
                    <div>
                        <h3 id="tracking-link-modal-title" class="text-sm font-bold uppercase tracking-wider text-white">Add tracking link</h3>
                        <p id="tracking-link-parent-name" class="text-[11px] text-brand-green font-mono mt-0.5">Campaign: Summer Launch 2026</p>
                    </div>
                    <button id="close-link-modal" type="button" class="p-1 text-brand-muted hover:text-white transition-colors cursor-pointer" aria-label="Close modal">
                        <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
                    </button>
                </div>

                <div class="space-y-4 text-xs overflow-y-auto pr-1">
                    <div>
                        <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted block mb-1">Link Name *</label>
                        <input type="text" id="link-input-name" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-2.5 text-white placeholder-brand-muted outline-none text-xs" placeholder="e.g. Google Search or Instagram Reel">
                        <p class="text-[10px] text-brand-muted mt-1">Organizational label; not a UTM parameter.</p>
                    </div>

                    <div>
                        <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted block mb-1">Destination URL *</label>
                        <input type="text" id="link-input-dest" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-4 py-2.5 text-white placeholder-brand-muted outline-none text-xs font-mono" placeholder="https://example.com/landing-page">
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Source *</label>
                                <span class="text-[10px] font-mono text-brand-muted">utm_source</span>
                            </div>
                            <input type="text" id="link-input-source" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3.5 py-2 text-white placeholder-brand-muted outline-none font-mono" placeholder="e.g. google">
                        </div>
                        <div>
                            <div class="flex items-center justify-between mb-1">
                                <label class="text-[11px] font-bold uppercase tracking-widest text-brand-muted">Medium *</label>
                                <span class="text-[10px] font-mono text-brand-muted">utm_medium</span>
                            </div>
                            <input type="text" id="link-input-medium" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3.5 py-2 text-white placeholder-brand-muted outline-none font-mono" placeholder="e.g. cpc">
                        </div>
                    </div>

                    <!-- Optional details -->
                    <div class="pt-3 border-t border-[#1C1C1C] space-y-3">
                        <span class="text-[10px] font-bold uppercase tracking-widest text-brand-muted block">Optional details</span>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-widest text-brand-muted block mb-1">Content (utm_content)</label>
                                <input type="text" id="link-input-content" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3 py-2 text-white placeholder-brand-muted outline-none font-mono" placeholder="e.g. Video Ad 01">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-widest text-brand-muted block mb-1">Term (utm_term)</label>
                                <input type="text" id="link-input-term" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3 py-2 text-white placeholder-brand-muted outline-none font-mono" placeholder="e.g. running shoes">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-widest text-brand-muted block mb-1">Source platform</label>
                                <input type="text" id="link-input-source-platform" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3 py-2 text-white placeholder-brand-muted outline-none font-mono" placeholder="e.g. Google Ads">
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase tracking-widest text-brand-muted block mb-1">Creative format</label>
                                <input type="text" id="link-input-creative-format" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3 py-2 text-white placeholder-brand-muted outline-none font-mono" placeholder="e.g. Video">
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold uppercase tracking-widest text-brand-muted block mb-1">Marketing tactic</label>
                            <input type="text" id="link-input-marketing-tactic" class="w-full bg-[#141414] border border-[#2A2A2A] focus:border-brand-green rounded-xl px-3 py-2 text-white placeholder-brand-muted outline-none font-mono" placeholder="e.g. Retargeting">
                        </div>
                    </div>

                    <div id="tracking-link-modal-error" class="hidden text-xs text-red-400 bg-red-950/40 border border-red-900/50 p-2.5 rounded-xl">
                        Please fill in required fields.
                    </div>
                </div>

                <div class="flex items-center justify-end gap-2 pt-4 border-t border-[#1C1C1C] mt-auto">
                    <button id="btn-cancel-link-modal" type="button" class="px-4 py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                    <button id="btn-confirm-link-modal" type="button" class="px-5 py-2.5 bg-brand-green text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-brand-greenHover transition-colors cursor-pointer">Save link</button>
                </div>
            </div>
        </div>

        <!-- TRACKING LINK DELETE CONFIRMATION MODAL -->
        <div id="link-delete-modal" class="fixed inset-0 z-[130] hidden flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="link-delete-title">
            <div class="w-full max-w-sm bg-[#0D0D0D] border border-[#222] rounded-2xl p-6 space-y-4 shadow-2xl relative">
                <h3 id="link-delete-title" class="text-sm font-bold uppercase tracking-wider text-white">Delete tracking link?</h3>
                <p class="text-xs text-brand-muted leading-relaxed">This will remove this link from the campaign.</p>
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-[#1C1C1C]">
                    <button id="btn-cancel-link-delete" type="button" class="px-4 py-2 text-xs font-bold text-brand-muted hover:text-white uppercase tracking-wider transition-colors cursor-pointer">Cancel</button>
                    <button id="btn-confirm-link-delete" type="button" class="px-4 py-2 bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-red-500 transition-colors cursor-pointer">Delete link</button>
                </div>
            </div>
        </div>

        <!-- TOAST NOTIFICATION -->
        <div id="toast" class="fixed bottom-6 right-6 transform translate-y-24 opacity-0 transition-all duration-300 bg-brand-green text-black px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(57,255,20,0.3)] z-[300] flex items-center gap-2">
            <i data-lucide="check-circle" class="w-4 h-4"></i> <span id="toast-msg">URL copied</span>
        </div>

    </main>

    <!-- SCRIPTS LOADED AFTER DOM ELEMENTS EXIST -->
    <script src="qrcode.min.js"></script>
    <script>
        if (typeof window.QRCode === 'undefined') {
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js';
            document.head.appendChild(s);
        }
    </script>
    <script src="utm-storage.js"></script>
    <script src="utm-presets.js"></script>
    <script src="utm-builder.js"></script>
    <script>
        (function() {
            function initFaqAccordion() {
                var group = document.getElementById('faq-accordion-group');
                if (!group) return;
                var triggers = group.querySelectorAll('.faq-trigger');
                triggers.forEach(function(trigger) {
                    trigger.addEventListener('click', function() {
                        var isExpanded = trigger.getAttribute('aria-expanded') === 'true';
                        var targetId = trigger.getAttribute('aria-controls');
                        var content = document.getElementById(targetId);
                        var chevron = trigger.querySelector('.faq-chevron');
                        var item = trigger.closest('.faq-item');

                        if (isExpanded) {
                            trigger.setAttribute('aria-expanded', 'false');
                            if (content) content.classList.add('hidden');
                            if (chevron) {
                                chevron.classList.remove('rotate-180', 'text-brand-green');
                                chevron.classList.add('text-brand-muted');
                            }
                            if (item) {
                                item.classList.remove('border-brand-green/30');
                                item.classList.add('border-[#1C1C1C]');
                            }
                        } else {
                            trigger.setAttribute('aria-expanded', 'true');
                            if (content) content.classList.remove('hidden');
                            if (chevron) {
                                chevron.classList.add('rotate-180', 'text-brand-green');
                                chevron.classList.remove('text-brand-muted');
                            }
                            if (item) {
                                item.classList.add('border-brand-green/30');
                                item.classList.remove('border-[#1C1C1C]');
                            }
                        }
                    });

                    trigger.addEventListener('keydown', function(e) {
                        var triggersArr = Array.prototype.slice.call(triggers);
                        var index = triggersArr.indexOf(trigger);
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            var next = triggersArr[(index + 1) % triggersArr.length];
                            if (next) next.focus();
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            var prev = triggersArr[(index - 1 + triggersArr.length) % triggersArr.length];
                            if (prev) prev.focus();
                        } else if (e.key === 'Home') {
                            e.preventDefault();
                            if (triggersArr[0]) triggersArr[0].focus();
                        } else if (e.key === 'End') {
                            e.preventDefault();
                            if (triggersArr[triggersArr.length - 1]) triggersArr[triggersArr.length - 1].focus();
                        }
                    });
                });
            }

            // Global defensive click guard against accidental page reloads
            document.addEventListener('click', function(e) {
                var anchor = e.target.closest('a');
                if (anchor) {
                    var href = anchor.getAttribute('href');
                    if (href === '#' || href === 'javascript:void(0)' || href === '') {
                        e.preventDefault();
                    }
                }
            }, true);

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initFaqAccordion);
            } else {
                initFaqAccordion();
            }
        })();
    </script>
`;

const outputPath = path.join(__dirname, 'tools', 'utm-builder', 'index.html');
fs.writeFileSync(outputPath, beforeMain + mainContent + afterMain);
console.log('Successfully generated tools/utm-builder/index.html');
