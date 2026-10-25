type AudioContextCtor = new () => AudioContext

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    AudioContext?: AudioContextCtor
    webkitAudioContext?: AudioContextCtor
  }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

/**
 * Tiny WebAudio kit: no audio files, everything is synthesized so the app
 * keeps working offline. Every method is a no-op when audio is disabled or
 * the browser has no WebAudio support.
 */
export class GameAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  private enabled = true
  private lastTick = 0

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled && this.ctx) void this.ctx.suspend()
    if (enabled && this.ctx) void this.ctx.resume()
  }

  /** Must be called from a user gesture at least once (browser autoplay rules). */
  unlock() {
    const ctx = this.ensure()
    if (ctx && ctx.state === 'suspended') void ctx.resume()
  }

  private ensure(): AudioContext | null {
    if (!this.enabled) return null
    if (!this.ctx) {
      const Ctor = audioContextCtor()
      if (!Ctor) return null
      try {
        this.ctx = new Ctor()
      } catch {
        return null
      }
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.75
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  private tone(options: {
    freq: number
    at?: number
    duration: number
    type?: OscillatorType
    peak?: number
    endFreq?: number
  }): void {
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const { freq, duration, type = 'triangle', peak = 0.22, endFreq } = options
    const at = ctx.currentTime + (options.at ?? 0)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, at)
    if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), at + duration)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(peak, at + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(at)
    osc.stop(at + duration + 0.05)
  }

  /** Short click as the pointer skips over a peg. */
  tick(energy = 1) {
    if (!this.enabled) return
    const now = performance.now()
    if (now - this.lastTick < 38) return
    this.lastTick = now
    const freq = 950 + Math.random() * 420
    this.tone({ freq, duration: 0.055, type: 'square', peak: 0.05 + 0.06 * energy })
  }

  /** Celebratory fanfare when the wheel settles. */
  fanfare() {
    if (!this.enabled) return
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      this.tone({ freq, at: i * 0.1, duration: 0.34, type: 'triangle', peak: 0.2 })
      this.tone({ freq: freq * 2, at: i * 0.1, duration: 0.2, type: 'square', peak: 0.05 })
    })
    this.tone({ freq: 1318.5, at: 0.42, duration: 0.9, type: 'triangle', peak: 0.16 })
    this.tone({ freq: 90, at: 0, duration: 0.5, type: 'sine', peak: 0.3, endFreq: 45 })
  }

  /** Rising whoosh when the wheel launches. */
  whoosh() {
    if (!this.enabled) return
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    if (!this.noise) {
      const frames = Math.floor(ctx.sampleRate * 0.7)
      const buf = ctx.createBuffer(1, frames, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1
      this.noise = buf
    }
    const at = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 1.1
    filter.frequency.setValueAtTime(260, at)
    filter.frequency.exponentialRampToValueAtTime(2400, at + 0.28)
    filter.frequency.exponentialRampToValueAtTime(420, at + 0.62)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.16, at + 0.12)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.62)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)
    src.start(at)
    src.stop(at + 0.7)
  }

  /** Soft UI blip for buttons. */
  click() {
    if (!this.enabled) return
    this.tone({ freq: 660, duration: 0.05, type: 'triangle', peak: 0.08 })
  }
}

export const gameAudio = new GameAudio()
