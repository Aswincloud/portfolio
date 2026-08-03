/**
 * @file assetsignore.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the two halves of "don't publish source maps".
 *
 * These were publicly fetchable in production (the full annotated sources were
 * downloadable from /assets/*.js.map), so both the Vite setting and the upload
 * exclusion are pinned here. Either one alone is insufficient: `sourcemap: 'hidden'`
 * still writes the files, and .assetsignore is what stops them being uploaded.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = relative => readFileSync(resolve(repoRoot, relative), 'utf8');

describe('source map exposure', () => {
  it('excludes *.map from the Cloudflare asset upload', () => {
    const assetsignore = read('public/.assetsignore');
    const patterns = assetsignore
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    expect(patterns).toContain('*.map');
  });

  it("builds source maps as 'hidden' so nothing references them", () => {
    // 'hidden' still emits .map files (uploadable to an error tracker) but omits the
    // //# sourceMappingURL comment. Plain `true` would advertise them to browsers.
    expect(read('vite.config.js')).toMatch(/sourcemap:\s*'hidden'/);
  });
});

describe('wrangler configuration', () => {
  const wrangler = read('wrangler.toml');

  it('routes /api/* to the Worker so it can serve the API', () => {
    expect(wrangler).toMatch(/run_worker_first\s*=\s*\[\s*"\/api\/\*"\s*\]/);
  });

  it('answers an unknown path with a real 404 document, not the home page', () => {
    // Was "single-page-application", which returned index.html at HTTP 200 for
    // every unknown path — so any typo'd URL was an indexable soft-404 titled
    // "Aswin — Senior Software Engineer". "404-page" serves dist/404.html with a
    // genuine 404; React still renders the client-side route from it, so deep
    // links behave the same. See scripts/vite-plugin-route-pages.js.
    expect(wrangler).toMatch(/not_found_handling\s*=\s*"404-page"/);
  });

  it('uses a compatibility_date new enough for SPA navigation optimization', () => {
    const date = wrangler.match(/compatibility_date\s*=\s*"([\d-]+)"/)?.[1];
    expect(date).toBeTruthy();
    expect(new Date(date) >= new Date('2025-04-01')).toBe(true);
  });
});
