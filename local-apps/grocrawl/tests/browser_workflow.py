"""Exercise the real local workspace in Edge; server must run on port 5000."""
import json
import sys
import time
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'verification'
OUT.mkdir(exist_ok=True)


class Site(BaseHTTPRequestHandler):
    hits = []
    def log_message(self,*args): pass
    def do_GET(self):
        self.hits.append(self.path)
        if self.path == '/robots.txt':
            body='User-agent: *\nDisallow: /blocked\n'
            status=200
        elif self.path=='/go':
            body='';status=302
        else:
            body='<html><head><title>&lt;img src=x onerror=alert(1)&gt; fixture title</title><link rel="canonical" href="/preferred"></head><body><h1>Fixture</h1>'+''.join(f'<a href="/p{i}?b=2&a=1">Page {i}</a>' for i in range(14))+'<a href="/blocked">Blocked</a><a href="/go">Redirect</a></body></html>'
            status=200
        self.send_response(status)
        if status==302:self.send_header('Location','/p1?b=2&a=1')
        self.send_header('X-Robots-Tag','googlebot: noindex, nofollow')
        self.send_header('Content-Type','text/html')
        self.send_header('Content-Length',str(len(body.encode())))
        self.end_headers();self.wfile.write(body.encode())


site=ThreadingHTTPServer(('127.0.0.1',0),Site)
Thread(target=site.serve_forever,daemon=True).start()
target=f'http://127.0.0.1:{site.server_port}/'
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(name);print('PASS',name,flush=True)

try:
    with sync_playwright() as p:
        browser=p.chromium.launch(channel='msedge',headless=True)
        page=browser.new_page(viewport={'width':1440,'height':1000})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('http://127.0.0.1:5000')
        expect(page.locator('#start-button')).to_be_enabled()
        page.locator('[name=url]').fill(target)
        page.locator('[name=maxUrls]').fill('25')
        page.locator('[name=crawlDelay]').fill('0.5')
        page.locator('#start-button').click()
        expect(page.locator('#pause')).to_be_enabled(timeout=15000)
        page.locator('#pause').click()
        expect(page.locator('#resume')).to_be_enabled()
        page.wait_for_timeout(1000)
        count=len(Site.hits);page.wait_for_timeout(1000)
        check('Pause halts new page requests',count==len(Site.hits))
        page.locator('#resume').click()
        expect(page.locator('#pause')).to_be_enabled()
        page.wait_for_timeout(1200)
        check('Resume continues requests',len(Site.hits)>count)
        page.locator('#stop').click()
        expect(page.locator('#start-button')).to_be_enabled(timeout=20000)
        expect(page.locator('#crawl-state')).to_have_text('Stopped')
        check('Stop exposes stopped state',True)
        page.locator('#start-button').click()
        expect(page.locator('#pause')).to_be_enabled()
        expect(page.locator('#start-button')).to_be_enabled(timeout=45000)
        check('Completed crawl respects robots','/blocked' not in Site.hits)
        page.locator('[data-view=URLs]').click()
        expect(page.locator('#table-body tr')).to_have_count(17)
        page.locator('#filter').select_option('redirect')
        expect(page.locator('#table-body tr')).to_have_count(1)
        check('Redirect filter',True)
        page.locator('#table-body button').first.click()
        expect(page.locator('#detail')).to_be_visible()
        check('Details show distinct redirect and header evidence','302' in page.locator('#detail-content').inner_text() and 'googlebot' in page.locator('#detail-content').inner_text())
        page.keyboard.press('Escape');expect(page.locator('#detail')).not_to_be_visible()
        page.locator('#filter').select_option('all')
        page.locator('#search').fill('p1?')
        check('Search narrows results',page.locator('#table-body tr').count()<17)
        page.locator('#search').fill('')
        page.locator('#columns summary').click()
        page.get_by_label('Final response URL',exact=True).check()
        page.locator('#columns summary').click()
        page.get_by_role('button',name='Final HTTP',exact=True).click()
        check('Sortable and selectable columns',page.locator('th[aria-sort=ascending]').count()==1)
        check('Untrusted title stays text',page.locator('#table-body img').count()==0)
        page.screenshot(path=str(OUT/'urls-wide.png'),full_page=True)
        for view in ['URLs','Issues','Links']:
            page.locator(f'[data-view={view}]').click()
            for fmt in ['csv','xlsx','json','xml']:
                page.locator('#export-format').select_option(fmt)
                with page.expect_download() as download:
                    page.locator('#export').click()
                download.value.save_as(str(OUT/f'fixture-{view.lower()}.{fmt}'))
            check(f'{view}: all four export downloads',True)
        page.locator('[data-view=Issues]').click()
        page.locator('#table-body button').first.click()
        check('Issue detail includes action and verification','Verification' in page.locator('#detail-content').inner_text())
        page.keyboard.press('Escape')
        page.locator('[data-view=History]').click()
        expect(page.locator('#history-list .history-row').first).to_be_visible()
        page.locator('#history-list').get_by_role('button',name='Load audit',exact=True).first.click()
        expect(page.locator('#notice')).to_contain_text('Loaded saved audit')
        check('History loads saved crawl',True)
        page.locator('[data-view=URLs]').click()
        page.locator('#filter').select_option('blocked')
        expect(page.locator('#table-body tr')).to_have_count(1)
        check('Saved robots-blocked row retains no HTTP status','—' in page.locator('#table-body').inner_text())
        page.set_viewport_size({'width':390,'height':844})
        for view in ['Overview','URLs','Issues','Links','History','Settings']:
            page.locator(f'[data-view={view}]').click()
            check(f'{view}: mobile has no page overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        page.locator('[data-view=Overview]').click()
        page.screenshot(path=str(OUT/'overview-mobile.png'),full_page=True)
        page.keyboard.press('Tab')
        check('Keyboard focus visible',page.evaluate('getComputedStyle(document.activeElement).outlineStyle')!='none')
        check('No browser JavaScript errors',not errors)
        browser.close()
finally:
    site.shutdown()
    (OUT/'browser-results.json').write_text(json.dumps(checks,indent=2))
