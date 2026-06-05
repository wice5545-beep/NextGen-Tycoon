// ============================================================================
//  Deterministic PRNG (mulberry32).
//  The whole simulation pulls randomness from here so a given seed always
//  produces the same run. The cursor is stored in GameState.meta.rngState so
//  determinism survives save/load.
// ============================================================================

export class Rng {
  private state: number;

  constructor(seed: number) {
    // ensure a 32-bit unsigned starting state
    this.state = seed >>> 0;
  }

  /** restore cursor (used after loading a save) */
  setState(s: number) {
    this.state = s >>> 0;
  }

  getState(): number {
    return this.state >>> 0;
  }

  /** float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** float in [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  bool(p = 0.5): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }

  /** weighted pick; returns index or -1 if total weight is 0 */
  weightedIndex(weights: number[]): number {
    let total = 0;
    for (const w of weights) total += Math.max(0, w);
    if (total <= 0) return -1;
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= Math.max(0, weights[i]);
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }

  /** gaussian-ish noise centered on 0 via averaging */
  noise(amp = 1): number {
    return (this.next() + this.next() + this.next() - 1.5) * (amp / 1.5);
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

/** make a fresh random 32-bit seed */
export function randomSeed(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}
