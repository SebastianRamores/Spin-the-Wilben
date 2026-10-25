/**
 * Wheel geometry for a clock-style spinner:
 *  - the dial (segments + names) never moves;
 *  - a hand pivots at the centre and is the only thing that rotates;
 *  - the winning segment is the one the hand ends up pointing at.
 *
 * Segment angles are measured from 12 o'clock, clockwise, matching the paint
 * order. Hand angles are screen angles: 0deg points right (3 o'clock) and
 * positive values rotate clockwise, matching CSS `rotate()`.
 */

export interface SpinPlan {
  /** index into the participant list the hand must finish on */
  index: number
  /** absolute hand angle (deg) at the start of the animation */
  startAngle: number
  /** absolute hand angle (deg) at the end of the animation */
  finalAngle: number
  /** total animated rotation (deg) for this spin */
  travel: number
  /** exactly `duration` ms: fast first half, decelerating second half */
  duration: number
  turns: number
}

export function segmentAngle(count: number): number {
  return 360 / count
}

/** Angle (deg from 12 o'clock) at the centre of segment `index`. */
export function segmentCenter(index: number, count: number): number {
  return (index + 0.5) * segmentAngle(count)
}

export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** Segment under a hand pointing at `angle` (0 = 3 o'clock, clockwise). */
export function indexUnderHand(angle: number, count: number): number {
  const seg = segmentAngle(count)
  return Math.floor(normalizeDeg(angle + 90) / seg) % count
}

/**
 * Picks a uniformly random winning index first, then solves the hand angle
 * that lands on it. The winner is therefore decided *by* the final angle
 * instead of being guessed after the animation.
 */
export function planSpin(options: {
  count: number
  currentAngle: number
  duration?: number
  minTurns?: number
  extraTurns?: number
  jitterFraction?: number
  random?: () => number
}): SpinPlan {
  const {
    count,
    currentAngle,
    duration = 10000,
    minTurns = 8,
    extraTurns = 4,
    jitterFraction = 0.28,
    random = Math.random,
  } = options

  if (count < 1) throw new Error('planSpin needs at least one participant')

  const seg = segmentAngle(count)
  const index = Math.min(count - 1, Math.floor(random() * count))
  const jitter = (random() * 2 - 1) * jitterFraction * seg
  const target = segmentCenter(index, count) + jitter

  const turns = minTurns + Math.floor(random() * (extraTurns + 1))
  const delta = normalizeDeg(target - 90 - currentAngle)
  const travel = turns * 360 + delta

  return {
    index,
    startAngle: currentAngle,
    finalAngle: currentAngle + travel,
    travel,
    duration,
    turns,
  }
}

/** Point on the wheel rim for a local angle (SVG coords, y grows downward). */
export function polarPoint(radius: number, angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180
  return [radius * Math.sin(rad), -radius * Math.cos(rad)]
}

/** Path for one pie segment, starting at 12 o'clock and going clockwise. */
export function segmentPath(index: number, count: number, radius: number): string {
  const seg = segmentAngle(count)
  const [x0, y0] = polarPoint(radius, index * seg)
  const [x1, y1] = polarPoint(radius, (index + 1) * seg)
  const largeArc = seg > 180 ? 1 : 0
  const f = (n: number) => n.toFixed(3)
  return `M 0 0 L ${f(x0)} ${f(y0)} A ${radius} ${radius} 0 ${largeArc} 1 ${f(x1)} ${f(y1)} Z`
}

/** Vibrant, always-distinguishable color for segment `index`. */
export function segmentColor(index: number): string {
  const hue = (index * 137.508 + 208) % 360
  const lightness = index % 2 === 0 ? 46 : 38
  const saturation = index % 3 === 0 ? 78 : 70
  return `hsl(${hue.toFixed(1)} ${saturation}% ${lightness}%)`
}
