import { useEffect } from 'react';
import {
  DEFAULT_IMAGE,
  SITE_NAME,
  canonicalUrl,
  isProductionHost
} from './seoCore.mjs';

const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (href) => {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!href) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * Per-route head management. `meta` comes from the builders in seoCore.mjs so the
 * runtime output matches the prerendered HTML. Pass `noindex` for private,
 * transactional or error routes.
 */
export default function Seo({ title, description, path, image, type = 'website', noindex = false, jsonLd = [] }) {
  const jsonLdKey = JSON.stringify(jsonLd);

  useEffect(() => {
    const fullTitle = title && title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const blocked = noindex || !isProductionHost(window.location.hostname);
    const canonical = path ? canonicalUrl(path) : '';
    const ogImage = image || DEFAULT_IMAGE;

    document.title = fullTitle;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', blocked ? 'noindex, nofollow' : 'index, follow');
    setCanonical(blocked ? '' : canonical);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', SITE_NAME);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', blocked ? '' : canonical);
    setMeta('property', 'og:image', ogImage);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    document.head.querySelectorAll('script[data-seo-jsonld]').forEach((node) => node.remove());
    if (!blocked) {
      JSON.parse(jsonLdKey).forEach((entry) => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-jsonld', '');
        script.text = JSON.stringify(entry).replace(/</g, '\\u003c');
        document.head.appendChild(script);
      });
    }
  }, [title, description, path, image, type, noindex, jsonLdKey]);

  return null;
}
