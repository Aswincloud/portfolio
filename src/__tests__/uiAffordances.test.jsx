/**
 * @file uiAffordances.test.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the interaction affordances a visitor reaches for without
 *   thinking, each of which was measured absent in a real browser at 390px before
 *   this suite existed: dismissing an open overlay with Escape or a press outside
 *   it, not being able to scroll the page underneath one, a form that enforces the
 *   rules it prints, and focus landing on the outcome panel after a submit.
 *
 *   These are the failures that don't throw. Every one of them leaves a page that
 *   renders perfectly and behaves wrongly, which is why they survived this long —
 *   so the tests assert on behaviour (press Escape, is it gone?) rather than on
 *   the presence of a handler.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navigation from '../components/Navigation.jsx';
import ContactSection from '../components/sections/ContactSection.jsx';
import { LIMITS } from '../data/contactLimits.js';

// Navigation reads matchMedia through motion and useThrottledScroll; jsdom has no
// implementation, so give it one that answers "no preference".
beforeEach(() => {
  window.matchMedia ??= query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
  document.documentElement.style.overflow = '';
});

const renderNav = () =>
  render(
    <MemoryRouter>
      <Navigation />
    </MemoryRouter>
  );

/** Opens the mobile sheet and returns the toggle. */
const openMenu = async () => {
  const toggle = screen.getByRole('button', { name: /open menu/i });
  fireEvent.click(toggle);
  await waitFor(() => expect(screen.getByRole('button', { name: /close menu/i })).toBeTruthy());
  return toggle;
};

describe('mobile menu dismissal', () => {
  it('closes on Escape', async () => {
    renderNav();
    await openMenu();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('button', { name: /close menu/i })).toBeNull());
    expect(screen.getByRole('button', { name: /open menu/i })).toBeTruthy();
  });

  it('closes on a press outside the nav', async () => {
    renderNav();
    await openMenu();

    // pointerdown, not click: the listener uses pointerdown so a press-outside
    // then drag-back-inside still dismisses.
    fireEvent.pointerDown(document.body);

    await waitFor(() => expect(screen.queryByRole('button', { name: /close menu/i })).toBeNull());
  });

  it('does not close on a press inside the nav', async () => {
    renderNav();
    await openMenu();

    // The toggle lives inside the ref'd <nav>, which is what stops the very press
    // that opened the sheet from being read as an outside press.
    fireEvent.pointerDown(screen.getByRole('button', { name: /close menu/i }));

    expect(screen.getByRole('button', { name: /close menu/i })).toBeTruthy();
  });

  it('locks page scroll while open and restores it on close', async () => {
    renderNav();
    await openMenu();

    expect(document.documentElement.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(document.documentElement.style.overflow).toBe(''));
  });

  it('names the sheet it controls', async () => {
    renderNav();
    const toggle = screen.getByRole('button', { name: /open menu/i });
    // aria-expanded alone says "something expanded" without saying what.
    expect(toggle.getAttribute('aria-controls')).toBe('mobile-menu');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /close menu/i }).getAttribute('aria-expanded')
      ).toBe('true')
    );
    expect(document.getElementById('mobile-menu')).toBeTruthy();
  });
});

describe('contact form enforces the rules it prints', () => {
  const fill = ({ name, email, message }) => {
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: name } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: email } });
    fireEvent.change(screen.getByLabelText(/^message$/i), { target: { value: message } });
  };

  it('carries the Worker limits as native constraints', () => {
    render(<ContactSection />);

    const name = screen.getByLabelText(/^name$/i);
    const message = screen.getByLabelText(/^message$/i);

    // The panel used to advertise these numbers while the inputs enforced nothing.
    expect(name.getAttribute('minlength')).toBe(String(LIMITS.name.min));
    expect(name.getAttribute('maxlength')).toBe(String(LIMITS.name.max));
    expect(message.getAttribute('minlength')).toBe(String(LIMITS.message.min));
    expect(message.getAttribute('maxlength')).toBe(String(LIMITS.message.max));
    expect(screen.getByLabelText(/^email$/i).getAttribute('maxlength')).toBe(
      String(LIMITS.email.max)
    );
  });

  it('rejects a too-short message without a network call', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<ContactSection />);

    fill({ name: 'Ada Lovelace', email: 'ada@example.com', message: 'too short' });
    fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form'));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    // The point of the fix: the rule is stated on screen, so applying it should
    // not cost a round trip.
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('rejects a message that is only whitespace past the minimum', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<ContactSection />);

    // 20 spaces: long enough to pass a naive length check, empty once trimmed —
    // and the Worker trims before validating.
    fill({ name: 'Ada Lovelace', email: 'ada@example.com', message: ' '.repeat(20) });
    fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form'));

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('derives the printed rules from the shared limits', () => {
    render(<ContactSection />);
    // The hint under the textarea quotes the same bounds the input enforces, so
    // the two cannot drift.
    expect(
      screen.getByText(new RegExp(`${LIMITS.message.min}–${LIMITS.message.max} characters`))
    ).toBeTruthy();
  });

  it('counts down only near the ceiling, and stays quiet in the middle', () => {
    render(<ContactSection />);
    const message = screen.getByLabelText(/^message$/i);

    fireEvent.change(message, { target: { value: 'a'.repeat(200) } });
    expect(screen.queryByText(/left$/)).toBeNull();

    fireEvent.change(message, { target: { value: 'a'.repeat(LIMITS.message.max - 40) } });
    expect(screen.getByText('40 left')).toBeTruthy();
  });

  it('says how much more is needed while below the minimum', () => {
    render(<ContactSection />);
    fireEvent.change(screen.getByLabelText(/^message$/i), { target: { value: 'hi' } });
    expect(screen.getByText(`${LIMITS.message.min - 2} more characters`)).toBeTruthy();
  });

  it('moves focus to the outcome panel so it cannot be off-screen', async () => {
    render(<ContactSection />);

    fill({ name: 'Ada Lovelace', email: 'ada@example.com', message: 'nope' });
    fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form'));

    // role='alert' is announced, but a sighted keyboard visitor got nothing: the
    // panel renders above the fields, so on a phone it can be off-screen while
    // you are still looking at the button you pressed.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('alert')));
    expect(screen.getByRole('alert').getAttribute('tabindex')).toBe('-1');
  });

  it('keeps the global focus ring on its fields', () => {
    render(<ContactSection />);
    // focus:outline-none here was the only one in the codebase, and it replaced a
    // 2px outline with a 1px ring at 40% opacity on the controls where keyboard
    // focus matters most.
    for (const label of [/^name$/i, /^email$/i, /^message$/i]) {
      expect(screen.getByLabelText(label).className).not.toContain('focus:outline-none');
    }
  });
});
