/**
 * @file cubePermutation.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Integer permutation model for a 3×3×3 cube whose layers turn on
 *   all three axes. Pure math, no DOM, no timers — the renderer reads this state
 *   and the scheduler mutates it, so the tricky part is unit-testable on its own.
 *
 *   Why integers: a mixed-axis cube cannot be expressed as static CSS groups. A
 *   Y-turn keeps every cubie in its own horizontal slice, but an X-turn moves
 *   cubies *between* slices, so any fixed grouping stops matching reality after
 *   the first cross-axis move and the cube tears apart. Instead every cubie owns
 *   its position and orientation, both exact integers, and a completed turn is
 *   *baked* into them. Nothing accumulates float error, so the cube is as exact
 *   after ten thousand turns as after one.
 */

// The three 90° rotation matrices, in CSS's coordinate system.
//
// These are NOT the textbook right-handed matrices: in CSS, +y points DOWN the
// screen, which flips the sense of the X and Z rotations. Using a textbook
// matrix here would leave the baked integer state disagreeing with the pixels
// the visitor just watched land, and the cube would visibly jump after a turn.
// Verified against the browser's own DOMMatrix for all three axes, both
// directions — see cubePermutation.test.js.
const ROTATION = {
  // rotateX(90deg): y → z, z → −y
  0: [
    [1, 0, 0],
    [0, 0, -1],
    [0, 1, 0],
  ],
  // rotateY(90deg): x → −z, z → x
  1: [
    [0, 0, 1],
    [0, 1, 0],
    [-1, 0, 0],
  ],
  // rotateZ(90deg): x → y, y → −x
  2: [
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, 1],
  ],
};

export const IDENTITY = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/** Axis index → the CSS rotate function that turns about it. */
export const AXIS_FN = ['rotateX', 'rotateY', 'rotateZ'];

/** For a rotation matrix the transpose is the inverse, so this is a −90° turn. */
const transpose = m => m[0].map((_, i) => m.map(row => row[i]));

const multiply = (a, b) =>
  a.map(row => b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)));

const applyTo = (m, v) => m.map(row => row.reduce((sum, x, i) => sum + x * v[i], 0));

/**
 * Build the 26 visible cubies at their solved positions. Coordinates are −1, 0,
 * or 1 on each axis; the 27th (0,0,0) is the core, which is never visible and so
 * is never created.
 *
 * @returns {Array<{id: string, pos: number[], orient: number[][]}>}
 */
export const createCubies = () => {
  const cubies = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        // id is the *solved* position and never changes, so React keys stay
        // stable while pos moves. Keying by live position would make React
        // recycle DOM nodes between cubies mid-turn.
        cubies.push({ id: `${x},${y},${z}`, pos: [x, y, z], orient: IDENTITY });
      }
    }
  }
  return cubies;
};

/**
 * The cubies currently in a layer, found by live position rather than by any
 * stored grouping. This recomputation is what makes mixed-axis turns correct: a
 * cubie an earlier turn moved into a different slice is simply picked up by
 * whichever layer now contains it.
 *
 * @param {Array} cubies
 * @param {number} axis 0 = x, 1 = y, 2 = z
 * @param {number} slice −1, 0, or 1
 */
export const layerMembers = (cubies, axis, slice) => cubies.filter(c => c.pos[axis] === slice);

/**
 * Bake a completed quarter-turn into integer state, returning new cubie objects
 * for the ones that moved (so React sees a changed reference).
 *
 * @param {Array} cubies
 * @param {number} axis 0 = x, 1 = y, 2 = z
 * @param {number} slice −1, 0, or 1
 * @param {number} direction +1 for 90°, −1 for −90°
 * @returns {Array} the full cubie list, with turned members replaced
 */
export const applyTurn = (cubies, axis, slice, direction) => {
  const m = direction === 1 ? ROTATION[axis] : transpose(ROTATION[axis]);
  return cubies.map(c =>
    c.pos[axis] === slice ? { ...c, pos: applyTo(m, c.pos), orient: multiply(m, c.orient) } : c
  );
};

/**
 * Whether two layers can turn at the same time.
 *
 * Layers on the same axis are either identical or parallel, and parallel layers
 * share no cubie, so they are safe. Layers on *different* axes always intersect
 * in a row of cubies — and a shared cubie would be handed two conflicting
 * transforms at once, which tears the cube. So only same-axis, different-slice
 * pairs may overlap in time.
 *
 * @returns {boolean} true when both may run concurrently
 */
export const canTurnConcurrently = (a, b) => a.axis === b.axis && a.slice !== b.slice;

/* Bounds for the specular highlight, as percentages inside a sticker.
 *
 * Both ranges stay well clear of 50%, and that is the whole point. The hotspot
 * is painted once per sticker in its own coordinate space, so wherever it sits,
 * it sits there on all 54 faces at once. Near a corner that reads as light
 * glancing across the cube; further in, every tile gets a matching centred blob
 * and the cube reads as a grid of glowing buttons rather than one lit object.
 *
 * The bounds come from sweeping the range against the real cube at its shipped
 * size, not against a mock-up: 36%/21% and beyond are visibly blobby, 32%/18% is
 * borderline, 28%/16% and below read as light. Scale mattered more than expected
 * — an isolated large sticker tolerates a much more central hotspot than a 42px
 * one seen among 53 others, so the bound measured on a prototype was too loose.
 *
 * The Y range is tighter than the X range because the cube's ground shadow
 * anchors it from below, so a light drifting downward fights the shading that
 * is already there.
 */
const LIGHT_X = { min: 10, max: 30 };
const LIGHT_Y = { min: 6, max: 17 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Map a pointer position to the specular highlight's position inside a sticker.
 *
 * Pure, and deliberately here rather than in the component: it is the one part
 * of the pointer feature with a correctness condition worth testing, and it
 * needs no DOM to test — just a rect-shaped object.
 *
 * The pointer's offset from the stage's centre is normalised to −1…1 and then
 * mapped across the ranges above, so the light tracks direction rather than
 * absolute position: the highlight leans the way the cursor is, and stays in
 * bounds no matter how far away the cursor actually is.
 *
 * @param {number} clientX pointer X in viewport coordinates
 * @param {number} clientY pointer Y in viewport coordinates
 * @param {{left: number, top: number, width: number, height: number}} rect
 *   the stage's bounding box
 * @returns {{x: number, y: number}} percentages, always within the ranges above
 */
export const lightPosition = (clientX, clientY, rect) => {
  // A zero-sized rect means the stage is not laid out (display:none, or measured
  // before paint). Dividing by it yields Infinity/NaN, which would serialise
  // into the custom property as garbage and blank the hotspot, so fall back to
  // the centre of the range instead.
  const nx = rect.width > 0 ? (clientX - (rect.left + rect.width / 2)) / rect.width : 0;
  const ny = rect.height > 0 ? (clientY - (rect.top + rect.height / 2)) / rect.height : 0;

  const spread = (n, { min, max }) => {
    const mid = (min + max) / 2;
    return clamp(mid + clamp(n, -1, 1) * ((max - min) / 2), min, max);
  };

  return { x: spread(nx, LIGHT_X), y: spread(ny, LIGHT_Y) };
};
