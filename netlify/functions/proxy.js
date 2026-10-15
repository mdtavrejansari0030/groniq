// Netlify Serverless Function: proxy.js
// Cloud Proxy Bridge for GroCrawl Browser Crawler Engine

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'text/html; charset=utf-8'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        let targetUrl = '';
        if (event.httpMethod === 'GET') {
            targetUrl = event.queryStringParameters?.url || '';
        } else if (event.httpMethod === 'POST') {
            try {
                const b = JSON.parse(event.body || '{}');
                targetUrl = b.url || '';
            } catch (e) {
                targetUrl = event.queryStringParameters?.url || '';
            }
        }

        targetUrl = (targetUrl || '').trim();
        if (!targetUrl) {
            return {
                statusCode: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Missing url parameter' })
            };
        }

        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6500);

        const res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (compatible; GroCrawl/2.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            },
            redirect: 'follow',
            signal: controller.signal
        });
        clearTimeout(timeout);

        const contentType = res.headers.get('content-type') || 'text/html; charset=utf-8';
        const text = await res.text();

        return {
            statusCode: res.status,
            headers: {
                ...headers,
                'Content-Type': contentType,
                'X-Final-Url': res.url || targetUrl
            },
            body: text
        };
    } catch (err) {
        return {
            statusCode: 502,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: err.message || 'Proxy request timed out or failed' })
        };
    }
};
