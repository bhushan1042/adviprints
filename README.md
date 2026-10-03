# AdviPrints

Custom-print e-commerce store.

- [`frontend/`](./frontend) - React (Create React App) storefront and admin pages. See [frontend/README.md](./frontend/README.md).
- [`backend/`](./backend) - Express + MongoDB API, built-in admin panel, Cloudinary image storage. See [backend/README.md](./backend/README.md).

## Render deployment checklist

Nothing here is applied automatically; check each item in the Render dashboard.

**Backend (Web Service)**

| Setting | Value |
|---|---|
| Root directory | `backend` |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/api/health` |
| Node version | 20.12+ (set `NODE_VERSION=22` to be explicit) |

Environment variables (see [backend/.env.example](./backend/.env.example)):

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `MONGODB_URI` | yes | Atlas connection string including the database name |
| `JWT_SECRET` | yes | 32+ random characters. Changing it logs everyone out |
| `CORS_ORIGINS` | yes | Frontend origin(s), e.g. `https://www.adviprints.com` (no trailing slash, comma-separated) |
| `ADMIN_EMAILS` | yes, first deploy | E-mail of your existing admin account(s). Without it nobody has admin rights until `npm run promote-admin` is run |
| `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | yes | From the Cloudinary dashboard (free plan is enough to start) |
| `CLOUDINARY_FOLDER`, `MONGODB_DB_NAME`, `JWT_EXPIRES_IN` | no | Optional overrides |

Atlas: Network Access must allow Render (`0.0.0.0/0` unless you have a fixed outbound IP), and the database user must have read/write on the database.

**Frontend (Static Site)**

| Setting | Value |
|---|---|
| Root directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Publish directory | `build` |
| Environment variable (build time) | `REACT_APP_API_BASE` = public https URL of the backend, no trailing slash |
| Redirects/Rewrites | Add a **Rewrite** `/*` -> `/index.html`. The `public/_redirects` file is a Netlify feature and is ignored by Render |

The production build fails on purpose when `REACT_APP_API_BASE` is missing, so it can never ship pointing at localhost.

## First deploy / migration steps

1. Create a Cloudinary account and add the credentials and the other variables above to the backend service.
2. Deploy the backend. Open `/api/health`: `"mongodb": "Connected"` means the database is reachable. If the service exits at startup, the log names the missing or invalid variable.
3. Log in to the admin panel with an account listed in `ADMIN_EMAILS`.
4. Run `npm run migrate-uploads` in the Render shell (dry run), then `npm run migrate-uploads -- --apply`. It moves images that still exist on disk to Cloudinary and lists those already lost (the old Render disk is wiped on every deploy); re-upload those in the admin panel.
5. Deploy the frontend with `REACT_APP_API_BASE` set.

## Why uploaded images used to disappear

The old backend saved uploads to `backend/public/uploads` on the web service's local disk and stored only the relative path in MongoDB. Render web service disks are ephemeral: every deploy, restart or instance replacement resets them to the git checkout, while the database records survived and pointed at files that no longer existed. Uploads now go to Cloudinary and the stored value is the absolute Cloudinary URL.
