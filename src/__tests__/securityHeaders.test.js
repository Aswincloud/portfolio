/**
 * @file securityHeaders.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Unit tests for the generated security headers / CSP.
 *
 * The browser-level checks live in e2e/csp.spec.js; these cover the generator's
 * logic and lock in the invariants that make the policy meaningful (no
 * 'unsafe-inline' in script-src, hashes derived from real HTML, Cloudflare's
 * `_headers` limits respected).
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  buildCsp,
  buildHeadersFile,
  collectEventHandlerHashes,
  collectInlineScriptHashes,
} from '../../scripts/vite-plugin-security-headers.js';

const sha256 = source => `'sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}'`;

/** Parse a CSP string into { directive: [values] }. */
const parse = csp =>
  Object.fromEntries(
    csp.split(';').map(part => {
      const [directive, ...values] = part.trim().split(/\s+/);
      return [directive, values];
    })
  );

describe('collectInlineScriptHashes', () => {
  it('hashes inline script bodies', () => {
    const html = '<script>alert(1)</script>';
    expect(collectInlineScriptHashes(html)).toEqual([sha256('alert(1)')]);
  });

  it('ignores external scripts, which are covered by host allowlists', () => {
    expect(collectInlineScriptHashes('<script src="/app.js"></script>')).toEqual([]);
    expect(collectInlineScriptHashes('<script async src="https://x.test/a.js"></script>')).toEqual(
      []
    );
  });

  it('ignores JSON-LD, which is data rather than executable script', () => {
    const html = '<script type="application/ld+json">{"@type":"Person"}</script>';
    expect(collectInlineScriptHashes(html)).toEqual([]);
  });

  it('hashes each inline block separately', () => {
    const html = '<script>a()</script><script>b()</script>';
    expect(collectInlineScriptHashes(html)).toEqual([sha256('a()'), sha256('b()')]);
  });

  it('produces a different hash when the script body changes', () => {
    const [before] = collectInlineScriptHashes('<script>a()</script>');
    const [after] = collectInlineScriptHashes('<script>a() // edited</script>');
    expect(before).not.toBe(after);
  });

  // HTML tag and attribute names are case-insensitive, so the scanner must be too.
  // A missed `<SCRIPT>` means a missing hash, which means CSP blocks a script the
  // build intended to allow.
  it('matches tags and attributes regardless of case', () => {
    expect(collectInlineScriptHashes('<SCRIPT>alert(1)</SCRIPT>')).toEqual([sha256('alert(1)')]);
    expect(collectInlineScriptHashes('<ScRiPt>alert(1)</sCrIpT>')).toEqual([sha256('alert(1)')]);
    expect(collectInlineScriptHashes('<SCRIPT SRC="/app.js"></SCRIPT>')).toEqual([]);
    expect(
      collectInlineScriptHashes('<script TYPE="APPLICATION/LD+JSON">{"a":1}</script>')
    ).toEqual([]);
  });

  // These end-tag forms all close the element per the HTML parser, so the body must stop
  // there. Requiring `>` immediately after the name would swallow everything up to the
  // next literal `</script>` and hash the wrong text.
  it.each([
    ['a space before the closing bracket', '<script>alert(1)</script >'],
    ['a tab before the closing bracket', '<script>alert(1)</script\t>'],
    ['a newline before the closing bracket', '<script>alert(1)</script\n>'],
    ['attributes on the end tag', '<script>alert(1)</script foo="bar">'],
  ])('terminates the body on an end tag with %s', (_label, html) => {
    expect(collectInlineScriptHashes(html)).toEqual([sha256('alert(1)')]);
  });

  it('still separates adjacent scripts when the end tag is padded', () => {
    // The end-tag match consumes the delimiter, so check it doesn't eat the next `<`.
    expect(collectInlineScriptHashes('<script>a()</script ><script>b()</script>')).toEqual([
      sha256('a()'),
      sha256('b()'),
    ]);
  });
});

