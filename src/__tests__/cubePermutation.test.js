/**
 * @file cubePermutation.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Invariant tests for the cube's integer permutation model. The
 *   failure these guard against is silent and ugly: if a turn ever produced a
 *   non-lattice position, two cubies in one cell, or a non-rotation orientation,
 *   the cube would visibly tear apart or skew mid-animation. Cheap to assert
 *   here, near-impossible to catch by eye later.
 */

import { describe, expect, it } from 'vitest';
import {
  IDENTITY,
  applyTurn,
  canTurnConcurrently,
  createCubies,
  layerMembers,
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
