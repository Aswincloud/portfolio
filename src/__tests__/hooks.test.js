/**
 * @file hooks.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Unit tests for the presentation hooks: useCountUp,
 * useThrottledScroll and useExperienceCalculator.
 *
 * All three are timer- or listener-driven, which is where the interesting
 * failures live: a count-up that ignores prefers-reduced-motion, a throttle that
 * leaves a pending timer behind on unmount, a duration string that reads "1+
 * years" when it should read "1+ year".
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from '../hooks/useCountUp.js';
import { useExperienceCalculator } from '../hooks/useExperienceCalculator.js';
import { useThrottledScroll } from '../hooks/useThrottledScroll.js';

/** Point matchMedia at a fixed answer for (prefers-reduced-motion: reduce). */
const setReducedMotion = reduce => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('useCountUp', () => {
  let rafCallbacks;

  beforeEach(() => {
    vi.useFakeTimers();
    setReducedMotion(false);
    // Drive requestAnimationFrame by hand so the climb can be stepped with an
    // explicit timestamp instead of waiting on real frames.
    rafCallbacks = [];
    vi.stubGlobal('requestAnimationFrame', cb => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Run every queued frame callback at `ts`, then the ones it queued, once. */
  const flushFrame = ts => {
    const pending = rafCallbacks;
    rafCallbacks = [];
    act(() => {
      for (const cb of pending) cb(ts);
    });
  };

  it('starts at zero while keeping the surrounding text', () => {
    const { result } = renderHook(() => useCountUp('10+', false));
    expect(result.current).toBe('0+');
  });

  it('preserves a trailing word as well as the symbol', () => {
    const { result } = renderHook(() => useCountUp('3+ years', false));
    expect(result.current).toBe('0+ years');
  });

  it('shows a non-numeric value as-is, with nothing to count', () => {
    const { result } = renderHook(() => useCountUp('Less than a month', true));
    expect(result.current).toBe('Less than a month');
  });

  it('handles an em dash placeholder without emitting NaN', () => {
    const { result } = renderHook(() => useCountUp('—', true));
    expect(result.current).toBe('—');
  });

  it('does not climb until start flips true', () => {
    const { result, rerender } = renderHook(({ start }) => useCountUp('50', start), {
      initialProps: { start: false },
    });
    expect(result.current).toBe('0');

    // Nothing was scheduled, so no frames exist to flush.
    expect(rafCallbacks).toHaveLength(0);

    rerender({ start: true });
    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(rafCallbacks.length).toBeGreaterThan(0);
  });

  it('reaches exactly the target value at the end of the climb', () => {
    const { result } = renderHook(() => useCountUp('42+', true, { duration: 1000 }));

    act(() => {
      vi.advanceTimersByTime(0);
    });
    flushFrame(0); // establishes the start timestamp
    flushFrame(1000); // t = 1

    expect(result.current).toBe('42+');
  });

  it('passes through intermediate values rather than snapping to the total', () => {
    const { result } = renderHook(() => useCountUp('100', true, { duration: 1000 }));

    act(() => {
      vi.advanceTimersByTime(0);
    });
    flushFrame(0);
    flushFrame(500);

    const midpoint = Number(result.current);
    expect(midpoint).toBeGreaterThan(0);
    expect(midpoint).toBeLessThan(100);
  });

  it('holds at zero for the configured delay before climbing', () => {
    const { result } = renderHook(() => useCountUp('20', true, { delay: 400 }));

    act(() => {
      vi.advanceTimersByTime(399);
    });
    expect(rafCallbacks).toHaveLength(0);
    expect(result.current).toBe('0');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(rafCallbacks.length).toBeGreaterThan(0);
  });

  it('strips thousands separators from the target it counts to', () => {
    const { result } = renderHook(() => useCountUp('1,500+', true, { duration: 1000 }));

    act(() => {
      vi.advanceTimersByTime(0);
    });
    flushFrame(0);
    flushFrame(1000);

    expect(result.current).toBe('1500+');
  });

  // An animation the visitor asked not to see is an accessibility failure, not a
  // cosmetic one: it can trigger symptoms for people with vestibular disorders.
  it('shows the final value immediately under prefers-reduced-motion', () => {
    setReducedMotion(true);
    const { result } = renderHook(() => useCountUp('10+', true));
    expect(result.current).toBe('10+');
    expect(rafCallbacks).toHaveLength(0);
  });

  it('animates only once, even if start toggles again', () => {
    const { result, rerender } = renderHook(({ start }) => useCountUp('30', start), {
      initialProps: { start: true },
    });

    act(() => {
      vi.advanceTimersByTime(0);
    });
    flushFrame(0);
    flushFrame(1500);
    expect(result.current).toBe('30');

    rerender({ start: false });
    rerender({ start: true });
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // No new climb was scheduled, so it stays at the final value.
    expect(result.current).toBe('30');
    expect(rafCallbacks).toHaveLength(0);
  });

  it('cancels a pending climb on unmount', () => {
    const { unmount } = renderHook(() => useCountUp('10', true, { delay: 500 }));
    unmount();

    // The delay timer must not fire into an unmounted component.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(rafCallbacks).toHaveLength(0);
  });
});

describe('useThrottledScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('collapses a burst of scroll events into a single call', () => {
    const callback = vi.fn();
    renderHook(() => useThrottledScroll(callback, 100));

    act(() => {
      for (let i = 0; i < 20; i += 1) window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('fires again once the window has elapsed', () => {
    const callback = vi.fn();
    renderHook(() => useThrottledScroll(callback, 100));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('does not call back before the delay is up', () => {
    const callback = vi.fn();
    renderHook(() => useThrottledScroll(callback, 200));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(199);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  // The listener is registered once, so a stale callback would keep being
  // invoked after a re-render — the ref exists precisely to avoid that.
  it('invokes the latest callback after a re-render', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useThrottledScroll(cb, 50), {
      initialProps: { cb: first },
    });

    rerender({ cb: second });

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(50);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('drops a pending callback when unmounted mid-window', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useThrottledScroll(callback, 100));

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    unmount();
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('stops listening after unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useThrottledScroll(callback, 100));
    unmount();

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useExperienceCalculator', () => {
  const START = '2023-01-06';

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Freeze the clock at `iso` and read the hook's output. */
  const atDate = iso => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(iso));
    const { result } = renderHook(() => useExperienceCalculator());
    return result.current;
  };

  it.each([
    // Same month as the start date: nothing has elapsed yet.
    [START, 'Less than a month'],
    ['2023-02-06', '1 month'],
    ['2023-04-06', '3 months'],
    // The singular/plural split is the easiest thing to get wrong here.
    ['2024-01-06', '1+ year'],
    ['2025-01-06', '2+ years'],
    ['2026-07-06', '3+ years'],
  ])('reads %s as "%s"', (now, expected) => {
    expect(atDate(now)).toBe(expected);
  });

  it('counts whole months, so a partial month does not round up', () => {
    // 5 days short of the 1-month mark, but the month number has changed.
    expect(atDate('2023-02-01')).toBe('1 month');
  });

  it('recalculates on its daily interval without remounting', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-11-30'));
    const { result } = renderHook(() => useExperienceCalculator());
    expect(result.current).toBe('10 months');

    // Cross into a new month while mounted; the interval should pick it up.
    act(() => {
      vi.setSystemTime(new Date('2023-12-01'));
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    });

    expect(result.current).toBe('11 months');
  });

  it('clears its interval on unmount', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useExperienceCalculator());
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