describe('collectEventHandlerHashes', () => {
  it('hashes inline event-handler attributes', () => {
    const html = `<link onload="this.media = 'all'" />`;
    expect(collectEventHandlerHashes(html)).toEqual([sha256("this.media = 'all'")]);
  });

  it('deduplicates identical handlers', () => {
    const html = '<a onclick="go()"></a><a onclick="go()"></a>';
    expect(collectEventHandlerHashes(html)).toEqual([sha256('go()')]);
  });

  it('matches handler attributes regardless of case', () => {
    expect(collectEventHandlerHashes('<a ONCLICK="go()"></a>')).toEqual([sha256('go()')]);
    expect(collectEventHandlerHashes('<a OnLoad="go()"></a>')).toEqual([sha256('go()')]);
  });

  // The parser honours all three forms as handlers, so a policy that only hashes
  // double-quoted ones would have the browser block the others.
  it.each([
    ['double-quoted', `<a onclick="go()"></a>`],
    ['single-quoted', `<a onclick='go()'></a>`],
    ['unquoted', `<a onclick=go()></a>`],
  ])('hashes %s handler values', (_label, html) => {
    expect(collectEventHandlerHashes(html)).toEqual([sha256('go()')]);
  });

  it('deduplicates the same handler written with different quoting', () => {
    expect(collectEventHandlerHashes(`<a onclick="go()"></a><b onmouseover='go()'></b>`)).toEqual([
      sha256('go()'),
    ]);
  });
});

describe('buildCsp', () => {
  const html = `
    <link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet" media="print" onload="this.media = 'all'" />
    <script type="application/ld+json">{"@type":"Person"}</script>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script>
    <script>window.dataLayer = window.dataLayer || [];</script>
  `;

  it("never allows 'unsafe-inline' in script-src", () => {
    // A single 'unsafe-inline' would void every hash and defeat the policy.
    expect(parse(buildCsp(html))['script-src']).not.toContain("'unsafe-inline'");
  });

  it('includes a hash for each inline script', () => {
    const scriptSrc = parse(buildCsp(html))['script-src'];
    for (const hash of collectInlineScriptHashes(html)) {
      expect(scriptSrc).toContain(hash);
    }
  });

  it("pairs 'unsafe-hashes' with inline handler hashes, since a hash alone won't authorise them", () => {
    const scriptSrc = parse(buildCsp(html))['script-src'];
    expect(scriptSrc).toContain("'unsafe-hashes'");
    expect(scriptSrc).toContain(sha256("this.media = 'all'"));
  });

  it("omits 'unsafe-hashes' when there are no inline handlers", () => {
    const scriptSrc = parse(buildCsp('<script>a()</script>'))['script-src'];
    expect(scriptSrc).not.toContain("'unsafe-hashes'");
  });

  it('allowlists the origins the page actually depends on', () => {
    const csp = parse(buildCsp(html));
    expect(csp['script-src']).toContain('https://www.googletagmanager.com');
    expect(csp['script-src']).toContain('https://support.aswincloud.com');
    expect(csp['style-src']).toContain('https://fonts.googleapis.com');
    expect(csp['font-src']).toContain('https://fonts.gstatic.com');
    expect(csp['frame-src']).toContain('https://support.aswincloud.com');
  });

  it('locks down the directives that limit injection blast radius', () => {
    const csp = parse(buildCsp(html));
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['frame-ancestors']).toEqual(["'none'"]);
    expect(csp['base-uri']).toEqual(["'self'"]);
    expect(csp['form-action']).toEqual(["'self'"]);
  });

  it('emits valueless directives without a trailing space', () => {
    expect(buildCsp(html)).toContain('upgrade-insecure-requests');
    expect(buildCsp(html)).not.toMatch(/upgrade-insecure-requests\s+;/);
  });
});

describe('buildHeadersFile', () => {
  const file = buildHeadersFile('<script>a()</script>');

  it('applies headers to every path', () => {
    expect(file).toMatch(/^\/\*$/m);
  });

  it('sets HSTS, framing and sniffing protections', () => {
    expect(file).toContain('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    expect(file).toContain('X-Content-Type-Options: nosniff');
    expect(file).toContain('X-Frame-Options: DENY');
    expect(file).toContain('Referrer-Policy: strict-origin-when-cross-origin');
  });

  it('caches content-hashed assets immutably', () => {
    expect(file).toContain('/assets/*');
    expect(file).toContain('Cache-Control: public, max-age=31536000, immutable');
  });

  it("stays within Cloudflare's _headers limits", () => {
    const lines = file.split('\n');
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(2000);
    const rules = lines.filter(line => line.startsWith('/'));
    expect(rules.length).toBeLessThanOrEqual(100);
  });
});
