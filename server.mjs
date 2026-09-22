import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import handler from "./api/google-reviews.js";
const port = Number(process.env.PORT || 4173);
const root = path.dirname(fileURLToPath(import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};
http
  .createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (pathname === "/api/google-reviews") {
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (body) => res.end(JSON.stringify(body));
      try {
        await handler(req, res);
      } catch {
        res.statusCode = 500;
        res.end("{}");
      }
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }
    const filename =
      pathname === "/" || pathname === "/index.html"
        ? "index.html"
        : /^\/assets\/[a-zA-Z0-9_-]+\.(?:png|jpg|css|js)$/.test(pathname)
          ? pathname.slice(1)
          : null;
    if (filename) {
      try {
        const body = await readFile(path.join(root, filename));
        res.writeHead(200, {
          "Content-Type": types[path.extname(filename)],
          "Cache-Control": "no-cache",
        });
        res.end(req.method === "HEAD" ? undefined : body);
        return;
      } catch {
        /* Return the same 404 for every unavailable asset. */
      }
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`Phuong Jewelry: http://localhost:${port}`),
  );
