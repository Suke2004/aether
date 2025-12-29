// Simple helper to ensure GitHub Pages single-page app routing works.
// It copies the built index.html to 404.html in the dist folder so that
// direct navigation to nested routes is served by the SPA shell.

const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");
const notFoundPath = path.join(distDir, "404.html");

try {
  if (!fs.existsSync(indexPath)) {
    console.warn(
      "[create-gh-pages-404] dist/index.html not found. Did you run `npm run build` first?"
    );
    process.exit(0);
  }

  const html = fs.readFileSync(indexPath, "utf8");
  fs.writeFileSync(notFoundPath, html, "utf8");
  console.log(
    "[create-gh-pages-404] Created dist/404.html for GitHub Pages routing."
  );
} catch (err) {
  console.error("[create-gh-pages-404] Failed to create 404.html:", err);
  process.exit(1);
}
