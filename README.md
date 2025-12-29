## Project Aether

This is a Vite + React + TypeScript app configured to be deployed to **GitHub Pages** at:

https://suke2004.github.io/aether/

### Local development

```bash
npm install
npm run dev
```

### Production build

```bash
npm run build
```

The production build will be output to the `dist` directory. A post-build script
creates a `dist/404.html` file (copied from `dist/index.html`) to ensure that
single-page app routing works correctly on GitHub Pages.

### Deploying to GitHub Pages

This project is already wired for GitHub Pages deployment using the
[`gh-pages`](https://www.npmjs.com/package/gh-pages) package.

The relevant configuration is:

- `vite.config.ts` sets `base: "/aether/"` so that assets resolve correctly
  when the app is served from `https://suke2004.github.io/aether/`.
- `package.json` sets `"homepage": "https://suke2004.github.io/aether/"`.
- `src/App.tsx` uses `BrowserRouter` with `basename={import.meta.env.BASE_URL}`
  so that React Router is aligned with the Vite base path.
- A `postbuild` script (`node scripts/create-gh-pages-404.cjs`) creates
  `dist/404.html` for GitHub Pages SPA routing support.
- The `deploy` script publishes the `dist` folder to the `gh-pages` branch.

To deploy:

```bash
npm install
npm run deploy
```

This will:

1. Run `npm run build` (via the `predeploy` script), producing the production
   bundle in `dist/`.
2. Run the `postbuild` script to create `dist/404.html`.
3. Publish the contents of `dist/` to the `gh-pages` branch, which GitHub
   Pages will serve at `https://suke2004.github.io/aether/` once the repository
   is configured to use that branch for Pages.

### GitHub Pages repository settings

In your GitHub repository settings under **Pages**:

1. Set **Source** to **Deploy from a branch**.
2. Select the `gh-pages` branch and the `/ (root)` folder.
3. Save the settings.

After a successful deploy, GitHub will build and serve the site at the
configured URL.
