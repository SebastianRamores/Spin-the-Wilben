import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { HAND_REST_ANGLE, MIN_PARTICIPANTS_TO_SPIN, SPIN_TUNING } from '../config'
import { gameAudio } from '../lib/audio'
import { spinEase } from '../lib/easing'
import type { Participant } from '../lib/participants'
import { fitLabel, textWidth, truncate } from '../lib/text'
import {
  indexUnderHand,
  planSpin,
  polarPoint,
  segmentCenter,
  segmentColor,
  segmentPath,
  type SpinPlan,
} from '../lib/wheel'
import { WilbenPortrait } from './WilbenPortrait'
import './SpinWheel.css'

export interface SpinWheelHandle {
  spin: () => boolean
  isSpinning: () => boolean
}

interface SpinWheelProps {
  participants: Participant[]
  /** While the result is being revealed, the hand must not start another spin. */
  locked?: boolean
  onSpinStart?: () => void
  onSpinEnd: (winner: Participant, plan: SpinPlan) => void
  onPortraitMissing?: (missing: boolean) => void
}

const SEG_R = 230
const VIEW = 250
const BULBS = 28
const BULB_R = 239.5
const HUB_R = 38
const LABEL_ANCHOR = 222
const LABEL_MAX_W = 52
const LABEL_MAX_FONT = 20
const LABEL_MIN_FONT = 8

