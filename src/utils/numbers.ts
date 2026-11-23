/**
 * Splits text into plain and numeric segments so every number (metrics,
 * years, money, percentages) can be set in JetBrains Mono.
 *
 * Matches tokens like: 2024, '28, 23%, 0.24, 260,000+, ~$81M, +$120M, FY2029.
 * Digits glued to letters (e.g. "ResNet18") are left alone.
 */

export interface TextSegment {
  text: string;
  isNumber: boolean;
}

const NUMBER = /(?<![\p{L}\p{N}])(?:FY)?(?:'|[~+]?\$?)\d+(?:[.,]\d+)*\+?(?:%|M(?!\p{L}))?/gu;

export function splitNumbers(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(NUMBER)) {
    const start = match.index ?? 0;
    if (start > last) segments.push({ text: text.slice(last, start), isNumber: false });
    segments.push({ text: match[0], isNumber: true });
    last = start + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), isNumber: false });
  return segments;
}
