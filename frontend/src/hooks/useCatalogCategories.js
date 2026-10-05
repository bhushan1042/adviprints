import { useEffect, useState } from 'react';
import { getErrorMessage, isRequestAborted } from '../services/api';
import { listCategories } from '../services/catalog';

export default function useCatalogCategories() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    listCategories(controller.signal)
      .then((items) => {
        if (!ignore) setCategories(items);
      })
      .catch((requestError) => {
        if (!ignore && !isRequestAborted(requestError)) {
          setError(getErrorMessage(requestError, 'Unable to load categories.'));
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  return { categories, error };
}
