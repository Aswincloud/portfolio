/**
 * @file microInteractions.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Shared motion/react variants for button press feedback.
 *
 *   This file used to carry a ripple implementation, shake/pulse/magnetic/tilt
 *   helpers, and a dozen variants — all with zero callers. The ripple in
 *   particular was a second, unused implementation of the one in
 *   hooks/useRipple.jsx, which is what every button on the site actually calls.
 */

// The only interaction variants anything consumes (HeroSection's three CTAs).
// A spring rather than a duration so an interrupted hover settles instead of
// snapping — damping 17 lands just shy of a visible overshoot.
export const buttonMotion = {
  hover: { scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 17 } },
  tap: { scale: 0.98, transition: { type: 'spring', stiffness: 400, damping: 17 } },
};

export default buttonMotion;
