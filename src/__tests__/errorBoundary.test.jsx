/**
 * @file errorBoundary.test.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Unit tests for the error boundaries and the global error handler.
 *
 * These are the components that run only when something else has already broken,
 * which is exactly why they need tests: a boundary that throws while rendering
 * its own fallback escalates a contained failure into a blank page, and nothing
 * in normal use exercises that path.
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary.jsx';
import GlobalErrorHandler from '../components/ErrorBoundary/GlobalErrorHandler.jsx';
import SectionErrorBoundary from '../components/ErrorBoundary/SectionErrorBoundary.jsx';

/** A child that throws on demand, so a boundary has something to catch. */
const Boom = ({ when = true, message = 'child exploded' }) => {
  if (when) throw new Error(message);
  return <p>child rendered</p>;
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  // React logs every caught error, and the boundaries console.group() their own
  // report. Silence both; the assertions below check behaviour, not noise.
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'group').mockImplementation(() => {});
  vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('all good')).toBeInTheDocument();
  });

  it('renders the fallback instead of propagating the error', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    expect(screen.queryByText('child rendered')).not.toBeInTheDocument();
  });

  it('labels the failure with the component name it was given', () => {
    render(
      <ErrorBoundary fallbackComponent='Projects'>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('Projects Error')).toBeInTheDocument();
  });

  it("says 'Application Error' at app level", () => {
    render(
      <ErrorBoundary level='app'>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText('Application Error')).toBeInTheDocument();
  });

  it('shows an error id so a report can be correlated with the log', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/^Error ID: .+/)).toBeInTheDocument();
  });

  it('persists the caught error for later inspection', () => {
    render(
      <ErrorBoundary>
        <Boom message='stored please' />
      </ErrorBoundary>
    );
    const errors = JSON.parse(localStorage.getItem('portfolio_errors') || '[]');
    expect(errors.at(-1).message).toBe('stored please');
    expect(errors.at(-1).componentStack).toBeTruthy();
  });

  it('caps the stored history at 50 entries', () => {
    localStorage.setItem(
      'portfolio_errors',
      JSON.stringify(Array.from({ length: 50 }, (_, i) => ({ message: `old-${i}` })))
    );

    render(
      <ErrorBoundary>
        <Boom message='newest' />
      </ErrorBoundary>
    );

    const errors = JSON.parse(localStorage.getItem('portfolio_errors'));
    expect(errors).toHaveLength(50);
    expect(errors[0].message).toBe('old-1');
    expect(errors.at(-1).message).toBe('newest');
  });

  it('still renders the fallback when the error cannot be persisted', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    // The point of the boundary is the fallback; logging is best-effort.
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  // Chunk load and network failures are transient by nature, so they are graded
  // below a genuine code fault — a fatal grade would page for a flaky CDN.
  it.each([
    ['ChunkLoadError', 'warning'],
    ['Error', 'error'],
  ])('grades a %s as %s severity', (name, expected) => {
    const Throwing = () => {
      const error = new Error('boom');
      error.name = name;
      throw error;
    };

    render(
      <ErrorBoundary>
        <Throwing />
      </ErrorBoundary>
    );

    const errors = JSON.parse(localStorage.getItem('portfolio_errors'));
    expect(errors.at(-1).severity).toBe(expected);
  });

  it('grades a network message as a warning regardless of error name', () => {
    render(
      <ErrorBoundary>
        <Boom message='Network request failed' />
      </ErrorBoundary>
    );
    const errors = JSON.parse(localStorage.getItem('portfolio_errors'));
    expect(errors.at(-1).severity).toBe('warning');
  });

  // `throw` takes any value. A bare string used to reach
  // `error.message.includes(...)` inside componentDidCatch, and a throw from there
  // escapes the boundary — React then has no fallback to commit and the visitor
  // gets a blank page instead of the recoverable error screen.
  it.each([
    ['a bare string', 'a bare string', 'a bare string'],
    ['a plain object', { code: 500 }, '[object Object]'],
    ['null', null, 'null'],
    ['a number', 42, '42'],
  ])('renders the fallback when a component throws %s', (_label, thrown, expectedMessage) => {
    const Throwing = () => {
      throw thrown;
    };

    render(
      <ErrorBoundary>
        <Throwing />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    const errors = JSON.parse(localStorage.getItem('portfolio_errors') || '[]');
    expect(errors.at(-1).message).toBe(expectedMessage);
  });

  it('reveals and hides the technical details on request', () => {
    render(
      <ErrorBoundary>
        <Boom message='inspect me' />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/show technical details/i));
    expect(screen.getByText('Error Details')).toBeInTheDocument();
    expect(screen.getByText('inspect me')).toBeInTheDocument();

    fireEvent.click(screen.getByText(/hide technical details/i));
    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
  });

  it('copies a report containing the id and message to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    render(
      <ErrorBoundary>
        <Boom message='copy me' />
      </ErrorBoundary>
    );

    const errorId = screen.getByText(/^Error ID: /).textContent.replace('Error ID: ', '');
    fireEvent.click(screen.getByText('Copy Error'));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const report = writeText.mock.calls[0][0];
    expect(report).toContain('copy me');
    expect(report).toContain(errorId);
    await waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
  });

  it('does not break the fallback when the clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Copy Error'));

    await waitFor(() => expect(console.warn).toHaveBeenCalled());
    // Still the fallback, and still offering the other recovery actions.
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });

  it('re-renders the children after a successful retry', async () => {
    vi.useFakeTimers();
    let shouldThrow = true;
    const Flaky = () => {
      if (shouldThrow) throw new Error('first attempt');
      return <p>recovered</p>;
    };

    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>
    );
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));
    // The retry deliberately waits ~1s before re-rendering.
    expect(screen.getByText('Retrying...')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100);
    });

    expect(screen.getByText('recovered')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('offers a support address as the last resort', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByRole('link', { name: /contact@aswincloud\.com/ })).toHaveAttribute(
      'href',
      'mailto:contact@aswincloud.com'
    );
  });
});

