// Netlify Serverless Function: crawl.js
// High-Performance In-Depth SEO Spider & Technical Audit Suite

const { parse } = require('node-html-parser');

const EXCLUDED_EXTENSIONS = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp', 'tiff', 'avif',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'tar', 'gz', 'rar', '7z', 'exe', 'dmg', 'iso', 'bin',
    'css', 'js', 'json', 'xml', 'txt', 'csv', 'mp3', 'mp4', 'avi', 'mov', 'wmv', 'webm',
    'woff', 'woff2', 'ttf', 'eot', 'otf'
]);

function getApexDomain(hostname) {
    if (!hostname) return '';
    return hostname.toLowerCase().replace(/^www\./, '');
}

function isSameDomain(targetHost, allowedHosts) {
    if (!targetHost) return false;
    const targetApex = getApexDomain(targetHost);
    for (const h of allowedHosts) {
        if (!h) continue;
        const baseApex = getApexDomain(h);
        if (targetApex === baseApex || targetApex.endsWith('.' + baseApex)) {
            return true;
        }
    }
    return false;
}

function normalizeCrawlUrl(rawUrl) {
    if (!rawUrl) return '';
    try {
        const u = new URL(rawUrl.split('#')[0]);
        let pathname = u.pathname;
        if (!pathname || pathname === '') pathname = '/';
        return u.origin + pathname + u.search;
    } catch {
        return rawUrl.split('#')[0];
    }
}

function isCrawlableUrl(urlStr) {
    try {
        const u = new URL(urlStr);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
        const pathname = u.pathname.toLowerCase();
        if (pathname.startsWith('/cdn-cgi/')) return false;
        const dotIndex = pathname.lastIndexOf('.');
        if (dotIndex !== -1) {
            const ext = pathname.slice(dotIndex + 1);
            if (EXCLUDED_EXTENSIONS.has(ext)) return false;
        }
        return true;
    } catch {
        return false;
    }
}

