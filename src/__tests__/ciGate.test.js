/**
 * @file ciGate.test.js
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Guards the aggregate required check in .github/workflows/ci.yml.
 *
 *   main's ruleset names one status check — "✅ CI" — instead of naming Lint /
 *   Test / Build / Security individually. That trades a manual ruleset edit per
 *   new job for a manual `needs:` edit per new job, which is only an improvement
 *   because a `needs:` list is a file in the repo and can therefore be tested.
 *   This is that test: add a job to ci.yml without wiring it into the gate and
 *   this fails, instead of the job silently not gating anything.
 *
 *   The `if: always()` assertion below is the important one. Without it the gate
 *   job is *skipped* when a dependency fails, and GitHub counts a skipped
 *   required check as a passing one — so the whole mechanism would report green
 *   on a red build. That is a failure that looks exactly like success from every
 *   angle except this assertion, which is why it is pinned rather than trusted
 *   to survive a future edit.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = parse(readFileSync(resolve(repoRoot, '.github/workflows/ci.yml'), 'utf8'));

/** The aggregate gate, by the id the ruleset's context resolves to. */
const GATE = 'ci';

describe('CI aggregate gate', () => {
  it('exists and is the check the ruleset can require by name', () => {
    expect(workflow.jobs[GATE]).toBeTruthy();
    // The ruleset matches on the *display name*, not the job id.
    expect(workflow.jobs[GATE].name).toBe('✅ CI');
  });

  it('depends on every other job in the workflow', () => {
    const others = Object.keys(workflow.jobs)
      .filter(id => id !== GATE)
      .sort();
    const needs = [...workflow.jobs[GATE].needs].sort();

    // The whole point of the aggregate: a job that isn't in this list runs on
    // every PR and blocks nothing, which reads as covered and isn't.
    expect(needs).toEqual(others);
  });

  it('runs even when a dependency fails', () => {
    // Not cosmetic. A gate without this is skipped on upstream failure, and a
    // skipped required check counts as passed — the gate would pass *because*
    // the build broke.
    expect(String(workflow.jobs[GATE].if).trim()).toBe('always()');
  });

  it('fails on every non-success upstream result', () => {
    // The failing step is the one that exits non-zero; its `if:` is the condition
    // that decides whether the gate goes red.
    const failStep = workflow.jobs[GATE].steps.find(s => /exit 1/.test(s.run ?? ''));
    expect(failStep, 'no step in the gate can fail the job').toBeTruthy();

    // Collapse the wrapped YAML scalar before matching — how it is line-broken is
    // formatting, not meaning, and prettier owns that.
    const condition = String(failStep.if).replace(/\s+/g, ' ');

    // 'skipped' matters as much as 'failure' here: `needs: setup` means one
    // early failure skips the rest, and a gate that only looked for 'failure'
    // would wave through a run where nothing but setup even executed.
    for (const result of ['failure', 'cancelled', 'skipped']) {
      expect(condition).toContain(`contains(needs.*.result, '${result}')`);
    }
  });

  it('still reports inside the merge queue', () => {
    // A required check that never reports on the merge_group event does not fail
    // the queue — it stalls it until the timeout, then fails. This trigger is
    // why pr-checks.yml's jobs cannot join the aggregate.
    expect(Object.keys(workflow.on)).toContain('merge_group');
  });
});
