/**
 * Arabic version of site.ts: the same facts, translated.
 *
 * Rules:
 *  - Same facts, same numbers, same links as site.ts. Nothing added, nothing left out.
 *    A field that is null or empty in site.ts is null or empty here too.
 *  - Every string here is a PROPOSED translation drafted by Claude (2026-11-24) and needs
 *    Yousef's review before it goes to main.
 *  - Proper names stay in Latin letters where they are names of things (Theil-Sen, ResNet18,
 *    AUC, PyTorch, the deck title "Beyond the Streak"), and become Arabic where the
 *    organisation itself uses an Arabic name (موهبة، كاوست، سدايا).
 *  - Types come from site.ts, so a missing or extra field is a type error.
 */

import type {
  Achievement,
  CompetitiveProgramming,
  Hcgcc,
  HcgccModel,
  Identity,
  Mizan,
  ProjectPage,
  Retina,
  TrainingItem,
  Ui,
} from './site';
import { competitiveProgramming as cpEn, hcgcc as hcgccEn, identity as identityEn, mizan as mizanEn, retina as retinaEn } from './site';

export const identity: Identity = {
  ...identityEn,
  name: 'يوسف الشريف',
  location: 'جدة، المملكة العربية السعودية',
  school: 'مدارس عبدالرحمن فقيه النموذجية، الصف الحادي عشر، دفعة 2028',
  tagline: 'طالب في المرحلة الثانوية مهتم بعلوم الحاسب وتعلّم الآلة.',
};

export const aboutBio: string | null = null; // TODO(content): About text (hidden on site for now)

export const proofChips: readonly string[] = [
  'برونزية أذكى 2024',
  'متأهل لنهائيات نسمو 2026',
  'تميّز موهبة، دفعة 2028',
];

export const mizan: Mizan = {
  ...mizanEn,
  title: 'ميزان: هل الاتجاه حقيقي؟',
  bullets: [
    'تطبيق ويب يختبر ما إذا كان التغيّر في بيانات المناخ من NASA POWER منذ 1981 اتجاهًا حقيقيًا، أم قفزة مفاجئة، أم مجرد ضجيج',
    'الطرق: ميل Theil-Sen، واختبار Mann-Kendall مع تصحيح الارتباط الذاتي، والمقارنة بين القفزة والاتجاه، وضبط معدل الاكتشافات الخاطئة',
    'معايَر على بيانات محاكاة: نحو 5% إنذارات كاذبة على الضجيج الخالص، مقابل ما يصل إلى 44% لخط الاتجاه العادي',
    'في 525 اختبارًا عبر 15 منطقة في المملكة العربية السعودية، ارتفعت حرارة الهواء في المناطق الخمس عشرة كلها (من 0.24 إلى 0.49 درجة مئوية لكل عقد)، وفي 10 من 15 منطقة كان اتجاه أشعة الشمس يُفسَّر بالقدر نفسه بقفزة عند تغيير ناسا لمصدر بياناتها عام 2001',
  ],
};

export const retina: Retina = {
  ...retinaEn,
  title: 'فارز جودة صور الشبكية',
  period: '2024 – الآن',
  oneLine:
    'يفرز صور قاع العين إلى صور قابلة للتقييم وغير قابلة للتقييم، ويكشف الصور المكررة، ثم يقيّم درجة اعتلال الشبكية السكري.',
  origin: 'انطلق من عمل المعالجة المسبقة لصور الشبكية في برنامج أذكى الصيفي من سدايا (2024).',
  stage1: 'قياس السطوع والتباين والدقة والحدّة داخل الشبكية، وكشف الملفات المكررة تمامًا.',
  stage2: 'شبكة ResNet18 مدرّبة مسبقًا لاستخراج الخصائص، مع انحدار لوجستي.',
  disclaimer: 'للبحث والتعليم فقط. ليس جهازًا طبيًا.',
};

