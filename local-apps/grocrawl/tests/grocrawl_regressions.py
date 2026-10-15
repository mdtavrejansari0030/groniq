"""Focused regressions against real local HTTP responses and temporary SQLite."""
import csv
import io
import json
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

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

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from src.crawler import WebCrawler
from src.core.link_manager import normalize_url
from src.core.issue_detector import IssueDetector
from src import crawl_db


class Fixture(BaseHTTPRequestHandler):
    hits = []
    def log_message(self, *args): pass
    def do_GET(self):
        self.hits.append((self.path, time.monotonic()))
        if self.path == '/robots.txt':
            status, body = 200, 'User-agent: *\nDisallow: /blocked\n'
        elif self.path in ('/redirect', '/to-blocked'):
            status, body = 301, ''
        else:
            status = 200
            body = '<html><title>Fixture title with useful evidence</title><link rel="canonical" href="/preferred"><body><a href="/blocked">Blocked</a><a href="/redirect">Redirect</a><a href="/final?b=2&a=1&a=3">Query</a></body></html>'
        self.send_response(status)
        if status == 301: self.send_header('Location', '/blocked' if self.path == '/to-blocked' else '/final?b=2&a=1&a=3')
        if self.path.startswith('/final'):
            self.send_header('X-Robots-Tag', 'googlebot: noindex, nofollow')
            self.send_header('X-Robots-Tag', 'max-snippet: 20')
        self.send_header('Content-Type', 'text/html')
        self.send_header('Content-Length', str(len(body.encode())))
        self.end_headers()
        self.wfile.write(body.encode())


class Regressions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), Fixture)
        Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = f'http://127.0.0.1:{cls.server.server_port}'
        cls.crawler = WebCrawler()
        cls.crawler.config.update(max_urls=10, concurrency=1, delay=.15,
            max_file_size=0, discover_sitemaps=False, respect_robots=True,
            check_auxiliary_links=False, max_depth=2)
        assert cls.crawler.start_crawl(cls.base + '/')[0]
        cls.crawler.crawl_thread.join(20)
        assert not cls.crawler.is_running
        cls.rows = {row['url']: row for row in cls.crawler.crawl_results}

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def test_robots_url_reported_without_request_or_status(self):
        row = self.rows[self.base + '/blocked']
        self.assertEqual(row['fetch_state'], 'robots_blocked')
        self.assertIsNone(row['status_code'])
        self.assertNotIn('/blocked', [path for path, _ in Fixture.hits])

    def test_redirect_and_header_scope(self):
        row = self.rows[self.base + '/redirect']
        self.assertEqual((row['initial_status'], row['final_status']), (301, 200))
        self.assertEqual(row['final_url'], self.base + '/final?b=2&a=1&a=3')
        self.assertEqual(row['redirects'][0]['status_code'], 301)
        self.assertEqual([x['scope'] for x in row['robots_directives']], ['googlebot','googlebot','*'])
        self.assertEqual(len(row['x_robots_tag']), 2)

    def test_redirect_does_not_fetch_blocked_destination(self):
        row=self.crawler._crawl_url_with_requests(self.base+'/to-blocked',0)
        self.assertEqual(row['fetch_state'],'redirect_blocked')
        self.assertEqual(row['final_status'],301)
        self.assertEqual(row['final_url'],self.base+'/to-blocked')
        self.assertEqual(row['redirected_to'],self.base+'/blocked')
        self.assertNotIn('/blocked',[path for path,_ in Fixture.hits])

    def test_query_order_and_duplicates_preserved(self):
        self.assertEqual(normalize_url(self.base+'/p?b=2&a=1&a=3#part'), self.base+'/p?b=2&a=1&a=3')

    def test_canonical_is_contextual(self):
        findings = [x for x in self.crawler.issue_detector.get_issues() if 'Canonical points' in x['issue']]
        self.assertTrue(findings)
        self.assertTrue(all(x['type']=='info' for x in findings))
        detector = IssueDetector()
        detector.detect_issues({**self.rows[self.base+'/'], 'canonical_url':'/', 'final_url':self.base+'/'})
        self.assertFalse(any('Canonical points' in x['issue'] for x in detector.get_issues()))

    def test_delay_applied(self):
        times = [stamp for path,stamp in Fixture.hits if path != '/robots.txt']
        self.assertTrue(all(b-a >= .10 for a,b in zip(times,times[1:])), [round(b-a,3) for a,b in zip(times,times[1:])])

    def test_storage_and_exports_preserve_evidence(self):
        old = crawl_db.DB_FILE
        with tempfile.TemporaryDirectory() as folder:
            crawl_db.DB_FILE = str(Path(folder)/'test.db')
            try:
                crawl_db.init_crawl_tables()
                crawl_db.init_crawl_tables()  # additive migration is idempotent
                crawl_id = crawl_db.create_crawl(1,'test',self.base,'localhost',{})
                self.assertTrue(crawl_db.save_url_batch(crawl_id,list(self.rows.values())))
                restored = {r['url']:r for r in crawl_db.load_crawled_urls(crawl_id)}
                row = restored[self.base+'/redirect']
                for key in ['initial_status','final_status','final_url','x_robots_tag','robots_directives']:
                    self.assertEqual(row[key],self.rows[self.base+'/redirect'][key])
                import main
                fields=['url','initial_status','final_status','final_url','x_robots_tag']
                output=''.join(main._stream_urls_json([row],fields))
                self.assertIn('301',output);self.assertIn('googlebot',output)
                output=''.join(main._stream_urls_csv([row],fields))
                exported=list(csv.DictReader(io.StringIO(output)))[0]
                self.assertEqual(exported['initial_status'],'301')
                self.assertEqual(exported['final_status'],'200')
                self.assertEqual(exported['final_url'],row['final_url'])
                import xml.etree.ElementTree as ET
                from openpyxl import load_workbook
                xml=ET.fromstring(''.join(main._stream_urls_xml([row],fields)))
                self.assertEqual(xml.find('.//initial_status').text,'301')
                self.assertEqual(xml.find('.//final_status').text,'200')
                workbook=load_workbook(io.BytesIO(main._urls_xlsx([row],fields)))
                values=list(workbook.active.values)
                self.assertEqual(values[1][1:4],(301,200,row['final_url']))
            finally:
                crawl_db.DB_FILE=old

    def test_guest_history_ownership(self):
        import main
        with main.app.test_request_context('/'):
            from flask import session
            session.update(user_id=None, session_id='guest-one')
            self.assertFalse(main.owns_crawl({'user_id':1,'session_id':'guest-one'}))
            self.assertFalse(main.owns_crawl({'user_id':None,'session_id':'guest-two'}))
            self.assertTrue(main.owns_crawl({'user_id':None,'session_id':'guest-one'}))
            session['user_id']=4
            self.assertFalse(main.owns_crawl({'user_id':5,'session_id':'guest-one'}))
            self.assertTrue(main.owns_crawl({'user_id':4,'session_id':'different'}))

    def test_guest_routes_reject_other_owners(self):
        import main
        from unittest.mock import patch
        client=main.app.test_client()
        with client.session_transaction() as session:
            session.update(user_id=None, session_id='guest-one')
        with patch('src.crawl_db.get_crawl_by_id', return_value={'user_id':7,'session_id':'other'}):
            for suffix, method in [('', 'get'),('/load','post'),('/resume','post'),('/delete','delete'),('/archive','post')]:
                response=getattr(client,method)('/api/crawls/999'+suffix)
                self.assertEqual(response.status_code,403,suffix)


if __name__ == '__main__':
    unittest.main(argv=[sys.argv[0]], verbosity=2)
