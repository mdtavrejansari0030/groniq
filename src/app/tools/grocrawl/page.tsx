import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GroCrawl — SEO Spider & Website Audit Tool | Groniq',
  description: 'Inspect URLs, status codes, links, images, metadata and site architecture directly in Groniq.',
};

export default function GroCrawlPage() {
  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#050505', color: '#fff' }}>
      <iframe
        src="/tools/grocrawl/index.html"
        style={{ width: '100%', height: '100vh', border: 'none' }}
        title="GroCrawl SEO Spider"
      />
    </div>
  );
}
