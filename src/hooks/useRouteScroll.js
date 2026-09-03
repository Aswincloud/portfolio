/**
 * @file useRouteScroll.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Decides where the viewport lands after a client-side navigation:
 *   at a hashed section, offset for the fixed header, or at the top of the new
 *   page when there is no hash.
 *
 *   The second case is the one that used to be missing. BrowserRouter swaps the
 *   route's element and leaves the scroll position where it was, so the footer
 *   link to /privacy — pressed from the very bottom of a long page — rendered the
 *   policy already scrolled to its last paragraph, and the wordmark back to /
 *   landed somewhere in the middle of the home page. Data routers ship a
 *   <ScrollRestoration> for this; the plain <BrowserRouter> used here does not.
 */

import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Keep in step with HEADER_OFFSET in usePageTransitions.js and
// `scroll-padding-top` in index.css; all three describe the same fixed header,
// and this is the one that applies to hashed URLs.
export const HEADER_OFFSET = 80;

// How many frames to wait for a hash target that isn't in the DOM yet — a
// lazily-loaded route, or a section that hasn't painted on a cold load.
const MAX_HASH_ATTEMPTS = 20;

export const useRouteScroll = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const isFirstRun = useRef(true);

  useEffect(() => {
    const firstRun = isFirstRun.current;
    isFirstRun.current = false;

    // A hashed URL — from the 404 page, the footer, or an external link. The
    // target may not exist yet at the moment the hash is set, so wait for it via
    // rAF and then scroll with the fixed-header offset. Runs on the first render
    // too: this, not `scroll-padding-top`, is what places a cold-loaded hash.
    if (hash) {
      let raf = 0;
      const attempt = (tries = 0) => {
        const el = document.getElementById(hash.slice(1));
        if (el) {
          window.scrollTo({ top: el.offsetTop - HEADER_OFFSET, behavior: 'smooth' });
        } else if (tries < MAX_HASH_ATTEMPTS) {
          raf = requestAnimationFrame(() => attempt(tries + 1));
        }
      };
      raf = requestAnimationFrame(() => attempt());
      return () => cancelAnimationFrame(raf);
    }

    // No hash. On the first render the browser owns the position — a reload
    // restores where the visitor was, and forcing 0 here would undo that. On a
    // back/forward (POP) it likewise restores what it saved for that entry, so
    // only a fresh PUSH or REPLACE means "new page, start at the top".
    if (firstRun || navigationType === 'POP') return undefined;

    // `instant`, not the default: index.css sets `scroll-behavior: smooth` on
    // <html>, and a smooth scroll from the bottom of one page to the top of a
    // different one animates through content the visitor never asked to see.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    return undefined;
  }, [pathname, hash, navigationType]);
};

export default useRouteScroll;
