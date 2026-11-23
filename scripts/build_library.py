# Usage: python3 scripts/build_library.py ~/Desktop/test/Certificates .
"""Build the Library: web images from the certificates + src/content/library.ts.

Run on the device:  python3 build_library.py <Certificates dir> <repo dir>
- Every page becomes a WebP (max 1600px wide) plus a small thumbnail.
- Metadata (EXIF, GPS) is dropped: images are re-encoded from pixels only.
- The KAUST AI certificate's ID number is covered before anything is saved.
"""
import json, os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageOps

SRC, REPO = sys.argv[1], sys.argv[2]
OUT = os.path.join(REPO, 'public', 'library')
os.makedirs(OUT, exist_ok=True)

# slug, category, year, sort key, title, detail, issuer, files
E = [
  # ---------------- Awards ----------------
  ('athka-2024', 'award', 2024, '2024-04', 'ATHKA 2024: Bronze Medal, Intermediate Division',
   'National Olympiad for Programming & AI; final in Riyadh, 23–27 April 2024',
   'Mawhiba with SDAIA and the Ministry of Education',
   ['Mawhiba/Bronze_ATHKA.JPG', 'Mawhiba/Participation_ATHKA.JPG', 'Unsorted/ATHKA_school.JPG', 'Unsorted/ATHKA_school_2.JPG']),
  ('spring-camp-2025', 'award', 2025, '2025-03', 'Spring Camp 2025: Bronze Medal',
   'International Olympiads bootcamp in Informatics (computer science), 54 hours',
   'Mawhiba', ['Mawhiba/Spring Camp 2025.pdf']),
  ('wro-2020', 'award', 2020, '2020-12', 'World Robot Olympiad 2020: 5th place in Saudi Arabia',
   'Regular category, team Robo Fakieh (elementary school)',
   'Makkah Region Education; Abdulrahman Fakieh Model Schools',
   ['Unsorted/Participation_WRO_2020.JPG', 'Unsorted/Participation_WRO_2020_2.JPG']),
  # ---------------- Competitions ----------------
  ('nasa-space-apps-2026', 'competition', 2026, '2026-11', 'NASA Space Apps Challenge 2026: Galactic Problem Solver',
   'Team project (Mizan), 14–15 November 2026', 'NASA Space Apps Challenge', ['Nasa-apps.pdf']),
  ('nsmo-2026', 'competition', 2026, '2026-01', 'National Math & Science Olympiad (NSMO) 2026: Finalist, Informatics',
   'Finals, Informatics 2; qualified for the first NSMO finals elite camp',
   'Mawhiba; Makkah Region Education', ['Mawhiba/Nsmo_participation.jpeg', 'Unsorted/makkah_nsmo.jpeg']),
  ('elo-2026', 'competition', 2026, '2026-02', 'National English Language Olympiad (ELO KSA 2026)',
   'National level, participation', 'English Language Olympia; Ministry of Education', ['Unsorted/Elo participation.pdf']),
  ('kmc-2025', 'competition', 2025, '2025-12', 'KAUST Mathematics Competition (KMC) 2025',
   'Senior Level, 13 December 2025', 'KAUST Academy',
   ['Kaust/KMC_2025_Participation_Yousef_Emad_Alsharif.pdf']),
  ('bebras', 'competition', 2025, '2025-01', 'Bebras Informatics Challenge',
   'Participated in 2023, 2024 and 2025', 'Mawhiba',
   ['Mawhiba/Bebras 2025.pdf', 'Mawhiba/Bebras 2024.pdf', 'Mawhiba/Bebras 2023.pdf']),
  ('kangaroo', 'competition', 2025, '2025-01', 'Kangaroo Mathematics Competition',
   'Participated in 2021, 2022 and 2025', 'Mawhiba',
   ['Mawhiba/Kangaroo 2025.pdf', 'Mawhiba/Kangaroo 2021.pdf', 'Mawhiba/Kangaroo 2022.pdf']),
  ('madak', 'competition', 2024, '2024-06', 'Madak Space Competition',
   'Distinguished participation', 'Saudi Space Agency', ['Unsorted/Madak_Certificate.pdf']),
  ('fll-2022', 'competition', 2022, '2022-12', 'FIRST LEGO League 2022/2023',
   'With the Fakieh STEAM Club team (middle school)', 'Abdulrahman Fakieh Model Schools',
   ['Unsorted/Participation_FLO.JPG']),
  ('wro-2022', 'competition', 2022, '2022-06', 'World Robot Olympiad 2022',
   'Participation (elementary school)', 'Abdulrahman Fakieh Model Schools',
   ['Unsorted/مسابقة أولمبياد الروبوت الدولية.JPG']),
  ('makkah-codes-2022', 'competition', 2022, '2022-04', 'Makkah Coding Competition 2022',
   'First Forum for STEAM Projects and AI, 3 February – 18 April 2022',
   'Office of International and Foreign Education, Makkah',
   ['Unsorted/STEAM Projects and Artificial Intelligence Al._2022.JPG']),
  ('young-researcher', 'competition', None, '0000', 'Young Researcher initiative',
   'Participation (elementary school)', 'Abdulrahman Fakieh Model Schools', ['Unsorted/ثصض .JPG']),
  # ---------------- Programs ----------------
  ('tamayuz-2026', 'program', 2026, '2026-10', 'Mawhiba Program for Elite Universities (Preparation for Tamayuz)',
   '56 hours, 2026', 'Mawhiba', ['Mawhiba/Tamayuz prep.pdf']),
  ('kaust-ai-2026', 'program', 2026, '2026-07', 'KAUST AI Summer Program 2026',
   '60 training hours, 14–30 July 2026', 'KAUST and the Ministry of Education', ['Kaust/Kaust ai 60 hours.jpeg']),
  ('elite-camp-2025', 'program', 2025, '2025-12', 'Elite Camp 2025', '100 hours', 'Mawhiba', ['Mawhiba/Elite Camp 2025.pdf']),
  ('winter-camp-2025', 'program', 2025, '2025-11', 'Winter Camp 2025',
   'International Olympiads bootcamp in Informatics, 60 hours', 'Mawhiba', ['Mawhiba/Winter Camp 2025.pdf']),
  ('summer-camp-2025', 'program', 2025, '2025-07', 'Summer Camp 2025',
   'International Olympiads bootcamp in Informatics, 66 hours', 'Mawhiba', ['Mawhiba/Summer Camp 2025.pdf']),
  ('basic-informatics-2025', 'program', 2025, '2025-02', 'Basic Informatics Training 2025',
   '39 hours', 'Mawhiba', ['Mawhiba/Main Training For Informatics 2025.pdf']),
  ('sdaia-athka-2024', 'program', 2024, '2024-08', 'ATHKA Winners Summer Training Program',
   '14 July – 1 August 2024 (AI, medical imaging project)', 'SDAIA Academy', ['Mawhiba/يوسف الشريف.pdf']),
  ('summer-camp-2024', 'program', 2024, '2024-07', 'Summer Camp 2024', '66 hours', 'Mawhiba', ['Mawhiba/Summer Camp 2024.pdf']),
  # ---------------- Courses ----------------
  ('satr-python', 'course', 2026, '2026-04', 'Python 101–104',
   '4 courses, 11 hours, beginner to advanced', 'Tuwaiq Academy (Satr)',
   ['Tuwaiq/Python 101.png', 'Tuwaiq/Python 102.png', 'Tuwaiq/Python 103.png', 'Tuwaiq/Python 104.png']),
  ('satr-data', 'course', 2026, '2026-04', 'Data analysis: intro, NumPy, Pandas and Matplotlib',
   '4 courses, 9 hours', 'Tuwaiq Academy (Satr)',
   ['Tuwaiq/Introduction to data analysis.png', 'Tuwaiq/Data analysis & processing NumPy.png',
    'Tuwaiq/Data analysis & processing Pandas.png', 'Tuwaiq/Matplotlib Data Representation.png']),
  ('satr-cpp', 'course', 2026, '2026-04', 'C++ 101–104', '4 courses, 4 hours', 'Tuwaiq Academy (Satr)',
   ['Tuwaiq/C++ 101.png', 'Tuwaiq/C++ 102.png', 'Tuwaiq/C++ 103.png', 'Tuwaiq/C++ 104.png']),
  ('satr-iot-scratch', 'course', 2026, '2026-04', 'Intro to IoT and Scratch Level 1', '2 courses, 3 hours',
   'Tuwaiq Academy (Satr)', ['Tuwaiq/Intro To IoT.png', 'Tuwaiq/Scratch - Level 1.png']),
  ('nvidia-dli-2024', 'course', 2024, '2024-08', 'NVIDIA DLI: Fundamentals of Deep Learning',
   'Certificate of Competency, 1 August 2024', 'NVIDIA Deep Learning Institute', ['Unsorted/My Learning | NVIDIA.pdf']),
  # ---------------- Academic ----------------
  ('rank-6-2024', 'academic', 2024, '2024-03', 'Rank 6, second trimester 2023–2024',
   'Certificate of Excellence', 'Abdulrahman Fakieh Model Schools', ['Unsorted/Rank_6_school_2023_2024.JPG']),
  ('rank-3-2023', 'academic', 2023, '2023-12', 'Rank 3, first trimester 2023–2024',
   'Certificate of Excellence', 'Abdulrahman Fakieh Model Schools', ['Unsorted/Rank_3_school_2023_2024.JPG']),
  ('excellence-2022', 'academic', 2022, '2022-12', 'Certificate of Excellence, first term 2022–2023',
   'Brilliant and consistent high marks in all subjects', 'Abdulrahman Fakieh Model Schools',
   ['Unsorted/High_marks_schoo_2022-2023.JPG']),
  ('excellence-2020', 'academic', 2020, '2020-01', 'Certificate of Excellence, 2020',
   'High marks in all subjects, grades 4–6', 'Abdulrahman Fakieh Model Schools', ['Unsorted/2020_good_marks_school.JPG']),
  ('elementary-recognition', 'academic', None, '0000', 'Recognition for excellence, first semester',
   'Elementary school', 'Abdulrahman Fakieh Model Schools', ['Unsorted/Marks_school.JPG']),
]

