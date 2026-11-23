/**
 * Arabic titles, details and issuers for the Library, by entry slug. Everything else
 * (year, category, files) comes from library.ts. PROPOSED translations (Claude, 2026-11-24),
 * to be reviewed by Yousef. An entry missing here falls back to English.
 */

export const libraryAr: Readonly<Record<string, { title: string; detail: string; issuer: string }>> = {
  'athka-2024': {
    title: 'أذكى 2024: الميدالية البرونزية، المستوى المتوسط',
    detail: 'الأولمبياد الوطني للبرمجة والذكاء الاصطناعي، النهائي في الرياض، 23–27 أبريل 2024',
    issuer: 'موهبة بالشراكة مع سدايا ووزارة التعليم',
  },
  'spring-camp-2025': {
    title: 'ملتقى الربيع المؤهل للأولمبيادات الدولية 2025: ميدالية برونزية',
    detail: 'في مجال المعلوماتية (حاسب آلي)، 54 ساعة',
    issuer: 'موهبة',
  },
  'wro-2020': {
    title: 'الأولمبياد العالمي للروبوت WRO 2020: المركز الخامس على مستوى المملكة',
    detail: 'تحديات الفئة العادية، فريق روبو فقيه (المرحلة الابتدائية)',
    issuer: 'تعليم منطقة مكة المكرمة؛ مدارس عبدالرحمن فقيه النموذجية',
  },
  'nasa-space-apps-2026': {
    title: 'تحدي NASA Space Apps ‏2026: Galactic Problem Solver',
    detail: 'مشروع فريق (ميزان)، 14–15 نوفمبر 2026',
    issuer: 'تحدي NASA Space Apps',
  },
  'nsmo-2026': {
    title: 'أولمبياد العلوم والرياضيات الوطني «نسمو» 2026: متأهل للنهائيات، المعلوماتية',
    detail: 'النهائيات، معلوماتية 2، والتأهل لأول معسكر نخبة لنهائيات نسمو',
    issuer: 'موهبة؛ تعليم منطقة مكة المكرمة',
  },
  'elo-2026': {
    title: 'الأولمبياد الوطني للغة الإنجليزية (ELO KSA 2026)',
    detail: 'المستوى الوطني، مشاركة',
    issuer: 'English Language Olympia؛ وزارة التعليم',
  },
  'kmc-2025': {
    title: 'مسابقة كاوست للرياضيات (KMC) ‏2025',
    detail: 'المستوى المتقدم (Senior)، 13 ديسمبر 2025',
    issuer: 'أكاديمية كاوست',
  },
  bebras: {
    title: 'تحدي بيبراس للمعلوماتية 2025: الميدالية البرونزية',
    detail: 'شارك في 2023 و2024 و2025',
    issuer: 'موهبة',
  },
  kangaroo: {
    title: 'مسابقة الكنغر للرياضيات',
    detail: 'شارك في 2021 و2022 و2025',
    issuer: 'موهبة',
  },
  madak: {
    title: 'مسابقة الفضاء مداك',
    detail: 'مشاركة مميزة',
    issuer: 'وكالة الفضاء السعودية',
  },
  'fll-2022': {
    title: 'FIRST LEGO League ‏2022/2023',
    detail: 'مع فريق نادي فقيه STEAM (المرحلة المتوسطة)',
    issuer: 'مدارس عبدالرحمن فقيه النموذجية',
  },
  'wro-2022': {
    title: 'الأولمبياد العالمي للروبوت 2022',
    detail: 'مشاركة (المرحلة الابتدائية)',
    issuer: 'مدارس عبدالرحمن فقيه النموذجية',
  },
  'makkah-codes-2022': {
    title: 'مسابقة مكة للبرمجة 2022',
    detail: 'الملتقى الأول لمشاريع STEAM والذكاء الاصطناعي، 3 فبراير – 18 أبريل 2022',
    issuer: 'مكتب التعليم العالمي والأجنبي بمكة المكرمة',
  },
  'young-researcher': {
    title: 'مبادرة الباحث الصغير',
    detail: 'مشاركة (المرحلة الابتدائية)',
    issuer: 'مدارس عبدالرحمن فقيه النموذجية',
  },
  'tamayuz-2026': {
    title: 'برنامج موهبة للالتحاق بالجامعات المرموقة (التأهيل للتميز)',
    detail: '56 ساعة تدريبية، 2026',
    issuer: 'موهبة',
  },
  'kaust-ai-2026': {
    title: 'برنامج كاوست الصيفي للذكاء الاصطناعي 2026',
    detail: '60 ساعة تدريبية، 14–30 يوليو 2026',
    issuer: 'كاوست ووزارة التعليم',
  },
  'elite-camp-2025': {
    title: 'معسكر النخبة 2025',
    detail: '100 ساعة',
    issuer: 'موهبة',
  },
  'winter-camp-2025': {
    title: 'الملتقى الشتوي 2025',
    detail: 'ملتقى مؤهل للأولمبيادات الدولية في المعلوماتية، 60 ساعة',
    issuer: 'موهبة',
  },
  'summer-camp-2025': {
    title: 'الملتقى الصيفي 2025',
    detail: 'ملتقى مؤهل للأولمبيادات الدولية في المعلوماتية، 66 ساعة',
    issuer: 'موهبة',
  },
  'basic-informatics-2025': {
    title: 'التدريب الأساسي في المعلوماتية 2025',
    detail: '39 ساعة',
    issuer: 'موهبة',
  },
  'sdaia-athka-2024': {
    title: 'البرنامج التدريبي الصيفي للفائزين في أذكى',
    detail: '14 يوليو – 1 أغسطس 2024 (ذكاء اصطناعي، مشروع في التصوير الطبي)',
    issuer: 'أكاديمية سدايا',
  },
  'summer-camp-2024': {
    title: 'الملتقى الصيفي 2024',
    detail: '66 ساعة',
    issuer: 'موهبة',
  },
  'satr-python': {
    title: 'Python 101–104',
    detail: '4 دورات، 11 ساعة، من المبتدئ إلى المتقدم',
    issuer: 'أكاديمية طويق (سطر)',
  },
  'satr-data': {
    title: 'تحليل البيانات: مقدمة، NumPy وPandas وMatplotlib',
    detail: '4 دورات، 9 ساعات',
    issuer: 'أكاديمية طويق (سطر)',
  },
  'satr-cpp': {
    title: 'C++ 101–104',
    detail: '4 دورات، 4 ساعات',
    issuer: 'أكاديمية طويق (سطر)',
  },
  'satr-iot-scratch': {
    title: 'مقدمة في إنترنت الأشياء وScratch المستوى الأول',
    detail: 'دورتان، 3 ساعات',
    issuer: 'أكاديمية طويق (سطر)',
  },
  'nvidia-dli-2024': {
    title: 'NVIDIA DLI: أساسيات التعلّم العميق',
    detail: 'شهادة كفاءة، 1 أغسطس 2024',
    issuer: 'NVIDIA Deep Learning Institute',
  },
};
