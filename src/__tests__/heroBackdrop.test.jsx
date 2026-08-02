/**
 * @file heroBackdrop.test.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the hero die map, which is four divs of pure CSS and so
 *   has no behaviour to test — but two specific ways to break silently.
 *
 *   The first is paint order. The die map works by painting an opaque grid of
 *   channels *over* the aurora glows, so light survives only in the tile-shaped
 *   gaps. Move it above the glows and it covers nothing; the tiles disappear and
 *   the page still renders, still passes every other test, and simply looks like
 *   it did before. There is no error to catch, which is exactly why it is pinned
 *   here.
 *
 *   The second is the layer being dropped in a refactor. Same failure mode as
 *   the prerender plugin's throw: silent, invisible, and only noticed later.
 */
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnimatedMeshGradient from '../components/background/AnimatedMeshGradient';

const backdrop = () => render(<AnimatedMeshGradient />).container.firstChild;

describe('hero die map', () => {
  it('renders the die map and all three of its layers', () => {
    const root = backdrop();
    const map = root.querySelector('.die-map');
    expect(map, '.die-map is missing from the hero backdrop').toBeTruthy();
    for (const layer of ['die-grid', 'die-lines', 'die-center-damp']) {
      expect(map.querySelector(`.${layer}`), `.${layer} is missing`).toBeTruthy();
    }
  });

  it('paints the die map after the glows that light it', () => {
    // The whole effect is paint order — see the file header. Compare document
    // position rather than array indices so this keeps holding if the layers
    // are moved into a wrapper or a component of their own.
    const root = backdrop();
    const map = root.querySelector('.die-map');
    const glows = [...root.querySelectorAll('.animate-aurora')];
    expect(glows.length).toBeGreaterThan(0);
    for (const glow of glows) {
      // DOCUMENT_POSITION_* is a bitmask, hence the &.
      const relation = glow.compareDocumentPosition(map);
      expect(
        relation & Node.DOCUMENT_POSITION_FOLLOWING,
        'die map paints before a glow'
      ).toBeTruthy();
    }
  });

  it('stays decorative — the whole backdrop is hidden from assistive tech', () => {
    const root = backdrop();
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.textContent).toBe('');
  });

  it('adds nothing that animates, so the compositor keeps its budget', () => {
    // Three versions of this layer animated and all three cost frames; the
    // shipped one reuses the auroras instead. A future edit that reintroduces
    // an animation here should have to measure it first — see the die-map block
    // in index.css for the numbers.
    const map = backdrop().querySelector('.die-map');
    const classes = [...map.querySelectorAll('*')].flatMap(el => [...el.classList]);
    expect(classes.filter(c => c.startsWith('animate-'))).toEqual([]);
  });
});
