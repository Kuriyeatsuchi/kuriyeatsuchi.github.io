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
  anyRetinopathyCi: string | null;
  referableAuc: number;
  referableCi: string | null;
  cvRange: string | null;
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
  /** Shown on the site (approved by Yousef 2026-11-23). */
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
  results: {
    anyRetinopathyAuc: 0.997,
    anyRetinopathyCi: null, // TODO(content): 95% CI
    referableAuc: 0.942,
    referableCi: null, // TODO(content): 95% CI
    cvRange: null, // TODO(content): repeated cross-validation range
  },
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
    detail: 'One of 108 finalists nationwide, selected from 85k+ students.',
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
    // PROPOSED (alt text of the link-preview image)
    ogImageAlt: 'Yousef Alsharif, high school student in computer science and machine learning, beside a 3D eye made of points',
    description:
      'Yousef Alsharif, student at Abdulrahman Fakieh Model Schools in Jeddah, Saudi Arabia. Projects, competitions and contact.',
  },
  /** Two lines, rendered one per line. */
  heroSubline: ['Jeddah, Saudi Arabia', 'Abdulrahman Fakieh Model Schools · Class of 2028'],
  skipLink: 'Skip to content',
  nav: {
    projects: 'Projects',
    library: 'Library',
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
    meta: 'NASA Space Apps 2026 team project · Nov 2026',
    code: 'Code on GitHub',
    liveApp: 'Live app',
  },
  retina: {
    // Labels and the cross-validation sentence from CONTENT.md ("Results (held-out test set)").
    results: 'Results (held-out test set)',
    anyRetinopathy: 'Any retinopathy',
    referable: 'Referable retinopathy',
    crossValidation: 'Repeated cross-validation: results vary by split',
    // Counts from CONTENT.md (Data); wording PROPOSED.
    testSet: 'Held-out test set: 279 photos, 106 with retinopathy (84 referable).',
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

  /* -------------------------------------------------------------- */
  /* PROPOSED copy (CONTENT.md "Proposed copy"), NOT approved yet.   */
  /* Don't merge to main until Yousef approves or edits these.       */
  /* -------------------------------------------------------------- */
  pages: {
    allProjects: 'All projects',
    nextProject: 'Next project',
    navLabel: 'Projects',
  },
  mizanLab: {
    heading: 'The false-alarm lab',
    intro:
      'Climate data has memory: a warm year makes the next one more likely to be warm. A plain trend line treats every year as independent, so it finds trends in data that has none. Every series below is pure noise. Turn up the memory and count how often each test is fooled.',
    chartLabel: 'One 45-year series of pure noise, 1981 to 2025, with a straight trend line fitted through it',
    slider: 'Memory between years',
    sliderHelp: '0 means each year is independent; 0.9 means each year mostly repeats the last.',
    run: 'Run 400 noise series',
    newExample: 'New example',
    plain: 'Plain trend line',
    corrected: 'Corrected test',
    falseAlarms: 'false alarms',
    of: 'of',
    notRun: 'Not run yet',
    trendFound: 'trend found',
    noTrend: 'no trend',
    fooled: 'fooled',
    legendFooled: 'Fooled: called noise a trend',
    legendCorrect: 'Correct: no trend',
    note: "A fair test is fooled about 5% of the time. This in-browser version is simpler than Mizan's full pipeline, so expect it to drift higher when the memory is very strong.",
    noscript: 'Turn on JavaScript to run the lab.',
  },
  retinaGate: {
    heading: 'The quality gate',
    intro:
      'A model can only grade what it can see. Before grading, each photo is measured inside the retina for brightness, contrast and sharpness. The limits come from 1,450 clinician-graded photos, and 98.5% of them pass. Try the examples, ruin one with the sliders, or check your own.',
    imageLabel: 'The photo being checked, changed by the settings beside it',
    sourcesLabel: 'Photos',
    samples: { clear: 'Clear photo', blurry: 'Out of focus', dark: 'Too dark' },
    yourPhoto: 'Your photo',
    dropHere: 'Or drop a photo here',
    privacy: 'Your photo is checked in your browser and never uploaded.',
    exposure: 'Exposure',
    contrast: 'Contrast',
    blur: 'Blur',
    reset: 'Reset sliders',
    tableCaption: 'Quality checks for the photo',
    check: 'Check',
    value: 'Value',
    allowed: 'Allowed',
    result: 'Result',
    brightness: 'Brightness',
    contrastCheck: 'Contrast',
    sharpness: 'Sharpness',
    pass: 'Pass',
    fail: 'Fail',
    verdictOk: 'Gradeable, moved to /gradeable',
    verdictBad: 'Ungradeable, moved to /ungradeable',
    reasons: { 'too dark': 'too dark', 'too bright': 'too bright', 'too flat': 'too flat', 'too blurry': 'too blurry' },
    notFundus: "This doesn't look like a retina photo, so the result may not mean much.",
    unreadable: "Couldn't read that image.",
    fingerprint: 'Fingerprint',
    duplicate: 'exact duplicate of the original',
    notDuplicate: 'not a duplicate',
    note: 'Exact duplicates share a fingerprint, so changing any setting changes it.',
    credit: "Example photos from the project's dataset.",
    noscript: 'Turn on JavaScript to try the quality gate.',
  },
  eyeGate: {
    hint: 'Drag a retina photo onto the eye to check its quality.',
    tapHint: 'Tap a retina photo to give it to the eye.',
    samplesLabel: 'Example retina photos',
    sampleAlt: { clear: 'Clear retina photo', blurry: 'Out-of-focus retina photo', dark: 'Too-dark retina photo' },
    panelLabel: 'Quality check',
    more: 'Open the full quality gate',
  },
  library: {
    heading: 'Library',
    intro: 'Every certificate in one place. Open an entry to see the original.',
    entries: 'entries',
    searchLabel: 'Search the library',
    searchPlaceholder: 'Search by name, issuer or year',
    filterLabel: 'Filter by type',
    listLabel: 'Certificates',
    all: 'All',
    plural: { award: 'Awards', competition: 'Competitions', program: 'Programs', course: 'Courses' },
    singular: { award: 'Award', competition: 'Competition', program: 'Program', course: 'Course' },
    undated: 'Undated',
    viewOne: 'View certificate',
    viewMany: 'View {n} certificates',
    showing: 'Showing {shown} of {total}',
    noMatch: 'Nothing in this filter.',
    noMatchQuery: 'Nothing matches “{q}”.',
    certificate: 'certificate',
    previous: 'Previous',
    next: 'Next',
    keysHint: 'Arrow keys move between certificates; Esc closes.',
    openFull: 'Open full size',
    close: 'Close',
    seeAll: 'See every certificate in the Library',
  },
  hcgccBuilder: {
    heading: 'Build the answer',
    intro: 'Switch each part of the plan on to see how much it adds to the modeled revenue.',
    on: 'On',
    off: 'Off',
    totalLabel: 'of +$120M a year by FY2029 (modeled)',
  },
} as const;

/* ------------------------------------------------------------------ */
/* Project pages (order on the home page and in "Next project")        */
/* ------------------------------------------------------------------ */

export interface ProjectPage {
  slug: 'mizan' | 'retina' | 'hcgcc';
  title: string;
  meta: string;
  line: string;
}

export const projectPages: readonly ProjectPage[] = [
  { slug: 'mizan', title: mizan.title, meta: ui.mizan.meta, line: mizan.bullets[0] ?? '' },
  { slug: 'retina', title: retina.title, meta: retina.period, line: retina.oneLine },
  { slug: 'hcgcc', title: hcgcc.title, meta: `${hcgcc.competition} · ${hcgcc.result}`, line: hcgcc.theCase },
];

/** Modeled revenue by part (CONTENT.md "Our answer" and "Model"), in $M. */
export const hcgccModel = {
  totalM: 120,
  parts: [
    { name: 'Progress Intelligence', amountM: 81 },
    { name: 'Own the Checkout', amountM: 16 },
    { name: 'Pay-for-Progress', amountM: 23 },
  ],
} as const;
