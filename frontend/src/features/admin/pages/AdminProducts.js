import React, { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage, isRequestAborted, withAuth } from '../../../services/api';
import styles from './AdminProducts.module.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '',
  price: '',
  stock: '0',
  sizes: '',
  colours: '',
  qikinkVariants: '',
  imageUrls: []
};

const splitOptions = (value) => [...new Set(
  value.split(/[\n,]+/).map((option) => option.trim()).filter(Boolean)
)];

const toForm = (product) => ({
  name: product.name || '',
  description: product.description || '',
  category: product.category || '',
  price: String(product.price ?? ''),
  stock: String(product.stock ?? 0),
  sizes: (product.sizes || []).join('\n'),
  colours: (product.colours || []).join('\n'),
  qikinkVariants: (product.qikinkVariants || [])
    .map((variant) => `${variant.size} | ${variant.colour} | ${variant.sku} | ${variant.printTypeId}`)
    .join('\n'),
  imageUrls: [...new Set([product.imageUrl, ...(product.images || [])].filter(Boolean))]
});

const parseVariants = (value) => {
  const variants = [];
  for (const [index, line] of value.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const [size, colour, sku, printTypeValue, ...extra] = line.split('|').map((part) => part.trim());
    const printTypeId = Number(printTypeValue);
    if (extra.length || !size || !colour || !sku || !Number.isInteger(printTypeId)) {
      throw new Error(`Mapping line ${index + 1} must be: size | colour | exact SKU | print type ID.`);
    }
    variants.push({ size, colour, sku, printTypeId });
  }
  return variants;
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadProducts = useCallback(async (signal) => {
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await api.get('/products/admin/all', { ...withAuth(), signal });
      setProducts(Array.isArray(data) ? data : []);
    } catch (requestError) {
      if (!isRequestAborted(requestError)) setLoadError(getErrorMessage(requestError, 'Unable to load products.'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(controller.signal);
    api.get('/categories', { signal: controller.signal })
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch((requestError) => {
        if (!isRequestAborted(requestError)) setError(getErrorMessage(requestError, 'Unable to load product categories.'));
      });
    return () => controller.abort();
  }, [loadProducts]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFiles([]);
    setEditingId(null);
    setMessage('');
    setError('');
  };

  const uploadImages = async () => {
    const uploaded = [];
    for (const file of imageFiles) {
      const body = new FormData();
      body.append('image', file);
      body.append('folder', 'products');
      const { data } = await api.post('/upload', body, withAuth());
      uploaded.push(data.url);
    }
    return [...new Set([...form.imageUrls, ...uploaded])];
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const sizes = splitOptions(form.sizes);
      const colours = splitOptions(form.colours);
      const qikinkVariants = parseVariants(form.qikinkVariants);
      if (sizes.length > 50 || colours.length > 50) throw new Error('Use no more than 50 sizes and 50 colours.');
      const imageUrls = await uploadImages();
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category || undefined,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        sizes,
        colours,
        qikinkVariants,
        imageUrl: imageUrls[0] || '',
        images: imageUrls
      };
      const response = editingId
        ? await api.put(`/products/${encodeURIComponent(editingId)}`, payload, withAuth())
        : await api.post('/products', payload, withAuth());
      setProducts((current) => {
        const found = current.some((item) => item._id === response.data._id);
        return found
          ? current.map((item) => item._id === response.data._id ? response.data : item)
          : [response.data, ...current];
      });
      resetForm();
      setMessage(editingId
        ? 'Product saved as PENDING. Review and enable it again to publish.'
        : 'Product created as PENDING. Review and enable it when ready.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to save product.'));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (product, status) => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.patch(
        `/products/${encodeURIComponent(product._id)}/status`,
        { status },
        withAuth()
      );
      setProducts((current) => current.map((item) => item._id === product._id ? data : item));
      setMessage(`${product.name} is now ${status}.`);
    } catch (requestError) {
      const problems = requestError?.response?.data?.problems;
      setError([
        getErrorMessage(requestError, `Unable to change product status to ${status}.`),
        ...(Array.isArray(problems) ? problems : [])
      ].join(' '));
    }
  };

  const filteredProducts = products.filter((product) =>
    `${product.name || ''} ${product.category || ''}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>PRODUCT CATALOG</p>
          <h1>Products &amp; approval</h1>
          <p>Create ready-designed products, map exact Qikink variants and approve each update before publishing.</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => loadProducts()}>
          Refresh products
        </button>
      </header>

      <form className={styles.productCard} onSubmit={saveProduct}>
        <div className={styles.productHeading}>
          <div>
            <h2>{editingId ? 'Edit product' : 'Add product'}</h2>
            <p>Every new or edited product returns to PENDING until reviewed.</p>
          </div>
          {editingId ? <button type="button" className={styles.refreshButton} onClick={resetForm}>Cancel edit</button> : null}
        </div>
        <div className={styles.fields}>
          <label>
            Product title
            <input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
          </label>
          <label>
            Selling price (₹)
            <input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => updateForm('price', event.target.value)} />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category._id || category.name} value={category.name}>{category.name}</option>)}
            </select>
          </label>
          <label>
            Stock (display only)
            <input type="number" min="0" step="1" value={form.stock} onChange={(event) => updateForm('stock', event.target.value)} />
          </label>
          <label className={styles.fullWidth}>
            Description
            <textarea rows={3} value={form.description} onChange={(event) => updateForm('description', event.target.value)} />
          </label>
          <label className={styles.fullWidth}>
            Product images
            <input type="file" accept="image/*" multiple onChange={(event) => setImageFiles(Array.from(event.target.files || []))} />
            <small>Images upload to the existing Adviprints storage. First image is the primary product image.</small>
            {form.imageUrls.length ? (
              <span className={styles.imageList}>
                {form.imageUrls.map((url, index) => (
                  <span className={styles.imageItem} key={`${url}-${index}`}>
                    <img src={url} alt={`Product image ${index + 1}`} />
                    <span>{index === 0 ? 'Primary image' : `Image ${index + 1}`}</span>
                    {index > 0 ? (
                      <button type="button" className={styles.presetButton} onClick={() => updateForm('imageUrls', [url, ...form.imageUrls.filter((_, itemIndex) => itemIndex !== index)])}>
                        Set primary
                      </button>
                    ) : null}
                    <button type="button" className={styles.presetButton} onClick={() => updateForm('imageUrls', form.imageUrls.filter((_, itemIndex) => itemIndex !== index))}>
                      Remove
                    </button>
                  </span>
                ))}
              </span>
            ) : null}
          </label>
          <label>
            Available sizes
            <small>One per line or comma-separated.</small>
            <textarea rows={4} value={form.sizes} onChange={(event) => updateForm('sizes', event.target.value)} />
          </label>
          <label>
            Available colours
            <small>One per line. Optional display colour format: Name | #hex.</small>
            <textarea rows={4} value={form.colours} onChange={(event) => updateForm('colours', event.target.value)} />
          </label>
          <label className={styles.fullWidth}>
            Exact Qikink variant mapping
            <small>One per colour-size combination: size | colour name | exact SKU | print_type_id. Use only verified values from your Qikink account.</small>
            <textarea rows={6} value={form.qikinkVariants} onChange={(event) => updateForm('qikinkVariants', event.target.value)} placeholder="M | Black | <verified SKU> | <verified print_type_id>" />
          </label>
        </div>
        {message ? <p className={styles.success} role="status">{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.actions}>
          <span className={styles.notice}>Qikink SKUs and print type IDs are validated; no values are invented.</span>
          <button type="submit" className={styles.saveButton} disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}</button>
        </div>
      </form>

      <label className={styles.searchLabel}>
        <span>Find a product</span>
        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product or category" />
      </label>

      {loadError ? <p className={styles.error} role="alert">{loadError}</p> : null}
      {loading ? <p className={styles.notice}>Loading products…</p> : filteredProducts.length === 0 ? (
        <p className={styles.notice}>{products.length ? 'No products match your search.' : 'No products found.'}</p>
      ) : (
        <div className={styles.productList}>
          {filteredProducts.map((product) => (
            <article className={styles.productCard} key={product._id}>
              <div className={styles.productHeading}>
                <div>
                  <h2>{product.name || 'Untitled product'}</h2>
                  <p>{product.category || 'Uncategorized'} · ₹{Number(product.price || 0).toFixed(2)}</p>
                  <p>{product.sizes?.length || 0} sizes · {product.colours?.length || 0} colours · {product.qikinkVariants?.length || 0} SKU mappings</p>
                </div>
                <span className={`${styles.status} ${product.status === 'ENABLED' ? styles.configured : product.status === 'DISABLED' ? styles.disabled : styles.incomplete}`}>
                  {product.status || 'PENDING'}
                </span>
              </div>
              {product.imageUrl ? <img className={styles.productImage} src={product.imageUrl} alt={product.name} /> : null}
              {product.approvalProblems?.length ? (
                <ul className={styles.problemList}>{product.approvalProblems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
              ) : null}
              <div className={styles.actions}>
                <button type="button" className={styles.refreshButton} onClick={() => { setEditingId(product._id); setForm(toForm(product)); setImageFiles([]); setMessage(''); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  Edit (requires re-approval)
                </button>
                {product.status === 'ENABLED' ? (
                  <button type="button" className={styles.saveButton} onClick={() => changeStatus(product, 'DISABLED')}>Disable</button>
                ) : (
                  <button type="button" className={styles.saveButton} onClick={() => changeStatus(product, 'ENABLED')}>Approve &amp; enable</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminProducts;
