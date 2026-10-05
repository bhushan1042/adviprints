import API_BASE from '../config/env';

export const TSHIRT_TEMPLATE_URL = '/images/tshirt-template.jpg';

export const resolveImageUrl = (url, fallback = '') => {
  if (typeof url !== 'string') {
    return fallback;
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return fallback;
  }

  if (/^(https?:|data:|blob:)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith('/uploads/')) {
    return `${API_BASE}${trimmedUrl}`;
  }

  return trimmedUrl;
};

export const applyImageFallback = (event, fallback = '') => {
  const nextSrc = resolveImageUrl(fallback, '');

  if (!nextSrc || !event?.currentTarget) {
    return;
  }

  if (event.currentTarget.dataset.fallbackApplied === 'true') {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = 'true';
  event.currentTarget.src = nextSrc;
};
