/**
 * @file useErrorReporting.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Unit tests for the useErrorReporting hook.
 *
 * The hook is the shared write path for every error the app records, so the
 * things worth locking in are: it renders at all (it used to throw on the first
 * render — see the ordering note in the hook), the ring buffer never grows past
 * its cap, and a corrupt or unavailable localStorage degrades instead of taking
 * the calling component down with it.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ERROR_CATEGORIES, ERROR_SEVERITY, useErrorReporting } from '../hooks/useErrorReporting.js';

const STORAGE_KEY = 'portfolio_errors';

const stored = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  // The hook console.group()s every report; silence it without losing the
  // ability to assert on what was written.
  vi.spyOn(console, 'group').mockImplementation(() => {});
  vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useErrorReporting', () => {
  // Regression test. The mount effect used to sit above the useCallback it
  // depends on, so React read the dependency array while the const was still in
  // its temporal dead zone and the first render threw ReferenceError — the hook
  // was unusable, and nothing caught it because nothing rendered it.
  it('mounts without throwing', () => {
    expect(() => renderHook(() => useErrorReporting())).not.toThrow();
  });

  it('starts from an empty history with zeroed stats', () => {
    const { result } = renderHook(() => useErrorReporting());
    expect(result.current.errorStats).toEqual({
      totalErrors: 0,
      lastError: null,
      errorsByCategory: {},
      errorsBySeverity: {},
    });
  });

  it('reads existing history on mount and aggregates it', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { message: 'a', category: 'network', severity: 'warning' },
        { message: 'b', category: 'network', severity: 'error' },
        { message: 'c', category: 'component', severity: 'error' },
      ])
    );

    const { result } = renderHook(() => useErrorReporting());

    expect(result.current.errorStats.totalErrors).toBe(3);
    expect(result.current.errorStats.errorsByCategory).toEqual({ network: 2, component: 1 });
    expect(result.current.errorStats.errorsBySeverity).toEqual({ warning: 1, error: 2 });
    expect(result.current.errorStats.lastError.message).toBe('c');
  });

  it('defaults missing category and severity rather than counting undefined', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ message: 'bare' }]));
    const { result } = renderHook(() => useErrorReporting());
    expect(result.current.errorStats.errorsByCategory).toEqual({ unknown: 1 });
    expect(result.current.errorStats.errorsBySeverity).toEqual({ error: 1 });
  });

  it('survives a corrupt history instead of throwing on mount', () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    const { result } = renderHook(() => useErrorReporting());
    expect(result.current.errorStats.totalErrors).toBe(0);
    expect(console.warn).toHaveBeenCalled();
  });

  it('persists a reported error and reflects it in the stats', () => {
    const { result } = renderHook(() => useErrorReporting());

    act(() => {
      result.current.reportError(new Error('boom'), {
        severity: ERROR_SEVERITY.FATAL,
        category: ERROR_CATEGORIES.NETWORK,
        context: { where: 'test' },
        tags: ['unit'],
      });
    });

    const [entry] = stored();
    expect(entry.message).toBe('boom');
    expect(entry.severity).toBe('fatal');
    expect(entry.category).toBe('network');
    expect(entry.context).toEqual({ where: 'test' });
    expect(result.current.errorStats.totalErrors).toBe(1);
    expect(result.current.errorStats.errorsBySeverity).toEqual({ fatal: 1 });
  });

  it('returns the stored record so callers can correlate on the id', () => {
    const { result } = renderHook(() => useErrorReporting());
    let returned;
    act(() => {
      returned = result.current.reportError(new Error('boom'));
    });
    expect(returned.id).toBe(stored()[0].id);
    expect(returned.id).toBeTruthy();
  });

  it('defaults to component/error when no options are given', () => {
    const { result } = renderHook(() => useErrorReporting());
    act(() => {
      result.current.reportError(new Error('boom'));
    });
    const [entry] = stored();
    expect(entry.category).toBe(ERROR_CATEGORIES.COMPONENT);
    expect(entry.severity).toBe(ERROR_SEVERITY.ERROR);
  });

  it('handles a thrown value with no message', () => {
    const { result } = renderHook(() => useErrorReporting());
    act(() => {
      result.current.reportError({});
    });
    expect(stored()[0].message).toBe('Unknown error');
  });

  it('writes nothing to the console when silent', () => {
    const { result } = renderHook(() => useErrorReporting());
    act(() => {
      result.current.reportError(new Error('quiet'), { silent: true });
    });
    expect(console.group).not.toHaveBeenCalled();
    // Still recorded — silent suppresses the log, not the report.
    expect(stored()).toHaveLength(1);
  });

  // The cap is the only thing keeping an error loop from filling the origin's
  // storage quota, at which point every subsequent write throws.
  it('keeps the history at 100 entries and drops the oldest', () => {
    const { result } = renderHook(() => useErrorReporting());

    act(() => {
      for (let i = 0; i < 105; i += 1) {
        result.current.reportError(new Error(`error-${i}`), { silent: true });
      }
    });

    const history = stored();
    expect(history).toHaveLength(100);
    expect(history[0].message).toBe('error-5');
    expect(history.at(-1).message).toBe('error-104');
  });

  it('reuses one session id across reports', () => {
    const { result } = renderHook(() => useErrorReporting());
    act(() => {
      result.current.reportError(new Error('one'), { silent: true });
      result.current.reportError(new Error('two'), { silent: true });
    });
    const [first, second] = stored();
    expect(first.sessionId).toBe(second.sessionId);
    expect(sessionStorage.getItem('portfolio_session_id')).toBe(first.sessionId);
  });

  it('gives each report a distinct id', () => {
    const { result } = renderHook(() => useErrorReporting());
    act(() => {
      result.current.reportError(new Error('one'), { silent: true });
      result.current.reportError(new Error('two'), { silent: true });
    });
    const [first, second] = stored();
    expect(first.id).not.toBe(second.id);
  });

  it('does not propagate a storage failure to the caller', () => {
    const { result } = renderHook(() => useErrorReporting());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => {
      act(() => {
        result.current.reportError(new Error('boom'), { silent: true });
      });
    }).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });

  // reportError runs because something already went wrong, so a throw from
  // inside it turns a handled error into an unhandled one. The session id is
  // written before the try/catch around the history, which is how a
  // storage-refusing browser used to break the whole call.
  it('still reports the error in its stats when storage refuses the write', () => {
    const { result } = renderHook(() => useErrorReporting());
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    act(() => {
      result.current.reportError(new Error('boom'), { silent: true });
    });

    expect(result.current.errorStats.totalErrors).toBe(1);
    expect(result.current.errorStats.lastError.message).toBe('boom');
  });

  it('starts a fresh buffer when the stored history is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, 'not json');
    const { result } = renderHook(() => useErrorReporting());

    act(() => {
      result.current.reportError(new Error('after corruption'), { silent: true });
    });

    const history = stored();
    expect(history).toHaveLength(1);
    expect(history[0].message).toBe('after corruption');
  });

  it('clears the history and resets the stats', () => {
    const { result } = renderHook(() => useErrorReporting());
    act(() => {
      result.current.reportError(new Error('boom'), { silent: true });
    });
    expect(result.current.errorStats.totalErrors).toBe(1);

    act(() => {
      result.current.clearErrorHistory();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(result.current.errorStats).toEqual({
      totalErrors: 0,
      lastError: null,
      errorsByCategory: {},
      errorsBySeverity: {},
    });
  });

  it('returns an empty history rather than throwing on corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{oops');
    const { result } = renderHook(() => useErrorReporting());
    expect(result.current.getErrorHistory()).toEqual([]);
  });

  it('records a tracked user action without writing it to the error history', () => {
    const { result } = renderHook(() => useErrorReporting());
    let action;
    act(() => {
      action = result.current.trackUserAction('clicked_contact', { section: 'hero' });
    });
    expect(action.action).toBe('clicked_contact');
    expect(action.context).toEqual({ section: 'hero' });
    expect(stored()).toEqual([]);
  });
});
