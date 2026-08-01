/**
 * @file cubePermutation.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Invariant tests for the cube's integer permutation model. The
 *   failure these guard against is silent and ugly: if a turn ever produced a
 *   non-lattice position, two cubies in one cell, or a non-rotation orientation,
 *   the cube would visibly tear apart or skew mid-animation. Cheap to assert
 *   here, near-impossible to catch by eye later.
 *
 *   Also covers lightPosition, the other pure function in that module. Its
 *   failure mode is the same shape — invisible in code, obvious on screen.
 */

import { describe, expect, it } from 'vitest';
import {
  IDENTITY,
  applyTurn,
  canTurnConcurrently,
  createCubies,
  layerMembers,
  lightPosition,
} from '../utils/cubePermutation.js';

const det = m =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
  m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
  m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

const multiply = (a, b) =>
  a.map(row => b[0].map((_, j) => row.reduce((sum, v, k) => sum + v * b[k][j], 0)));

const transpose = m => m[0].map((_, i) => m.map(row => row[i]));

/** Every invariant that must hold after any sequence of turns. */
const expectValid = cubies => {
  const cells = new Set();
  for (const c of cubies) {
    for (const v of c.pos) expect([-1, 0, 1]).toContain(v);
    cells.add(c.pos.join(','));
    // det 1 rules out a reflection; M·Mᵀ = I rules out any skew or scale.
    expect(det(c.orient)).toBe(1);
    expect(multiply(c.orient, transpose(c.orient))).toEqual(IDENTITY);
  }
  // 26 distinct occupied cells means no two cubies overlap.
  expect(cells.size).toBe(26);
};

describe('cube permutation model', () => {
  it('creates 26 visible cubies and omits the invisible core', () => {
    const cubies = createCubies();
    expect(cubies).toHaveLength(26);
    expect(cubies.find(c => c.id === '0,0,0')).toBeUndefined();
    expectValid(cubies);
  });

  it('puts 9 cubies in a face layer and 8 in a middle layer', () => {
    const cubies = createCubies();
    for (const axis of [0, 1, 2]) {
      expect(layerMembers(cubies, axis, -1)).toHaveLength(9);
      expect(layerMembers(cubies, axis, 1)).toHaveLength(9);
      // The middle layer is 8, not 9: the core was never created.
      expect(layerMembers(cubies, axis, 0)).toHaveLength(8);
    }
  });

  it('returns to the solved state after four identical quarter-turns', () => {
    const solved = createCubies();
    for (const axis of [0, 1, 2]) {
      for (const slice of [-1, 0, 1]) {
        let cubies = createCubies();
        for (let i = 0; i < 4; i++) cubies = applyTurn(cubies, axis, slice, 1);
        expect(cubies).toEqual(solved);
      }
    }
  });

  it('cancels a turn with its inverse', () => {
    const solved = createCubies();
    for (const axis of [0, 1, 2]) {
      let cubies = applyTurn(createCubies(), axis, 1, 1);
      expect(cubies).not.toEqual(solved);
      cubies = applyTurn(cubies, axis, 1, -1);
      expect(cubies).toEqual(solved);
    }
  });

  it('holds every invariant across a long mixed-axis sequence', () => {
    // Deterministic LCG rather than Math.random, so a failure is reproducible.
    let seed = 12345;
    const next = n => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) >>> 8) % n;

    let cubies = createCubies();
    // Checked every 25th turn rather than every turn: expectValid runs ~78
    // matrix assertions per call, so per-turn checking is thousands of times
    // slower than the turns themselves and blows the 5s test timeout. Sampling
    // still fails on any corruption, since corruption never repairs itself.
    for (let i = 1; i <= 3000; i++) {
      cubies = applyTurn(cubies, next(3), next(3) - 1, next(2) ? 1 : -1);
      if (i % 25 === 0) expectValid(cubies);
    }
    expectValid(cubies);
  });

  it('moves cubies between layers of another axis', () => {
    // This is precisely what static CSS grouping cannot represent, and the
    // reason the model exists: after an X-turn, the set of cubies in a given
    // Y-layer is different.
    const before = layerMembers(createCubies(), 1, -1)
      .map(c => c.id)
      .sort();
    const after = layerMembers(applyTurn(createCubies(), 0, 1, 1), 1, -1)
      .map(c => c.id)
      .sort();
    expect(after).not.toEqual(before);
  });

  it('permits concurrent turns only on parallel layers', () => {
    // Same axis, different slice: disjoint cubies, safe to overlap in time.
    expect(canTurnConcurrently({ axis: 1, slice: -1 }, { axis: 1, slice: 1 })).toBe(true);
    // Same layer twice: would double-transform every member.
    expect(canTurnConcurrently({ axis: 1, slice: 1 }, { axis: 1, slice: 1 })).toBe(false);
    // Different axes always intersect in a row, so never concurrent.
    expect(canTurnConcurrently({ axis: 0, slice: 1 }, { axis: 1, slice: 1 })).toBe(false);
    expect(canTurnConcurrently({ axis: 2, slice: 0 }, { axis: 1, slice: -1 })).toBe(false);
  });

  it('never lets two same-axis parallel layers share a cubie', () => {
    // The guarantee canTurnConcurrently relies on, asserted rather than assumed.
    const cubies = createCubies();
    for (const axis of [0, 1, 2]) {
      const a = new Set(layerMembers(cubies, axis, -1).map(c => c.id));
      const b = layerMembers(cubies, axis, 1).map(c => c.id);
      expect(b.some(id => a.has(id))).toBe(false);
    }
  });
});

