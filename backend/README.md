# AdviPrints backend

Express + MongoDB (Mongoose) API and the built-in admin panel (`views/`).

## Local development

```bash
cd backend
npm install
npm run dev
```

If `backend/.env` does not exist, copy `.env.example` to `.env`; otherwise preserve the existing file and update its values. Set `MONGODB_URI` to the Atlas connection string you provide and set `MONGODB_DB_NAME=adviprints`; keep any query parameters in the URI. The configuration module loads `backend/.env` relative to `config/env.js` outside production, before validating the settings. Production reads environment variables supplied by its host and does not load `.env`. Node 20.12+ is required.

The backend connects before opening its HTTP listener. To check connectivity without writing data, run `npm run check-db`. In Atlas, permit the local machine's current public IP under Network Access; do not allow access from every IP.

Orders are persisted by the existing `Order` model after server-side product, variant and price validation. MongoDB creates the `orders` collection when the first order is successfully written. Product and SKU/price details are snapshotted on each order; later product edits do not rewrite historical orders.

## Layout

```
index.js          entry point: validate config -> connect MongoDB -> listen -> graceful shutdown
app.js            Express app (middleware, routes)
config/           env.js (validation), db.js (single MongoDB connection path), multer.js
controllers/      request handlers
routes/           route tables and access rules
middleware/       authenticate (JWT, requireAdmin), rate limiters, error handling
models/           Mongoose schemas
services/storage.js   image storage (Cloudinary in production, local disk in development)
utils/            helpers (image type detection, token signing, public order view)
scripts/          check-db, promote-admin, migrate-uploads, seed
tests/            node:test suites (`npm test`)
views/            EJS admin panel
```

## Environment variables

See [.env.example](./.env.example). Configure production separately with `MONGODB_URI` for the intended Atlas cluster and `MONGODB_DB_NAME=adviprints`, along with `JWT_SECRET`, `CORS_ORIGINS`, and Cloudinary credentials. The server refuses to start (exit code 1, nothing listening) when a required value is missing, when `MONGODB_URI` points at localhost, or when `STORAGE_DRIVER=local` is used in production.

## Qikink integration status

The backend Qikink client defaults to Sandbox (`QIKINK_ENV=sandbox`) and keeps credentials server-side. Add the sandbox Client ID and sandbox secret to the backend environment only. The client caches tokens, shares concurrent token acquisition, validates the documented order shape and rate-limits API calls. It does not automatically retry order creation after a timeout because Qikink may have accepted the request; an uncertain result is stored as `outcome_unknown` and must be checked in Qikink before any manual action. `checkoutId` also prevents the same browser checkout from creating another Adviprints order on retry. Startup initializes and verifies unique sparse MongoDB indexes for `orders.checkoutId` and `qikinkFulfillment.reference`; startup fails if either index is missing.

Live order creation is blocked in the API client, even if the environment variables are changed. Live status reads are available only if the backend is intentionally configured with Live credentials, and are not exercised by Sandbox. COD is the only payment method in the current checkout; an order is sent to Qikink with `gateway=COD`, which may start fulfilment before payment is collected from the customer. Do not enable this workflow operationally until that business risk is accepted.

Create Qikink products in the Qikink dashboard, then enter their title, description, manually uploaded images, selling price, sizes, colours and per-variant details in the Adviprints Admin Panel. Enter sizes and colours to generate a row for each combination. Copy the Store SKU and Product Cost for each variation; the cost is sent to Qikink per item and can differ from the customer selling price. Product SKU and Design SKU are optional references and are not sent in My Products orders. Drafts may omit the cost, but every Store SKU must have one before approval. Do not invent values. New and edited products start as `PENDING`; only `ENABLED` products are public/orderable. Every product edit requires approval again. Existing products without a stored status are treated as PENDING and must be reviewed/approved.

Use Remove beside a variation to exclude that size and colour without removing other combinations; Restore brings it back. Save the product to persist the change and approve it again. Removed combinations cannot be ordered. An unsaved restored row retains its entered details; after saving a removal, re-enter those details if restoring it later.

Products can have a separate thumbnail for catalog cards and a product image for the detail page. Upload both in the product editor; when no thumbnail is set, existing product images remain the catalog fallback.

Ready-designed products submit line items in `search_from_my_products=1` mode, using the configured SKU and quantity. The documented mode says design and print-type details are not needed, so this integration omits `designs` and `print_type_id`; verify this exact mode with Qikink Sandbox credentials before customer launch. Qikink product catalogue synchronization is intentionally not implemented.

The order-list API is unavailable in Sandbox. Admin status refresh reads the documented `status`, `shipping_type` and `delivered_on` fields when supported; tracking/AWB details and webhooks are not documented and are not fabricated. Do not send Live orders. Test Sandbox order creation and confirm `search_from_my_products=1`, SKU resolution, COD handling and fulfillment behavior before any separate Live approval.

## Access control

- Public: enabled catalogue reads, `POST /api/orders`, guest order confirmation with the matching `X-Checkout-Id` capability, reviews, newsletter, login/register.
- Admin only (`role: "admin"`): product administration/approval, everything that writes homepage/branding data, uploads, user management, order listing/status/delete, Qikink status refresh and legacy customer artwork.
- Registering never grants admin rights. Admins are created with `ADMIN_EMAILS` (matched at login) or `npm run promote-admin -- user@example.com`. Existing users keep working but are normal users until promoted; after promotion they must log in again.
- Guest order confirmation requires the unguessable `checkoutId` retained in that browser tab and sent as `X-Checkout-Id`; an order ID alone does not grant access. Administrators continue to use their authenticated token for full order access.
- Public product endpoints omit Qikink and fulfilment fields; the backend still resolves SKU mappings from MongoDB at checkout.
- The Qikink documentation labels `shipping_address.zip` numeric, while Adviprints preserves and sends the customer's six-digit Indian PIN as a string to avoid losing leading zeros. Keep this representation until Qikink confirms the accepted format.

## Image storage

- Public images (products, categories, banners, branding) go to Cloudinary under `adviprints/<kind>/` and the absolute `https://res.cloudinary.com/...` URL is stored in MongoDB.
- Customer artwork (orders) is uploaded as Cloudinary `authenticated` assets, is never public, and is streamed to admins through `GET /api/orders/:id/artwork/:kind` (`original`, `preview`, `uploaded`).
- Files are never written to the application filesystem in production. Legacy `/uploads/...` URLs keep resolving only while the file still exists on disk.
- Moving existing data: `npm run migrate-uploads` (dry run) then `npm run migrate-uploads -- --apply`. It copies files and rewrites references, never deletes anything, and lists references whose files are already gone (re-upload those in the admin panel).
- Cloudinary free plan: 25 monthly credits (storage + bandwidth + transformations); enough to start. Alternatives: S3-compatible storage (needs code changes), or a Render persistent disk (paid, single instance, no CDN).

## Database troubleshooting

```bash
npm run check-db
```

Prints the target host/database (never credentials), pings MongoDB and lists collection counts. If it fails, check that `MONGODB_URI` is set in the environment of the failing service, the database credentials are correct (URL-encode special characters), the database user has access to that database, the host's IP is allowed by Atlas **Network Access**, and the cluster is running. `GET /api/health` returns 503 while the database is not connected.

## Tests

```bash
npm test
```

Covers configuration validation, access control on every admin route, image validation, storage, upload and error handling. Cloudinary and a real MongoDB are not exercised by these tests.