export const hcgcc: Hcgcc = {
  ...hcgccEn,
  // The deck's own title stays as it is.
  competition: 'مسابقة هارفارد كريمسون العالمية لدراسات الحالة 2026',
  result: 'ضمن أفضل 50 فريقًا عالميًا',
  // Arabic spellings from Yousef (2026-11-24).
  teamCredit: 'فريق Fortune: عبدالعزيز الصغير، يوسف الشريف، عبدالله الرويس، أحمد الحصين',
  theCase: 'نما عدد مستخدمي دولينجو اليوميين 23% بينما لم تنمُ الحجوزات إلا 8%.',
  answerIntro: '«امنح التعلّم مجانًا، وبِع الإثبات»، خطة من ثلاثة أجزاء:',
  plan: [
    {
      name: 'ذكاء التقدّم',
      text: 'اختبارات مستوى مجانية، وتقارير تقدّم في Super، وشهادة مراقَبة بسعر 10 دولارات (نحو 81 مليون دولار من الإيرادات المقدّرة بحلول السنة المالية 2029)',
    },
    {
      name: 'امتلاك الدفع',
      text: 'دفع عبر الويب بـ Pix وUPI لتقليل رسوم متاجر التطبيقات والوصول إلى المتعلّمين الذين لا يملكون بطاقات ائتمان (نحو 16 مليون دولار سنويًا)',
    },
    {
      name: 'الدفع مقابل التقدّم',
      text: 'تدفع الحكومات وجهات العمل عن كل متعلّم وعن كل خطوة تقدّم موثّقة (نحو 23 مليون دولار من الإيرادات)',
    },
  ],
  headlineNumbers: [
    { value: '23% vs 8%', label: 'نمو المستخدمين اليوميين مقابل نمو الحجوزات' },
    { value: '+$120M', label: 'سنويًا بحلول السنة المالية 2029 (تقديري)' },
    { value: '$71M', label: 'صافي القيمة الحالية لثلاث سنوات (تقديري)' },
  ],
};

export const competitiveProgramming: CompetitiveProgramming = cpEn;

export const achievements: readonly Achievement[] = [
  { date: 'نوفمبر 2026', title: 'HCGCC ‏2026، ضمن أفضل 50 فريقًا عالميًا', detail: null },
  {
    date: 'يناير 2026',
    title: 'متأهل لنهائيات أولمبياد العلوم والرياضيات الوطني «نسمو» (NSMO)، المعلوماتية',
    detail: 'واحد من 108 متأهلين على مستوى المملكة، اختيروا من أكثر من 85 ألف طالب.',
  },
  {
    date: 'أبريل 2024',
    title: 'أذكى 2024 (الأولمبياد الوطني للبرمجة والذكاء الاصطناعي)، الميدالية البرونزية، المستوى المتوسط',
    detail: 'واحد من 70 فائزًا بميدالية من بين أكثر من 260,000 مسجّل، وتأهّل إلى النهائي في الرياض بين 298 طالبًا.',
  },
  // TODO(content): Tamayuz "since" date (month/year)
  { date: null, title: 'برنامج تميّز (موهبة)، دفعة 2028', detail: null },
];

export const training: readonly TrainingItem[] = [
  { name: 'برنامج موهبة للتدريب على أولمبياد المعلوماتية (أكاديمية طويق، كاوست)', dates: 'نوفمبر 2024 – نوفمبر 2026' },
  { name: 'برنامج كاوست الصيفي للذكاء الاصطناعي', dates: 'يوليو 2026' },
  { name: 'برنامج أذكى الصيفي من سدايا (ذكاء اصطناعي، مشروع في التصوير الطبي)', dates: 'يوليو – أغسطس 2024' },
  { name: 'NVIDIA DLI: أساسيات التعلّم العميق', dates: 'أغسطس 2024' },
];

