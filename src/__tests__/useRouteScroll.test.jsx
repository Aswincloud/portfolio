/**
 * @file useRouteScroll.test.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards where the viewport lands after a client-side navigation.
 *
 *   The case that matters most is the one that used to be missing: a PUSH to a
 *   route with no hash must start at the top. Without it the footer's link to
 *   /privacy, pressed from the bottom of the home page, rendered the policy
 *   already scrolled to its end. The other cases pin down what must *not*
 *   change — a hashed URL still lands on its section, the first render and a
 *   back/forward leave the position to the browser.
 */

import { useEffect } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useRouteScroll, HEADER_OFFSET } from '../hooks/useRouteScroll.js';

// Exposes the router's navigate() to the test so a navigation can be issued
// after mount — the hook has to see a *change*, not just an initial location.
// Handed out from an effect rather than assigned during render, which the
// react-hooks rules (rightly) flag as a side effect.
let navigate;
const Probe = () => {
  useRouteScroll();
  const nav = useNavigate();
  useEffect(() => {
    navigate = nav;
  }, [nav]);
  return null;
};

const mount = (initialEntries = ['/']) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path='*' element={<Probe />} />
      </Routes>
    </MemoryRouter>
  );

// jsdom logs "Not implemented: window.scrollTo" rather than scrolling, so the
// assertion is on the call, not on scrollY. spyOn on an already-spied method
// hands back the same spy with its call history intact, so clear it explicitly
// or the second test sees the first test's calls.
let scrollTo;
beforeEach(() => {
  scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  scrollTo.mockClear();
  navigate = undefined;
});

describe('useRouteScroll', () => {
  it('does not touch the scroll position on the first render', () => {
    mount(['/']);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('scrolls to the top on a PUSH to a route without a hash', () => {
    mount(['/']);
    act(() => navigate('/privacy'));

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('scrolls to the top again on the way back to the home route', () => {
    mount(['/privacy']);
    act(() => navigate('/'));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('leaves a back/forward (POP) navigation to the browser', () => {
    mount(['/']);
    act(() => navigate('/privacy'));
    expect(scrollTo).toHaveBeenCalledTimes(1);

    act(() => navigate(-1));
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('scrolls a hashed URL to its section with the header offset', async () => {
    const target = document.createElement('section');
    target.id = 'projects';
    document.body.appendChild(target);

    try {
      mount(['/privacy']);
      act(() => navigate('/#projects'));

      await waitFor(() => expect(scrollTo).toHaveBeenCalled());
      expect(scrollTo).toHaveBeenCalledWith({
        top: target.offsetTop - HEADER_OFFSET,
        behavior: 'smooth',
      });
      // The hash branch owns this navigation: no competing scroll to 0.
      expect(scrollTo).toHaveBeenCalledTimes(1);
    } finally {
      target.remove();
    }
  });

  it('keeps waiting for a hash target that renders late', async () => {
    mount(['/privacy']);
    act(() => navigate('/#contact'));
    expect(scrollTo).not.toHaveBeenCalled();

    // Appears a few frames later, as a lazily-rendered route's section would.
    const target = document.createElement('section');
    target.id = 'contact';
    document.body.appendChild(target);

    try {
      await waitFor(() =>
        expect(scrollTo).toHaveBeenCalledWith({
          top: target.offsetTop - HEADER_OFFSET,
          behavior: 'smooth',
        })
      );
    } finally {
      target.remove();
    }
  });
});
