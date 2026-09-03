/**
 * @file contactSubmit.test.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Tests for what the contact form tells the visitor after submitting.
 *
 * The bug these exist to prevent: a failed send reported as "Message sent
 * successfully" with the form cleared. The visitor then has no copy of what they
 * wrote and no reason to follow up, and the message is simply lost. So the
 * assertions here are mostly negative — after every failure path, the success
 * text must be absent and the typed text must still be there.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ContactSection from '../components/sections/ContactSection';

const NAME = 'Jane Doe';
const EMAIL = 'jane@example.com';
const MESSAGE = 'Hello, I would like to discuss a project with you.';

/** Target by id: "Email" also labels the click-to-copy card elsewhere in the section. */
const fields = () => ({
  name: document.getElementById('contact-name'),
  email: document.getElementById('contact-email'),
  message: document.getElementById('contact-message'),
});

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('contact form submission outcomes', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.spyOn(globalThis, 'fetch');
    // The component logs failures; keep the test output readable.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Fill in valid values and submit. */
  const submit = async () => {
    const user = userEvent.setup();
    render(<ContactSection />);
    const f = fields();
    await user.type(f.name, NAME);
    await user.type(f.email, EMAIL);
    await user.type(f.message, MESSAGE);
    await user.click(screen.getByRole('button', { name: /send message/i }));
    return user;
  };

  const successText = () => screen.queryByText(/message sent successfully/i);
  const failureAlert = () => screen.queryByText(/wasn't sent|wasn’t sent/i);
  const mailtoLink = () =>
    document.querySelector('a[href^="mailto:contact@aswincloud.com?"]') ?? null;

  describe('when the API confirms delivery', () => {
    it('reports success and clears the form', async () => {
      fetchMock.mockResolvedValue(json({ success: true, delivered: true, message: 'ok' }));
      await submit();

      await waitFor(() => expect(successText()).not.toBeNull());
      expect(failureAlert()).toBeNull();
      expect(fields().message).toHaveValue('');
    });
  });

  // Each of these is a case where the previous implementation, or a plausible
  // simplification of it, would have claimed success.
  describe.each([
    {
      label: 'the network never completed (offline, DNS, CORS)',
      // This is the exact case the old code treated as success.
      arrange: mock => mock.mockRejectedValue(new TypeError('Failed to fetch')),
    },
    {
      label: 'the Worker could not deliver the email (502)',
      arrange: mock =>
        mock.mockResolvedValue(json({ success: false, delivered: false, message: 'nope' }, 502)),
    },
    {
      label: 'the Worker errored (500)',
      arrange: mock => mock.mockResolvedValue(json({ success: false, message: 'boom' }, 500)),
    },
    {
      label: 'the response was not JSON at all (proxy error page)',
      arrange: mock =>
        mock.mockResolvedValue(
          new Response('<html>502 Bad Gateway</html>', {
            status: 502,
            headers: { 'Content-Type': 'text/html' },
          })
        ),
    },
    {
      label: 'the response was 200 but success was false',
      arrange: mock => mock.mockResolvedValue(json({ success: false, message: 'nope' }, 200)),
    },
  ])('when $label', ({ arrange }) => {
    // Braces, not a concise body: returning the mock would hand Vitest a thenable
    // that resolves to the configured rejection, failing the hook itself.
    beforeEach(() => {
      arrange(fetchMock);
    });

    it('does not claim the message was sent', async () => {
      await submit();
      await waitFor(() => expect(failureAlert()).not.toBeNull());
      expect(successText()).toBeNull();
    });

    it('keeps what the visitor typed', async () => {
      await submit();
      await waitFor(() => expect(failureAlert()).not.toBeNull());
      // Losing the text is what makes the false success actively harmful.
      expect(fields().message).toHaveValue(MESSAGE);
      expect(fields().name).toHaveValue(NAME);
      expect(fields().email).toHaveValue(EMAIL);
    });

    it('offers the direct email address as a fallback', async () => {
      await submit();
      await waitFor(() => expect(failureAlert()).not.toBeNull());
      expect(mailtoLink()).not.toBeNull();
    });

    it('announces the failure to assistive tech', async () => {
      await submit();
      await waitFor(() => expect(failureAlert()).not.toBeNull());
      expect(failureAlert().closest('[role="alert"]')).not.toBeNull();
    });

    it('re-enables the submit button so a retry is possible', async () => {
      await submit();
      await waitFor(() => expect(failureAlert()).not.toBeNull());
      expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled();
    });
  });

  describe('the mailto fallback', () => {
    beforeEach(() => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    });

    it("carries the visitor's message across so nothing is retyped", async () => {
      await submit();
      await waitFor(() => expect(mailtoLink()).not.toBeNull());

      const url = new URL(mailtoLink().getAttribute('href'));
      expect(url.searchParams.get('body')).toBe(MESSAGE);
      expect(url.searchParams.get('subject')).toContain(NAME);
    });

    it('encodes text that would otherwise break out of the mailto', async () => {
      const user = userEvent.setup();
      render(<ContactSection />);
      const f = fields();
      await user.type(f.name, NAME);
      await user.type(f.email, EMAIL);
      // `&` and `?` unencoded would terminate the body and be read as further
      // mailto headers — i.e. the visitor's own text could inject a cc/bcc.
      await user.type(f.message, 'A & B ? cc=someone@evil.test — does encoding hold up');
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => expect(mailtoLink()).not.toBeNull());
      const href = mailtoLink().getAttribute('href');
      const url = new URL(href);
      expect(url.searchParams.get('body')).toBe(
        'A & B ? cc=someone@evil.test — does encoding hold up'
      );
      // Exactly two params: the raw `&`/`?` did not create extra ones.
      expect([...url.searchParams.keys()]).toEqual(['subject', 'body']);
    });
  });

  describe('when the input itself was rejected', () => {
    it('shows the validation checklist rather than the direct-email fallback', async () => {
      // A 400 means editing the form can succeed, so pointing at a mailto would be
      // the wrong advice.
      fetchMock.mockResolvedValue(json({ success: false, message: 'Invalid email address' }, 400));
      await submit();

      await waitFor(() => expect(screen.queryByText(/please check/i)).not.toBeNull());
      expect(successText()).toBeNull();
      expect(failureAlert()).toBeNull();
      expect(mailtoLink()).toBeNull();
    });

    it('does not call the API when a required field is empty', async () => {
      const user = userEvent.setup();
      render(<ContactSection />);
      await user.type(fields().name, NAME);
      await user.click(screen.getByRole('button', { name: /send message/i }));

      // The inputs still carry `required` (checkValidity reports it), but the
      // form is noValidate, so handleSubmit runs and answers with its own
      // field-level messages instead of the browser's bubble. Either way nothing
      // was sent and nothing claimed success.
      expect(document.querySelector('form').checkValidity()).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(successText()).toBeNull();
      expect(document.getElementById('contact-email-error').textContent).toMatch(
        /please enter your email address/i
      );
    });
  });
});
