import { useEffect, useState } from 'react'
import { PORTRAIT_SRC } from '../config'
import './WilbenPortrait.css'

interface WilbenPortraitProps {
  src?: string
  /** `rider` sits on the clock hand and rotates with it. */
  variant?: 'default' | 'rider'
  /** Notifies the shell so it can show a "placeholder art" reminder. */
  onMissingChange?: (missing: boolean) => void
}

/**
 * Wilben's cutout. The `rider` variant rides the clock hand as the pointer;
 * the default variant is a larger standing portrait. Drop the real cutout at
 * `public/images/WilbenSpin.png` (or pass `src`); if the image is missing the
 * built-in silhouette keeps the composition intact.
 */
export function WilbenPortrait({
  src = PORTRAIT_SRC,
  variant = 'default',
  onMissingChange,
}: WilbenPortraitProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = failedSrc === src

  useEffect(() => {
    onMissingChange?.(failed)
  }, [failed, onMissingChange])

  return (
    <div className={`wilben ${variant === 'rider' ? 'wilben--rider' : ''}`}>
      <div className="wilben__glow" aria-hidden="true" />
      <div className="wilben__figure">
        {failed ? (
          <FallbackSilhouette />
        ) : (
          <img
            className="wilben__img"
            src={src}
            alt={
              variant === 'rider'
                ? 'Wilben as the spinning clock hand'
                : 'Wilben, arms raised, holding up the spinning wheel'
            }
            draggable={false}
            onError={() => setFailedSrc(src)}
          />
        )}
      </div>
    </div>
  )
}

function FallbackSilhouette() {
  return (
    <svg className="wilben__fallback" viewBox="0 -52 200 372" role="img" aria-label="Placeholder Wilben silhouette with both arms raised">
      <g stroke="#150c38" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round">
        <path d="M58 118 L30 26" stroke="#150c38" strokeWidth="26" fill="none" />
        <path d="M142 118 L170 26" stroke="#150c38" strokeWidth="26" fill="none" />
      </g>
      <g stroke="#f0b084" strokeWidth="16" strokeLinecap="round">
        <path d="M58 118 L30 26" fill="none" />
        <path d="M142 118 L170 26" fill="none" />
      </g>
      <circle cx="30" cy="22" r="13" fill="#f0b084" stroke="#150c38" strokeWidth="5" />
      <circle cx="170" cy="22" r="13" fill="#f0b084" stroke="#150c38" strokeWidth="5" />
      <path d="M76 190 L74 306" stroke="#24314f" strokeWidth="30" strokeLinecap="round" />
      <path d="M124 190 L126 306" stroke="#24314f" strokeWidth="30" strokeLinecap="round" />
      <rect x="46" y="112" width="108" height="100" rx="34" fill="#12b5a5" stroke="#150c38" strokeWidth="7" />
      <circle cx="100" cy="72" r="40" fill="#f0b084" stroke="#150c38" strokeWidth="7" />
      <path d="M62 66 a38 38 0 0 1 76 0 q-38 -16 -76 0z" fill="#2a1b12" />
      <circle cx="86" cy="76" r="4.5" fill="#150c38" />
      <circle cx="114" cy="76" r="4.5" fill="#150c38" />
      <path d="M86 92 q14 12 28 0" fill="none" stroke="#150c38" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="66" cy="300" rx="22" ry="12" fill="#f5f7fc" stroke="#150c38" strokeWidth="5" />
      <ellipse cx="134" cy="300" rx="22" ry="12" fill="#f5f7fc" stroke="#150c38" strokeWidth="5" />
      <text x="100" y="176" textAnchor="middle" fontSize="34" fontFamily="var(--font-display)" fill="rgba(255,255,255,0.75)">
        ?
      </text>
    </svg>
  )
}
