import api, { isRequestAborted } from '../services/api';

let cache = null;
let pendingRequest = null;

const readStoredBranding = () => {
  try {
    return JSON.parse(localStorage.getItem('branding') || 'null') || {};
  } catch (error) {
    return {};
  }
};

export async function fetchBranding({ signal, force = false } = {}) {
  if (!force && cache) {
    return cache;
  }

  if (!force && pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = api
    .get('/api/branding', { signal })
    .then(({ data }) => {
      cache = data || {};

      try {
        localStorage.setItem('branding', JSON.stringify(cache));
      } catch (error) {
        // Ignore storage write failures.
      }

      return cache;
    })
    .catch((error) => {
      if (isRequestAborted(error)) {
        throw error;
      }

      const storedBranding = readStoredBranding();

      if (Object.keys(storedBranding).length > 0) {
        cache = storedBranding;
      }

      return storedBranding;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}

export function getCachedBranding() {
  return cache || readStoredBranding();
}
