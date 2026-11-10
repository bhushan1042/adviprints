import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(path.resolve(process.cwd(), '..', 'backend', 'views', 'admin.ejs'), 'utf8');
const start = source.indexOf('    function bindProductImageUpload(){');
const end = source.indexOf('    async function renderProductAdd(){', start);
const makeUpload = new Function('tokenKey', `${source.slice(start, end)}; return bindProductImageUpload;`);

beforeEach(() => {
  document.body.innerHTML = `
    <input id="p_image_file" type="file"><img id="p_image_preview"><input id="p_imageUrl">
    <input id="p_imageFilename"><input id="p_imageMime"><input id="p_imageSize">
    <input id="p_thumbnail_file" type="file"><img id="p_thumbnail_preview"><input id="p_thumbnailUrl">
    <div id="p_err"></div>`;
});

test('uploads thumbnail and detail separately and prevents saving while uploading', async () => {
  let resolveUpload;
  global.fetch = jest.fn().mockImplementationOnce(() => new Promise((resolve) => { resolveUpload = resolve; }))
    .mockResolvedValueOnce({ ok: true, json: async () => ({ url: '/thumb.jpg' }) });
  const check = makeUpload('token')();
  const image = document.getElementById('p_image_file');
  Object.defineProperty(image, 'files', { configurable: true, value: [new File(['a'], 'detail.png')] });
  image.dispatchEvent(new Event('change'));
  expect(check).toThrow(/wait for image uploads/i);
  const thumb = document.getElementById('p_thumbnail_file');
  Object.defineProperty(thumb, 'files', { configurable: true, value: [new File(['b'], 'thumb.png')] });
  thumb.dispatchEvent(new Event('change'));
  resolveUpload({ ok: true, json: async () => ({ url: '/detail.jpg', filename: 'detail.png' }) });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(check).not.toThrow();
  expect(document.getElementById('p_imageUrl').value).toBe('/detail.jpg');
  expect(document.getElementById('p_thumbnailUrl').value).toBe('/thumb.jpg');
});

test('failed upload blocks saving and reports the error', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Invalid image' }) });
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const check = makeUpload('token')();
    const thumb = document.getElementById('p_thumbnail_file');
    Object.defineProperty(thumb, 'files', { configurable: true, value: [new File(['b'], 'thumb.png')] });
    thumb.dispatchEvent(new Event('change'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(check).toThrow(/upload failed/i);
    expect(document.getElementById('p_err').textContent).toMatch(/image upload failed/i);
  } finally {
    log.mockRestore();
  }
});

test('a late upload cannot overwrite a newly opened form', async () => {
  let resolveUpload;
  global.fetch = jest.fn().mockImplementationOnce(() => new Promise((resolve) => { resolveUpload = resolve; }));
  makeUpload('token')();
  const thumb = document.getElementById('p_thumbnail_file');
  Object.defineProperty(thumb, 'files', { configurable: true, value: [new File(['b'], 'thumb.png')] });
  thumb.dispatchEvent(new Event('change'));
  document.body.innerHTML = '<input id="p_thumbnailUrl" value="/new-product.jpg"><div id="p_err"></div>';
  resolveUpload({ ok: true, json: async () => ({ url: '/old-product.jpg' }) });
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(document.getElementById('p_thumbnailUrl').value).toBe('/new-product.jpg');
});
