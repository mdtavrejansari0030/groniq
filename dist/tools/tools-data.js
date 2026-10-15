const TOOLS_CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'paid-ads', name: 'Paid Ads' },
    { id: 'analytics-tracking', name: 'Analytics & Tracking' },
    { id: 'seo', name: 'SEO' },
    { id: 'e-commerce', name: 'E-commerce' },
    { id: 'utilities', name: 'Utilities' }
];

const TOOLS_DATA = [
    {
        id: 'grocrawl', name: 'GroCrawl', slug: 'grocrawl', url: '/tools/grocrawl/',
        shortDescription: 'SEO spider and audit workspace to inspect URLs, response codes, redirect chains, links, images, headings and site architecture.',
        category: 'seo', categoryName: 'SEO', status: '', featured: true,
        keywords: ['crawler', 'audit', 'seo', 'spider', 'robots', 'links', 'images', 'headings', 'duplicates'],
        icon: '<i data-lucide="scan-search" class="w-5 h-5 text-brand-green"></i>',
        available: true, showWhenUnavailable: true
    },
    {
        id: 'utm-builder',
        name: 'UTM Builder',
        slug: 'utm-builder',
        url: '/tools/utm-builder/',
        shortDescription: 'Build clean, consistent campaign URLs for Google Ads, Meta, email and more.',
        category: 'analytics-tracking',
        categoryName: 'Analytics & Tracking',
        status: '',
        featured: true,
        keywords: ['utm', 'url', 'tracking', 'campaign', 'analytics', 'builder', 'generator', 'links'],
        icon: '<i data-lucide="link" class="w-5 h-5 text-brand-green"></i>',
        available: true,
        showWhenUnavailable: true // Show as Coming Soon
    },
    {
        id: 'business-competitor-research',
        name: 'Groniq Research',
        slug: 'business-competitor-research',
        url: '/tools/business-competitor-research/',
        shortDescription: 'Research a business, customers, market and competitors in one workspace and turn findings into actionable marketing insights.',
        category: 'paid-ads',
        categoryName: 'Paid Ads',
        status: '',
        featured: true,
        keywords: ['research', 'competitor', 'business', 'market', 'customer', 'evidence', 'insights', 'action brief', 'paid media', 'hypotheses'],
        icon: '<i data-lucide="compass" class="w-5 h-5 text-brand-green"></i>',
        available: true,
        showWhenUnavailable: true
    },
    {
        id: 'roas-calculator',
        name: 'ROAS Calculator',
        slug: 'roas-calculator',
        url: '/tools/roas-calculator/',
        shortDescription: 'Calculate Return on Ad Spend and project profitability margins.',
        category: 'paid-ads',
        categoryName: 'Paid Ads',
        status: 'Coming Soon',
        featured: false,
        keywords: ['roas', 'calculator', 'ads', 'spend', 'profit', 'revenue'],
        icon: '<i data-lucide="calculator" class="w-5 h-5 text-brand-green"></i>',
        available: false,
        showWhenUnavailable: false // Completely hidden for now
    },
    {
        id: 'schema-generator',
        name: 'Schema Markup Generator',
        slug: 'schema-generator',
        url: '/tools/schema-generator/',
        shortDescription: 'Generate valid JSON-LD structured data for rich search results.',
        category: 'seo',
        categoryName: 'SEO',
        status: 'Coming Soon',
        featured: false,
        keywords: ['schema', 'json-ld', 'seo', 'structured data', 'rich snippets'],
        icon: '<i data-lucide="code" class="w-5 h-5 text-brand-green"></i>',
        available: false,
        showWhenUnavailable: false
    }
];
