const fs = require("fs");
const path = require("path");

const distDir = path.resolve(__dirname, "..", "dist");
const notFoundPath = path.join(distDir, "404.html");

const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Redirecting…</title>
    <script>
      sessionStorage.setItem("redirect", location.pathname + location.search);
      location.replace("/");
    </script>
  </head>
  <body></body>
</html>
`;

try {
  fs.writeFileSync(notFoundPath, html, "utf8");
  console.log("[create-gh-pages-404] Created redirecting 404.html");
} catch (err) {
  console.error("[create-gh-pages-404] Failed:", err);
  process.exit(1);
}
