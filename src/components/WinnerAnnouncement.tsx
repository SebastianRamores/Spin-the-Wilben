import { useEffect, useRef } from 'react'
import type { Participant } from '../lib/participants'
import { truncate } from '../lib/text'
import './WinnerAnnouncement.css'

interface WinnerAnnouncementProps {
  winner: Participant
  message: string
  poolCount: number
  calledCount: number
  canSpinAgain: boolean
  onSpinAgain: () => void
  onClose: () => void
  onOpenParticipants: () => void
}

export function WinnerAnnouncement({
  winner,
  message,
  poolCount,
  calledCount,
  canSpinAgain,
  onSpinAgain,
  onClose,
  onOpenParticipants,
}: WinnerAnnouncementProps) {
  const primaryRef = useRef<HTMLButtonElement>(null)
  const name = truncate(winner.name, 24)
  const nameClass = name.length > 16 ? 'is-long' : name.length > 11 ? 'is-medium' : ''

  useEffect(() => {
    primaryRef.current?.focus()
  }, [])

  return (
    <div className="reveal" role="dialog" aria-modal="true" aria-labelledby="reveal-title">
      <div className="reveal__backdrop" onClick={onClose} />

      <div className="reveal__stage">
        <div className="reveal__rays" aria-hidden="true">
          <svg viewBox="-100 -100 200 200">
            <defs>
              <radialGradient id="rayFade" cx="50%" cy="50%" r="50%">
                <stop offset="30%" stopColor="#ffc93c" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ffc93c" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g fill="url(#rayFade)">
              {Array.from({ length: 24 }, (_, i) => (
                <path key={i} d="M0 0 L7 -100 L-7 -100 Z" transform={`rotate(${i * 15})`} />
              ))}
            </g>
          </svg>
        </div>

        <div className={`reveal__card ${nameClass}`}>
          <p className="reveal__kicker" id="reveal-title">
            The chosen one is…
          </p>
          <h2 className="reveal__name">{name}</h2>
          <p className="reveal__message">{message}</p>

          <div className="reveal__actions">
            <button
              ref={primaryRef}
              type="button"
              className="btn btn--primary btn--xl"
              onClick={onSpinAgain}
              disabled={!canSpinAgain}
            >
              SPIN AGAIN
              <kbd>Space</kbd>
            </button>
            <button type="button" className="btn btn--ghost" onClick={onOpenParticipants}>
              PARTICIPANTS
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              CLOSE
              <kbd>Esc</kbd>
            </button>
          </div>

          <p className="reveal__meta">
            {canSpinAgain
              ? `${poolCount} still in the pool`
              : 'Not enough participants left — add more names to keep spinning'}
            {calledCount > 0 ? ` · ${calledCount} already called` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
