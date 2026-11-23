/**
 * Site content, transcribed word for word from CONTENT.md.
 *
 * CONTENT.md stays local (gitignored) and is the only source of facts.
 * Rules:
 *  - Never add a fact here that isn't in CONTENT.md.
 *  - A TODO in CONTENT.md becomes `null` (or an empty list) here, with a
 *    `// TODO(content): ...` comment. Components render nothing for it.
 *  - Text in `ui` is microcopy drafted by Claude and approved by Yousef.
 */

export interface Link {
  label: string;
  href: string;
}

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export interface Identity {
  name: string;
  location: string;
  school: string;
  tagline: string | null;
  githubUrl: string;
  linkedinUrl: string;
  /**
   * Email stored as two reversed parts so the address never appears as
   * plain text in the HTML. Assembled in the browser by Contact.astro.
   */
  emailReversed: { user: string; domain: string };
  cvHref: string | null;
  headshotSrc: string | null;
  goatcounterCode: string | null;
}

export const identity: Identity = {
  name: 'Yousef Alsharif',
  location: 'Jeddah, Saudi Arabia',
  school: 'Abdulrahman Fakieh Model Schools, Grade 11, Class of 2028',
  tagline: 'High school student in computer science and machine learning.',
  githubUrl: 'https://github.com/Kuriyeatsuchi',
  linkedinUrl: 'https://www.linkedin.com/in/ykuri',
  emailReversed: { user: 'keyfirahsla', domain: 'moc.liamg' },
  cvHref: '/cv.pdf',
  headshotSrc: null, // TODO(content): headshot (none for now)
  goatcounterCode: null, // TODO(content): GoatCounter code
};

/** About bio (4–5 sentences). */
export const aboutBio: string | null = null; // TODO(content): About text (hidden on site for now)

/* ------------------------------------------------------------------ */
/* Hero proof chips                                                    */
/* ------------------------------------------------------------------ */

export const proofChips: readonly string[] = [
  "ATHKA '24 Bronze",
  "NSMO '26 Finalist",
  "Tamayuz Scholar '28",
  // TODO(content): USACO chip (add only once Gold or higher)
];

/* ------------------------------------------------------------------ */
/* Project: Mizan                                                      */
/* ------------------------------------------------------------------ */

export interface Mizan {
  title: string;
  bullets: readonly string[];
  codeUrl: string | null;
  liveAppUrl: string | null;
}

export const mizan: Mizan = {
  title: 'Mizan: Is the Trend Real?',
  bullets: [
    'Web app that tests whether a change in NASA POWER climate data since 1981 is a real trend, an abrupt shift, or noise',
    'Methods: Theil-Sen slopes, Mann-Kendall test with autocorrelation correction, step-vs-trend check, false discovery rate control',
    'Calibrated on simulated data: about 5% false alarms on pure noise, compared with up to 44% for a plain trend line',
    "Across 525 tests in 15 areas of Saudi Arabia, air temperature rose in all 15 (0.24 to 0.49 °C per decade); in 10 of 15 areas the sunlight trend fit equally well as a jump at NASA's 2001 data-source change",
  ],
  codeUrl: 'https://github.com/Kuriyeatsuchi/Mizan',
  liveAppUrl: 'https://mizan-trends.streamlit.app',
};

/* ------------------------------------------------------------------ */
/* Project: Retinal Image Quality Sorter                               */
/* ------------------------------------------------------------------ */

export interface RetinaResults {
  anyRetinopathyAuc: number;
  anyRetinopathyCi: string;
  referableAuc: number;
  referableCi: string;
  cvRange: string;
}

export interface Retina {
  title: string;
  period: string;
  oneLine: string;
  whyItMatters: string | null;
  origin: string;
  stage1: string;
  stage2: string;
  /** Dataset statement. Hidden until permission to describe it publicly is confirmed. */
  data: string | null;
  /** Hidden on the whole site until dataset size, patient split and CIs are added. */
  results: RetinaResults | null;
  limitations: string | null;
  stack: readonly string[];
  repoUrl: string | null;
  disclaimer: string;
}

