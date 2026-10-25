import { useEffect, useRef, useState } from 'react'
import { MAX_PARTICIPANTS, MIN_PARTICIPANTS_TO_SPIN } from '../config'
import { cleanName, parseNameList, type BulkResult, type Participant, type Participants } from '../lib/participants'
import './ParticipantManager.css'

interface ParticipantManagerProps {
  onClose: () => void
  participants: Participants
  calledIds: string[]
  removeWinners: boolean
  onToggleRemoveWinners: (value: boolean) => void
  onRestoreCalled: () => void
  onAdd: (name: string) => string | null
  onRename: (id: string, name: string) => string | null
  onRemove: (id: string) => void
  onReplaceAll: (names: string[]) => BulkResult
  onAppendMany: (names: string[]) => BulkResult
  onRestoreSample: () => void
  onClearAll: () => void
}

function describeResult(result: BulkResult, verb: string): string {
  const parts: string[] = []
  parts.push(`${verb} ${result.added} ${result.added === 1 ? 'name' : 'names'}.`)
  if (result.duplicates) parts.push(`Skipped ${result.duplicates} duplicate${result.duplicates === 1 ? '' : 's'}.`)
  if (result.empties) parts.push(`Ignored ${result.empties} blank line${result.empties === 1 ? '' : 's'}.`)
  if (result.overflow) parts.push(`Dropped ${result.overflow} over the ${MAX_PARTICIPANTS}-name limit or too long.`)
  return parts.join(' ')
}

