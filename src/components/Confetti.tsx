import { useEffect, useRef } from 'react'
import './Confetti.css'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  vr: number
  color: string
  shape: 'rect' | 'circle' | 'streamer'
  life: number
  maxLife: number
}

const COLORS = ['#ffc93c', '#ff9f1c', '#ff4d97', '#26e0d0', '#7b5cff', '#fff3c4', '#4ade80']

interface ConfettiProps {
  /** Increment to fire a burst. `null`/`0` does nothing. */
  fireKey: number
  disabled?: boolean
}

export function Confetti({ fireKey, disabled = false }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number | null>(null)
  const lastRunRef = useRef(0)

  useEffect(() => {
    if (disabled || fireKey <= 0 || lastRunRef.current === fireKey) return
    lastRunRef.current = fireKey

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const spawnCannon = (originX: number, originY: number, angleDeg: number, amount: number) => {
      for (let i = 0; i < amount; i += 1) {
        const angle = ((angleDeg + (Math.random() * 46 - 23)) * Math.PI) / 180
        const speed = 480 + Math.random() * 800
        const shapeRoll = Math.random()
        particlesRef.current.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 8 + Math.random() * 9,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 14,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: shapeRoll > 0.78 ? 'circle' : shapeRoll > 0.52 ? 'streamer' : 'rect',
          life: 0,
          maxLife: 2.6 + Math.random() * 1.6,
        })
      }
    }

    spawnCannon(w * 0.03, h * 0.98, -64, 85)
    spawnCannon(w * 0.97, h * 0.98, -116, 85)
    spawnCannon(w * 0.5, h * 0.02, 90, 45)

    let previous = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - previous) / 1000)
      previous = now
      ctx.clearRect(0, 0, w, h)

      const alive: Particle[] = []
      for (const p of particlesRef.current) {
        p.life += dt
        p.vy += 1250 * dt
        p.vx *= 1 - 1.1 * dt
        p.vy *= 1 - 0.6 * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt

        const remaining = p.maxLife - p.life
        if (remaining <= 0 || p.y > h + 80) continue

        const alpha = Math.min(1, remaining / 0.6)
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.shape === 'streamer') {
          ctx.fillRect(-p.size * 0.22, -p.size * 1.5, p.size * 0.44, p.size * 3)
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66)
        }
        ctx.restore()
        alive.push(p)
      }
      particlesRef.current = alive

      if (alive.length > 0) {
        rafRef.current = requestAnimationFrame(frame)
      } else {
        ctx.clearRect(0, 0, w, h)
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      particlesRef.current = []
    }
  }, [fireKey, disabled])

  return <canvas ref={canvasRef} className="confetti" aria-hidden="true" />
}
