import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  SITE_URL, canonicalUrl, categoryMeta, escapeXml, injectHeadBlock, normalizePath,
  productMeta, renderSitemap, serializeJsonLd, staticPageMeta, STATIC_PAGES, HOME_META, truncate
} from '../src/seo/seoCore.mjs';
import { prerender } from '../scripts/prerender.mjs';

const shell = '<!doctype html><html><head><meta charset="UTF-8" />\n<!--seo-head-start--><title>x</title><!--seo-head-end-->\n</head><body><div id="root"></div></body></html>';

const ID1 = 'a'.repeat(24);
const ID2 = 'b'.repeat(24);
const categories = [
  { _id: 'c1', name: 'Polo T-Shirts', slug: 'polo-t-shirts', description: 'Polos & <more>' },
  { _id: 'c2', name: 'Empty', slug: 'empty' }
];
const products = [
  { _id: ID1, name: 'Classic "Polo"', category: 'Polo T-Shirts', price: 499, stock: 5, imageUrl: 'https://res.cloudinary.com/x/p.jpg', description: 'Soft cotton', createdAt: '2026-01-01T00:00:00Z' },
  { _id: ID2, name: 'No price', category: 'c1', price: 0, imageUrl: '' }
];

const mockFetch = (data) => async (url) => {
  const key = url.endsWith('/categories') ? 'categories' : 'products';
  if (!data[key]) return { ok: false, status: 500, json: async () => ({}) };
  return { ok: true, status: 200, json: async () => data[key] };
};

test('canonical URLs use the production origin, drop queries and trailing slashes', () => {
  assert.equal(canonicalUrl('/'), `${SITE_URL}/`);
  assert.equal(canonicalUrl('/category/polo?sort=price&utm_source=x#top'), `${SITE_URL}/category/polo`);
  assert.equal(canonicalUrl('/about/'), `${SITE_URL}/about`);
  assert.equal(normalizePath('//a//b/'), '/a/b');
});

test('static pages have unique titles and descriptions', () => {
  const metas = [HOME_META, ...STATIC_PAGES.map(staticPageMeta)];
  assert.equal(new Set(metas.map((m) => m.title)).size, metas.length);
  assert.equal(new Set(metas.map((m) => m.description)).size, metas.length);
});

test('product meta uses real data only', () => {
  const meta = productMeta(products[0], categories[0]);
  assert.equal(meta.path, `/product/${ID1}`);
  const [productLd, crumbs] = meta.jsonLd;
  assert.equal(productLd.offers.price, '499.00');
  assert.equal(productLd.offers.availability, 'https://schema.org/InStock');
  assert.equal(crumbs['@type'], 'BreadcrumbList');
  const noPrice = productMeta(products[1], null).jsonLd[0];
  assert.equal(noPrice.offers, undefined);
  assert.equal(noPrice.image, undefined);
  assert.notEqual(productMeta(products[0], null).description, productMeta(products[1], null).description);
});

test('category meta points at its own canonical path', () => {
  assert.equal(categoryMeta(categories[0]).path, '/category/polo-t-shirts');
});

test('escaping and JSON-LD serialisation are safe', () => {
  assert.equal(escapeXml('a&b<c>"d\''), 'a&amp;b&lt;c&gt;&quot;d&#39;');
  const out = serializeJsonLd({ name: '</script><script>alert(1)' });
  assert.ok(!out.includes('</script>'));
  assert.deepEqual(JSON.parse(out), { name: '</script><script>alert(1)' });
  assert.ok(truncate('word '.repeat(100), 160).length <= 160);
});

test('sitemap is well formed, deduplicated and escaped', () => {
  const xml = renderSitemap([{ path: '/' }, { path: '/' }, { path: '/p?a=1&b=2' }, { path: '/x', image: 'https://i.example/a.jpg?x=1&y=2' }]);
  assert.equal((xml.match(/<url>/g) || []).length, 3);
  assert.ok(xml.includes('image:loc>https://i.example/a.jpg?x=1&amp;y=2<'));
  assert.ok(!xml.includes('?a=1'));
});

test('injectHeadBlock replaces head metadata and fails without markers', () => {
  const html = injectHeadBlock(shell, productMeta(products[0], categories[0]));
  assert.ok(html.includes(`<link rel="canonical" href="${SITE_URL}/product/${ID1}" />`));
  assert.ok(html.includes('Classic &quot;Polo&quot;'));
  assert.ok(!html.includes('<title>x</title>'));
  assert.throws(() => injectHeadBlock('<html></html>', HOME_META));
});

test('prerender writes per-route pages, skips empty categories and builds the sitemap', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'seo-'));
  await fs.writeFile(path.join(dir, 'index.html'), shell);
  const quiet = { log() {}, warn() {} };
  const result = await prerender({ buildDir: dir, apiBase: 'https://api.example.com', fetchImpl: mockFetch({ categories, products }), log: quiet });
  assert.equal(result.sitemap, true);
  const productHtml = await fs.readFile(path.join(dir, 'product', ID1, 'index.html'), 'utf8');
  assert.match(productHtml, /<h1>Classic &quot;Polo&quot;<\/h1>/);
  assert.match(productHtml, /"@type":"Product"/);
  const catHtml = await fs.readFile(path.join(dir, 'category', 'polo-t-shirts', 'index.html'), 'utf8');
  assert.ok(catHtml.includes('Polos &amp; &lt;more&gt;'));
  await assert.rejects(fs.access(path.join(dir, 'category', 'empty', 'index.html')));
  const sitemap = await fs.readFile(path.join(dir, 'sitemap.xml'), 'utf8');
  assert.ok(sitemap.includes(`${SITE_URL}/product/${ID1}`));
  assert.ok(!sitemap.includes('/category/empty'));
  assert.ok(!sitemap.includes('/admin') && !sitemap.includes('/checkout'));
  const titles = new Set();
  for (const file of ['about', 'faq', `product/${ID1}`, `product/${ID2}`]) {
    titles.add((await fs.readFile(path.join(dir, file, 'index.html'), 'utf8')).match(/<title>(.*?)<\/title>/)[1]);
  }
  assert.equal(titles.size, 4);
});

test('prerender fails safe when the API is down: no partial sitemap, strict mode throws', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'seo-'));
  await fs.writeFile(path.join(dir, 'index.html'), shell);
  const warnings = [];
  const log = { log() {}, warn: (m) => warnings.push(m) };
  const result = await prerender({ buildDir: dir, apiBase: 'https://api.example.com', fetchImpl: mockFetch({}), log, retryDelayMs: 1 });
  assert.equal(result.sitemap, false);
  assert.equal(warnings.length, 1);
  await assert.rejects(fs.access(path.join(dir, 'sitemap.xml')));
  await assert.rejects(prerender({ buildDir: dir, apiBase: 'x', fetchImpl: mockFetch({}), strict: true, log, retryDelayMs: 1 }));
});

test('robots.txt allows crawling and references the sitemap', async () => {
  const robots = await fs.readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Sitemap: https:\/\/www\.adviprints\.com\/sitemap\.xml/);
  assert.ok(!/^Disallow:\s*\/\s*$/m.test(robots));
});