// A stage somewhere down the page, so a test that accidentally assumed the
// viewport origin would fail rather than coincidentally pass.
const RECT = { left: 400, top: 300, width: 320, height: 320 };

/* The clamp is the whole substance of lightPosition, and it is the kind of thing
 * that breaks quietly: a wrong bound still produces a perfectly valid gradient,
 * just one painted at each tile's centre, so all 54 faces glow individually
 * instead of the cube reading as one object catching a light. Nothing throws and
 * nothing looks broken in code — it only looks wrong on screen. Hence asserting
 * the bounds here.
 */
describe('specular light position', () => {
  const X = { min: 10, max: 30 };
  const Y = { min: 6, max: 17 };

  const expectInRange = ({ x, y }) => {
    expect(x).toBeGreaterThanOrEqual(X.min);
    expect(x).toBeLessThanOrEqual(X.max);
    expect(y).toBeGreaterThanOrEqual(Y.min);
    expect(y).toBeLessThanOrEqual(Y.max);
  };

  it('stays in range for a pointer far outside the stage on every side', () => {
    // Thousands of pixels out, and negative — the pointer is tracked globally
    // while the band is on screen, so it genuinely does reach these positions.
    const far = [
      [-9000, 300],
      [9000, 300],
      [400, -9000],
      [400, 9000],
      [-9000, -9000],
      [9000, 9000],
    ];
    for (const [cx, cy] of far) expectInRange(lightPosition(cx, cy, RECT));
  });

  it('never puts the light near a tile centre, even at the stage centre', () => {
    // Centre pointer gives the middle of each range. That must still be nowhere
    // near 50% — a highlight at the middle of every sticker is the failure this
    // clamp exists to prevent.
    const centre = lightPosition(560, 460, RECT);
    expect(centre).toEqual({ x: 20, y: 11.5 });
    expect(centre.x).toBeLessThan(35);
    expect(centre.y).toBeLessThan(35);
  });

  it('leans the light toward the pointer', () => {
    const left = lightPosition(RECT.left - 200, 460, RECT);
    const right = lightPosition(RECT.left + RECT.width + 200, 460, RECT);
    const above = lightPosition(560, RECT.top - 200, RECT);
    const below = lightPosition(560, RECT.top + RECT.height + 200, RECT);

    expect(left.x).toBeLessThan(right.x);
    expect(above.y).toBeLessThan(below.y);
    // And it actually travels, rather than sitting clamped at one value.
    expect(right.x - left.x).toBeGreaterThan(10);
    expect(below.y - above.y).toBeGreaterThan(5);
  });

  it('returns a usable position for an unlaid-out stage', () => {
    // getBoundingClientRect on a display:none element, or one measured before
    // paint, is all zeroes. Dividing by that yields NaN, which would serialise
    // into the custom property as garbage and blank the hotspot on all 54 faces.
    const zero = lightPosition(560, 460, { left: 0, top: 0, width: 0, height: 0 });
    expect(Number.isFinite(zero.x)).toBe(true);
    expect(Number.isFinite(zero.y)).toBe(true);
    expectInRange(zero);
  });
});
