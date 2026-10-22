// Serves a built site the way GitHub Pages does, to try it locally:
//
//   bun scripts/serve.ts dist/client [port]
//
// /x serves x.html, /dir redirects to /dir/, /dir/ serves dir/index.html, and
// an address with no file gets 404.html with status 404.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = process.argv[2] ?? "dist/client";
const port = Number(process.argv[3] ?? 4173);

const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".sh": "application/x-sh",
  ".ps1": "application/octet-stream",
};

const isFile = (p: string) => existsSync(p) && statSync(p).isFile();
const isDir = (p: string) => existsSync(p) && statSync(p).isDirectory();

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = decodeURIComponent(url.pathname);
  const file = normalize(join(root, path));
  if (!file.startsWith(normalize(root))) {
    res.writeHead(400).end();
    return;
  }
  let found: string | undefined;
  if (path.endsWith("/"))
    found = isFile(join(file, "index.html")) ? join(file, "index.html") : undefined;
  else if (isFile(file)) found = file;
  else if (isFile(file + ".html")) found = file + ".html";
  else if (isDir(file)) {
    res.writeHead(301, { location: path + "/" + url.search }).end();
    return;
  }
  const status = found ? 200 : 404;
  found ??= join(root, "404.html");
  res.writeHead(status, { "content-type": types[extname(found)] ?? "application/octet-stream" });
  res.end(readFileSync(found));
}).listen(port, () => console.log(`serving ${root} at http://localhost:${port}`));
