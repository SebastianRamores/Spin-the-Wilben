/**
 * Progress curve for the clock hand: a constant fast sweep for the first
 * half of the spin, then a cubic ease-out over the second half. The two
 * halves are velocity-matched, so the hand does not jerk at the hand-off.
 * 75% of the travel happens in the first half, leaving the last 25% to trail
 * off visibly into the stop.
 */
const FAST_SHARE = 0.75

export function spinEase(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  if (x < 0.5) return (x / 0.5) * FAST_SHARE
  const u = (x - 0.5) / 0.5
  return FAST_SHARE + (1 - FAST_SHARE) * (1 - (1 - u) ** 3)
}