exports.handler = async (event) => {
    // Handle CORS preflight
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed. Use POST.' })
        };
    }

    const startTime = Date.now();
    // Guarantee exit before 8.5s to stay well within Netlify's 10s limit
    const DEADLINE = startTime + 8500;

    try {
        const body = JSON.parse(event.body || '{}');
        let startUrl = (body.url || '').trim();

        if (!startUrl) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, error: 'URL is required' })
            };
        }

        if (!/^https?:\/\//i.test(startUrl)) {
            startUrl = 'https://' + startUrl;
        }

        startUrl = normalizeCrawlUrl(startUrl);

        const parsedStart = new URL(startUrl);
        const allowedHosts = new Set([parsedStart.hostname, getApexDomain(parsedStart.hostname)]);
        const baseOrigin = parsedStart.origin;

        const maxPages = Math.min(Math.max(parseInt(body.maxPages || body.maxUrls || 20, 10), 1), 50);
        const maxDepth = Math.min(Math.max(parseInt(body.maxDepth || 3, 10), 1), 5);

        const visited = new Set();
        const queuedSet = new Set();
        const queue = [{ url: startUrl, depth: 0 }];
        queuedSet.add(startUrl);

        const urls = [];
        const links = [];
        const issues = [];
        const images = [];
        const headings = [];
        const titleMap = new Map();
        const h1Map = new Map();

        const defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; GroCrawl/2.0)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache'
        };

        // Quick Sitemap Discovery to find deep internal pages rapidly
        try {
            const sitemapCtrl = new AbortController();
            const sTimeout = setTimeout(() => sitemapCtrl.abort(), 2000);
            const sitemapCandidates = [
                `${baseOrigin}/sitemap.xml`,
                `${baseOrigin}/sitemap_index.xml`,
                `${baseOrigin}/wp-sitemap.xml`
            ];

            for (const sUrl of sitemapCandidates) {
                if (Date.now() >= DEADLINE) break;
                try {
                    const sRes = await fetch(sUrl, { headers: defaultHeaders, signal: sitemapCtrl.signal, redirect: 'follow' });
                    if (sRes.ok) {
                        const sText = await sRes.text();
                        if (sText && (sText.includes('<urlset') || sText.includes('<sitemapindex') || sText.includes('<loc>'))) {
                            const locMatches = sText.match(/<loc>\s*(https?:\/\/[^<\s]+)\s*<\/loc>/gi);
                            if (locMatches && locMatches.length > 0) {
                                for (const m of locMatches) {
                                    const u = normalizeCrawlUrl(m.replace(/<\/?loc>/gi, '').trim());
                                    if (isCrawlableUrl(u) && !queuedSet.has(u)) {
                                        try {
                                            const uObj = new URL(u);
                                            if (isSameDomain(uObj.hostname, allowedHosts)) {
                                                queuedSet.add(u);
                                                queue.push({ url: u, depth: 1 });
                                                if (queue.length >= maxPages * 2) break;
                                            }
                                        } catch (e) {}
                                    }
                                }
                                break;
                            }
                        }
                    }
                } catch (e) {}
            }
            clearTimeout(sTimeout);
        } catch (sErr) {}

        // Page crawler worker
        async function fetchAndAnalyze(item) {
            const normUrl = normalizeCrawlUrl(item.url);
            if (visited.has(normUrl)) return null;
            visited.add(normUrl);

            const pageStart = Date.now();
            let res = null;
            let status = 0;
            let html = '';
            let finalUrl = normUrl;

            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);

                res = await fetch(normUrl, {
                    method: 'GET',
                    headers: defaultHeaders,
                    redirect: 'follow',
                    signal: controller.signal
                });
                clearTimeout(timeout);

                status = res.status;
                finalUrl = normalizeCrawlUrl(res.url || normUrl);

                try {
                    const finalHost = new URL(finalUrl).hostname;
                    allowedHosts.add(finalHost);
                    allowedHosts.add(getApexDomain(finalHost));
                } catch (e) {}

                const contentType = (res.headers.get('content-type') || '').toLowerCase();
                if (contentType.includes('text/html') || contentType.includes('application/xhtml') || contentType === '') {
                    html = await res.text();
                }
            } catch (fetchErr) {
                status = 0;
                issues.push({
                    type: 'error',
                    category: 'Fetch',
                    issue: 'Failed to fetch page response',
                    url: normUrl,
                    details: fetchErr.message || 'Connection timeout or network failure'
                });
            }

            const responseTime = Date.now() - pageStart;

            let title = '';
            let metaDesc = '';
            let h1List = [];
            let h2List = [];
            let h3List = [];
            let canonicalUrl = '';
            let robots = '';
            let viewport = '';
            let lang = '';
            let charset = 'utf-8';
            let wordCount = 0;
            let pageImagesCount = 0;
            let pageInternalLinks = 0;
            let pageExternalLinks = 0;

            const ogTags = {};
            let hasOg = false;
            const twitterTags = {};
            const jsonLd = [];
            const schemaTypes = new Set();
            let hasSchema = false;
            let author = '';
            let hasAuthor = false;
            let ga4Id = '';
            let gtmId = '';
            let hasAnalytics = false;

            if (html) {
                try {
                    const doc = parse(html);

                    // Title
                    title = (doc.querySelector('title')?.textContent || '').trim();

                    // Meta Description
                    const metaDescEl = doc.querySelector('meta[name="description"]');
                    if (metaDescEl) metaDesc = (metaDescEl.getAttribute('content') || '').trim();

                    // Canonical
                    const canonEl = doc.querySelector('link[rel="canonical"]');
                    if (canonEl) canonicalUrl = (canonEl.getAttribute('href') || '').trim();

                    // Robots
                    const robotsEl = doc.querySelector('meta[name="robots"]');
                    if (robotsEl) robots = (robotsEl.getAttribute('content') || '').trim();

                    // Viewport
                    const vpEl = doc.querySelector('meta[name="viewport"]');
                    if (vpEl) viewport = (vpEl.getAttribute('content') || '').trim();

                    // Lang & Charset
                    lang = (doc.querySelector('html')?.getAttribute('lang') || '').trim();
                    const charsetEl = doc.querySelector('meta[charset]');
                    if (charsetEl) charset = (charsetEl.getAttribute('charset') || 'utf-8').trim();

                    // Open Graph & Twitter Cards
                    doc.querySelectorAll('meta').forEach(el => {
                        const prop = el.getAttribute('property');
                        const name = el.getAttribute('name');
                        const cont = el.getAttribute('content');
                        if (prop && prop.startsWith('og:') && cont) ogTags[prop] = cont.trim();
                        if (name && name.startsWith('twitter:') && cont) twitterTags[name] = cont.trim();
                    });
                    hasOg = !!(ogTags['og:title'] || ogTags['og:image'] || ogTags['og:description']);

                    // Schema.org JSON-LD
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
                    hasSchema = jsonLd.length > 0 || schemaTypes.size > 0;

                    // Author Detection
                    author = (doc.querySelector('meta[name="author"]')?.getAttribute('content') || '').trim();
                    if (!author) {
                        author = (doc.querySelector('meta[property="article:author"]')?.getAttribute('content') || '').trim();
                    }
                    if (!author) {
                        const authorEl = doc.querySelector('[rel="author"], .author-name, .byline, [itemprop="author"]');
                        if (authorEl) author = (authorEl.textContent || '').trim().slice(0, 80);
                    }
                    hasAuthor = !!author;

                    // GA4 / GTM Detection
                    const htmlSample = html.slice(0, 50000) + html.slice(-20000);
                    const gtmMatch = htmlSample.match(/GTM-[A-Z0-9]+/i);
                    if (gtmMatch) gtmId = gtmMatch[0];
                    const ga4Match = htmlSample.match(/G-[A-Z0-9]+/i);
                    if (ga4Match) ga4Id = ga4Match[0];
                    hasAnalytics = !!(gtmId || ga4Id || htmlSample.includes('google-analytics.com') || htmlSample.includes('googletagmanager.com'));

                    // Headings
                    doc.querySelectorAll('h1').forEach(h => {
                        const txt = (h.textContent || '').replace(/\s+/g, ' ').trim();
                        if (txt) h1List.push(txt);
                    });

                    doc.querySelectorAll('h2').forEach(h => {
                        const txt = (h.textContent || '').replace(/\s+/g, ' ').trim();
                        if (txt) h2List.push(txt);
                    });

                    doc.querySelectorAll('h3').forEach(h => {
                        const txt = (h.textContent || '').replace(/\s+/g, ' ').trim();
                        if (txt) h3List.push(txt);
                    });

                    // Word count
                    const bodyEl = doc.querySelector('body') || doc;
                    const bodyText = (bodyEl.textContent || '').replace(/\s+/g, ' ').trim();
                    wordCount = bodyText ? bodyText.split(' ').filter(w => w.length > 0).length : 0;

                    // Links
                    doc.querySelectorAll('a[href]').forEach(a => {
                        try {
                            const href = a.getAttribute('href');
                            if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;

                            const targetObj = new URL(href, finalUrl);
                            const targetUrl = normalizeCrawlUrl(targetObj.href);
                            const isInternal = isSameDomain(targetObj.hostname, allowedHosts);
                            const anchorText = (a.textContent || '').replace(/\s+/g, ' ').trim().substring(0, 100);

                            if (isInternal) pageInternalLinks++;
                            else pageExternalLinks++;

                            links.push({
                                source_url: normUrl,
                                target_url: targetUrl,
                                anchor_text: anchorText,
                                target_status: isInternal ? 200 : 'External',
                                is_internal: isInternal,
                                placement: a.closest('nav') ? 'nav' : a.closest('footer') ? 'footer' : 'body'
                            });

                            // Queue internal links
                            if (isInternal && item.depth < maxDepth && isCrawlableUrl(targetUrl) && !visited.has(targetUrl) && !queuedSet.has(targetUrl)) {
                                if (urls.length + queue.length < maxPages * 3) {
                                    queuedSet.add(targetUrl);
                                    queue.push({ url: targetUrl, depth: item.depth + 1 });
                                }
                            }
                        } catch (e) {}
                    });

                    // Images
                    doc.querySelectorAll('img').forEach(img => {
                        try {
                            const srcAttr = img.getAttribute('src');
                            if (!srcAttr) return;
                            pageImagesCount++;
                            const imgUrl = new URL(srcAttr, finalUrl).href;
                            const hasAlt = img.hasAttribute('alt');
                            const altText = (img.getAttribute('alt') || '').trim();

                            images.push({
                                src: imgUrl,
                                page_url: normUrl,
                                alt: altText,
                                has_alt: hasAlt && altText.length > 0,
                                status: 200
                            });

                            if (!hasAlt || altText.length === 0) {
                                issues.push({
                                    type: 'warning',
                                    category: 'Images',
                                    issue: 'Image Missing Alt Attribute',
                                    url: normUrl,
                                    details: `Image: ${imgUrl}`
                                });
                            }
                        } catch (e) {}
                    });

                    // Comprehensive SEO Rule Checks
                    if (!title) {
                        issues.push({
                            type: 'error',
                            category: 'Metadata',
                            issue: 'Missing Title Tag',
                            url: normUrl,
                            details: 'The page has no <title> tag. Essential for search rankings.'
                        });
                    } else if (title.length < 30) {
                        issues.push({
                            type: 'warning',
                            category: 'Metadata',
                            issue: 'Title Tag Too Short',
                            url: normUrl,
                            details: `Length is ${title.length} chars (recommended: 30-60 chars).`
                        });
                    } else if (title.length > 60) {
                        issues.push({
                            type: 'info',
                            category: 'Metadata',
                            issue: 'Title Tag Over 60 Characters',
                            url: normUrl,
                            details: `Length is ${title.length} chars. May be truncated in Google search results.`
                        });
                    }

                    if (!metaDesc) {
                        issues.push({
                            type: 'warning',
                            category: 'Metadata',
                            issue: 'Missing Meta Description',
                            url: normUrl,
                            details: 'Page has no meta description specified.'
                        });
                    } else if (metaDesc.length < 70) {
                        issues.push({
                            type: 'info',
                            category: 'Metadata',
                            issue: 'Meta Description Too Short',
                            url: normUrl,
                            details: `Length is ${metaDesc.length} chars (recommended: 70-160 chars).`
                        });
                    } else if (metaDesc.length > 160) {
                        issues.push({
                            type: 'info',
                            category: 'Metadata',
                            issue: 'Meta Description Over 160 Characters',
                            url: normUrl,
                            details: `Length is ${metaDesc.length} chars. May be truncated in SERPs.`
                        });
                    }

                    if (h1List.length === 0) {
                        issues.push({
                            type: 'warning',
                            category: 'Headings',
                            issue: 'Missing H1 Heading',
                            url: normUrl,
                            details: 'No <h1> heading was found on this page.'
                        });
                    } else if (h1List.length > 1) {
                        issues.push({
                            type: 'info',
                            category: 'Headings',
                            issue: 'Multiple H1 Headings',
                            url: normUrl,
                            details: `Found ${h1List.length} H1 tags. Best practice is a single primary H1.`
                        });
                    }

                    if (status >= 400 && status < 500) {
                        issues.push({
                            type: 'error',
                            category: 'HTTP',
                            issue: `HTTP ${status} Client Error`,
                            url: normUrl,
                            details: `Page returned HTTP status code ${status}.`
                        });
                    } else if (status >= 500) {
                        issues.push({
                            type: 'error',
                            category: 'HTTP',
                            issue: `HTTP ${status} Server Error`,
                            url: normUrl,
                            details: `Page returned HTTP server error ${status}.`
                        });
                    }

                    if (!canonicalUrl) {
                        issues.push({
                            type: 'info',
                            category: 'Technical',
                            issue: 'Missing Canonical Tag',
                            url: normUrl,
                            details: 'No canonical URL declared.'
                        });
                    } else if (canonicalUrl !== normUrl && canonicalUrl !== finalUrl) {
                        issues.push({
                            type: 'info',
                            category: 'Technical',
                            issue: 'Canonical Points Elsewhere',
                            url: normUrl,
                            details: `Declared canonical points to: ${canonicalUrl}`
                        });
                    }

                    if (robots && robots.includes('noindex')) {
                        issues.push({
                            type: 'warning',
                            category: 'Indexability',
                            issue: 'Page Marked noindex',
                            url: normUrl,
                            details: `Robots directive: ${robots}`
                        });
                    }

                    if (!viewport) {
                        issues.push({
                            type: 'error',
                            category: 'Mobile',
                            issue: 'Missing Viewport Tag',
                            url: normUrl,
                            details: 'Page is missing <meta name="viewport">.'
                        });
                    }

                    if (!hasOg) {
                        issues.push({
                            type: 'info',
                            category: 'Social',
                            issue: 'Missing Open Graph Tags',
                            url: normUrl,
                            details: 'Page lacks Open Graph metadata for social sharing.'
                        });
                    }

                    if (!hasSchema) {
                        issues.push({
                            type: 'warning',
                            category: 'Schema',
                            issue: 'Missing Structured Data (Schema.org)',
                            url: normUrl,
                            details: 'No JSON-LD Schema markup found on this page.'
                        });
                    }

                    if (wordCount < 200 && status === 200) {
                        issues.push({
                            type: 'warning',
                            category: 'Content',
                            issue: 'Thin Content (Under 200 words)',
                            url: normUrl,
                            details: `Page has only ${wordCount} words.`
                        });
                    }

                } catch (domErr) {
                    console.error('DOM parse error:', domErr);
                }
            }

            const schemaTypesArr = Array.from(schemaTypes);

            const pageRecord = {
                url: normUrl,
                status_code: status,
                title: title,
                meta_description: metaDesc,
                h1: h1List,
                h2: h2List,
                h3: h3List,
                word_count: wordCount,
                response_time: responseTime,
                canonical_url: canonicalUrl,
                robots: robots,
                viewport: viewport,
                lang: lang,
                charset: charset,
                depth: item.depth,
                internal_links_count: pageInternalLinks,
                external_links_count: pageExternalLinks,
                images_count: pageImagesCount,
                is_internal: true,
                has_og: hasOg,
                og_tags: ogTags,
                og_title: ogTags['og:title'] || '',
                og_description: ogTags['og:description'] || '',
                og_image: ogTags['og:image'] || '',
                twitter_tags: twitterTags,
                has_schema: hasSchema,
                schema_types: schemaTypesArr,
                json_ld: jsonLd,
                has_author: hasAuthor,
                author: author,
                has_analytics: hasAnalytics,
                ga4_id: ga4Id,
                gtm_id: gtmId
            };

            headings.push({
                url: normUrl,
                h1: h1List.join(' | ') || '',
                h2: h2List.slice(0, 3).join(' | ') || '',
                h1_count: h1List.length,
                status_code: status
            });

            if (title) {
                if (!titleMap.has(title)) titleMap.set(title, []);
                titleMap.get(title).push(normUrl);
            }

            if (h1List.length > 0) {
                const primaryH1 = h1List[0];
                if (!h1Map.has(primaryH1)) h1Map.set(primaryH1, []);
                h1Map.get(primaryH1).push(normUrl);
            }

            return pageRecord;
        }

        // Concurrent Worker Loop with Netlify execution time limit
        const CONCURRENCY = 4;
        while (queue.length > 0 && urls.length < maxPages && Date.now() < DEADLINE) {
            const batch = [];
            while (batch.length < CONCURRENCY && queue.length > 0 && (urls.length + batch.length) < maxPages) {
                const item = queue.shift();
                const cleanU = normalizeCrawlUrl(item.url);
                if (!visited.has(cleanU)) {
                    batch.push(item);
                }
            }

            if (!batch.length) break;

            const results = await Promise.allSettled(batch.map(item => fetchAndAnalyze(item)));
            for (const r of results) {
                if (r.status === 'fulfilled' && r.value) {
                    urls.push(r.value);
                }
            }
        }

        // Duplicate title detection
        const duplicates = [];
        titleMap.forEach((matchedUrls, t) => {
            if (matchedUrls.length > 1) {
                duplicates.push({
                    title: t,
                    count: matchedUrls.length,
                    urls: matchedUrls
                });
                matchedUrls.forEach(u => {
                    issues.push({
                        type: 'warning',
                        category: 'Duplicates',
                        issue: 'Duplicate Page Title',
                        url: u,
                        details: `Shares identical title with ${matchedUrls.length - 1} other page(s): "${t}"`
                    });
                });
            }
        });

        // Duplicate H1 detection
        h1Map.forEach((matchedUrls, h) => {
            if (matchedUrls.length > 1 && h.length > 5) {
                matchedUrls.forEach(u => {
                    issues.push({
                        type: 'info',
                        category: 'Duplicates',
                        issue: 'Duplicate H1 Heading',
                        url: u,
                        details: `Shares identical H1 with ${matchedUrls.length - 1} other page(s): "${h}"`
                    });
                });
            }
        });

        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                status: 'completed',
                urls,
                links,
                issues,
                images,
                headings,
                duplicates,
                stats: {
                    discovered: visited.size + queue.length,
                    crawled: urls.length,
                    depth: urls.length > 0 ? Math.max(...urls.map(u => u.depth), 0) : 0,
                    speed: `${(urls.length / Math.max(elapsedSec, 0.5)).toFixed(1)} URLs/sec`,
                    baseUrl: startUrl,
                    elapsed: `${elapsedSec}s`
                }
            })
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: err.message || 'Server error during crawl execution'
            })
        };
    }
};
