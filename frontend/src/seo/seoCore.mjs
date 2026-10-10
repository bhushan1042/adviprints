// Framework-free SEO helpers shared by the React app (runtime metadata) and the
// build-time prerender script (static HTML + sitemap). Keep this file dependency-free.

export const SITE_URL = 'https://www.adviprints.com';
export const SITE_NAME = 'Adviprints';
export const DEFAULT_IMAGE = `${SITE_URL}/logo_large.png`;
export const CURRENCY = 'INR';

export const STATIC_PAGES = [
  {
    path: '/about',
    title: 'About Adviprints',
    description: 'Learn about Adviprints, an online custom T-shirt printing store where you design your own apparel.'
  },
  {
    path: '/how-it-works',
    title: 'How Custom T-Shirt Printing Works',
    description: 'See how to customize a T-shirt with Adviprints: pick a product, upload your artwork or add text, preview your design and order.'
  },
  {
    path: '/faq',
    title: 'Frequently Asked Questions',
    description: 'Answers to common questions about ordering, uploading your own design and customizing T-shirts with Adviprints.'
  },
  {
    path: '/contact',
    title: 'Contact Adviprints',
    description: 'Get in touch with the Adviprints team for questions about custom T-shirt printing and your order.'
  }
];

export const HOME_META = {
  title: 'Custom T-Shirt Printing & Personalized T-Shirts Online | Adviprints',
  description: 'Design custom printed T-shirts online with Adviprints. Choose a T-shirt, upload your own design or add text, preview it and place your order.',
  path: '/'
};

export const SHOP_META = {
  title: 'Shop Custom T-Shirts | Adviprints',
  description: 'Browse all T-shirts available for customization at Adviprints. Pick a style, add your design and order online.',
  path: '/category/all'
};

const UNSAFE_PATH_CHARS = /[^a-zA-Z0-9\-._~%/]/g;

export const normalizePath = (path = '/') => {
  const clean = String(path).split(/[?#]/)[0].replace(UNSAFE_PATH_CHARS, '');
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  const collapsed = withSlash.replace(/\/{2,}/g, '/');
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : '/';
};

// Query strings and fragments are dropped on purpose (filters, sorting, tracking params).
export const canonicalUrl = (path = '/') => {
  const normalized = normalizePath(path);
  return normalized === '/' ? `${SITE_URL}/` : `${SITE_URL}${normalized}`;
};

export const truncate = (text = '', max = 160) => {
  const plain = String(text).replace(/\s+/g, ' ').trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:-]+$/, '')}…`;
};

export const withSiteName = (title) => (title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`);

export const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const escapeXml = escapeHtml;

export const absoluteImageUrl = (url, apiBase = '') => {
  if (typeof url !== 'string' || !url.trim()) return undefined;
  const value = url.trim();
  if (/^https:\/\//i.test(value)) return value;
  if (/^http:\/\//i.test(value)) return value.replace(/^http:/i, 'https:');
  if (value.startsWith('/uploads/') && apiBase) return `${apiBase.replace(/\/+$/, '')}${value}`;
  return undefined;
};

export const slugifyCategory = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '-')
  .replace(/[^a-z0-9-]/g, '')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '');

export const categorySlug = (category) => category?.slug || slugifyCategory(category?.name);

export const breadcrumbJsonLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: canonicalUrl(item.path)
  }))
});

export const staticPageMeta = (page) => ({
  title: withSiteName(page.title),
  description: page.description,
  path: page.path
});

export const categoryMeta = (category, apiBase = '') => {
  const slug = categorySlug(category);
  const name = category.name;
  const description = category.description
    ? truncate(category.description, 155)
    : `Browse ${name} at Adviprints. Choose a style, add your own design or text and order online.`;
  return {
    title: `${name} - Custom Printing | ${SITE_NAME}`,
    description,
    path: `/category/${slug}`,
    image: absoluteImageUrl(category.bannerImageUrl || category.imageUrl, apiBase),
    jsonLd: [
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Shop', path: '/category/all' },
        { name, path: `/category/${slug}` }
      ])
    ]
  };
};

export const productAvailability = (stock) => {
  if (typeof stock !== 'number' || Number.isNaN(stock)) return undefined;
  return stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
};

