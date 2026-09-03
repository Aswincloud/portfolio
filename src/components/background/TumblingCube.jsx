/**
 * @file TumblingCube.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description A 3×3×3 cube of 26 separate cubies that tumbles slowly while its
 *   layers turn, on all three axes. Purely decorative, so it is aria-hidden.
 *
 *   The animation itself is entirely CSS: each turn is one compositor transform
 *   with a transition, and the constant tumble is a keyframe on the shell. JS
 *   only *schedules* — one setTimeout every ~1.4s picks a layer and a second one
 *   bakes the integer result when the turn lands. That is under one wake-up per
 *   second, versus 60 for a requestAnimationFrame driver, and it is why this is
 *   affordable: commit f5613cb removed ~370 lines of decorative rAF loops from
 *   this repo for hurting scroll performance, and a per-frame driver here would
 *   be the same mistake. Nothing here runs per frame.
 *
 *   Turn state lives in a ref and is written straight to the DOM rather than
 *   held in React state: a re-render of 26 cubies every 1.4s would be pointless
 *   work for something that is only ever a transform change.
 */

import React, { useEffect, useRef } from 'react';
import {
  AXIS_FN,
  applyTurn,
  canTurnConcurrently,
  createCubies,
  layerMembers,
} from '../../utils/cubePermutation.js';

// Coloured stickers, keyed `cubieId|face` — a single face of a single cubie, not
// the whole cubie. Keying by cubie alone tints every outward face it has, which
// on a corner is three at once: measured 19 coloured stickers where 8 were
// intended, and the cube read as a toy.
//
// Keyed by the cubie's *solved* coordinate so the sticker travels with the cubie
// as turns move it — that is the point of separate cubies over painted-on cells:
// you can watch a sticker change layers.
//
// Literal class values, not assembled at runtime: Tailwind scans source text, so
// a computed class name would never be emitted and the sticker would render
// plain. Same constraint as the edge/dot values in AboutSection's FOCUS cards.
const ACCENTS = {
  '-1,-1,1|z1': 'cube-sticker-em',
  '1,-1,1|x1': 'cube-sticker-cy',
  '-1,1,-1|y1': 'cube-sticker-em',
  '1,1,1|z1': 'cube-sticker-cy',
  '0,-1,1|z1': 'cube-sticker-hl',
  '-1,1,1|x-1': 'cube-sticker-hl',
  '1,0,-1|x1': 'cube-sticker-em',
  '0,1,-1|y1': 'cube-sticker-cy',
};

// The six candidate faces of a cubie: [axis, sign, css transform]. Only the ones
// pointing away from the cube's centre are actually rendered — see the filter in
// the JSX. The interior is covered by the cubie's own dark background instead,
// which is worth 20 fps (156 composited layers versus 54); the reasoning is in
// the cube-cubie comment in index.css.
const CUBIE_FACES = [
  ['z', 1, 'translateZ(var(--cubie-half))'],
  ['z', -1, 'rotateY(180deg) translateZ(var(--cubie-half))'],
  ['x', 1, 'rotateY(90deg) translateZ(var(--cubie-half))'],
  ['x', -1, 'rotateY(-90deg) translateZ(var(--cubie-half))'],
  ['y', -1, 'rotateX(90deg) translateZ(var(--cubie-half))'],
  ['y', 1, 'rotateX(-90deg) translateZ(var(--cubie-half))'],
];

const TURN_MS = 620; // must match --cube-turn-ms in index.css
const GAP_MS = 780; // rest between scheduling attempts

// The solved layout, used only to render the initial markup. It is a module
// constant rather than component state because the rendered element list never
// changes: turns move cubies by rewriting each node's transform, so React
// renders exactly once. The live, mutating positions live in a ref.
const INITIAL_CUBIES = createCubies();

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Position a cubie from its integer state.
 *
 * Order matters and is the crux of the whole approach. The pending turn is the
 * *outermost* transform, so it rotates the cubie about the cube's centre rather
 * than its own — which is exactly what a layer turn is. That means the 9 cubies
 * of a layer sweep together without being DOM siblings, so no re-parenting is
 * ever needed and layers can cut across each other freely.
 */