export const retina: Retina = {
  title: 'Retinal Image Quality Sorter',
  period: '2024 – present',
  oneLine:
    'Sorts retinal fundus photos into gradeable and ungradeable, flags duplicates, then grades diabetic retinopathy severity.',
  whyItMatters: null, // TODO(content): why it matters
  origin:
    'Grew out of the retinal image preprocessing work at the SDAIA ATHKA summer program (2024).',
  stage1:
    'brightness, contrast, resolution and sharpness measured inside the retina; exact duplicate files flagged.',
  stage2: 'pretrained ResNet18 as a feature extractor + logistic regression.',
  data: null, // TODO(content): dataset size, patient split, permission to describe publicly
  results: null, // TODO(content): results hidden until dataset size, patient split and 95% CIs are added
  limitations: null, // TODO(content): limitations
  // TODO(content): confirm PyTorch before adding it to the stack
  stack: ['Python', 'OpenCV', 'NumPy', 'scikit-learn'],
  repoUrl: 'https://github.com/Kuriyeatsuchi/retinal-image-quality-sorter',
  disclaimer: 'Research and education only. Not a medical device.',
};

/* ------------------------------------------------------------------ */
/* Project: Beyond the Streak (HCGCC 2026)                             */
/* ------------------------------------------------------------------ */

export interface HeadlineNumber {
  value: string;
  label: string;
}

export interface PlanPart {
  name: string;
  text: string;
}

export interface Hcgcc {
  title: string;
  competition: string;
  result: string;
  teamCredit: string;
  theCase: string;
  answerIntro: string;
  plan: readonly PlanPart[];
  headlineNumbers: readonly HeadlineNumber[];
  myRole: string | null;
  deckHref: string | null;
}

export const hcgcc: Hcgcc = {
  title: 'Beyond the Streak',
  competition: 'Harvard Crimson Global Case Competition 2026',
  result: 'Top 50 teams globally',
  teamCredit:
    'Team Fortune: Abdulaziz Alsaghyir, Yousef Alsharif, Abdullah Alruwais, Ahmad Alhussain',
  theCase: "Duolingo's daily users grew 23% but bookings grew only 8%.",
  answerIntro: '"Give away the learning, sell the proof," a three-part plan:',
  plan: [
    {
      name: 'Progress Intelligence',
      text: 'free level checks, progress reports in Super, and a $10 proctored certificate (~$81M modeled revenue by FY2029)',
    },
    {
      name: 'Own the Checkout',
      text: 'web checkout with Pix and UPI to cut app-store fees and reach learners without credit cards (~$16M a year)',
    },
    {
      name: 'Pay-for-Progress',
      text: 'governments and employers pay per learner and per verified progress step (~$23M revenue)',
    },
  ],
  // Values from CONTENT.md; labels are approved microcopy.
  headlineNumbers: [
    { value: '23% vs 8%', label: 'daily user growth vs bookings growth' },
    { value: '+$120M', label: 'a year by FY2029 (modeled)' },
    { value: '$71M', label: '3-year NPV (modeled)' },
  ],
  myRole: null, // TODO(content): my role (rewrite so the team gets credit)
  deckHref: '/hcgcc-deck.pdf',
};

/* ------------------------------------------------------------------ */
/* Competitive programming                                             */
/* ------------------------------------------------------------------ */

export interface CpProblem {
  name: string;
  url: string;
  keyInsight: string;
  complexity: string;
}

export interface CompetitiveProgramming {
  codeforcesHandle: string | null;
  usacoDivision: string | null;
  problems: readonly CpProblem[];
}

export const competitiveProgramming: CompetitiveProgramming = {
  codeforcesHandle: null, // TODO(content): Codeforces handle
  usacoDivision: null, // TODO(content): USACO division
  problems: [], // TODO(content): 2–3 favorite problems (name + link, key insight, complexity)
};

/* ------------------------------------------------------------------ */
/* Achievements and training                                           */
/* ------------------------------------------------------------------ */

