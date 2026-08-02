import { Brain, Zap, Gamepad2, Activity, Gauge, Globe } from 'lucide-react';

// Accent per *kind* of thing, not per project. Six cards separated only by a
// small icon meant the grid had to be read rather than scanned; keying colour to
// category gives it structure — the two bots share a hue precisely because that
// is the signal ("same kind of thing"), not an oversight.
//
// Literal class strings, never interpolated. Tailwind finds classes by scanning
// source text, so `bg-${kind}-500/10` is emitted as nothing at all and the
// failure shows up as an invisible accent rather than a build error. Same
// constraint as SkillsSection's `edge`/`dot`.
export const PROJECT_KINDS = {
  web: {
    tile: 'border-brand-500/20 bg-brand-500/10 text-brand-300',
    edge: 'via-brand-400/60',
    chip: 'border-brand-500/20 bg-brand-500/10 text-brand-300',
  },
  perf: {
    tile: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
    edge: 'via-cyan-400/60',
    chip: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
  },
  data: {
    tile: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
    edge: 'via-indigo-400/60',
    chip: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
  },
  bot: {
    tile: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
    edge: 'via-sky-400/60',
    chip: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  },
};

export const featuredProjects = [
  {
    id: 'portfolio',
    kind: 'web',
    title: 'aswincloud — This Portfolio',
    domain: 'www.aswincloud.com',
    description:
      'The site you are on — designed and built from scratch, with no UI kit or template. Deployed on Cloudflare Workers with a serverless contact form and self-hosted live chat.',
    technologies: ['React', 'Vite', 'Tailwind CSS', 'Motion', 'Cloudflare Workers'],
    features: [
      'Lighthouse 96 / 100 / 100 / 100 (perf / a11y / best-practices / SEO)',
      'Hand-built design system — no UI kit or template',
      'Responsive, keyboard-accessible, reduced-motion aware',
    ],
    icon: <Globe size={48} />,
    link: 'https://www.aswincloud.com',
    repo: 'https://github.com/Aswincloud/portfolio',
    status: 'Live',
    metric: 'Lighthouse 96+',
  },
  {
    id: 'ttperf',
    kind: 'perf',
    title: 'ttperf — TT-Metal Performance Profiler',
    domain: 'ttperf.aswincloud.com',
    description:
      "A CLI that wraps Tenstorrent's TT-Metal profiler with pytest, parses the result CSVs, and reports total device kernel duration. Published on PyPI (pip install ttperf).",
    technologies: ['Python', 'CLI', 'pytest', 'PyPI', 'Tenstorrent TT-Metal'],
    features: [
      'Automated profiler runs via pytest, per operation',
      'CSV parsing → total device kernel duration',
      'Config-file defaults + CI-friendly --quiet/--verbose',
    ],
    icon: <Gauge size={48} />,
    link: 'https://ttperf.aswincloud.com',
    repo: 'https://github.com/Aswincloud/ttperf',
    pypi: 'https://pypi.org/project/ttperf/',
    status: 'Live',
    metric: 'On PyPI',
  },
  {
    id: 'ttnn-eltwise-performance',
    kind: 'data',
    title: 'TTNN Eltwise Performance Tracker',
    domain: 'ttnn-eltwise-performance.aswincloud.com',
    description:
      "Day-by-day performance monitoring for Tenstorrent's TTNN eltwise operations. Tracks trends against a baseline, correlates regressions back to the git commit, and colour-codes the deltas.",
    technologies: ['React', 'Vite', 'Tailwind CSS', 'Recharts', 'Python', 'Cloudflare Workers'],
    features: [
      'Day-by-day comparison against a baseline',
      'Git commit correlation for regression triage',
      'Automated email alerts on >20% changes',
    ],
    icon: <Activity size={48} />,
    link: 'https://ttnn-eltwise-performance.aswincloud.com',
    repo: 'https://github.com/Aswincloud/ttnn-performance-dashboard',
    status: 'Live',
    // Kept short deliberately — this chip shares a row with the 56px icon tile,
    // and the previous "13 op categories tracked" ran 190px wide in a 347px
    // card, squeezing the tile against it. Every metric here stays ~16 chars.
    metric: '13 op categories',
  },
];

export const additionalProjects = [
  {
    id: 'pr-reviewer',
    kind: 'data',
    title: 'PR Reviewer',
    domain: 'pr-reviewer.aswincloud.com',
    description:
      'An ML-trained service that reads a pull request and works out the minimum set of approvals it actually needs, then predicts which reviewers will get to it fastest.',
    technologies: ['Machine Learning', 'Python', 'React', 'Node.js', 'Cloud'],
    features: [
      'Minimum-approval analysis per pull request',
      'Reviewer turnaround prediction',
      'Real-time insights as the PR changes',
    ],
    icon: <Brain size={48} />,
    link: 'https://pr-reviewer.aswincloud.com',
    status: 'Live',
    metric: 'ML-powered',
  },
  {
    id: 'mirror-download-bot',
    kind: 'bot',
    title: 'Mirror Download Bot',
    domain: 't.me/Testdownload123bot',
    description:
      'A Telegram-driven download orchestrator that puts aria2 and yt-dlp behind one job model, with live progress, retries, and automatic filing into cloud storage when a transfer lands.',
    technologies: ['Python', 'Telegram Bot API', 'aria2', 'yt-dlp', 'Cloud Storage'],
    features: [
      'One job queue across multiple download backends',
      'Concurrent transfers with per-job progress',
      'Pause / resume / cancel over chat',
    ],
    icon: <Zap size={48} />,
    link: 'https://t.me/Testdownload123bot',
    status: 'Live',
    metric: 'Multi-source queue',
  },
  {
    id: 'word-chain-game-bot',
    kind: 'bot',
    title: 'Word Chain Game Bot',
    domain: 't.me/gamebotbyashbot',
    description:
      'A Telegram game where players take turns on a word starting with the last letter of the previous one. Turn-based multiplayer with dictionary validation and persistent scores.',
    technologies: ['Python', 'Telegram Bot API', 'SQLite', 'Game Logic', 'Multiplayer Support'],
    features: [
      'Turn-based multiplayer in any group chat',
      'Dictionary validation and scoring',
      'Persistent per-player statistics',
    ],
    icon: <Gamepad2 size={48} />,
    link: 'https://t.me/gamebotbyashbot',
    status: 'Live',
    metric: 'Multiplayer',
  },
];

export const allProjects = [...featuredProjects, ...additionalProjects];
