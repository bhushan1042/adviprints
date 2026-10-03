## Frontend

### Local development
- Install dependencies with `npm install`.
- Start the CRA app with `npm start` from the `frontend` folder.
- The app uses `http://localhost:5000` automatically in development when `REACT_APP_API_BASE` is not set.

### Environment
- Copy `.env.example` to `.env` when you need to override the backend URL locally.
- `REACT_APP_API_BASE` is required for production builds.
- Set it to the public HTTPS backend URL without a trailing slash.

### Build
- Run `npm run build` to create the production bundle.
- `CI=true npm run build` treats warnings as errors.

### Folder structure
- `src/app` – app shell and route configuration.
- `src/components/common` – shared UI building blocks.
- `src/components/layout` – layout components such as Navbar and Footer.
- `src/config`, `src/services`, `src/utils` – environment config, API client, and helpers.
- `src/features/*` – feature-focused pages and related modules.
- `src/assets` – imported frontend assets.