const cubieTransform = (pos, orient, pending) => {
  const step = 'var(--cubie-step)';
  const t = (v, axis) => (v === 0 ? '0px' : `calc(${v} * ${step} * ${axis})`);
  const translate = `translate3d(${t(pos[0], 1)}, ${t(pos[1], 1)}, ${t(pos[2], 1)})`;
  // orient is a rotation matrix; matrix3d is column-major.
  const o = orient;
  const matrix =
    `matrix3d(${o[0][0]},${o[1][0]},${o[2][0]},0,` +
    `${o[0][1]},${o[1][1]},${o[2][1]},0,` +
    `${o[0][2]},${o[1][2]},${o[2][2]},0,0,0,0,1)`;
  return `${pending} ${translate} ${matrix}`;
};

const TumblingCube = () => {
  const shellRef = useRef(null);
  const cubiesRef = useRef(INITIAL_CUBIES);
  const nodesRef = useRef(new Map());

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const shell = shellRef.current;
    if (!shell) return undefined;

    const active = [];
    let timer = null;
    let stopped = false;
    // Deterministic rotation through the 9 layers rather than random: a fixed
    // cycle guarantees every layer gets used and no two consecutive picks
    // collide, without needing to retry.
    let step = 0;

    const paint = cubie => {
      const node = nodesRef.current.get(cubie.id);
      if (!node) return;
      node.style.transform = cubieTransform(cubie.pos, cubie.orient, node.dataset.pending || '');
    };

    const startTurn = () => {
      if (stopped) return;

      const axis = step % 3;
      const slice = (Math.floor(step / 3) % 3) - 1;
      step = (step + 1) % 9;
      const move = { axis, slice };

      // Different-axis layers share cubies, so refuse the move rather than hand
      // a cubie two transforms at once. Skipping is invisible — the next tick is
      // under a second away.
      if (!active.every(a => canTurnConcurrently(a, move))) return;

      const direction = step % 2 === 0 ? 1 : -1;
      const members = layerMembers(cubiesRef.current, axis, slice);
      const pending = `${AXIS_FN[axis]}(${direction * 90}deg)`;

      active.push(move);

      // Animate: set the pending prefix and let the CSS transition run it.
      for (const cubie of members) {
        const node = nodesRef.current.get(cubie.id);
        if (!node) continue;
        node.dataset.pending = pending;
        node.style.transition = `transform var(--cube-turn-ms) cubic-bezier(0.45, 0.05, 0.3, 1)`;
        paint(cubie);
      }

      // Land: bake the turn into integers, drop the prefix, repaint with the
      // transition off so the identical pose does not animate back.
      window.setTimeout(() => {
        if (stopped) return;
        cubiesRef.current = applyTurn(cubiesRef.current, axis, slice, direction);
        const turned = new Set(members.map(m => m.id));
        for (const cubie of cubiesRef.current) {
          if (!turned.has(cubie.id)) continue;
          const node = nodesRef.current.get(cubie.id);
          if (!node) continue;
          node.dataset.pending = '';
          node.style.transition = 'none';
          paint(cubie);
        }
        active.splice(active.indexOf(move), 1);
      }, TURN_MS);
    };

    const tick = () => {
      // No work at all while the tab is hidden — a background tab should cost
      // nothing, and browsers throttle timers there anyway, which would leave a
      // turn visually mid-flight.
      if (!document.hidden) startTurn();
      timer = window.setTimeout(tick, TURN_MS + GAP_MS);
    };

    // Only run while the cube is actually on screen. The band sits mid-page, so
    // for most of a visit this observer keeps the scheduler idle.
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries[0]?.isIntersecting;
        if (visible && timer === null) {
          tick();
        } else if (!visible && timer !== null) {
          window.clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(shell);

    return () => {
      stopped = true;
      observer.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div aria-hidden='true' className='cube-stage'>
      <div ref={shellRef} className='cube-shell'>
        {INITIAL_CUBIES.map(cubie => {
          const [x, y, z] = cubie.pos;
          return (
            <div
              key={cubie.id}
              ref={node => {
                if (node) nodesRef.current.set(cubie.id, node);
                else nodesRef.current.delete(cubie.id);
              }}
              className='cube-cubie'
              style={{ transform: cubieTransform(cubie.pos, cubie.orient, '') }}
            >
              {CUBIE_FACES.filter(([axis, sign]) => {
                // Keep only faces on the cube's surface — those pointing outward
                // from the centre on their own axis. A cubie has at most three.
                const coord = axis === 'x' ? x : axis === 'y' ? y : z;
                return coord === sign;
              }).map(([axis, sign, transform]) => {
                const accent = ACCENTS[`${cubie.id}|${axis}${sign}`];
                return (
                  <div
                    key={`${axis}${sign}`}
                    className={`cube-sticker ${accent ?? ''}`.trimEnd()}
                    style={{ transform }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TumblingCube;
