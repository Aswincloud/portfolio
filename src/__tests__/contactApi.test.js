/**
 * @file contactApi.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Tests for the hardening applied to POST /api/contact.
 *
 * These exercise the Worker's exported helpers and route handler directly against
 * real Request/Response objects. The point of each test is a specific attack or
 * leak the hardening exists to stop, so a regression fails loudly rather than
 * quietly widening the endpoint again.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ALLOWED_ORIGIN_PATTERNS,
  LIMITS,
  escapeHtml,
  redactEmail,
  resolveAllowedOrigin,
  createEmailHTML,
  createAutoReplyHTML,
  handleApiRoutes,
  handleContactForm,
} from '../../worker.js';

/**
 * Stub the Resend call for every test in this file.
 *
 * A submission that clears validation calls fetch('https://api.resend.com/emails'),
 * so without this the suite makes real outbound requests — which is slow, flaky, and
 * (with a real key in the environment) would send mail. The stub is installed globally
 * rather than per-test so a future test that forgets cannot silently start doing I/O;
 * `fetchMock` is available to assert on where nothing should have been sent.
 */
let fetchMock;
beforeEach(() => {
  // mockImplementation, not mockResolvedValue: a single Response instance shared across
  // both sends would have its body consumed by the first, and the second read throws
  // "Body has already been read". Each call gets its own.
  fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(
      async () => new Response(JSON.stringify({ id: 'stub-email-id' }), { status: 200 })
    );
});
afterEach(() => {
  vi.restoreAllMocks();
});

/** Silence the Worker's console output for tests that don't assert on it. */
const muteLogs = () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
};

/** A Worker-shaped env with a rate limiter that always allows. */
const allowingEnv = () => ({
  CONTACT_RATE_LIMIT: { limit: vi.fn(async () => ({ success: true })) },
});

/** A Worker-shaped env with a rate limiter that always denies. */
const denyingEnv = () => ({
  CONTACT_RATE_LIMIT: { limit: vi.fn(async () => ({ success: false })) },
});

const contactRequest = (body, headers = {}) =>
  new Request('https://aswincloud.com/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const validSubmission = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'Hello, I would like to talk about a project.',
};

describe('escapeHtml', () => {
  it('neutralises the characters that can open a tag or escape an attribute', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml(`" onmouseover='x'`)).toBe('&quot; onmouseover=&#39;x&#39;');
  });

  it('escapes & first so existing entities cannot be reconstructed', () => {
    // If & were escaped last, `&lt;` typed by a visitor would survive as a real
    // tag delimiter after the other replacements ran.
    expect(escapeHtml('&lt;img&gt;')).toBe('&amp;lt;img&amp;gt;');
  });

  it('coerces non-strings rather than throwing', () => {
    expect(escapeHtml(undefined)).toBe('undefined');
    expect(escapeHtml(42)).toBe('42');
  });
});

describe('createEmailHTML', () => {
  it('does not emit visitor markup as live HTML', () => {
    const html = createEmailHTML(
      '<b>Bold</b>',
      'attacker@example.com',
      '<img src=x onerror=alert(1)>'
    );
    expect(html).not.toContain('<b>Bold</b>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;b&gt;Bold&lt;/b&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('percent-encodes the address in mailto: hrefs so extra headers cannot be injected', () => {
    // A bare escapeHtml would leave `?` and `&` intact, letting the address smuggle
    // a bcc/cc into the reply link that the recipient would send on a single click.
    const html = createEmailHTML(
      'Jane',
      'jane@example.com?bcc=leak@evil.example',
      'A perfectly normal message body.'
    );
    expect(html).not.toMatch(/href="mailto:[^"]*\?bcc=/);
    expect(html).toContain('%3Fbcc%3Dleak%40evil.example');
  });

  it('keeps intended line breaks while escaping the surrounding text', () => {
    const html = createEmailHTML('Jane', 'jane@example.com', 'line one\n<b>line two</b>');
    expect(html).toContain('line one<br>&lt;b&gt;line two&lt;/b&gt;');
  });
});