# The 10-digit number under the name on the KAUST AI certificate (fractions of width/height).
REDACT = {'Kaust/Kaust ai 60 hours.jpeg': [(0.44, 0.43, 0.64, 0.52)]}


def load(path):
    if path.lower().endswith('.pdf'):
        with tempfile.TemporaryDirectory() as d:
            subprocess.run(['pdftoppm', '-r', '150', '-png', '-f', '1', '-l', '1', '-singlefile', path, os.path.join(d, 'p')], check=True,
                           stderr=subprocess.DEVNULL)
            im = Image.open(os.path.join(d, 'p.png'))
            im.load()
            return im
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)
    return im


def trim_white(im):
    """Crop the empty white margin some PDFs carry (Mawhiba pages are portrait sheets)."""
    g = im.convert('L').point(lambda v: 0 if v > 245 else 255)
    box = g.getbbox()
    if box:
        pad = 12
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
        im = im.crop(box)
    return im


entries = []
for slug, cat, year, sort, title, detail, issuer, files in E:
    out_files = []
    for i, rel in enumerate(files):
        im = load(os.path.join(SRC, rel)).convert('RGB')
        for (x0, y0, x1, y1) in REDACT.get(rel, []):
            d = ImageDraw.Draw(im)
            d.rectangle([x0 * im.width, y0 * im.height, x1 * im.width, y1 * im.height], fill=(255, 255, 255))
        if rel.lower().endswith('.pdf'):
            im = trim_white(im)
        im.thumbnail((1600, 1600))
        name = f'{slug}-{i + 1}'
        im.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=80, method=6)
        th = ImageOps.fit(im, (240, 170), Image.LANCZOS, centering=(0.5, 0.4))
        th.save(os.path.join(OUT, name + '-thumb.webp'), 'WEBP', quality=70, method=6)
        out_files.append({'src': f'/library/{name}.webp', 'thumb': f'/library/{name}-thumb.webp',
                          'width': im.width, 'height': im.height})
    entries.append({'slug': slug, 'category': cat, 'year': year, 'sort': sort, 'title': title,
                    'detail': detail, 'issuer': issuer, 'files': out_files})

ts = '''/**
 * Library: every certificate, transcribed from the files in Desktop/test/Certificates.
 * Generated by build_library.py; titles and details are PROPOSED until Yousef approves
 * them in CONTENT.md ("Library").
 */

export type LibraryCategory = 'award' | 'competition' | 'program' | 'course' | 'academic';

export interface LibraryFile {
  src: string;
  thumb: string;
  width: number;
  height: number;
}

export interface LibraryEntry {
  slug: string;
  category: LibraryCategory;
  /** null when the certificate has no date. */
  year: number | null;
  /** YYYY-MM for ordering within a year ("0000" when undated). */
  sort: string;
  title: string;
  detail: string;
  issuer: string;
  files: readonly LibraryFile[];
}

export const library: readonly LibraryEntry[] = ''' + json.dumps(entries, ensure_ascii=False, indent=2) + ';\n'
open(os.path.join(REPO, 'src', 'content', 'library.ts'), 'w', encoding='utf-8').write(ts)
total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(len(entries), 'entries', sum(len(e['files']) for e in entries), 'images', round(total / 1e6, 2), 'MB')
