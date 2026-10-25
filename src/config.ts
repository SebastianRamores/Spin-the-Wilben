export const APP_TITLE = 'SPIN THE WILBEN'
export const APP_SUBTITLE = "Who's getting called for recitation?"
export const APP_KICKER = 'CLASSROOM RANDOMIZER'

/** Portrait asset location. Replace `public/images/WilbenSpin.png` with the real cutout. */
export const PORTRAIT_SRC = `${import.meta.env.BASE_URL}images/WilbenSpin.png`

/**
 * Flip this to `true` if you swap the portrait back to placeholder art, so the
 * reminder badge in the UI comes back.
 */
export const PORTRAIT_IS_PLACEHOLDER = false

export const PLACEHOLDER_HINT =
  'Placeholder art is showing — replace public/images/WilbenSpin.png'

/** Shown instead when the portrait file fails to load. */
export const PORTRAIT_MISSING_HINT =
  'Portrait image not found — showing a stand-in. Add public/images/WilbenSpin.png'

/** Shown randomly under the winner. Edit freely. */
export const HUMOROUS_MESSAGES = [
  'Wilben has spoken!',
  'The wheel has chosen.',
  'No escaping recitation today!',
  'Congratulations! You’re up next.',
  'Wilben points at you. No refunds.',
  'Destiny called. It wants an answer.',
  'The hands of fate have spoken.',
  'Resistance is futile. Recite!',
]

/** Sample roster - replace with the real class list from the Participants panel. */
export const DEFAULT_NAMES = [
  'Wilben',
  'Alex',
  'Bea',
  'Carlo',
  'Dani',
  'Elle',
  'Franz',
  'Gia',
  'Hugo',
  'Iris',
  'Jomar',
  'Kim',
  'Luis',
]

export const MAX_PARTICIPANTS = 36
export const MIN_PARTICIPANTS_TO_SPIN = 2

/** The hand parks at 12 o'clock when the app loads. */
export const HAND_REST_ANGLE = -90

export const SPIN_TUNING = {
  /**
   * Every spin lasts exactly this long (ms): a fast constant sweep for the
   * first 5 s, then a decelerating 5 s crawl into the stop.
   */
  duration: 10000,
  /** Full rotations added on top of the winning segment alignment. */
  minTurns: 8,
  extraTurns: 4,
  /** How far off segment-center the hand may land (fraction of a segment). */
  jitterFraction: 0.28,
}