// `product` is the raw public API document; `category` the matching category (optional).
export const productMeta = (product, category, apiBase = '') => {
  const id = String(product._id || product.id);
  const path = `/product/${id}`;
  const name = String(product.name || 'Product').trim();
  const image = absoluteImageUrl(product.imageUrl, apiBase);
  const categoryName = category?.name || '';
  const description = product.description
    ? truncate(product.description, 155)
    : `Customize the ${name}${categoryName ? ` (${categoryName})` : ''} at Adviprints: upload your design or add text, preview it and order online.`;

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    url: canonicalUrl(path),
    description
  };
  if (image) productLd.image = [image];
  if (product.productCode) productLd.sku = String(product.productCode);
  if (categoryName) productLd.category = categoryName;
  const price = Number(product.price);
  if (Number.isFinite(price) && price > 0) {
    const offer = {
      '@type': 'Offer',
      url: canonicalUrl(path),
      price: price.toFixed(2),
      priceCurrency: CURRENCY
    };
    const availability = productAvailability(product.stock);
    if (availability) offer.availability = availability;
    productLd.offers = offer;
  }

  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Shop', path: '/category/all' }];
  if (category) crumbs.push({ name: category.name, path: `/category/${categorySlug(category)}` });
  crumbs.push({ name, path });

  return {
    title: `${name} - Custom Print${categoryName ? ` ${categoryName}` : ''} | ${SITE_NAME}`,
    description,
    path,
    image,
    type: 'product',
    jsonLd: [productLd, breadcrumbJsonLd(crumbs)]
  };
};

export const serializeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

export const SEO_START = '<!--seo-head-start-->';
export const SEO_END = '<!--seo-head-end-->';

// Page-specific <head> block. JSON-LD carries data-seo-jsonld so the runtime component can replace it.
export const renderHeadBlock = (meta) => {
  const canonical = canonicalUrl(meta.path);
  const image = meta.image || DEFAULT_IMAGE;
  const lines = [
    SEO_START,
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="robots" content="${meta.noindex ? 'noindex, follow' : 'index, follow'}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${meta.type === 'product' ? 'product' : 'website'}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`
  ];
  (meta.jsonLd || []).forEach((entry) => {
    lines.push(`<script type="application/ld+json" data-seo-jsonld>${serializeJsonLd(entry)}</script>`);
  });
  lines.push(SEO_END);
  return lines.join('\n    ');
};

export const injectHeadBlock = (html, meta) => {
  const start = html.indexOf(SEO_START);
  const end = html.indexOf(SEO_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error('index.html is missing the seo-head markers');
  }
  return `${html.slice(0, start)}${renderHeadBlock(meta)}${html.slice(end + SEO_END.length)}`;
};

// Crawlable fallback content placed inside #root; React replaces it on mount.
export const renderRootContent = (heading, paragraphs = [], links = []) => {
  const body = [`<h1>${escapeHtml(heading)}</h1>`]
    .concat(paragraphs.filter(Boolean).map((text) => `<p>${escapeHtml(text)}</p>`));
  if (links.length) {
    body.push(`<ul>${links.map((l) => `<li><a href="${escapeHtml(l.path)}">${escapeHtml(l.label)}</a></li>`).join('')}</ul>`);
  }
  return `<main>${body.join('')}</main>`;
};

export const injectRootContent = (html, content) => html.replace('<div id="root"></div>', () => `<div id="root">${content}</div>`);

export const renderSitemap = (entries) => {
  const seen = new Set();
  const urls = [];
  entries.forEach((entry) => {
    const loc = canonicalUrl(entry.path);
    if (seen.has(loc)) return;
    seen.add(loc);
    const parts = [`<loc>${escapeXml(loc)}</loc>`];
    if (entry.lastmod) parts.push(`<lastmod>${escapeXml(new Date(entry.lastmod).toISOString())}</lastmod>`);
    if (entry.image) parts.push(`<image:image><image:loc>${escapeXml(entry.image)}</image:loc></image:image>`);
    urls.push(`  <url>${parts.join('')}</url>`);
  });
  if (urls.length > 50000) throw new Error('Sitemap exceeds 50,000 URLs; split into a sitemap index.');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
};

// Only the production hostname may be indexed; localhost and *.onrender.com previews get noindex at runtime.
export const isProductionHost = (hostname) => hostname === new URL(SITE_URL).hostname;
