# AdviPrints backend

Express + MongoDB (Mongoose) API and the built-in admin panel (`views/`).

## Local development

```bash
cd backend
npm install
cp .env.example .env     # fill in MONGODB_URI at least
npm run dev
```

`.env` is only read outside production. Node 20.12+ is required.

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

See [.env.example](./.env.example). Required in production: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGINS`, Cloudinary credentials. The server refuses to start (exit code 1, nothing listening) when a required value is missing, when `MONGODB_URI` points at localhost, or when `STORAGE_DRIVER=local` is used in production.

## Access control

- Public: catalogue reads, `POST /api/orders`, `GET /api/orders/:id` (sanitised: masked contact details, no street address), reviews, newsletter, login/register.
- Admin only (`role: "admin"`): everything that writes catalogue/homepage/branding data, uploads, user management, order listing/status/delete and customer artwork.
- Registering never grants admin rights. Admins are created with `ADMIN_EMAILS` (matched at login) or `npm run promote-admin -- user@example.com`. Existing users keep working but are normal users until promoted; after promotion they must log in again.

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

Prints the target host/database (never credentials), pings MongoDB and lists collection counts. If it fails, check in order: `MONGODB_URI` is set in the environment of the failing service, the user/password are correct (URL-encode special characters), the database user has access to that database, Atlas **Network Access** allows the host (Render has no fixed IPs; `0.0.0.0/0` is typical), the cluster is not paused. `GET /api/health` returns 503 while the database is not connected.

## Tests

```bash
npm test
```

Covers configuration validation, access control on every admin route, image validation, storage, upload and error handling. Cloudinary and a real MongoDB are not exercised by these tests.