describe('createAutoReplyHTML', () => {
  it('escapes the name in a message delivered to an address the caller chose', () => {
    const html = createAutoReplyHTML('<script>x</script>', 'A normal message body here.');
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;');
  });

  it('truncates before escaping so an entity is never cut in half', () => {
    // 99 chars, then a character that expands to a 5-char entity. Truncating after
    // escaping would slice `&quot;` mid-entity and emit `&quo` as literal text.
    const message = `${'a'.repeat(99)}"tail`;
    const html = createAutoReplyHTML('Jane', message);
    expect(html).toContain(`${'a'.repeat(99)}&quot;...`);
    expect(html).not.toMatch(/&quo[^t]/);
  });

  it('leaves short messages unabridged', () => {
    const html = createAutoReplyHTML('Jane', 'Short message.');
    expect(html).toContain('Short message.');
    expect(html).not.toContain('...');
  });
});

describe('redactEmail', () => {
  it('keeps the domain and shape but not the local part', () => {
    expect(redactEmail('someone@example.com')).toBe('s*****e@example.com');
  });

  it('handles local parts too short to partially mask', () => {
    expect(redactEmail('ab@example.com')).toBe('a*@example.com');
  });

  it('refuses to echo anything that is not an address', () => {
    expect(redactEmail('not-an-email')).toBe('[redacted]');
    expect(redactEmail('@example.com')).toBe('[redacted]');
    expect(redactEmail(undefined)).toBe('[redacted]');
  });

  it('never returns the input verbatim for a real address', () => {
    const address = 'contact.person@somewhere.co.uk';
    expect(redactEmail(address)).not.toBe(address);
    expect(redactEmail(address)).toContain('@somewhere.co.uk');
  });
});

describe('resolveAllowedOrigin', () => {
  const withOrigin = origin =>
    new Request('https://aswincloud.com/api/contact', {
      method: 'POST',
      headers: origin ? { Origin: origin } : {},
    });

  it.each([
    'https://aswincloud.com',
    'https://www.aswincloud.com',
    'https://aswin-portfolio.workers.dev',
    'https://preview-123.aswin-portfolio.workers.dev',
    'http://localhost:3000',
    'http://127.0.0.1:4173',
  ])('allows %s', origin => {
    expect(resolveAllowedOrigin(withOrigin(origin))).toBe(origin);
  });

  it.each([
    'https://evil.example',
    'https://aswincloud.com.evil.example',
    'http://aswincloud.com',
    'https://evil-aswincloud.com',
    'https://sub.aswincloud.com',
    'https://aswin-portfolio.workers.dev.evil.example',
    'null',
  ])('denies %s', origin => {
    expect(resolveAllowedOrigin(withOrigin(origin))).toBeNull();
  });

  it('returns null when no Origin header is present', () => {
    expect(resolveAllowedOrigin(withOrigin(null))).toBeNull();
  });

  it('anchors every pattern at both ends', () => {
    // An unanchored pattern is the classic way this check gets bypassed, so assert
    // on the regex sources rather than trusting the cases above to cover it.
    for (const pattern of ALLOWED_ORIGIN_PATTERNS) {
      expect(pattern.source.startsWith('^')).toBe(true);
      expect(pattern.source.endsWith('$')).toBe(true);
    }
  });
});

describe('CORS on API responses', () => {
  it('echoes an allowed origin and varies on Origin', async () => {
    const request = new Request('https://aswincloud.com/api/health', {
      method: 'GET',
      headers: { Origin: 'https://aswincloud.com' },
    });
    const response = await handleApiRoutes('/api/health', request, {});
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://aswincloud.com');
    expect(response.headers.get('Vary')).toContain('Origin');
  });

  it('sends no Access-Control-Allow-Origin for a foreign origin', async () => {
    const request = new Request('https://aswincloud.com/api/health', {
      method: 'GET',
      headers: { Origin: 'https://evil.example' },
    });
    const response = await handleApiRoutes('/api/health', request, {});
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    // Still 200 — the browser, not the Worker, enforces the denial. What matters is
    // that the attacker's page cannot read the body.
    expect(response.status).toBe(200);
    expect(response.headers.get('Vary')).toContain('Origin');
  });

  it('never answers with the wildcard origin', async () => {
    for (const origin of ['https://aswincloud.com', 'https://evil.example']) {
      const request = new Request('https://aswincloud.com/api/health', {
        method: 'GET',
        headers: { Origin: origin },
      });
      const response = await handleApiRoutes('/api/health', request, {});
      expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
    }
  });

  it('refuses to preflight a foreign origin', async () => {
    const request = new Request('https://aswincloud.com/api/contact', {
      method: 'OPTIONS',
      headers: { Origin: 'https://evil.example' },
    });
    const response = await handleApiRoutes('/api/contact', request, {});
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(response.headers.get('Access-Control-Max-Age')).toBeNull();
  });

  it('preflights an allowed origin with the methods it may use', async () => {
    const request = new Request('https://aswincloud.com/api/contact', {
      method: 'OPTIONS',
      headers: { Origin: 'http://localhost:3000' },
    });
    const response = await handleApiRoutes('/api/contact', request, {});
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
  });
});

