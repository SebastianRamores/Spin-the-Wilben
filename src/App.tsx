import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Confetti } from './components/Confetti'
import { ParticipantManager } from './components/ParticipantManager'
import { SpinWheel, type SpinWheelHandle } from './components/SpinWheel'
import { WinnerAnnouncement } from './components/WinnerAnnouncement'
import {
  APP_KICKER,
  APP_SUBTITLE,
  APP_TITLE,
  DEFAULT_NAMES,
  PLACEHOLDER_HINT,
  PORTRAIT_MISSING_HINT,
  PORTRAIT_IS_PLACEHOLDER,
  HUMOROUS_MESSAGES,
  MAX_PARTICIPANTS,
  MIN_PARTICIPANTS_TO_SPIN,
} from './config'
import { usePersistentState } from './hooks/usePersistentState'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { gameAudio } from './lib/audio'
import {
  cleanName,
  createId,
  isParticipantList,
  mergeNames,
  toParticipants,
  validateNewName,
  type BulkResult,
  type Participant,
} from './lib/participants'
import './styles/app.css'

const SAMPLE_ROSTER = toParticipants(DEFAULT_NAMES)

function reviveParticipants(raw: unknown): Participant[] | null {
  if (!Array.isArray(raw)) return null
  return raw.filter(isParticipantList).map((p) => ({
    id: p.id || createId(),
    name: cleanName(p.name),
  }))
}

function reviveStringList(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  return raw.filter((item): item is string => typeof item === 'string')
}

