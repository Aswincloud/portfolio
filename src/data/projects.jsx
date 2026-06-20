import { Brain, Zap, Gamepad2, Activity, Gauge } from 'lucide-react';

export const featuredProjects = [
  {
    id: 'ttperf',
    title: 'ttperf — TT-Metal Performance Profiler',
    domain: 'ttperf.aswincloud.com',
    description:
      "A streamlined CLI tool for profiling Tenstorrent's TT-Metal tests and extracting device kernel performance metrics. It wraps the TT-Metal profiler with pytest, parses the result CSVs, and reports total device kernel duration — with a showcase site documenting usage. Published on PyPI: `pip install ttperf`.",
    technologies: ['Python', 'CLI', 'pytest', 'PyPI', 'Tenstorrent TT-Metal'],
    features: [
      'Automated TT-Metal profiler runs via pytest',
      'Operation-based profiling (e.g. `ttperf add`)',
      'Automatic CSV parsing → total device kernel duration',
      'Configurable tensor shape, dtype, and layout',
      'Config-file defaults (~/.ttperf.yaml) + CI-friendly --quiet/--verbose',
    ],
    icon: <Gauge size={48} />,
    link: 'https://ttperf.aswincloud.com',
    repo: 'https://github.com/Aswincloud/ttperf',
    pypi: 'https://pypi.org/project/ttperf/',
    status: 'Live',
  },
  {
    id: 'ttnn-eltwise-performance',
    title: 'TTNN Eltwise Performance Tracker',
    domain: 'ttnn-eltwise-performance.aswincloud.com',
    description:
      "Day-by-day performance monitoring dashboard for Tenstorrent's TT-Metal TTNN eltwise operations. Tracks performance trends across dates, correlates regressions to git commits, and surfaces improvements vs. degradations with color-coded deltas.",
    technologies: ['React', 'Vite', 'Tailwind CSS', 'Recharts', 'Python', 'Cloudflare Workers'],
    features: [
      'Day-by-day performance comparison with baselines',
      '13 granular operation category filters',
      'Trend analysis with improvement/degradation indicators',
      'Git commit correlation for regression triage',
      'Automated email alerts on >20% performance changes',
    ],
    icon: <Activity size={48} />,
    link: 'https://ttnn-eltwise-performance.aswincloud.com',
    status: 'Live',
  },
];

export const additionalProjects = [
  {
    id: 'pr-reviewer',
    title: 'PR Reviewer',
    domain: 'pr-reviewer.aswincloud.com',
    description:
      'ML-trained application that intelligently analyzes pull requests to determine the minimum person approval required for merging. Features prediction algorithms to identify reviewers who will approve faster, optimizing development workflows.',
    technologies: ['Machine Learning', 'Python', 'React', 'Node.js', 'Cloud'],
    features: [
      'Intelligent PR analysis',
      'Approval prediction algorithms',
      'Fast reviewer identification',
      'Development workflow optimization',
      'Real-time PR insights',
    ],
    icon: <Brain size={48} />,
    link: 'https://pr-reviewer.aswincloud.com',
    status: 'Live',
  },
  {
    id: 'mirror-download-bot',
    title: 'Mirror Download Bot',
    domain: 't.me/Testdownload123bot',
    description:
      'A powerful Telegram bot for downloading content from various sources including torrents, direct links, and YouTube videos. Features automated downloads, progress tracking, and file management.',
    technologies: ['Python', 'Telegram Bot API', 'aria2', 'yt-dlp', 'Cloud Storage'],
    features: [
      'Torrent download support',
      'YouTube video downloading',
      'Direct link processing',
      'Download progress tracking',
      'File organization and management',
    ],
    icon: <Zap size={48} />,
    link: 'https://t.me/Testdownload123bot',
    status: 'Live',
  },
  {
    id: 'word-chain-game-bot',
    title: 'Word Chain Game Bot',
    domain: 't.me/gamebotbyashbot',
    description:
      'An interactive Telegram bot where players take turns creating words starting with the last letter of the previous word. Features multiplayer support, scoring system, and word validation.',
    technologies: ['Python', 'Telegram Bot API', 'SQLite', 'Game Logic', 'Multiplayer Support'],
    features: [
      'Multiplayer word chain game',
      'Word validation and scoring',
      'Turn-based gameplay',
      'Game statistics tracking',
      'Custom game rules and settings',
    ],
    icon: <Gamepad2 size={48} />,
    link: 'https://t.me/gamebotbyashbot',
    status: 'Live',
  },
];

export const allProjects = [...featuredProjects, ...additionalProjects];
