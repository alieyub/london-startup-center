import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const root = join(import.meta.dirname, 'dist');
const port = process.env.PORT || 8080;
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
};
const compressible = new Set(['.html', '.js', '.css', '.svg', '.txt', '.xml']);
const security = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// The site is small and static: load every file once, pre-compressed, and serve from memory.
const files = new Map();
async function load(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { await load(full); continue; }
    const ext = extname(entry.name);
    const body = await readFile(full);
    const urlPath = '/' + relative(root, full).split(sep).join('/');
    const zip = compressible.has(ext) && body.length > 1024;
    files.set(urlPath, {
      body,
      br: zip ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }) : null,
      gz: zip ? gzipSync(body, { level: 9 }) : null,
      type: types[ext] || 'application/octet-stream',
      cache: urlPath.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'          // content-hashed by Vite
        : ext === '.html' ? 'public, max-age=0, must-revalidate'
        : 'public, max-age=2592000',                       // images, logos, robots: 30 days
    });
  }
}
await load(root);

createServer((req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { path = '/'; }
  if (path.endsWith('/')) path += 'index.html';
  const file = files.get(path);
  const status = file ? 200 : 404;
  const f = file || files.get('/index.html');

  const accept = req.headers['accept-encoding'] || '';
  const headers = { 'Content-Type': f.type, 'Cache-Control': file ? f.cache : 'no-store', Vary: 'Accept-Encoding', ...security };
  let body = f.body;
  if (f.br && /\bbr\b/.test(accept)) { body = f.br; headers['Content-Encoding'] = 'br'; }
  else if (f.gz && /\bgzip\b/.test(accept)) { body = f.gz; headers['Content-Encoding'] = 'gzip'; }
  headers['Content-Length'] = body.length;
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(port, '0.0.0.0', () => console.log(`LSC listening on ${port} (${files.size} files)`));
