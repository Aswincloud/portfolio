/**
 * @file TumblingCube.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description A 3×3×3 cube tumbling slowly in pure CSS 3D — six 9-cell face
 *   grids rotated as one group. Purely decorative, so it is aria-hidden. All
 *   geometry and motion live in the cube-* utilities in index.css; nothing here
 *   runs per frame, so the animation stays on the compositor.
 */

import React from 'react';

// Accent cells, keyed `face-cell` (1-indexed face, 0-indexed cell). Kept as a
// literal map with literal class values: Tailwind scans source *text*, so a
// class name assembled at runtime from the accent key would never be emitted
// and the cell would silently render plain.
//
// Deliberately sparse and asymmetric — 11 of 54 — so some faces come around
// almost entirely dark and the cube reads as an object catching brand light.
const ACCENT_CLASS = {
  '1-2': 'cube-cell-em',
  '1-6': 'cube-cell-hl',
  '2-0': 'cube-cell-hl',
  '2-4': 'cube-cell-cy',
  '3-0': 'cube-cell-hl',
  '3-8': 'cube-cell-em',
  '4-3': 'cube-cell-cy',
  '4-8': 'cube-cell-hl',
  '5-1': 'cube-cell-hl',
  '6-5': 'cube-cell-em',
  '6-7': 'cube-cell-cy',
};

const FACES = [1, 2, 3, 4, 5, 6];
const CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const TumblingCube = () => {
  return (
    <div aria-hidden='true' className='cube-stage'>
      <div className='cube-shell'>
        {FACES.map(face => (
          <div key={face} className='cube-face'>
            {CELLS.map(cell => (
              <div
                key={cell}
                className={`cube-cell ${ACCENT_CLASS[`${face}-${cell}`] ?? ''}`.trimEnd()}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TumblingCube;
