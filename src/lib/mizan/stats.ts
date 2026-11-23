/**
 * Trend tests on pure noise, for the false-alarm lab on /mizan.
 *
 * How it works, in plain English:
 * - `ar1Series` makes a fake 45-year climate series with no real trend. Each year is
 *   `phi` times last year plus fresh random noise, so a bigger `phi` means more "memory".
 * - `plainTrend` fits an ordinary straight line and asks whether the slope is far from
 *   zero, treating every year as independent. With memory, that assumption is wrong,
 *   so it "finds" trends in noise far too often.
 * - `correctedMannKendall` counts how often later years beat earlier ones (Mann-Kendall),
 *   then widens the uncertainty by an effective-sample-size factor estimated from the
 *   series' own lag-1 autocorrelation (after removing a Theil-Sen trend). This is a
 *   simplified version of the correction Mizan uses.
 * A test is "fooled" when it reports a trend at the 5% level, because there is none.
 */

export type Rng = () => number;

/** Small, fast, seedable random number generator (mulberry32). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box-Muller). */
export function gauss(rng: Rng): number {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** AR(1) series of length n with lag-1 memory phi (0 <= phi < 1), started in equilibrium. */
export function ar1Series(n: number, phi: number, rng: Rng): number[] {
  const x = new Array<number>(n);
  x[0] = gauss(rng) / Math.sqrt(1 - phi * phi);
  for (let t = 1; t < n; t++) x[t] = phi * (x[t - 1] as number) + gauss(rng);
  return x;
}

/** Standard normal CDF (Abramowitz & Stegun 26.2.17). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export interface TestResult {
  /** Two-sided p-value. */
  p: number;
  /** True when the test reports a trend at the 5% level. */
  trend: boolean;
}

export interface PlainTrendResult extends TestResult {
  intercept: number;
  slope: number;
}

/** Ordinary least-squares slope test, years treated as independent. */
export function plainTrend(x: readonly number[]): PlainTrendResult {
  const n = x.length;
  const tm = (n - 1) / 2;
  let xm = 0;
  for (const v of x) xm += v;
  xm /= n;
  let sxx = 0;
  let sxy = 0;
  for (let t = 0; t < n; t++) {
    sxx += (t - tm) ** 2;
    sxy += (t - tm) * ((x[t] as number) - xm);
  }
  const slope = sxy / sxx;
  const intercept = xm - slope * tm;
  let ssr = 0;
  for (let t = 0; t < n; t++) ssr += ((x[t] as number) - intercept - slope * t) ** 2;
  const tStat = slope / Math.sqrt(ssr / (n - 2) / sxx);
  // Critical t for 43 degrees of freedom (n = 45) at 5%, two-sided; close to 1.96 otherwise.
  const critical = n === 45 ? 2.017 : 1.96;
  return { intercept, slope, p: 2 * (1 - normalCdf(Math.abs(tStat))), trend: Math.abs(tStat) > critical };
}

/** Median of pairwise slopes (Theil-Sen). */
export function theilSen(x: readonly number[]): number {
  const slopes: number[] = [];
  for (let i = 0; i < x.length - 1; i++)
    for (let j = i + 1; j < x.length; j++) slopes.push(((x[j] as number) - (x[i] as number)) / (j - i));
  slopes.sort((a, b) => a - b);
  const m = slopes.length;
  return m % 2 ? (slopes[(m - 1) / 2] as number) : ((slopes[m / 2 - 1] as number) + (slopes[m / 2] as number)) / 2;
}

/** Mann-Kendall with an effective-sample-size correction for lag-1 autocorrelation. */
export function correctedMannKendall(x: readonly number[]): TestResult {
  const n = x.length;
  let s = 0;
  for (let i = 0; i < n - 1; i++)
    for (let j = i + 1; j < n; j++) s += Math.sign((x[j] as number) - (x[i] as number));

  const sen = theilSen(x);
  const r = x.map((v, t) => v - sen * t);
  const rm = r.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let t = 0; t < n; t++) {
    const d = (r[t] as number) - rm;
    den += d * d;
    if (t < n - 1) num += d * ((r[t + 1] as number) - rm);
  }
  const r1 = den > 0 ? num / den : 0;
  // Small-sample bias correction for the lag-1 estimate, clamped to [0, 0.95].
  const phi = Math.max(0, Math.min(0.95, (n * r1 + 1) / (n - 3)));
  let ratio = 1;
  let pk = 1;
  for (let k = 1; k < n; k++) {
    pk *= phi;
    ratio += 2 * (1 - k / n) * pk;
  }
  const varS = ((n * (n - 1) * (2 * n + 5)) / 18) * ratio;
  const z = s === 0 ? 0 : (s - Math.sign(s)) / Math.sqrt(varS);
  return { p: 2 * (1 - normalCdf(Math.abs(z))), trend: Math.abs(z) > 1.96 };
}
