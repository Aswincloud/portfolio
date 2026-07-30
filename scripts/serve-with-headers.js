/**
 * @file serve-with-headers.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Static file server that applies `dist/_headers` the way Cloudflare's
 * assets runtime does, so the generated Content-Security-Policy can be exercised by a
 * real browser (see e2e/csp.spec.js) rather than only eyeballed.
 *
 * `vite preview` ignores `_headers`, which is why this exists.
 *
 * Importable (`createHeadersServer`) and runnable directly:
 *   node scripts/serve-with-headers.js [dist-dir] [port]
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.map': 'application/json',
};

/**
 * Parse a `_headers` file into `[{ pattern, headers }]` in declaration order.
 * Deliberately minimal — it supports the `/*` catch-all and prefix rules such as
 * `/assets/*`, which is all this project's `_headers` uses.
 */
export function parseHeadersFile(text) {
  const rules = [];
  let current = null;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = { pattern: line.trim(), headers: [] };
      rules.push(current);
    } else if (current) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        current.headers.push([line.slice(0, idx).trim(), line.slice(idx + 1).trim()]);
      }
    }
  }
  return rules;
}

export function headerRuleMatches(pattern, pathname) {
  if (pattern === '/*') return true;
  if (pattern.endsWith('/*')) return pathname.startsWith(pattern.slice(0, -1));
  return pattern === pathname;
}

/**
 * Start a server over `distDir`. Resolves to `{ url, close }`; port 0 picks a free
 * port, so concurrent test workers can't collide.
 */
export async function createHeadersServer(distDir = 'dist', port = 0) {
  const dist = resolve(distDir);
  const rules = parseHeadersFile(await readFile(join(dist, '_headers'), 'utf8'));

  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    // Contain path traversal, then fall back to index.html for client-side routes,
    // mirroring not_found_handling = "single-page-application".
    const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    let filePath = pathname.endsWith('/') ? join(dist, safe, 'index.html') : join(dist, safe);
    let body;
    try {
      body = await readFile(filePath);
    } catch {
      filePath = join(dist, 'index.html');
      body = await readFile(filePath);
    }

    for (const rule of rules) {
      if (!headerRuleMatches(rule.pattern, pathname)) continue;
      for (const [name, value] of rule.headers) res.setHeader(name, value);
    }
    res.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream');
    res.writeHead(200);
    res.end(body);
  });

  await new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolvePromise);
  });

  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(done => server.close(done)),
  };
}

// CLI entry point (no-op when imported).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { url } = await createHeadersServer(
    process.argv[2] ?? 'dist',
    Number(process.argv[3] ?? 4174)
  );
  console.log(`serving ${resolve(process.argv[2] ?? 'dist')} with _headers on ${url}`);
}
