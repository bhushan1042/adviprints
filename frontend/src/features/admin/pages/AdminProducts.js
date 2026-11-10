import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  qikinkVariants: [],
  qikinkExcludedVariants: [],
  thumbnailUrl: '',
  imageUrls: []
};

const splitOptions = (value) => [...new Set(
  value.split(/[\n,]+/).map((option) => option.trim()).filter(Boolean)
)];

const colourName = (colour) => colour.split('|')[0].trim();
const variantKey = (size, colour) => `${size.trim().toLowerCase()}\u0000${colourName(colour).toLowerCase()}`;

const toForm = (product) => ({
  name: product.name || '',
  description: product.description || '',
  category: product.category || '',
  price: String(product.price ?? ''),
  stock: String(product.stock ?? 0),
  sizes: (product.sizes || []).join('\n'),
  colours: (product.colours || []).join('\n'),
  qikinkVariants: (product.qikinkVariants || []).map((variant) => ({ ...variant })),
  qikinkExcludedVariants: (product.qikinkExcludedVariants || []).map((variant) => ({ ...variant })),
  thumbnailUrl: product.thumbnailUrl || '',
  imageUrls: [...new Set([product.imageUrl, ...(product.images || [])].filter(Boolean))]
});

const collectVariants = (sizes, colours, drafts, excluded) => colours.flatMap((colour) => sizes.flatMap((size) => {
  if (excluded.some((variant) => variantKey(variant.size, variant.colour) === variantKey(size, colour))) return [];
  const draft = drafts.find((variant) => variantKey(variant.size, variant.colour) === variantKey(size, colour));
  if (!draft) return [];
  const sku = (draft.sku || '').trim();
  const productSku = (draft.productSku || '').trim();
  const designSku = (draft.designSku || '').trim();
  const price = String(draft.qikinkPrice ?? '').trim();
  if (!sku && !productSku && !designSku && !price) return [];
  if (!sku) throw new Error(`Enter the Store SKU for ${colourName(colour)} / ${size}.`);
  const qikinkPrice = price ? Number(price) : undefined;
  if (qikinkPrice !== undefined && (!Number.isFinite(qikinkPrice) || qikinkPrice < 0.01 || qikinkPrice > 100000)) {
    throw new Error(`Enter a Qikink price between 0.01 and 100000 for ${colourName(colour)} / ${size}.`);
  }
  return [{ size, colour: colourName(colour), sku, ...(draft.printTypeId === undefined ? {} : { printTypeId: draft.printTypeId }), ...(qikinkPrice === undefined ? {} : { qikinkPrice }), ...(productSku ? { productSku } : {}), ...(designSku ? { designSku } : {}) }];
}));

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const imageInput = useRef(null);
  const thumbnailInput = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [newSize, setNewSize] = useState('');
  const [sizeMessage, setSizeMessage] = useState('');

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
  const clearFileInputs = () => {
    setImageFiles([]);
    setThumbnailFile(null);
    if (imageInput.current) imageInput.current.value = '';
    if (thumbnailInput.current) thumbnailInput.current.value = '';
  };
  const updateVariant = (size, colour, field, value) => setForm((current) => {
    const key = variantKey(size, colour);
    const existing = current.qikinkVariants.find((variant) => variantKey(variant.size, variant.colour) === key);
    const updated = { ...existing, size, colour: colourName(colour), [field]: value };
    return { ...current, qikinkVariants: [...current.qikinkVariants.filter((variant) => variantKey(variant.size, variant.colour) !== key), updated] };
  });

  const resetForm = () => {
    setForm(EMPTY_FORM);
    clearFileInputs();
    setEditingId(null);
    setMessage('');
    setError('');
    setNewSize('');
    setSizeMessage('');
  };

  const addSize = () => {
    const size = newSize.trim();
    const sizes = splitOptions(form.sizes);
    if (!size || /[,\n\r]/.test(size)) {
      setSizeMessage('Enter one size at a time.');
      return;
    }
    if (sizes.some((item) => item.toLowerCase() === size.toLowerCase())) {
      setSizeMessage('This size is already in the list.');
      return;
    }
    if (sizes.length >= 50) {
      setSizeMessage('A product can have at most 50 sizes.');
      return;
    }
    updateForm('sizes', [...sizes, size].join(', '));
    setNewSize('');
    setSizeMessage(`Added size ${size}.`);
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

  const uploadThumbnail = async () => {
    if (!thumbnailFile) return form.thumbnailUrl;
    const body = new FormData();
    body.append('image', thumbnailFile);
    body.append('folder', 'products');
    const { data } = await api.post('/upload', body, withAuth());
    if (!data.url) throw new Error('Thumbnail upload did not return an image URL.');
    return data.url;
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const sizes = splitOptions(form.sizes);
      const colours = splitOptions(form.colours);
      const qikinkExcludedVariants = form.qikinkExcludedVariants.filter((variant) =>
        sizes.some((size) => size.toLowerCase() === variant.size.toLowerCase()) &&
        colours.some((colour) => colourName(colour).toLowerCase() === colourName(variant.colour).toLowerCase()));
      const qikinkVariants = collectVariants(sizes, colours, form.qikinkVariants, qikinkExcludedVariants);
      if (sizes.length > 50 || colours.length > 50) throw new Error('Use no more than 50 sizes and 50 colours.');
      const imageUrls = await uploadImages();
      const thumbnailUrl = await uploadThumbnail();
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category || undefined,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        sizes,
        colours,
        qikinkVariants,
        qikinkExcludedVariants,
        imageUrl: imageUrls[0] || '',
        thumbnailUrl,
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
          {editingId ? <button type="button" className={styles.refreshButton} disabled={saving} onClick={resetForm}>Cancel edit</button> : null}
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
            Product thumbnail image
            <input ref={thumbnailInput} type="file" accept="image/*" onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)} />
            <small>Shown in product lists. If none is provided, the product image is used.</small>
            {form.thumbnailUrl ? <span className={styles.imageItem}>
              <img src={form.thumbnailUrl} alt="Current product thumbnail" />
              <button type="button" className={styles.presetButton} onClick={() => { updateForm('thumbnailUrl', ''); setThumbnailFile(null); if (thumbnailInput.current) thumbnailInput.current.value = ''; }}>Remove thumbnail</button>
            </span> : null}
          </label>
          <label className={styles.fullWidth}>
            Product images
            <input ref={imageInput} type="file" accept="image/*" multiple onChange={(event) => setImageFiles(Array.from(event.target.files || []))} />
            <small>Shown on the product detail page. The first image is the main preview. New images are added after existing images; use Set primary after saving to change the preview.</small>
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
          <div className={styles.mappingField}>
            <label htmlFor="admin-sizes">Available sizes</label>
            <small>Keep all sizes separated by commas, or use Add size below.</small>
            <textarea id="admin-sizes" rows={4} value={form.sizes} onChange={(event) => updateForm('sizes', event.target.value)} />
            <div className={styles.addSize}>
              <input aria-label="New size" placeholder="New size, e.g. M" value={newSize} onChange={(event) => setNewSize(event.target.value)} />
              <button type="button" className={styles.presetButton} onClick={addSize}>Add size</button>
            </div>
            <span className={styles.notice} role="status" aria-live="polite">{sizeMessage}</span>
          </div>
          <label>
            Available colours
            <small>Enter colours separated by commas, for example: White. Optional format: Name | #hex.</small>
            <textarea rows={4} value={form.colours} onChange={(event) => updateForm('colours', event.target.value)} />
          </label>
          <div className={`${styles.fullWidth} ${styles.mappingField}`}>
            <span>Product variation rows</span>
            <small>Enter both sizes and colours above. A row appears for every size and colour. Copy each row's details from Qikink.</small>
            {splitOptions(form.sizes).length && splitOptions(form.colours).length ? (
              <div className={styles.variantTable}>
                <table>
                  <thead><tr><th>Colour</th><th>Size</th><th>Store SKU</th><th>Product SKU</th><th>Design SKU</th><th>Product cost (₹)</th><th>Action</th></tr></thead>
                  <tbody>{splitOptions(form.colours).flatMap((colour) => splitOptions(form.sizes).map((size) => {
                    if (form.qikinkExcludedVariants.some((item) => variantKey(item.size, item.colour) === variantKey(size, colour))) return null;
                    const variant = form.qikinkVariants.find((item) => variantKey(item.size, item.colour) === variantKey(size, colour));
                    const label = `${colourName(colour)} ${size}`;
                    return <tr key={variantKey(size, colour)}>
                      <td>{colourName(colour)}</td><td>{size}</td>
                      <td><input aria-label={`Store SKU for ${label}`} maxLength={50} value={variant?.sku ?? ''} onChange={(event) => updateVariant(size, colour, 'sku', event.target.value)} /></td>
                      <td><input aria-label={`Product SKU for ${label}`} maxLength={100} value={variant?.productSku ?? ''} onChange={(event) => updateVariant(size, colour, 'productSku', event.target.value)} /></td>
                      <td><input aria-label={`Design SKU for ${label}`} maxLength={100} value={variant?.designSku ?? ''} onChange={(event) => updateVariant(size, colour, 'designSku', event.target.value)} /></td>
                      <td><input aria-label={`Product cost for ${label}`} type="number" min="0.01" max="100000" step="0.01" value={variant?.qikinkPrice ?? ''} onChange={(event) => updateVariant(size, colour, 'qikinkPrice', event.target.value)} /></td>
                      <td><button type="button" className={styles.presetButton} aria-label={`Remove ${label}`} onClick={() => updateForm('qikinkExcludedVariants', [...form.qikinkExcludedVariants, { size, colour: colourName(colour) }])}>Remove</button></td>
                    </tr>;
                  }))}</tbody>
                </table>
                {form.qikinkExcludedVariants.filter((item) =>
                  splitOptions(form.sizes).some((size) => size.toLowerCase() === item.size.toLowerCase()) &&
                  splitOptions(form.colours).some((colour) => colourName(colour).toLowerCase() === colourName(item.colour).toLowerCase())
                ).map((item) => <button key={variantKey(item.size, item.colour)} type="button" className={styles.presetButton} onClick={() => updateForm('qikinkExcludedVariants', form.qikinkExcludedVariants.filter((v) => variantKey(v.size, v.colour) !== variantKey(item.size, item.colour)))}>Restore {item.colour} / {item.size}</button>)}
              </div>
            ) : <p className={styles.notice}>No rows yet. Enter at least one size and one colour above.</p>}
          </div>
        </div>
        {message ? <p className={styles.success} role="status">{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.actions}>
          <span className={styles.notice}>Copy variation details from Qikink; no values are invented.</span>
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
                <button type="button" className={styles.refreshButton} disabled={saving} onClick={() => { setEditingId(product._id); setForm(toForm(product)); clearFileInputs(); setMessage(''); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
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
