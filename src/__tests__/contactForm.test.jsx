/**
 * @file contactForm.test.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Tests for the contact form's honeypot field.
 *
 * The honeypot only works if it is invisible to people and visible to bots, and it
 * only stays harmless if browsers don't autofill it — a real visitor whose browser
 * helpfully filled in "Company" would have their message silently dropped. These
 * tests pin both halves of that contract.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ContactSection from '../components/sections/ContactSection';

const getHoneypot = () => document.querySelector('input[name="company"]');

describe('contact form honeypot', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, message: 'ok' }), { status: 200 })
      );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a honeypot input that bots will see in the DOM', () => {
    render(<ContactSection />);
    expect(getHoneypot()).not.toBeNull();
  });

  it('is a real text input, not type=hidden, which bots skip', () => {
    render(<ContactSection />);
    expect(getHoneypot()).toHaveAttribute('type', 'text');
  });

  it('opts out of autofill so a browser cannot trip the trap for a real visitor', () => {
    render(<ContactSection />);
    expect(getHoneypot()).toHaveAttribute('autocomplete', 'off');
  });

  it('is hidden from assistive tech and removed from the tab order', () => {
    render(<ContactSection />);
    const honeypot = getHoneypot();
    expect(honeypot).toHaveAttribute('tabindex', '-1');
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('is not reachable by keyboard, so nobody fills it in by tabbing', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);
    const honeypot = getHoneypot();

    // Tab through more stops than the form has; the honeypot must never take focus.
    for (let i = 0; i < 15; i += 1) {
      await user.tab();
      expect(honeypot).not.toHaveFocus();
    }
  });

  it('is not offered to screen readers as a form field', () => {
    render(<ContactSection />);
    // aria-hidden on the wrapper takes the input out of the accessibility tree, so
    // the accessible-name query finds nothing.
    expect(screen.queryByRole('textbox', { name: /company/i })).toBeNull();
  });

  it('submits the honeypot empty for a genuine visitor', async () => {
    const user = userEvent.setup();
    render(<ContactSection />);

    // Target by id: "Email" also labels the click-to-copy card elsewhere in the section.
    await user.type(document.getElementById('contact-name'), 'Jane Doe');
    await user.type(document.getElementById('contact-email'), 'jane@example.com');
    await user.type(
      document.getElementById('contact-message'),
      'Hello, I would like to discuss a project with you.'
    );
    await user.click(screen.getByRole('button', { name: /send contact message/i }));

    expect(fetchMock).toHaveBeenCalled();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    // Present (so the Worker's check is exercised) but empty (so it never fires).
    expect(body).toHaveProperty('company', '');
    expect(body).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com' });
  });
});