describe('contact form validation', () => {
  it('rejects a missing field', async () => {
    const response = await handleContactForm(
      contactRequest({ name: 'Jane', email: 'jane@example.com' }),
      allowingEnv()
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });

  it('rejects a malformed address', async () => {
    const response = await handleContactForm(
      contactRequest({ ...validSubmission, email: 'not-an-email' }),
      allowingEnv()
    );
    expect(response.status).toBe(400);
  });

  it('rejects an address longer than the RFC 5321 forward-path limit', async () => {
    const email = `${'a'.repeat(LIMITS.email.max)}@example.com`;
    const response = await handleContactForm(
      contactRequest({ ...validSubmission, email }),
      allowingEnv()
    );
    expect(response.status).toBe(400);
  });

  it('bounds the name so it cannot be used as an unbounded payload', async () => {
    for (const name of ['a', 'a'.repeat(LIMITS.name.max + 1)]) {
      const response = await handleContactForm(
        contactRequest({ ...validSubmission, name }),
        allowingEnv()
      );
      expect(response.status).toBe(400);
    }
  });

  it('bounds the message at both ends', async () => {
    for (const message of ['too short', 'a'.repeat(LIMITS.message.max + 1)]) {
      const response = await handleContactForm(
        contactRequest({ ...validSubmission, message }),
        allowingEnv()
      );
      expect(response.status).toBe(400);
    }
  });

  it('does not consume rate-limit quota on invalid input', async () => {
    // Otherwise a bot could exhaust a shared-NAT visitor's quota with junk requests.
    const env = allowingEnv();
    await handleContactForm(contactRequest({ name: '', email: '', message: '' }), env);
    expect(env.CONTACT_RATE_LIMIT.limit).not.toHaveBeenCalled();
  });

  // JSON lets the caller choose the type. `!value` only rejects the falsy ones, so a
  // number/object/array is truthy, has no `.length`, and every `undefined < min` and
  // `undefined > max` comparison below it reads false — the bounds pass by default.
  // Each of these cleared validation entirely before the type check.
  it.each([
    ['a number', { name: 12345 }],
    ['an object', { name: { toString: () => 'x' } }],
    ['an array', { name: ['Jane', 'Doe'] }],
    ['a boolean', { message: true }],
    ['a number for the message', { message: 42 }],
    // RegExp.test stringifies, so this satisfies the email pattern by coercion.
    ['an array for the email', { email: ['jane@example.com'] }],
    ['null', { name: null }],
    ['a nested payload', { message: { text: 'hello there, this is long enough' } }],
  ])('rejects %s in place of a string field', async (_label, override) => {
    const response = await handleContactForm(
      contactRequest({ ...validSubmission, ...override }),
      allowingEnv()
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['name', { name: '   ' }],
    ['email', { email: '   ' }],
    ['message', { message: '          ' }],
  ])('rejects a whitespace-only %s', async (_label, override) => {
    const response = await handleContactForm(
      contactRequest({ ...validSubmission, ...override }),
      allowingEnv()
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('measures the bounds against the trimmed value, not the padding', async () => {
    // `'  a  '` is 5 characters but one letter. Counting the padding would admit a name
    // that fails the minimum it exists to enforce.
    const response = await handleContactForm(
      contactRequest({ ...validSubmission, name: `  ${'a'} ` }),
      allowingEnv()
    );
    expect(response.status).toBe(400);
  });

  it('accepts a padded address and sends to the trimmed one', async () => {
    // The regex forbids whitespace, so an untrimmed '  jane@example.com  ' would 400 on a
    // perfectly valid address. Validating the trimmed value means the address that passes
    // is also the address Resend receives.
    muteLogs();
    const response = await handleContactForm(
      contactRequest({ ...validSubmission, email: '  jane@example.com  ' }),
      allowingEnv()
    );
    expect(response.status).toBe(200);
    const recipients = fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).to[0]);
    expect(recipients).toContain('jane@example.com');
    for (const to of recipients) expect(to).not.toMatch(/^\s|\s$/);
  });

  it('does not carry padding into the delivered email body', async () => {
    muteLogs();
    await handleContactForm(
      contactRequest({ ...validSubmission, name: '  Jane Doe  ' }),
      allowingEnv()
    );
    const bodies = fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).html);
    expect(bodies.join('')).not.toContain('  Jane Doe  ');
    expect(bodies.join('')).toContain('Jane Doe');
  });
});

describe('honeypot', () => {
  beforeEach(muteLogs);

  it('drops a submission with the honeypot filled, without sending anything', async () => {
    const response = await handleContactForm(
      contactRequest({ ...validSubmission, company: 'Acme Bots Inc' }),
      allowingEnv()
    );
    expect(response.status).toBe(200);
    // The real assertion: no email left the Worker.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not consume rate-limit quota on a trapped submission', async () => {
    const env = allowingEnv();
    await handleContactForm(contactRequest({ ...validSubmission, company: 'bot' }), env);
    expect(env.CONTACT_RATE_LIMIT.limit).not.toHaveBeenCalled();
  });

  it('is indistinguishable from a real success, so bots cannot detect it', async () => {
    const trapped = await handleContactForm(
      contactRequest({ ...validSubmission, company: 'bot' }),
      allowingEnv()
    );
    const real = await handleContactForm(contactRequest(validSubmission), allowingEnv());
    expect(trapped.status).toBe(real.status);
    expect(await trapped.json()).toEqual(await real.json());
  });

  it('ignores an empty or whitespace-only honeypot from a real visitor', async () => {
    // The field ships in every submission, so treating '' or a stray space as a hit
    // would reject everyone.
    for (const company of ['', '   ']) {
      fetchMock.mockClear();
      const response = await handleContactForm(
        contactRequest({ ...validSubmission, company }),
        allowingEnv()
      );
      expect(response.status).toBe(200);
      // Mail was actually sent, so this was treated as a genuine submission.
      expect(fetchMock).toHaveBeenCalled();
    }
  });

  it('treats a submission with no honeypot field at all as genuine', async () => {
    // Older cached copies of the bundle post without `company`.
    await handleContactForm(contactRequest(validSubmission), allowingEnv());
    expect(fetchMock).toHaveBeenCalled();
  });

  it('logs no IP, user-agent or submitted content when it fires', async () => {
    // The honeypot is a heuristic — autofill can trip it for a real person. Logging who
    // they are and what device they used writes the PII this change removes from the
    // success path, for someone who may have been misclassified.
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleContactForm(
      contactRequest(
        { ...validSubmission, company: 'Acme Bots Inc' },
        { 'CF-Connecting-IP': '203.0.113.42', 'user-agent': 'Mozilla/5.0 (BotHunter 9.9)' }
      ),
      allowingEnv()
    );
    const written = JSON.stringify(log.mock.calls);
    expect(written).toContain('Honeypot');
    for (const secret of [
      '203.0.113.42',
      'BotHunter',
      'Mozilla',
      validSubmission.email,
      validSubmission.name,
      validSubmission.message,
      'Acme Bots Inc',
    ]) {
      expect(written).not.toContain(secret);
    }
  });
});

describe('rate limiting', () => {
  beforeEach(muteLogs);

  it('answers 429 with Retry-After once the limit is hit', async () => {
    const response = await handleContactForm(contactRequest(validSubmission), denyingEnv());
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    await expect(response.json()).resolves.toMatchObject({ success: false });
  });

  it('sends no email when the limit is hit', async () => {
    // The whole point of the limit: cap outbound mail, not just the status code.
    await handleContactForm(contactRequest(validSubmission), denyingEnv());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keys the limit on the client IP, not the whole endpoint', async () => {
    const env = denyingEnv();
    await handleContactForm(
      contactRequest(validSubmission, { 'CF-Connecting-IP': '203.0.113.7' }),
      env
    );
    expect(env.CONTACT_RATE_LIMIT.limit).toHaveBeenCalledWith({ key: 'contact:203.0.113.7' });
  });

  it('fails open when the binding is missing so a config regression cannot take the form down', async () => {
    const response = await handleContactForm(contactRequest(validSubmission), {});
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('fails open when the limiter itself throws', async () => {
    const env = {
      CONTACT_RATE_LIMIT: {
        limit: vi.fn(async () => {
          throw new Error('limiter unavailable');
        }),
      },
    };
    const response = await handleContactForm(contactRequest(validSubmission), env);
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
  });
});

describe('log hygiene', () => {
  it('never writes the submitter address or message body to the logs', async () => {
    const lines = [];
    const capture = (...args) =>
      lines.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    vi.spyOn(console, 'log').mockImplementation(capture);
    vi.spyOn(console, 'warn').mockImplementation(capture);
    vi.spyOn(console, 'error').mockImplementation(capture);

    const secretMessage = 'Confidential-project-details-that-must-not-be-logged.';
    await handleContactForm(
      contactRequest({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        message: secretMessage,
      }),
      allowingEnv()
    );

    const output = lines.join('\n');
    expect(output).not.toContain('jane.doe@example.com');
    expect(output).not.toContain(secretMessage);
    // The redacted form should still be there — the logs stay useful for support.
    expect(output).toContain('@example.com');
    expect(output).toContain(redactEmail('jane.doe@example.com'));
  });

  it('redacts the address when Resend rejects the send', async () => {
    // The error path used to log the raw payload and full address; make sure the
    // failure branch is held to the same standard as the success branch.
    const lines = [];
    const capture = (...args) =>
      lines.push(args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    vi.spyOn(console, 'log').mockImplementation(capture);
    vi.spyOn(console, 'error').mockImplementation(capture);
    // Fresh Response per call — see the note on the global stub.
    fetchMock.mockImplementation(async () => new Response('domain not verified', { status: 403 }));

    const response = await handleContactForm(
      contactRequest({ ...validSubmission, email: 'jane.doe@example.com' }),
      allowingEnv()
    );

    expect(response.status).toBe(502);
    const output = lines.join('\n');
    expect(output).not.toContain('jane.doe@example.com');
    expect(output).toContain('403');
  });
});

describe('delivery outcome', () => {
  beforeEach(muteLogs);

  /**
   * Both sends go to the same URL, so route by payload: `to` is contact@aswincloud.com
   * for the notification and the visitor's address for the auto-reply.
   */
  const routeResend = ({ notification, autoReply }) => {
    fetchMock.mockImplementation(async (_url, init) => {
      const { to } = JSON.parse(init.body);
      const outcome = to[0] === 'contact@aswincloud.com' ? notification : autoReply;
      return outcome === 'ok'
        ? new Response(JSON.stringify({ id: 'stub-email-id' }), { status: 200 })
        : new Response('rejected by provider', { status: 422 });
    });
  };

  it('reports success when both emails are sent', async () => {
    routeResend({ notification: 'ok', autoReply: 'ok' });
    const response = await handleContactForm(contactRequest(validSubmission), allowingEnv());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true, delivered: true });
  });

  // The bug this suite exists for: the message reached nobody, and the caller was told
  // it had been sent.
  it('reports failure when the notification email could not be sent', async () => {
    routeResend({ notification: 'fail', autoReply: 'ok' });
    const response = await handleContactForm(contactRequest(validSubmission), allowingEnv());

    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body).toMatchObject({ success: false, delivered: false });
    // The client shows a mailto fallback, so the address has to be in the copy.
    expect(body.message).toContain('contact@aswincloud.com');
  });

  it('still reports success when only the courtesy auto-reply fails', async () => {
    // The submission did arrive. Telling the visitor it failed would be false and
    // would prompt a duplicate.
    routeResend({ notification: 'ok', autoReply: 'fail' });
    const response = await handleContactForm(contactRequest(validSubmission), allowingEnv());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ success: true, delivered: true });
  });

  it('attempts the auto-reply even when the notification fails', async () => {
    // allSettled, not all: a short-circuit here would drop a send that might succeed.
    routeResend({ notification: 'fail', autoReply: 'ok' });
    await handleContactForm(contactRequest(validSubmission), allowingEnv());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports failure when the transport itself throws', async () => {
    fetchMock.mockRejectedValue(new TypeError('network unreachable'));
    const response = await handleContactForm(contactRequest(validSubmission), allowingEnv());
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ success: false, delivered: false });
  });

  it('gives the honeypot a response byte-identical to a real success', async () => {
    // Any difference in shape — including the new `delivered` field — would tell a bot
    // it had been detected.
    routeResend({ notification: 'ok', autoReply: 'ok' });
    const real = await handleContactForm(contactRequest(validSubmission), allowingEnv());
    const trapped = await handleContactForm(
      contactRequest({ ...validSubmission, company: 'AcmeBot' }),
      allowingEnv()
    );

    expect(trapped.status).toBe(real.status);
    expect(await trapped.text()).toBe(await real.text());
  });
});