export interface Achievement {
  /** null when CONTENT.md has no date for it. */
  date: string | null;
  title: string;
  detail: string | null;
}

/** Newest first. ONLY the items in CONTENT.md. */
export const achievements: readonly Achievement[] = [
  { date: 'Nov 2026', title: 'HCGCC 2026, Top 50 teams globally', detail: null },
  {
    date: 'Jan 2026',
    title: 'National Math & Science Olympiad (NSMO) Finalist, Informatics',
    detail: null,
  },
  {
    date: 'Apr 2024',
    title:
      // Trailing period dropped on the site (Yousef's review, 2026-11-23).
      'ATHKA 2024 (National Olympiad for Programming & AI), Bronze Medal, Intermediate Division',
    detail:
      'One of 70 medalists from 260,000+ registrants; reached the 298-student final in Riyadh.',
  },
  // TODO(content): Tamayuz "since" date (month/year)
  { date: null, title: 'Tamayuz Scholar (Mawhiba), Class of 2028', detail: null },
  // TODO(content): USACO
];

export interface TrainingItem {
  name: string;
  dates: string;
}

export const training: readonly TrainingItem[] = [
  {
    name: 'Mawhiba Informatics Olympiad Training Program (Tuwaiq Academy, KAUST)',
    dates: 'Nov 2024 – Nov 2026',
  },
  { name: 'KAUST AI Summer Program', dates: 'Jul 2026' },
  {
    name: 'SDAIA ATHKA Summer Program (AI, medical imaging project)',
    dates: 'Jul – Aug 2024',
  },
  { name: 'NVIDIA DLI: Fundamentals of Deep Learning', dates: 'Aug 2024' },
];

/* ------------------------------------------------------------------ */
/* Approved microcopy                                                  */
/* ------------------------------------------------------------------ */

export const ui = {
  meta: {
    title: 'Yousef Alsharif',
    description:
      'Yousef Alsharif, student at Abdulrahman Fakieh Model Schools in Jeddah, Saudi Arabia. Projects, competitions and contact.',
  },
  /** Two lines, rendered one per line. */
  heroSubline: ['Jeddah, Saudi Arabia', 'Abdulrahman Fakieh Model Schools · Class of 2028'],
  skipLink: 'Skip to content',
  nav: {
    projects: 'Projects',
    achievements: 'Achievements',
    contact: 'Contact',
  },
  hero: {
    viewWork: 'View work',
    downloadCv: 'Download CV',
  },
  projects: {
    heading: 'Projects',
  },
  mizan: {
    kicker: 'NASA Space Apps 2026 team project · Nov 2026',
    code: 'Code on GitHub',
    liveApp: 'Live app',
  },
  retina: {
    stage1: 'Stage 1, quality',
    stage2: 'Stage 2, grading',
    stack: 'Stack',
    code: 'Code on GitHub',
  },
  // Heading from CLAUDE.md; field labels from CONTENT.md; platform names as plain text.
  cp: {
    heading: 'Competitive Programming',
    codeforces: 'Codeforces',
    usaco: 'USACO',
    keyInsight: 'Key insight',
    complexity: 'Complexity',
  },
  hcgcc: {
    theCase: 'The case',
    ourAnswer: 'Our answer',
    openDeck: 'Open the deck (PDF)',
    downloadDeck: 'Download the deck (PDF)',
    slideAlt:
      'Executive summary slide from the Beyond the Streak deck: the situation, four root issues, an external environment (PEST) analysis, the three-move strategy and the bottom line',
  },
  achievements: {
    heading: 'Achievements',
    training: 'Training',
  },
  contact: {
    heading: 'Contact',
    email: 'Email',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    downloadCv: 'Download CV',
    noJsEmail: "Turn on JavaScript to see the email address. It's also listed in the CV.",
  },
  notFound: {
    heading: 'Page not found',
    body: "This page doesn't exist.",
    home: 'Back to home',
  },
  footer: 'Yousef Alsharif',
} as const;