export function ParticipantManager({
  onClose,
  participants,
  calledIds,
  removeWinners,
  onToggleRemoveWinners,
  onRestoreCalled,
  onAdd,
  onRename,
  onRemove,
  onReplaceAll,
  onAppendMany,
  onRestoreSample,
  onClearAll,
}: ParticipantManagerProps) {
  const [draft, setDraft] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [bulk, setBulk] = useState('')
  const [bulkNote, setBulkNote] = useState<string | null>(null)
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = window.setTimeout(() => addInputRef.current?.focus(), 120)
    return () => window.clearTimeout(id)
  }, [])

  const full = participants.length >= MAX_PARTICIPANTS

  const submitAdd = () => {
    const error = onAdd(draft)
    if (error) {
      setAddError(error)
      return
    }
    setDraft('')
    setAddError(null)
  }

  const applyBulk = (mode: 'replace' | 'append') => {
    const names = parseNameList(bulk)
    if (names.length === 0) {
      setBulkNote('Nothing to import — paste one name per line first.')
      return
    }
    const result = mode === 'replace' ? onReplaceAll(names) : onAppendMany(names)
    setBulkNote(describeResult(result, mode === 'replace' ? 'Loaded' : 'Added'))
    setBulk('')
  }

  const commitRow = (participant: Participant, input: HTMLInputElement) => {
    const next = cleanName(input.value)
    if (next === participant.name) return
    const error = onRename(participant.id, input.value)
    if (error) {
      input.value = participant.name
      setRowError({ id: participant.id, message: error })
      return
    }
    setRowError(null)
  }

  return (
    <div className="pm">
      <div className="pm__backdrop" onClick={onClose} />

      <aside className="pm__panel" role="dialog" aria-modal="true" aria-labelledby="pm-title">
        <header className="pm__header">
          <div>
            <h2 id="pm-title">Participants</h2>
            <p className="pm__count">
              {participants.length} on the wheel
              {calledIds.length > 0 ? ` · ${calledIds.length} already called` : ''}
            </p>
          </div>
          <button type="button" className="pm__close" onClick={onClose} aria-label="Close participants panel">
            ×
          </button>
        </header>

        <div className="pm__body">
          <section className="pm__block">
            <label className="pm__label" htmlFor="pm-add">
              Quick add
            </label>
            <div className="pm__add-row">
              <input
                id="pm-add"
                ref={addInputRef}
                className="pm__input"
                value={draft}
                placeholder="Classmate's name"
                maxLength={32}
                onChange={(event) => {
                  setDraft(event.target.value)
                  setAddError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    submitAdd()
                  }
                }}
              />
              <button type="button" className="btn btn--primary" onClick={submitAdd} disabled={full}>
                ADD
              </button>
            </div>
            {addError && <p className="pm__error">{addError}</p>}
            {full && <p className="pm__error">The wheel is full ({MAX_PARTICIPANTS} names max).</p>}
            {!full && participants.length >= 20 && (
              <p className="pm__hint">
                Past 20 names the wedge labels get small — trim the roster for the back row.
              </p>
            )}
          </section>

          <section className="pm__block pm__block--list">
            <div className="pm__label-row">
              <span className="pm__label">On the wheel</span>
              <span className="pm__label-note">click a name to edit</span>
            </div>
            {participants.length === 0 ? (
              <p className="pm__empty">No participants yet. Add names above or paste a list below.</p>
            ) : (
              <ul className="pm__list">
                {participants.map((participant, index) => {
                  const called = calledIds.includes(participant.id)
                  return (
                    <li key={participant.id} className={`pm__row ${called ? 'is-called' : ''}`}>
                      <span className="pm__index">{index + 1}</span>
                      <input
                        className="pm__row-input"
                        defaultValue={participant.name}
                        maxLength={32}
                        aria-label={`Name of participant ${index + 1}`}
                        onBlur={(event) => commitRow(participant, event.currentTarget)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur()
                        }}
                      />
                      {called && <span className="pm__tag">called</span>}
                      <button
                        type="button"
                        className="pm__remove"
                        onClick={() => onRemove(participant.id)}
                        aria-label={`Remove ${participant.name}`}
                      >
                        ×
                      </button>
                      {rowError?.id === participant.id && <p className="pm__error pm__error--row">{rowError.message}</p>}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="pm__block">
            <label className="pm__label" htmlFor="pm-bulk">
              Paste a list (one name per line)
            </label>
            <textarea
              id="pm-bulk"
              className="pm__textarea"
              value={bulk}
              rows={5}
              placeholder={'Alex\nBea\nCarlo\nDani'}
              onChange={(event) => {
                setBulk(event.target.value)
                setBulkNote(null)
              }}
            />
            <div className="pm__bulk-actions">
              <button type="button" className="btn btn--primary" onClick={() => applyBulk('replace')}>
                REPLACE LIST
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => applyBulk('append')}>
                ADD TO LIST
              </button>
            </div>
            {bulkNote && <p className="pm__note">{bulkNote}</p>}
          </section>

          <section className="pm__block pm__settings">
            <label className="pm__switch">
              <input
                type="checkbox"
                checked={removeWinners}
                onChange={(event) => onToggleRemoveWinners(event.target.checked)}
              />
              <span className="pm__switch-track" aria-hidden="true">
                <span className="pm__switch-thumb" />
              </span>
              <span className="pm__switch-text">
                Remove selected names from future spins
                <small>Called classmates stay out of the pool until you reset.</small>
              </span>
            </label>

            <button
              type="button"
              className="btn btn--ghost pm__restore"
              onClick={onRestoreCalled}
              disabled={calledIds.length === 0}
            >
              RETURN {calledIds.length} CALLED {calledIds.length === 1 ? 'NAME' : 'NAMES'} TO THE POOL
            </button>
          </section>

          <section className="pm__block pm__footer">
            <button type="button" className="btn btn--ghost" onClick={onRestoreSample}>
              RESTORE SAMPLE ROSTER
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={onClearAll}
              disabled={participants.length === 0}
            >
              CLEAR ALL
            </button>
            <p className="pm__hint">
              The wheel needs at least {MIN_PARTICIPANTS_TO_SPIN} names to spin. Everything is saved in this browser.
            </p>
          </section>
        </div>
      </aside>
    </div>
  )
}