function reviveBoolean(raw: unknown): boolean | null {
  return typeof raw === 'boolean' ? raw : null
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion()

  const [participants, setParticipants] = usePersistentState<Participant[]>(
    'spin-the-wilben:participants:v1',
    SAMPLE_ROSTER,
    reviveParticipants,
  )
  const [calledIds, setCalledIds] = usePersistentState<string[]>(
    'spin-the-wilben:called:v1',
    [],
    reviveStringList,
  )
  const [removeWinners, setRemoveWinners] = usePersistentState<boolean>(
    'spin-the-wilben:remove-winners:v1',
    false,
    reviveBoolean,
  )
  const [soundOn, setSoundOn] = usePersistentState<boolean>('spin-the-wilben:sound:v1', true, reviveBoolean)

  const [spinning, setSpinning] = useState(false)
  const [pendingWinner, setPendingWinner] = useState<Participant | null>(null)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [message, setMessage] = useState(HUMOROUS_MESSAGES[0])
  const [confettiKey, setConfettiKey] = useState(0)
  const [managerOpen, setManagerOpen] = useState(false)
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const [portraitMissing, setPortraitMissing] = useState(false)
  const [pendingSpin, setPendingSpin] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [live, setLive] = useState('')
  const [fullscreen, setFullscreen] = useState(false)
  const [wheelSize, setWheelSize] = useState(620)

  const wheelRef = useRef<SpinWheelHandle>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<number | null>(null)
  const lastMessage = useRef('')

  const calledSet = useMemo(() => new Set(calledIds), [calledIds])
  const pool = useMemo(() => participants.filter((p) => !calledSet.has(p.id)), [participants, calledSet])
  const canSpin = pool.length >= MIN_PARTICIPANTS_TO_SPIN

  /* ---------- layout sizing so a projector screen never scrolls ---------- */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const measure = () => {
      const styles = getComputedStyle(stage)
      const width = stage.clientWidth
      const height =
        stage.clientHeight - (parseFloat(styles.paddingTop) || 0) - (parseFloat(styles.paddingBottom) || 0)
      const size = Math.max(220, Math.min(height, width))
      setWheelSize(Math.floor(size))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [])

  /* ------------------------------- feedback ------------------------------- */
  const showToast = useCallback((text: string) => {
    setToast(text)
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2800)
  }, [])

  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
  }, [])

  useEffect(() => {
    gameAudio.setEnabled(soundOn)
  }, [soundOn])

  const pickMessage = useCallback(() => {
    const options = HUMOROUS_MESSAGES.filter((item) => item !== lastMessage.current)
    const next = options[Math.floor(Math.random() * options.length)] ?? HUMOROUS_MESSAGES[0]
    lastMessage.current = next
    return next
  }, [])

  /* --------------------------- spin orchestration -------------------------- */
  const handleSpinStart = useCallback(() => setSpinning(true), [])

  const handleSpinEnd = useCallback((selected: Participant) => {
    setSpinning(false)
    setPendingWinner(selected)
  }, [])

  // Hold the stopped hand on screen for a beat so everyone sees who it points
  // at, then open the result card.
  useEffect(() => {
    if (!pendingWinner) return
    const id = window.setTimeout(() => {
      setWinner(pendingWinner)
      setPendingWinner(null)
      setMessage(pickMessage())
      setConfettiKey((key) => key + 1)
      setLive(`${pendingWinner.name} was selected for recitation.`)
      gameAudio.fanfare()
    }, 700)
    return () => window.clearTimeout(id)
  }, [pendingWinner, pickMessage])

  const triggerSpin = useCallback(() => {
    if (winner || pendingWinner) return
    gameAudio.unlock()
    if (!canSpin) {
      showToast(`Add at least ${MIN_PARTICIPANTS_TO_SPIN} participants before spinning.`)
      return
    }
    const started = wheelRef.current?.spin() ?? false
    if (!started) showToast('Hold on, Wilben is already spinning.')
  }, [canSpin, pendingWinner, showToast, winner])

  const closeReveal = useCallback(() => {
    if (winner && removeWinners) {
      setCalledIds((prev) => (prev.includes(winner.id) ? prev : [...prev, winner.id]))
      const remaining = pool.filter((p) => p.id !== winner.id).length
      if (remaining < MIN_PARTICIPANTS_TO_SPIN) showToast('Pool is running dry — add more names to keep spinning.')
    }
    setWinner(null)
  }, [pool, removeWinners, setCalledIds, showToast, winner])

  const spinAgain = useCallback(() => {
    closeReveal()
    setPendingSpin(true)
  }, [closeReveal])

  useEffect(() => {
    if (!pendingSpin) return
    if (winner || pendingWinner || managerOpen) return
    const id = requestAnimationFrame(() => {
      setPendingSpin(false)
      const started = wheelRef.current?.spin() ?? false
      if (!started) showToast('Add at least two participants to spin again.')
    })
    return () => cancelAnimationFrame(id)
  }, [managerOpen, pendingSpin, pendingWinner, showToast, winner])

  /* ---------------------------- participant CRUD --------------------------- */
  const handleAdd = useCallback(
    (name: string): string | null => {
      if (participants.length >= MAX_PARTICIPANTS) return `The wheel is full (${MAX_PARTICIPANTS} max).`
      const result = validateNewName(name, participants)
      if (!result.ok) return result.error
      setParticipants((prev) => [...prev, { id: createId(), name: result.name }])
      return null
    },
    [participants, setParticipants],
  )

  const handleRename = useCallback(
    (id: string, name: string): string | null => {
      const others = participants.filter((p) => p.id !== id)
      const result = validateNewName(name, others)
      if (!result.ok) return result.error
      setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, name: result.name } : p)))
      return null
    },
    [participants, setParticipants],
  )

  const handleRemove = useCallback(
    (id: string) => {
      setParticipants((prev) => prev.filter((p) => p.id !== id))
      setCalledIds((prev) => prev.filter((called) => called !== id))
    },
    [setCalledIds, setParticipants],
  )

  const handleReplaceAll = useCallback(
    (names: string[]): BulkResult => {
      const result = mergeNames(names, [], MAX_PARTICIPANTS, 'replace')
      setParticipants(toParticipants(result.names))
      setCalledIds([])
      return result
    },
    [setCalledIds, setParticipants],
  )

  const handleAppendMany = useCallback(
    (names: string[]): BulkResult => {
      const result = mergeNames(names, participants, MAX_PARTICIPANTS, 'append')
      if (result.names.length > 0) {
        setParticipants((prev) => [...prev, ...toParticipants(result.names)])
      }
      return result
    },
    [participants, setParticipants],
  )

  const handleRestoreSample = useCallback(() => {
    setParticipants(toParticipants(DEFAULT_NAMES))
    setCalledIds([])
    showToast('Sample roster restored.')
  }, [setCalledIds, setParticipants, showToast])

  const handleClearAll = useCallback(() => {
    setParticipants([])
    setCalledIds([])
    showToast('Roster cleared.')
  }, [setCalledIds, setParticipants, showToast])

  const handleRestoreCalled = useCallback(() => {
    setCalledIds([])
    showToast('Everyone is back in the pool.')
  }, [setCalledIds, showToast])

  const handleResetWheel = useCallback(() => {
    setCalledIds([])
    setPendingWinner(null)
    setWinner(null)
    showToast('Wheel reset — full roster back in play.')
  }, [setCalledIds, showToast])

  /* ------------------------------ shell chrome ----------------------------- */
  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }
    void document.documentElement.requestFullscreen?.().catch(() => showToast('Fullscreen is blocked in this browser.'))
  }, [showToast])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)

      if (event.key === 'Escape') {
        if (managerOpen) setManagerOpen(false)
        else if (winner) closeReveal()
        return
      }
      if (typing) return
      if (managerOpen || winner || pendingWinner) return
      if (event.code === 'Space' || event.key === 'Enter') {
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) return
        event.preventDefault()
        triggerSpin()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeReveal, managerOpen, pendingWinner, triggerSpin, winner])

  const fullscreenSupported = typeof document !== 'undefined' && Boolean(document.fullscreenEnabled)

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__titles">
          <p className="app__kicker">{APP_KICKER}</p>
          <h1 className="app__title" aria-label={APP_TITLE}>
            <span className="app__title-word">SPIN</span>
            <span className="app__title-the">THE</span>
            <span className="app__title-name">WILBEN</span>
          </h1>
          <p className="app__subtitle">{APP_SUBTITLE}</p>
        </div>

        <div className="app__hud">
          <span className="chip chip--gold">
            <strong>{pool.length}</strong> in the pool
          </span>
          {calledIds.length > 0 && (
            <span className="chip">
              <strong>{calledIds.length}</strong> called
            </span>
          )}
          {removeWinners && <span className="chip chip--ghost">Auto-remove on</span>}
          {(PORTRAIT_IS_PLACEHOLDER || portraitMissing) && !noticeDismissed && (
            <button type="button" className="chip chip--notice" onClick={() => setNoticeDismissed(true)}>
              <span>{portraitMissing ? PORTRAIT_MISSING_HINT : PLACEHOLDER_HINT}</span>
              <em aria-hidden="true">×</em>
            </button>
          )}
        </div>
      </header>

      <main className="stage" ref={stageRef} style={{ '--wheel-size': `${wheelSize}px` } as CSSProperties}>
        <SpinWheel
          ref={wheelRef}
          participants={pool}
          locked={Boolean(winner || pendingWinner)}
          onSpinStart={handleSpinStart}
          onSpinEnd={handleSpinEnd}
          onPortraitMissing={setPortraitMissing}
        />
      </main>

      <footer className="app__controls">
        <div className="app__controls-group">
          <button type="button" className="btn btn--ghost" onClick={() => setManagerOpen(true)} disabled={spinning}>
            PARTICIPANTS
            <span className="btn__badge">{participants.length}</span>
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleResetWheel} disabled={spinning}>
            RESET WHEEL
          </button>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--xl app__spin"
          onClick={triggerSpin}
          disabled={spinning || !canSpin || Boolean(pendingWinner)}
        >
          {spinning ? 'SPINNING…' : 'SPIN THE WILBEN'}
          <kbd>Space</kbd>
        </button>

        <div className="app__controls-group">
          <button
            type="button"
            className={`btn btn--ghost ${soundOn ? '' : 'is-off'}`}
            onClick={() => {
              gameAudio.unlock()
              setSoundOn((value) => !value)
            }}
            aria-pressed={soundOn}
          >
            SOUND {soundOn ? 'ON' : 'OFF'}
          </button>
          {fullscreenSupported && (
            <button type="button" className="btn btn--ghost" onClick={toggleFullscreen} aria-pressed={fullscreen}>
              {fullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
            </button>
          )}
        </div>
      </footer>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      <div className="sr-only" role="status" aria-live="polite">
        {live}
      </div>

      {winner && (
        <WinnerAnnouncement
          winner={winner}
          message={message}
          poolCount={pool.length}
          calledCount={calledIds.length}
          canSpinAgain={pool.filter((p) => p.id !== winner.id).length >= MIN_PARTICIPANTS_TO_SPIN || !removeWinners}
          onSpinAgain={spinAgain}
          onClose={closeReveal}
          onOpenParticipants={() => {
            closeReveal()
            setManagerOpen(true)
          }}
        />
      )}

      {managerOpen && (
        <ParticipantManager
          onClose={() => setManagerOpen(false)}
          participants={participants}
          calledIds={calledIds}
          removeWinners={removeWinners}
          onToggleRemoveWinners={(value) => {
            setRemoveWinners(value)
            if (value) showToast('Called names will sit out the next spins.')
          }}
          onRestoreCalled={handleRestoreCalled}
          onAdd={handleAdd}
          onRename={handleRename}
          onRemove={handleRemove}
          onReplaceAll={handleReplaceAll}
          onAppendMany={handleAppendMany}
          onRestoreSample={handleRestoreSample}
          onClearAll={handleClearAll}
        />
      )}

      <Confetti fireKey={confettiKey} disabled={reducedMotion} />
    </div>
  )
}
