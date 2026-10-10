// Post-build step: writes route-specific HTML (head metadata + crawlable content) and
// sitemap.xml into the Vite output. The React app still takes over on load.
// Usage: node scripts/prerender.mjs   (run automatically by `npm run build`)
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  HOME_META,
  SHOP_META,
  STATIC_PAGES,
  absoluteImageUrl,
  categoryMeta,
  categorySlug,
  injectHeadBlock,
  injectRootContent,
  productMeta,
  renderRootContent,
  renderSitemap,
  staticPageMeta
} from '../src/seo/seoCore.mjs';

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const SAFE_SLUG = /^[a-z0-9-]+$/;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const asList = (value) => (Array.isArray(value) ? value : Array.isArray(value?.value) ? value.value : []);

export const fetchJson = async (url, { fetchImpl = fetch, retries = 3, delayMs = 4000, timeoutMs = 45000 } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(delayMs);
    }
  }
  throw new Error(`Request to ${url} failed: ${lastError?.message || lastError}`);
};

const writePage = async (buildDir, routePath, html) => {
  const dir = path.join(buildDir, ...routePath.split('/').filter(Boolean));
  const resolved = path.resolve(dir);
  if (!resolved.startsWith(path.resolve(buildDir) + path.sep)) throw new Error(`Refusing to write outside build dir: ${routePath}`);
  await fs.mkdir(resolved, { recursive: true });
  await fs.writeFile(path.join(resolved, 'index.html'), html, 'utf8');
};

const productCategoryKeys = (product) => String(product.category ?? '').toLowerCase();

export const prerender = async ({ buildDir, apiBase, fetchImpl = fetch, strict = false, log = console, retryDelayMs = 4000 }) => {
  const shell = await fs.readFile(path.join(buildDir, 'index.html'), 'utf8');
  const written = [];

  const emit = async (meta, content) => {
    const html = injectRootContent(injectHeadBlock(shell, meta), content);
    await writePage(buildDir, meta.path, html);
    written.push(meta.path);
  };

  const staticLinks = [
    { path: '/category/all', label: 'Shop custom T-shirts' },
    { path: '/how-it-works', label: 'How it works' },
    { path: '/faq', label: 'FAQ' },
    { path: '/contact', label: 'Contact' }
  ];

  for (const page of STATIC_PAGES) {
    const meta = staticPageMeta(page);
    await emit(meta, renderRootContent(page.title, [page.description], staticLinks));
  }

  let categories;
  let products;
  try {
    const opts = { fetchImpl, delayMs: retryDelayMs };
    [categories, products] = await Promise.all([
      fetchJson(`${apiBase}/categories`, opts).then(asList),
      fetchJson(`${apiBase}/products`, opts).then(asList)
    ]);
  } catch (error) {
    const message = `SEO prerender: could not load catalog data (${error.message}). Product/category pages and sitemap were NOT generated.`;
    if (strict) throw new Error(message);
    log.warn(`\n[seo] WARNING: ${message}\n[seo] The static fallback public/sitemap.xml (informational pages only) stays in place.\n`);
    return { written, sitemap: false };
  }

  const validProducts = products.filter((p) => OBJECT_ID.test(String(p?._id || '')) && p?.name);
  const usable = categories
    .map((category) => ({ category, slug: categorySlug(category) }))
    .filter(({ category, slug }) => category?.name && SAFE_SLUG.test(slug));

  const productsFor = (category, slug) => validProducts.filter((p) => {
    const key = productCategoryKeys(p);
    return key === category.name.toLowerCase() || key === String(category._id || '').toLowerCase() || key === slug;
  });

  const sitemapEntries = [{ path: '/' }];
  STATIC_PAGES.forEach((page) => sitemapEntries.push({ path: page.path }));

  if (validProducts.length) {
    await emit(
      SHOP_META,
      renderRootContent('All T-Shirts', [SHOP_META.description], validProducts.slice(0, 50).map((p) => ({ path: `/product/${p._id}`, label: p.name })))
    );
    sitemapEntries.push({ path: SHOP_META.path });
  }

  const categoryByKey = new Map();
  for (const { category, slug } of usable) {
    const items = productsFor(category, slug);
    categoryByKey.set(category.name.toLowerCase(), category);
    categoryByKey.set(String(category._id || '').toLowerCase(), category);
    categoryByKey.set(slug, category);
    if (!items.length) continue; // do not index empty categories
    const meta = categoryMeta(category, apiBase);
    await emit(
      meta,
      renderRootContent(category.name, [category.description || meta.description], items.slice(0, 50).map((p) => ({ path: `/product/${p._id}`, label: p.name })))
    );
    sitemapEntries.push({ path: meta.path, image: meta.image, lastmod: category.updatedAt });
  }

  for (const product of validProducts) {
    const category = categoryByKey.get(productCategoryKeys(product));
    const meta = productMeta(product, category, apiBase);
    const price = Number(product.price);
    await emit(
      meta,
      renderRootContent(
        product.name,
        [product.description, Number.isFinite(price) && price > 0 ? `Price: Rs ${price}` : ''],
        [
          ...(category ? [{ path: `/category/${categorySlug(category)}`, label: category.name }] : []),
          { path: '/category/all', label: 'All T-shirts' }
        ]
      )
    );
    sitemapEntries.push({ path: meta.path, image: absoluteImageUrl(product.imageUrl, apiBase), lastmod: product.createdAt });
  }

  await fs.writeFile(path.join(buildDir, 'sitemap.xml'), renderSitemap(sitemapEntries), 'utf8');
  log.log(`[seo] Prerendered ${written.length} pages and wrote sitemap with ${sitemapEntries.length} URLs.`);
  return { written, sitemap: true, sitemapEntries };
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { loadEnv } = await import('vite');
  const env = loadEnv('production', frontendDir, '');
  const apiBase = (env.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE || '').trim().replace(/\/+$/, '');
  if (!apiBase) {
    console.error('[seo] REACT_APP_API_BASE is required.');
    process.exit(1);
  }
  try {
    await prerender({
      buildDir: path.join(frontendDir, 'build'),
      apiBase,
      strict: process.env.SEO_STRICT === '1'
    });
  } catch (error) {
    console.error(`[seo] ${error.message}`);
    process.exit(1);
  }
}
