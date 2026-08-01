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
