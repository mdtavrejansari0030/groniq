import argparse
import os
import sys
from pathlib import Path
from urllib.parse import urlsplit

# Ensure UTF-8 output encoding on Windows consoles
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
if sys.stderr and hasattr(sys.stderr, 'reconfigure'):
    try:
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

root = Path(__file__).resolve().parent
os.chdir(root)
parser = argparse.ArgumentParser(description='GroCrawl local SEO audit workspace')
parser.add_argument('--host', default=os.getenv('GROCRAWL_HOST', '127.0.0.1'))
parser.add_argument('--port', type=int, default=int(os.getenv('GROCRAWL_PORT', '5000')))
options = parser.parse_args()
if options.host not in ('127.0.0.1', 'localhost', '::1'):
    parser.error('Local authentication bypass requires a loopback host.')
sys.argv = [sys.argv[0], '--local']
import main
from flask import jsonify, request, render_template


@main.app.before_request
def local_boundary():
    if request.host.split(':')[0] not in ('127.0.0.1', 'localhost', '['):
        return jsonify(error='Unrecognized local host'), 403
    origin = request.headers.get('Origin')
    allowed_prefixes = ('http://127.0.0.1', 'http://localhost', 'https://groniqdigital.com')
    is_allowed = origin and any(origin.startswith(p) for p in allowed_prefixes)
    if request.method == 'OPTIONS':
        resp = main.app.make_default_options_response()
        if is_allowed:
            resp.headers['Access-Control-Allow-Origin'] = origin
            resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
            resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            resp.headers['Access-Control-Allow-Credentials'] = 'true'
        return resp
    if request.method not in ('GET', 'HEAD', 'OPTIONS'):
        if origin and not (origin == request.host_url.rstrip('/') or is_allowed):
            return jsonify(error='Authorized origin required'), 403
    if 'user_id' not in main.session:
        if not main.auto_login_local_mode():
            return jsonify(success=False, error='Local account initialization failed'), 500
    if request.path == '/api/start_crawl':
        payload = request.get_json(silent=True) or {}
        parsed = urlsplit(payload.get('url', ''))
        if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username or parsed.password:
            return jsonify(success=False, error='Enter an HTTP(S) URL without credentials'), 400
        crawler = main.get_or_create_crawler()
        if crawler.crawl_thread and crawler.crawl_thread.is_alive():
            return jsonify(success=False, error='Wait for the current crawl to finish stopping'), 409
        settings = main.get_session_settings()
        values = settings.get_settings()
        # Preserve user settings while ensuring sane local safety bounds
        concurrency = max(1, min(10, int(values.get('concurrency', 1))))
        max_urls = max(1, min(1000, int(values.get('maxUrls', 50))))
        crawl_delay = max(0.5, float(values.get('crawlDelay', 1)))
        success, message = settings.save_settings({
            **values,
            'respectRobotsTxt': values.get('respectRobotsTxt', True),
            'concurrency': concurrency,
            'crawlExternalLinks': values.get('crawlExternalLinks', False),
            'crawlImages': values.get('crawlImages', False),
            'discoverSitemaps': values.get('discoverSitemaps', False),
            'enablePageSpeed': False,
            'maxFileSize': int(values.get('maxFileSize', 0)),
            'jsMaxConcurrentPages': max(1, min(5, int(values.get('jsMaxConcurrentPages', 1)))),
            'maxUrls': max_urls,
            'crawlDelay': crawl_delay,
            'issueExclusionPatterns': values.get('issueExclusionPatterns', '')
        })
        if not success:
            return jsonify(success=False, error=message), 400


@main.app.after_request
def headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' http://127.0.0.1:* http://localhost:* https://groniqdigital.com; img-src 'self' https://res.cloudinary.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; connect-src 'self' http://127.0.0.1:* http://localhost:* https://groniqdigital.com; frame-ancestors 'none'; base-uri 'none'"
    response.headers['Cache-Control'] = 'no-store'
    origin = request.headers.get('Origin')
    allowed_prefixes = ('http://127.0.0.1', 'http://localhost', 'https://groniqdigital.com')
    if origin and any(origin.startswith(p) for p in allowed_prefixes):
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    return response


main.app.view_functions['dashboard'] = lambda: render_template('index.html')
# The new workspace uses the existing engine and all four export implementations.
original_get = main.get_or_create_crawler
def local_crawler():
    crawler = original_get()
    if 'check_auxiliary_links' not in crawler.config:
        crawler.config['check_auxiliary_links'] = False
    return crawler
main.get_or_create_crawler = local_crawler

if __name__ == '__main__':
    from waitress import serve
    main.recover_crashed_crawls()
    print(f'GroCrawl: http://{options.host}:{options.port} - local mode only', flush=True)
    serve(main.app, host=options.host, port=options.port, threads=6)
