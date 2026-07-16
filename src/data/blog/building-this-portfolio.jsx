/**
 * @file building-this-portfolio.jsx
 * @author Aswin
 * @copyright © 2025 Aswin. All rights reserved.
 * @description Blog post: how this portfolio was rebuilt — the real story of
 *   pairing with an AI agent, the bugs, and the workflow that kept it honest.
 */

import React from 'react';
import { H2, H3, P, UL, LI, Code, A, Callout } from '../../components/blog/Prose.jsx';

export const meta = {
  slug: 'building-this-portfolio',
  title: 'How this portfolio actually got built',
  description:
    'The real story of rebuilding aswincloud.com — pairing with an AI coding agent, the bugs it caught (and caused), and the ship-gate workflow that kept it all honest.',
  date: '2026-07-16',
  readingTime: '8 min read',
  tags: ['Portfolio', 'React', 'AI-assisted', 'Engineering'],
};

export const Body = () => (
  <>
    <P>
      The site you are reading this on is the third or fourth version of my portfolio, and the first
      one I am genuinely happy with. This post is the honest account of how it came together — not a
      tidy after-the-fact narrative, but what actually happened: a lot of iteration, a few bugs I
      caused, a couple the tooling caught before you ever saw them, and a workflow that kept the
      whole thing from turning into a mess.
    </P>
    <P>
      I built it pairing with <A href='https://claude.com/claude-code'>Claude Code</A>, an AI coding
      agent, running in my terminal. I want to be upfront about that because the interesting part
      isn&apos;t &quot;AI wrote my website&quot; — it didn&apos;t, not on its own — it&apos;s the
      loop we settled into, where I made the calls and it did the legwork, and neither of us was
      allowed to claim something worked without proving it.
    </P>

    <H2>The starting point: too plain</H2>
    <P>
      The previous version leaned hard into austere, editorial minimalism — lots of whitespace, thin
      type, almost no color. On paper that reads as &quot;tasteful.&quot; In practice it read as
      unfinished. So the brief for the rebuild was a dark, systems-engineer aesthetic: deep navy
      canvas, an emerald-to-cyan accent, monospace for the technical labels, and just enough motion
      to feel alive without tipping into a gimmick.
    </P>
    <P>
      The design system is hand-built — no UI kit, no template. Everything is Tailwind CSS v4 with a
      small set of custom tokens (<Code>--color-ink</Code>, <Code>--color-surface</Code>, a{' '}
      <Code>brand-*</Code> emerald ramp) and a handful of <Code>@utility</Code> helpers so the class
      names stay readable. React 19, Vite, Motion for animation, deployed to Cloudflare Workers with
      a self-hosted contact API and live chat.
    </P>

    <H2>The motion I swore was already there (it wasn&apos;t)</H2>
    <P>
      Here is my favorite mistake from the whole build. The hero has an aurora background — three
      big, soft glows drifting behind the headline. When I was asked whether the site had any live
      animation, I checked the code, saw the drift keyframes were applied, and confidently said yes,
      it&apos;s animating.
    </P>
    <P>
      Then I actually looked. And it wasn&apos;t — not perceptibly. The glows <em>were</em> moving,
      about 40 pixels over six seconds, but they are 670-pixel-wide blobs blurred by 40+ pixels at
      very low opacity. A faint, heavily-blurred cloud that large drifting that slowly is below the
      threshold your eye can register. The transform value was changing; nothing you could see was.
    </P>
    <Callout>
      &quot;It animates&quot; and &quot;you can see it move&quot; are not the same claim. The first
      is about the code; the second is about a human looking at a screen. On a portfolio, only the
      second one counts.
    </Callout>
    <P>
      So I fixed it for real: bumped the glow opacity, tightened the blur, widened the drift, and
      sped the loop up so the background genuinely breathes. Then I added a shimmer that sweeps a
      soft highlight across the word &quot;faster&quot; every few seconds, and — the detail people
      seem to like most — the stat tiles now count up from zero when they scroll into view.
    </P>

    <H3>The count-up that counted too fast</H3>
    <P>
      That count-up shipped with a subtle bug I only caught because I was watching the real page.
      The numbers started climbing the instant the component mounted, with an ease curve that
      front-loads the motion — so by the time the tile finished fading in, the count was already
      ~84% done. You&apos;d see <Code>9 → 10</Code> and nothing before it. The fix was to hold the
      climb until the entrance animation finishes, then count at an even pace. Now you actually see{' '}
      <Code>1, 2, 4, 6, 8, 10</Code> tick past.
    </P>

    <H2>The bug I&apos;d written and never noticed</H2>
    <P>
      The site has a live chat widget. Open it, and — as I discovered when someone pointed it out —
      you couldn&apos;t click outside to close it. There was already an outside-click handler in the
      page; it just never fired. It was checking for a CSS class (
      <Code>.woot-widget-bubble--expanded</Code>) that doesn&apos;t exist in the version of the chat
      SDK the site actually runs. So the guard bailed out on every click and the close never
      happened.
    </P>
    <P>
      I only found the true cause by inspecting the live widget&apos;s DOM instead of trusting the
      class name I&apos;d assumed. The real open/closed signal was a <Code>woot--hide</Code> class
      on a different element entirely. Two-line fix, but it would have stayed broken indefinitely if
      I&apos;d kept reasoning from the class name I <em>expected</em> to be there.
    </P>

    <H2>Dependencies that don&apos;t just &quot;bump&quot;</H2>
    <P>
      Two dependency upgrades looked routine and weren&apos;t. The icon library removed all of its
      brand logos in a major version (GitHub, LinkedIn — gone, for trademark reasons), so a plain
      version bump broke the build with missing-export errors. The fix was to replace those two with
      small inline-SVG components that keep the same call signature, so nothing else in the code had
      to change.
    </P>
    <P>
      The linter upgrade to ESLint 10 was worse: it required a newer hooks plugin that turns on
      strict new rules by default, which flagged perfectly good code — including the count-up hook I
      just described. There the right move wasn&apos;t to force it through or silently rewrite
      working code; it was to surface the trade-off, then opt out of exactly the two new opinionated
      rules while keeping the ones that catch real hook bugs.
    </P>
    <Callout>
      A green CI check is necessary, not sufficient. A dependency can install clean, pass every
      automated gate, and still be the wrong thing to merge — because &quot;it builds&quot; says
      nothing about whether the API you rely on still exists.
    </Callout>

    <H2>The workflow that kept it honest</H2>
    <P>
      None of the above would have stayed sane without a boring, strict loop around every change:
    </P>
    <UL>
      <LI>
        <strong>Make the change, then prove it.</strong> Every visual change got built and driven in
        a real headless browser — screenshotted, pixel-checked, the actual behavior observed. Not
        &quot;the test passes,&quot; but &quot;here is the frame where the number is
        mid-climb.&quot;
      </LI>
      <LI>
        <strong>A ship-gate before anything merges.</strong> Lint with zero warnings allowed,
        formatting, a copyright-header check, the unit tests, a security audit, and a production
        build — all green, locally, before a pull request even opens.
      </LI>
      <LI>
        <strong>One change, one PR.</strong> The shimmer, the chat fix, the perf pass, the
        accessibility pass — each is its own small, reviewable pull request rather than one giant
        &quot;redesign&quot; commit. Easier to review, easier to revert, easier to explain.
      </LI>
      <LI>
        <strong>Correct the record when wrong.</strong> The aurora story is the template: claim,
        check, discover the claim was wrong, say so, fix it. That only works if being wrong is cheap
        and admitting it is normal.
      </LI>
    </UL>

    <H2>What I&apos;d tell you about pairing with an agent</H2>
    <P>
      The useful mental model isn&apos;t &quot;the AI builds it for me.&quot; It&apos;s closer to
      working with a very fast, very literal collaborator who will happily do the tedious parts —
      wire up the component, run the build, drive the browser, open the PR — but who needs a human
      to make the judgment calls and to insist on proof. The moments that mattered most were the
      ones where I said &quot;I don&apos;t see it&quot; or &quot;that dependency looks risky, check
      it first&quot; — human taste and skepticism pointed at a tool that could then do the
      verification work at a pace I couldn&apos;t.
    </P>
    <P>
      The result is a site I can stand behind line by line — because every line got looked at,
      built, and driven before it shipped. If you found a bug anyway,{' '}
      <A href='mailto:contact@aswincloud.com'>tell me</A> — that&apos;s the next entry in this same
      loop.
    </P>
  </>
);