export const ui: Ui = {
  meta: {
    title: 'يوسف الشريف',
    ogImageAlt: 'عين ثلاثية الأبعاد مكوّنة من نقاط، تنظر إلى الأمام، على خلفية داكنة مليئة بالنجوم',
    description: 'يوسف الشريف، طالب في مدارس عبدالرحمن فقيه النموذجية في جدة، المملكة العربية السعودية. مشاريع ومسابقات وتواصل.',
  },
  heroSubline: ['جدة، المملكة العربية السعودية', 'مدارس عبدالرحمن فقيه النموذجية · دفعة 2028'],
  skipLink: 'انتقل إلى المحتوى',
  nav: {
    projects: 'المشاريع',
    library: 'المكتبة',
    achievements: 'الإنجازات',
    contact: 'تواصل',
    toLight: 'التبديل إلى الوضع الفاتح',
    toDark: 'التبديل إلى الوضع الداكن',
    themes: 'المظاهر',
    themeNames: { default: 'الافتراضي', frost: 'صقيع' },
    home: 'الصفحة الرئيسية',
    main: 'القائمة الرئيسية',
    otherLanguage: 'English',
    otherLanguageLabel: 'النسخة الإنجليزية',
  },
  hero: {
    viewWork: 'شاهد الأعمال',
    downloadCv: 'تحميل السيرة الذاتية',
  },
  projects: {
    heading: 'المشاريع',
  },
  mizan: {
    meta: 'مشروع فريق في NASA Space Apps ‏2026 · نوفمبر 2026',
    code: 'الكود على GitHub',
    liveApp: 'التطبيق المباشر',
  },
  retina: {
    results: 'النتائج (مجموعة اختبار منفصلة)',
    anyRetinopathy: 'أي اعتلال في الشبكية',
    referable: 'اعتلال يستدعي الإحالة',
    crossValidation: 'التحقق المتقاطع المتكرر: تختلف النتائج حسب التقسيم',
    testSet: 'مجموعة الاختبار المنفصلة: 279 صورة، منها 106 فيها اعتلال (84 تستدعي الإحالة).',
    stage1: 'المرحلة الأولى، الجودة',
    stage2: 'المرحلة الثانية، التقييم',
    stack: 'الأدوات',
    code: 'الكود على GitHub',
  },
  cp: {
    heading: 'البرمجة التنافسية',
    codeforces: 'Codeforces',
    usaco: 'USACO',
    keyInsight: 'الفكرة الأساسية',
    complexity: 'التعقيد',
  },
  hcgcc: {
    theCase: 'الحالة',
    ourAnswer: 'إجابتنا',
    openDeck: 'افتح العرض (PDF)',
    downloadDeck: 'حمّل العرض (PDF)',
    slideAlt:
      'شريحة الملخص التنفيذي من عرض Beyond the Streak: الوضع الحالي، وأربع مشكلات جذرية، وتحليل البيئة الخارجية (PEST)، والاستراتيجية ذات الخطوات الثلاث، والخلاصة',
  },
  achievements: {
    heading: 'الإنجازات',
    training: 'التدريب',
  },
  contact: {
    heading: 'تواصل',
    email: 'البريد الإلكتروني',
    github: 'GitHub',
    linkedin: 'LinkedIn',
    downloadCv: 'تحميل السيرة الذاتية',
    noJsEmail: 'فعّل JavaScript لرؤية البريد الإلكتروني. وهو موجود أيضًا في السيرة الذاتية.',
  },
  notFound: {
    heading: 'الصفحة غير موجودة',
    body: 'هذه الصفحة غير موجودة.',
    home: 'العودة إلى الرئيسية',
  },
  footer: 'يوسف الشريف',
  pages: {
    allProjects: 'كل المشاريع',
    nextProject: 'المشروع التالي',
    navLabel: 'المشاريع',
  },
  mizanLab: {
    heading: 'مختبر الإنذارات الكاذبة',
    intro:
      'لبيانات المناخ ذاكرة: السنة الدافئة تجعل السنة التالية أكثر ميلًا للدفء. خط الاتجاه العادي يعامل كل سنة كأنها مستقلة، فيجد اتجاهات في بيانات لا اتجاه فيها. كل سلسلة أدناه ضجيج خالص. ارفع الذاكرة واحسب كم مرة ينخدع كل اختبار.',
    chartLabel: 'سلسلة واحدة من الضجيج الخالص مدتها 45 سنة، من 1981 إلى 2025، مع خط اتجاه مستقيم مرسوم عبرها',
    slider: 'الذاكرة بين السنوات',
    sliderHelp: '0 تعني أن كل سنة مستقلة، و0.9 تعني أن كل سنة تكرر سابقتها في الغالب.',
    run: 'شغّل 400 سلسلة ضجيج',
    newExample: 'مثال جديد',
    plain: 'خط الاتجاه العادي',
    corrected: 'الاختبار المصحَّح',
    falseAlarms: 'إنذارات كاذبة',
    of: 'من',
    notRun: 'لم يُشغَّل بعد',
    trendFound: 'وُجد اتجاه',
    noTrend: 'لا اتجاه',
    fooled: 'انخدع',
    legendFooled: 'انخدع: اعتبر الضجيج اتجاهًا',
    legendCorrect: 'صحيح: لا اتجاه',
    note: 'الاختبار العادل ينخدع في نحو 5% من المرات. هذه النسخة داخل المتصفح أبسط من نظام ميزان الكامل، لذا توقّع أن ترتفع النسبة قليلًا عندما تكون الذاكرة قوية جدًا.',
    noscript: 'فعّل JavaScript لتشغيل المختبر.',
  },
  retinaGate: {
    heading: 'بوابة الجودة',
    intro:
      'لا يستطيع النموذج تقييم ما لا يراه. قبل التقييم، تُقاس كل صورة داخل الشبكية من حيث السطوع والتباين والحدّة. الحدود مأخوذة من 1,450 صورة قيّمها أطباء، و98.5% منها تجتاز البوابة. جرّب الأمثلة، أو أفسد إحداها بالمنزلقات، أو افحص صورتك.',
    imageLabel: 'الصورة قيد الفحص، وتتغيّر بالإعدادات المجاورة لها',
    sourcesLabel: 'الصور',
    samples: { clear: 'صورة واضحة', blurry: 'خارج التركيز', dark: 'داكنة جدًا' },
    yourPhoto: 'صورتك',
    dropHere: 'أو أفلت صورة هنا',
    privacy: 'تُفحص صورتك داخل متصفحك ولا تُرفع إلى أي مكان.',
    exposure: 'الإضاءة',
    contrast: 'التباين',
    blur: 'الضبابية',
    reset: 'إعادة ضبط المنزلقات',
    tableCaption: 'فحوص الجودة للصورة',
    check: 'الفحص',
    value: 'القيمة',
    allowed: 'المسموح',
    to: 'إلى',
    result: 'النتيجة',
    brightness: 'السطوع',
    contrastCheck: 'التباين',
    sharpness: 'الحدّة',
    pass: 'نجح',
    fail: 'رسب',
    verdictOk: 'قابلة للتقييم، نُقلت إلى ‎/gradeable',
    verdictBad: 'غير قابلة للتقييم، نُقلت إلى ‎/ungradeable',
    reasons: { 'too dark': 'داكنة جدًا', 'too bright': 'ساطعة جدًا', 'too flat': 'باهتة جدًا', 'too blurry': 'ضبابية جدًا' },
    notFundus: 'لا تبدو هذه صورة شبكية، لذا قد لا تعني النتيجة الكثير.',
    unreadable: 'تعذّرت قراءة هذه الصورة.',
    fingerprint: 'البصمة',
    duplicate: 'نسخة مطابقة تمامًا للأصل',
    notDuplicate: 'ليست نسخة مكررة',
    note: 'الصور المكررة تمامًا تشترك في البصمة نفسها، لذا فإن تغيير أي إعداد يغيّرها.',
    credit: 'صور الأمثلة من بيانات المشروع.',
    noscript: 'فعّل JavaScript لتجربة بوابة الجودة.',
  },
  eyeGate: {
    hint: 'اسحب صورة شبكية إلى العين لفحص جودتها.',
    tapHint: 'المس صورة شبكية لتعطيها للعين.',
    samplesLabel: 'صور شبكية للتجربة',
    sampleAlt: { clear: 'صورة شبكية واضحة', blurry: 'صورة شبكية خارج التركيز', dark: 'صورة شبكية داكنة جدًا' },
    panelLabel: 'فحص الجودة',
    shapesHint: 'المس شكلًا في الزاوية لتنقله إلى المنتصف، والمس الشكل الأوسط لتتفاعل معه.',
    done: 'تم',
    more: 'افتح بوابة الجودة كاملة',
  },
  library: {
    heading: 'المكتبة',
    intro: 'كل الشهادات في مكان واحد. افتح أي عنصر لترى الأصل.',
    entries: 'عنصرًا',
    searchLabel: 'ابحث في المكتبة',
    searchPlaceholder: 'ابحث بالاسم أو الجهة أو السنة',
    filterLabel: 'التصفية حسب النوع',
    listLabel: 'الشهادات',
    all: 'الكل',
    plural: { award: 'الجوائز', competition: 'المسابقات', program: 'البرامج', course: 'الدورات' },
    singular: { award: 'جائزة', competition: 'مسابقة', program: 'برنامج', course: 'دورة' },
    undated: 'بدون تاريخ',
    viewOne: 'عرض الشهادة',
    viewMany: 'عرض {n} شهادات',
    showing: 'عرض {shown} من {total}',
    noMatch: 'لا شيء في هذا التصنيف.',
    noMatchQuery: 'لا توجد نتائج لـ «{q}».',
    certificate: 'شهادة',
    previous: 'السابق',
    next: 'التالي',
    keysHint: 'استخدم مفاتيح الأسهم للتنقل بين الشهادات، وEsc للإغلاق.',
    openFull: 'افتح بالحجم الكامل',
    close: 'إغلاق',
    seeAll: 'شاهد كل الشهادات في المكتبة',
  },
  hcgccBuilder: {
    heading: 'ابنِ الإجابة',
    intro: 'فعّل كل جزء من الخطة لترى كم يضيف إلى الإيرادات المقدّرة.',
    on: 'مفعّل',
    off: 'متوقف',
    totalLabel: 'من 120+ مليون دولار سنويًا بحلول السنة المالية 2029 (تقديري)',
  },
};

export const projectPages: readonly ProjectPage[] = [
  { slug: 'mizan', title: mizan.title, meta: ui.mizan.meta, line: mizan.bullets[0] ?? '' },
  { slug: 'retina', title: retina.title, meta: retina.period, line: retina.oneLine },
  { slug: 'hcgcc', title: hcgcc.title, meta: `${hcgcc.competition} · ${hcgcc.result}`, line: hcgcc.theCase },
];

export const hcgccModel: HcgccModel = {
  totalM: 120,
  parts: [
    { name: 'ذكاء التقدّم', amountM: 81 },
    { name: 'امتلاك الدفع', amountM: 16 },
    { name: 'الدفع مقابل التقدّم', amountM: 23 },
  ],
};