export const SpinWheel = forwardRef<SpinWheelHandle, SpinWheelProps>(function SpinWheel(
  { participants, locked = false, onSpinStart, onSpinEnd, onPortraitMissing },
  ref,
) {
  const handRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const angleRef = useRef(HAND_REST_ANGLE)
  const spinningRef = useRef(false)
  const [spinning, setSpinning] = useState(false)
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null)

  const count = participants.length
  const canSpin = count >= MIN_PARTICIPANTS_TO_SPIN
  const layoutKey = participants.map((p) => p.id).join('|')

  const applyAngle = useCallback((deg: number) => {
    if (handRef.current) handRef.current.style.transform = `rotate(${deg}deg)`
  }, [])

  const segments = useMemo(() => {
    const seg = 360 / count
    const arc = (seg * Math.PI) / 180
    const baseFont = Math.max(
      LABEL_MIN_FONT,
      Math.min(LABEL_MAX_FONT, 0.56 * (0.8 * SEG_R * arc)),
    )
    const minFont = Math.max(LABEL_MIN_FONT, baseFont * 0.55)
    return participants.map((p, i) => {
      const name = truncate(p.name, 26)
      let fontSize = baseFont
      while (fontSize > minFont && textWidth(name, fontSize) > LABEL_MAX_W) fontSize -= 0.5
      const label = fitLabel(name, LABEL_MAX_W, fontSize)
      return {
        id: p.id,
        color: segmentColor(i),
        path: segmentPath(i, count, SEG_R),
        center: segmentCenter(i, count),
        fontSize,
        label,
      }
    })
  }, [count, participants])

  const bulbs = useMemo(
    () =>
      Array.from({ length: BULBS }, (_, i) => {
        const [x, y] = polarPoint(BULB_R, (i * 360) / BULBS)
        return { x, y, delay: (i / BULBS) * 1.2 }
      }),
    [],
  )

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  useEffect(() => stop, [stop])

  // A new roster resets the hand to 12 o'clock.
  useEffect(() => {
    if (spinningRef.current) return
    angleRef.current = HAND_REST_ANGLE
    setWinnerIndex(null)
    applyAngle(HAND_REST_ANGLE)
  }, [layoutKey, applyAngle])

  const spin = useCallback((): boolean => {
    if (spinningRef.current || !canSpin || locked) return false

    const plan = planSpin({
      count,
      currentAngle: angleRef.current,
      ...SPIN_TUNING,
    })
    const t0 = performance.now()
    let lastIndex = indexUnderHand(angleRef.current, count)

    spinningRef.current = true
    setSpinning(true)
    setWinnerIndex(null)
    onSpinStart?.()
    gameAudio.whoosh()

    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / plan.duration)
      const deg = plan.startAngle + plan.travel * spinEase(p)
      applyAngle(deg)

      const idx = indexUnderHand(deg, count)
      if (idx !== lastIndex) {
        lastIndex = idx
        gameAudio.tick(1 - p)
      }

      if (p < 1) {
        rafRef.current = requestAnimationFrame(step)
        return
      }

      rafRef.current = null
      applyAngle(plan.finalAngle)
      angleRef.current = plan.finalAngle
      spinningRef.current = false
      setSpinning(false)
      setWinnerIndex(plan.index)
      onSpinEnd(participants[plan.index], plan)
    }

    rafRef.current = requestAnimationFrame(step)
    return true
  }, [applyAngle, canSpin, count, locked, onSpinEnd, onSpinStart, participants])

  useImperativeHandle(ref, () => ({ spin, isSpinning: () => spinningRef.current }), [spin])

  const hubLabel = canSpin ? 'SPIN' : 'ADD'
  const hubKicker = canSpin ? (spinning ? 'GOOD LUCK' : 'WILBEN SAYS') : 'NAMES'

  return (
    <div className={`wheel ${spinning ? 'is-spinning' : ''} ${canSpin ? '' : 'is-empty'}`}>
      <div className="wheel__shadow" aria-hidden="true" />

      <svg className="wheel__faces" viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} aria-hidden="true">
        <circle r={SEG_R + 1} fill="rgba(9,4,30,0.55)" />
        {segments.map((segment) => (
          <path
            key={segment.id}
            d={segment.path}
            fill={segment.color}
            stroke="rgba(255,255,255,0.14)"
            strokeWidth="1"
          />
        ))}
        {winnerIndex !== null && segments[winnerIndex] && (
          <path className="wheel__winner" d={segments[winnerIndex].path} />
        )}
      </svg>

      <svg className="wheel__chrome" viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} aria-hidden="true">
        <defs>
          <linearGradient id="rimGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe9a8" />
            <stop offset="35%" stopColor="#ffc93c" />
            <stop offset="70%" stopColor="#ff9f1c" />
            <stop offset="100%" stopColor="#ffd166" />
          </linearGradient>
          <radialGradient id="hubDark" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#2b1f5e" />
            <stop offset="100%" stopColor="#150c38" />
          </radialGradient>
        </defs>
        <circle r={SEG_R + 9} fill="none" stroke="url(#rimGold)" strokeWidth="15" />
        <circle r={SEG_R + 1} fill="none" stroke="rgba(20,10,45,0.75)" strokeWidth="3" />
        <circle r={SEG_R + 17} fill="none" stroke="rgba(255,209,102,0.35)" strokeWidth="2" />
        {bulbs.map((bulb, i) => (
          <circle
            key={i}
            className="wheel__bulb"
            cx={bulb.x}
            cy={bulb.y}
            r={5.4}
            style={{ animationDelay: `${bulb.delay}s` }}
          />
        ))}
        <circle r={HUB_R} fill="url(#hubDark)" stroke="url(#rimGold)" strokeWidth="4" />
      </svg>

      <div
        ref={handRef}
        className="wheel__hand"
        data-testid="wheel-hand"
        style={{ transform: `rotate(${HAND_REST_ANGLE}deg)` }}
      >
        <div className="wheel__shaft" aria-hidden="true" />
        <div className="wheel__tip" aria-hidden="true" />
        <div className="wheel__rider-glow" aria-hidden="true" />
        <div className="wheel__rider">
          <WilbenPortrait variant="rider" onMissingChange={onPortraitMissing} />
        </div>
      </div>

      <svg className="wheel__labels" viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`} aria-hidden="true">
        {segments.map((segment) => (
          <g key={`label-${segment.id}`} transform={`rotate(${segment.center - 90})`}>
            <text
              className="wheel__label"
              x={LABEL_ANCHOR}
              y={0}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={segment.fontSize}
            >
              {segment.label}
            </text>
          </g>
        ))}
      </svg>

      <button
        type="button"
        className="wheel__hub"
        onClick={spin}
        disabled={!canSpin || spinning || locked}
        aria-label={canSpin ? 'Spin the wheel' : 'Add at least two participants first'}
      >
        <span className="wheel__hub-glow" aria-hidden="true" />
        <span className="wheel__hub-text">
          <small>{hubKicker}</small>
          <strong>{hubLabel}</strong>
        </span>
      </button>
    </div>
  )
})