describe('SectionErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    render(
      <SectionErrorBoundary sectionName='Skills'>
        <p>skills content</p>
      </SectionErrorBoundary>
    );
    expect(screen.getByText('skills content')).toBeInTheDocument();
  });

  it('names the failing section in the fallback', () => {
    render(
      <SectionErrorBoundary sectionName='Skills'>
        <Boom />
      </SectionErrorBoundary>
    );
    expect(screen.getByText('Skills Section Error')).toBeInTheDocument();
  });

  it('falls back to a placeholder name when none is given', () => {
    render(
      <SectionErrorBoundary>
        <Boom />
      </SectionErrorBoundary>
    );
    expect(screen.getByText('Unknown Section Error')).toBeInTheDocument();
  });

  it('retries the section on request', () => {
    let shouldThrow = true;
    const Flaky = () => {
      if (shouldThrow) throw new Error('boom');
      return <p>section recovered</p>;
    };

    render(
      <SectionErrorBoundary sectionName='Skills'>
        <Flaky />
      </SectionErrorBoundary>
    );

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByText('section recovered')).toBeInTheDocument();
  });

  // Skipping is what keeps one broken section from blocking the rest of the page,
  // so it must not re-mount the child that just threw.
  it('replaces the section with a skipped notice and does not re-mount the child', () => {
    render(
      <SectionErrorBoundary sectionName='Skills'>
        <Boom message='always throws' />
      </SectionErrorBoundary>
    );

    fireEvent.click(screen.getByText('Skip Section'));

    expect(screen.getByText(/Skills section was skipped due to an error/)).toBeInTheDocument();
    // Neither the fallback nor the child — a child that always throws would
    // otherwise take the page down when skip re-rendered it.
    expect(screen.queryByText('Skills Section Error')).not.toBeInTheDocument();
    expect(screen.queryByText('child rendered')).not.toBeInTheDocument();
  });

  it('logs the section name with the error', () => {
    render(
      <SectionErrorBoundary sectionName='Projects'>
        <Boom message='section boom' />
      </SectionErrorBoundary>
    );

    const logged = JSON.stringify(console.error.mock.calls);
    expect(logged).toContain('Section Error in Projects');
  });
});

describe('GlobalErrorHandler', () => {
  it('renders its children', () => {
    render(
      <GlobalErrorHandler>
        <p>wrapped</p>
      </GlobalErrorHandler>
    );
    expect(screen.getByText('wrapped')).toBeInTheDocument();
  });

  it('records an unhandled rejection', () => {
    render(
      <GlobalErrorHandler>
        <p>wrapped</p>
      </GlobalErrorHandler>
    );

    const event = new Event('unhandledrejection');
    event.reason = new Error('rejected promise');
    act(() => {
      window.dispatchEvent(event);
    });

    const errors = JSON.parse(localStorage.getItem('portfolio_errors') || '[]');
    expect(errors.at(-1)).toMatchObject({
      type: 'unhandled_promise_rejection',
      message: 'rejected promise',
    });
  });

  it('records an uncaught error with its source location', () => {
    render(
      <GlobalErrorHandler>
        <p>wrapped</p>
      </GlobalErrorHandler>
    );

    const event = new Event('error');
    event.error = new Error('uncaught boom');
    event.filename = 'app.js';
    event.lineno = 42;
    event.colno = 7;
    act(() => {
      window.dispatchEvent(event);
    });

    const errors = JSON.parse(localStorage.getItem('portfolio_errors') || '[]');
    const uncaught = errors.find(e => e.type === 'uncaught_javascript_error');
    expect(uncaught).toMatchObject({
      message: 'uncaught boom',
      filename: 'app.js',
      lineno: 42,
      colno: 7,
    });
  });

  it('caps the stored history at 50 entries', () => {
    localStorage.setItem(
      'portfolio_errors',
      JSON.stringify(Array.from({ length: 50 }, (_, i) => ({ message: `old-${i}` })))
    );

    render(
      <GlobalErrorHandler>
        <p>wrapped</p>
      </GlobalErrorHandler>
    );

    const event = new Event('unhandledrejection');
    event.reason = new Error('newest');
    act(() => {
      window.dispatchEvent(event);
    });

    const errors = JSON.parse(localStorage.getItem('portfolio_errors'));
    expect(errors).toHaveLength(50);
    expect(errors[0].message).toBe('old-1');
  });

  // A handler still attached after unmount keeps writing to storage for a tree
  // that no longer exists, and stacks a duplicate on every remount.
  it('detaches its listeners on unmount', () => {
    const { unmount } = render(
      <GlobalErrorHandler>
        <p>wrapped</p>
      </GlobalErrorHandler>
    );
    unmount();

    const event = new Event('unhandledrejection');
    event.reason = new Error('after unmount');
    act(() => {
      window.dispatchEvent(event);
    });

    expect(localStorage.getItem('portfolio_errors')).toBeNull();
  });
});
