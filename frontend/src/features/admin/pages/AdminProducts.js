import React, { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage, isRequestAborted, withAuth } from '../../../services/api';
import styles from './AdminProducts.module.css';

const STANDARD_T_SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const splitOptions = (value) => [...new Set(
  value
    .split(/[\n,]+/)
    .map((option) => option.trim())
    .filter(Boolean)
)];

const toDraft = (product) => ({
  sizes: (Array.isArray(product.sizes) ? product.sizes : []).join('\n'),
  colours: (Array.isArray(product.colours) ? product.colours : []).join('\n')
});

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [messages, setMessages] = useState({});

  const loadProducts = useCallback(async (signal) => {
    setLoading(true);
    setLoadError('');

    try {
      const { data } = await api.get('/products', { signal });
      const items = Array.isArray(data) ? data : [];
      setProducts(items);
      setDrafts(Object.fromEntries(items.map((product) => [product._id, toDraft(product)])));
    } catch (error) {
      if (!isRequestAborted(error)) {
        setLoadError(getErrorMessage(error, 'Unable to load products.'));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  const updateDraft = (productId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [productId]: { ...current[productId], [field]: value }
    }));
    setMessages((current) => ({ ...current, [productId]: '' }));
  };

  const saveVariants = async (product) => {
    const draft = drafts[product._id] || { sizes: '', colours: '' };
    const sizes = splitOptions(draft.sizes);
    const colours = splitOptions(draft.colours);
    if (sizes.length > 50 || colours.length > 50) {
      setMessages((current) => ({
        ...current,
        [product._id]: 'Each product can have at most 50 sizes and 50 colours.'
      }));
      return;
    }

    setSavingId(product._id);
    setMessages((current) => ({ ...current, [product._id]: '' }));

    try {
      const { data } = await api.put(
        `/products/${encodeURIComponent(product._id)}`,
        { sizes, colours },
        withAuth()
      );
      setProducts((current) => current.map((item) => item._id === product._id ? data : item));
      setDrafts((current) => ({ ...current, [product._id]: toDraft(data) }));
      setMessages((current) => ({
        ...current,
        [product._id]: 'Variant options saved. The storefront will use these options immediately.'
      }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [product._id]: getErrorMessage(error, 'Unable to save variant options.')
      }));
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = products.filter((product) =>
    `${product.name || ''} ${product.category || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>CATALOG SETUP</p>
          <h1>Product sizes &amp; colours</h1>
          <p>Set the real variants customers can select before starting a T-shirt design.</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => loadProducts()}>
          Refresh products
        </button>
      </header>

      <label className={styles.searchLabel}>
        <span>Find a product</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by product or category"
        />
      </label>

      {loadError && <p className={styles.error} role="alert">{loadError}</p>}
      {loading ? (
        <p className={styles.notice}>Loading products…</p>
      ) : filteredProducts.length === 0 ? (
        <p className={styles.notice}>{products.length ? 'No products match your search.' : 'No products found.'}</p>
      ) : (
        <div className={styles.productList}>
          {filteredProducts.map((product) => {
            const draft = drafts[product._id] || { sizes: '', colours: '' };
            const hasVariants = product.sizes?.length > 0 && product.colours?.length > 0;
            return (
              <article className={styles.productCard} key={product._id}>
                <div className={styles.productHeading}>
                  <div>
                    <h2>{product.name || 'Untitled product'}</h2>
                    <p>{product.category || 'Uncategorized'} <span>·</span> Rs {Number(product.price || 0).toFixed(2)}</p>
                  </div>
                  <span className={`${styles.status} ${hasVariants ? styles.configured : styles.incomplete}`}>
                    {hasVariants ? 'Ready for customization' : 'Variant setup needed'}
                  </span>
                </div>

                <div className={styles.fields}>
                  <label>
                    <span>Available sizes</span>
                    <small>One size per line. Commas are also accepted.</small>
                    <textarea
                      rows={4}
                      value={draft.sizes}
                      onChange={(event) => updateDraft(product._id, 'sizes', event.target.value)}
                      placeholder={'XS\nS\nM\nL\nXL\nXXL'}
                    />
                    <button
                      type="button"
                      className={styles.presetButton}
                      onClick={() => updateDraft(product._id, 'sizes', STANDARD_T_SHIRT_SIZES.join('\n'))}
                    >
                      Use standard T-shirt sizes (XS–XXL)
                    </button>
                  </label>

                  <label>
                    <span>Available colours</span>
                    <small>One per line: a CSS colour name or “Display name | hex”, e.g. Navy Blue | #0B1F3A.</small>
                    <textarea
                      rows={4}
                      value={draft.colours}
                      onChange={(event) => updateDraft(product._id, 'colours', event.target.value)}
                      placeholder={'Black\nWhite\nNavy Blue | #0B1F3A'}
                    />
                  </label>
                </div>

                <div className={styles.actions}>
                  <p className={messages[product._id]?.includes('saved') ? styles.success : styles.message} role="status">
                    {messages[product._id] || (!hasVariants
                      ? 'Customers cannot customize this product until at least one size and colour are saved.'
                      : `${product.sizes.length} sizes · ${product.colours.length} colours configured.`)}
                  </p>
                  <button
                    type="button"
                    className={styles.saveButton}
                    onClick={() => saveVariants(product)}
                    disabled={savingId === product._id}
                  >
                    {savingId === product._id ? 'Saving…' : 'Save variants'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AdminProducts;
