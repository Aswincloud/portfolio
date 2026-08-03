/**
 * @file contactLimits.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description The contact form's length rules, shared by the form that enforces
 *   them and the Worker that rejects violations.
 *
 *   These lived only in worker.js, which meant the form could describe rules it
 *   had no way to apply. It did exactly that: the error panel listed "Name:
 *   letters and spaces (2–100 characters)" and "Message: 10–1000 characters"
 *   while the inputs carried nothing but `required`, so a nine-character message
 *   passed the client check, cost a network round trip, and came back as a red
 *   box stating a rule the browser could have enforced instantly.
 *
 *   Two copies of a number that must agree is the same problem as the two route
 *   lists in routeMeta.js, and gets the same answer: one list, imported by both
 *   sides. The form now derives its minlength/maxlength and its visible copy from
 *   these values, so the advice cannot drift from the enforcement.
 *
 *   This module and not worker.js because the Worker is 640 lines of route
 *   handling and email templates: importing it to reach three numbers would pull
 *   all of that into the browser bundle. The dependency points the other way —
 *   worker.js imports this, which is a leaf with no imports of its own.
 *
 *   Keep it free of JSX and of any React import, for the same reason as
 *   routeMeta.js: worker.js loads it in the Workers runtime.
 */

/**
 * Field lengths, measured after trimming — which is what the Worker validates,
 * so the browser has to agree or `   ` would pass one and fail the other.
 *
 * `email.max` is the RFC 5321 maximum forward-path length. There is no minimum:
 * the regex already requires something@something.something.
 */
export const LIMITS = {
  name: { min: 2, max: 100 },
  message: { min: 10, max: 1000 },
  email: { max: 254 },
};

/**
 * The rule text shown in the form's validation panel.
 *
 * Interpolated from LIMITS rather than written out, so editing a bound updates
 * the advice. The wording stays close to what the Worker's own 400 responses
 * say, so a visitor who somehow sees both doesn't get two different stories.
 */
export const LIMIT_HINTS = {
  name: `${LIMITS.name.min}–${LIMITS.name.max} characters`,
  email: 'a valid email address',
  message: `${LIMITS.message.min}–${LIMITS.message.max} characters`,
};
