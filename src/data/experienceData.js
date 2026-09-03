// Experience data for the portfolio.
// `description` is the one-line lead; `achievements` carries the specifics and
// `tech` the tooling, so each card is scannable rather than a wall of prose.
export const getExperienceData = experience => [
  {
    period: 'June 2023 - Present',
    title: 'Senior Software Engineer',
    company: 'MulticoreWare Pvt Ltd',
    location: 'Chennai, India',
    logo: '/MulticoreWare_Logo.jpg',
    description:
      "Performance engineering on Tenstorrent's TT-Metal stack: profiling tensor operations, finding where the time goes, and getting it back.",
    achievements: [
      'Profile and benchmark tensor operations on AI accelerator hardware, turning the measurements into concrete optimization work.',
      'Trace bottlenecks across the software stack to find where the time actually goes before changing anything.',
      'Optimize the code paths that drive throughput — data layout, kernel choice, and scheduling decisions.',
    ],
    tech: ['Python', 'pytest', 'Profiling', 'Benchmarking', 'Performance Tuning'],
    experience: experience,
    delay: 0.1,
  },
  {
    period: 'June 2022 - May 2023',
    title: 'Industrial Project Engineer',
    company: 'Lenovo Pvt Ltd',
    location: 'Pondicherry, India',
    logo: '/Lenovo_Global_Corporate_Logo.png',
    description:
      'Computer vision and test automation for manufacturing — attendance and ESD testing systems.',
    achievements: [
      'Built and maintained a smart attendance system using face recognition, from the vision pipeline through to the database behind it.',
      'Developed an ESD tester with database integration for the electrostatic-discharge testing workflow.',
      'Handled the real-time data processing behind attendance tracking and ESD test runs.',
    ],
    tech: ['Computer Vision', 'Face Recognition', 'Biometrics', 'Database Integration'],
    experience: '1 year',
    delay: 0.2,
  },
];
