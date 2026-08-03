/**
 * Lighthouse CI gate.
 *
 * This is .cjs rather than .json because the thresholds below are judgement
 * calls and they need their reasoning next to them — JSON has nowhere to put
 * it. lhci resolves lighthouserc.{js,cjs,json,yml} equally; .cjs specifically
 * because package.json sets "type": "module".
 *
 * Every assertion here is `error`. They were all `warn`, which meant the job
 * reported success at any score — it would have gone green at 45. It also
 * printed nothing at all when everything passed, so there was no number in the
 * log to notice drifting either.
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      // Three runs, not one. A single sample makes the gate a coin flip on the
      // noisier metrics: across five local runs LCP landed anywhere from 520ms
      // to 1318ms and TBT from 0ms to 59ms, on identical bytes. Asserting on
      // the median of three is what makes it safe to enforce rather than warn.
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        // Median of three, not the default `optimistic` (which takes the best
        // run and would quietly launder exactly the variance above).
        //
        // 0.9 against a measured 97: deliberately loose. Performance is the one
        // category that depends on how busy the runner is, and a gate that
        // fires on a noisy neighbour trains people to re-run it until green,
        // which is worse than no gate. 7 points of headroom, and the score is
        // now printed on every failure so drift is visible before it trips.
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median' }],

        // These three sit at 1.0 with zero spread across every run, because
        // none of them depend on timing — they read the DOM and the response
        // headers. Nothing is gained by leaving slack under a number that does
        // not move, so they are pinned at exactly where they are: any drop is a
        // real regression, not weather.
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 1 }],
        'categories:seo': ['error', { minScore: 1 }],

        // WCAG 2.5.3, asserted explicitly because the category score cannot
        // see it. Lighthouse gives this audit `weight: 0, group: "hidden"`, so
        // it contributes nothing: the nav wordmark failed it with score 0 while
        // accessibility reported a clean 100. It is the only zero-weight
        // accessibility audit on this page that is applicable and can fail, so
        // pinning it is the whole of the gap rather than an arbitrary pick.
        'label-content-name-mismatch': ['error', { minScore: 1 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
