import { useEffect, useEffectEvent, useRef } from 'react'
import cockpit from '../../assets/cockpit.webp'

// Timeline, in ms: stars drift, stretch into streaks, flash, tunnel, drop out.
const STRETCH_AT = 600
const FLASH_AT = 1500
const TUNNEL_END = 2900
const PLAY_MS = 3600
const STAR_COUNT = 240

const ease = (t) => t * t * (3 - 2 * t)

/**
 * The freighter's jump to lightspeed, seen from its cockpit. The stars are
 * drawn on a canvas at normal resolution, only while the jump plays; the
 * cockpit picture (with see-through windows) shakes as the jump hits, and
 * the tunnel's violet light spills onto it.
 */
const Hyperspace = ({ onDone }) => {
  const canvasRef = useRef(null)
  const finish = useEffectEvent(() => onDone())

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const width = (canvas.width = canvas.clientWidth)
    const height = (canvas.height = canvas.clientHeight)
    const cx = width / 2
    // The windshield's middle in the cockpit picture.
    const cy = height * 0.43
    const reach = Math.hypot(width, height) / 2
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      distance: 0.05 + Math.random() * 0.95,
      speed: 0.6 + Math.random() * 0.8,
      hue: 250 + Math.random() * 60,
    }))
    const started = performance.now()
    let frame = 0

    const draw = (now) => {
      const t = now - started
      context.clearRect(0, 0, width, height)
      context.lineCap = 'round'

      if (t < FLASH_AT) {
        // Drifting stars that stretch into streaks as the jump builds.
        const stretch = t < STRETCH_AT ? 0 : ease((t - STRETCH_AT) / (FLASH_AT - STRETCH_AT))
        context.strokeStyle = '#ffffff'
        for (const star of stars) {
          const d = star.distance * reach * (1 + (t / 1000) * 0.08 * star.speed)
          const length = 1.5 + stretch * stretch * reach * 0.9 * star.speed
          const x = cx + Math.cos(star.angle) * d
          const y = cy + Math.sin(star.angle) * d
          context.globalAlpha = 0.5 + stretch * 0.5
          context.lineWidth = 1 + stretch * 1.2
          context.beginPath()
          context.moveTo(x, y)
          context.lineTo(x + Math.cos(star.angle) * length, y + Math.sin(star.angle) * length)
          context.stroke()
        }
      } else if (t < TUNNEL_END) {
        // The tunnel: violet and white streaks rushing outward, slowly turning.
        const progress = (t - FLASH_AT) / (TUNNEL_END - FLASH_AT)
        const turn = progress * 0.6
        for (const star of stars) {
          const d = ((star.distance + progress * 2.4 * star.speed) % 1) * reach
          const angle = star.angle + turn
          const length = reach * 0.25 * star.speed
          context.strokeStyle = `hsl(${star.hue} 90% ${70 + star.speed * 15}%)`
          context.globalAlpha = Math.min(1, d / (reach * 0.25))
          context.lineWidth = 1.4
          context.beginPath()
          context.moveTo(cx + Math.cos(angle) * d, cy + Math.sin(angle) * d)
          context.lineTo(cx + Math.cos(angle) * (d + length), cy + Math.sin(angle) * (d + length))
          context.stroke()
        }
      } else {
        // Dropping out: the streaks snap back to still stars.
        const settle = ease(Math.min(1, (t - TUNNEL_END) / 400))
        context.fillStyle = '#ffffff'
        for (const star of stars) {
          const d = star.distance * reach
          const length = (1 - settle) * reach * 0.3 * star.speed
          context.globalAlpha = 0.85
          context.fillRect(cx + Math.cos(star.angle) * (d + length), cy + Math.sin(star.angle) * (d + length), 1.6, 1.6)
        }
      }
      context.globalAlpha = 1
      if (t < PLAY_MS) frame = requestAnimationFrame(draw)
      else finish()
    }

    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="hyperspace" role="img" aria-label="The freighter jumps to lightspeed">
      <canvas ref={canvasRef} className="hyperspace-stars" />
      <div className="hyperspace-flash" />
      {/* The cockpit picture (src/assets/cockpit.webp), with see-through windows. */}
      <img className="hyperspace-cockpit" src={cockpit} alt="" draggable="false" />
      <div className="hyperspace-glow" />
    </div>
  )
}

export default Hyperspace
