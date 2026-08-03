/**
 * @file useDismissable.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Closes a transient overlay the three ways a visitor expects:
 *   Escape, a click outside it, and — because it is fixed over the page — by
 *   locking the scroll underneath while it is open.
 *
 *   The mobile nav sheet had none of them. Verified in a real browser at 390px:
 *   Escape left it open, a click on the page behind left it open, and a scroll
 *   gesture moved the page to y=600 with the sheet still pinned over the top of
 *   it. The only way out was finding the toggle again, which is the one control
 *   the sheet itself can cover.
 *
 *   Scroll lock via `overflow: hidden` on <html> rather than <body>: the body is
 *   what `overflow-x-hidden` and the section backgrounds are set on, and
 *   overwriting its inline overflow fights those. It also has to restore the
 *   *previous* value rather than clearing to '', because clearing would drop a
 *   value some other component set.
 *
 *   No focus trap. A trap is the right call for a modal dialog that must not be
 *   escaped, but this sheet is a nav list in the document flow with the page
 *   still behind it — trapping focus in it would mean a Tab from the last link
 *   cycling forever instead of reaching the page, and getting a trap subtly
 *   wrong is worse than not having one. Escape plus an outside click is what
 *   this pattern needs.
 */

import { useEffect } from 'react';

/**
 * @param {boolean} isOpen - Whether the overlay is currently shown.
 * @param {() => void} onDismiss - Called on Escape or an outside click. Must be
 *   stable (useCallback or a setState updater) — it is in the effect's deps, so a
 *   new identity each render rebinds the listeners.
 * @param {React.RefObject<HTMLElement>} containerRef - The element that counts as
 *   "inside". A click within it, or on the toggle if the toggle is inside it, does
 *   not dismiss.
 * @param {{ lockScroll?: boolean }} [options] - `lockScroll` freezes the page
 *   behind the overlay. Defaults to true.
 */
export function useDismissable(isOpen, onDismiss, containerRef, { lockScroll = true } = {}) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = event => {
      if (event.key === 'Escape') onDismiss();
    };

    // `pointerdown` rather than `click`: a click fires after the pointer is
    // released, so a visitor who presses outside and drags back in would still
    // dismiss. pointerdown also beats the React onClick that opened the sheet
    // to the punch, which is why the toggle has to be inside containerRef —
    // otherwise opening it would immediately register as an outside press.
    const onPointerDown = event => {
      if (!containerRef.current?.contains(event.target)) onDismiss();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);

    // Capture what was there so the cleanup restores it instead of clearing to
    // '' — the latter would discard a value set elsewhere.
    const root = document.documentElement;
    const previousOverflow = lockScroll ? root.style.overflow : null;
    if (lockScroll) root.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      if (lockScroll) root.style.overflow = previousOverflow;
    };
  }, [isOpen, onDismiss, containerRef, lockScroll]);
}

export default useDismissable;
