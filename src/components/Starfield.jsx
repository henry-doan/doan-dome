import { useEffect, useEffectEvent, useRef } from 'react'
import { seededRandom } from '../lib/random.js'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
// Twinkle brightness is rounded to this many steps, so each frame paints a
// handful of batches instead of one fill per star.
const ALPHA_STEPS = 8

/**
 * A twinkling night sky drawn on a canvas, with an occasional shooting star.
 * Star and streak colors come from the CSS variables --star and --streak, so
 * the sky follows the app theme. Motion stops for reduced-motion users and
 * while the tab is hidden.
 *
 * `drift` turns the sky slowly sideways (pixels per second); it pauses while
 * the pointer is over the sky. With `onCatch`, shooting stars can be clicked:
 * the streak bursts into sparks and onCatch({ x, y }) gets the point,
 * relative to the canvas. `streakSlowdown` stretches each streak's life so
 * they are easier to catch.
 *
 * With `showers`, every `showerMin`–`showerMax` seconds a meteor shower
 * bursts: a dozen or so meteors streaking out from one point in the sky
 * over a few seconds, as real showers seem to. `onShower` is told when one starts.
 */
const Starfield = ({
  density = 0.00018,
  shootingMin = 9,
  shootingMax = 18,
  shooting = true,
  seed = 'sky',
  drift = 0,
  streakSlowdown = 1,
  showers = false,
  showerMin = 25,
  showerMax = 50,
  onShower,
  onCatch,
  className = '',
}) => {
  const canvasRef = useRef(null)
  const canCatch = Boolean(onCatch)
  const handleCatch = useEffectEvent((point) => onCatch?.(point))
  const handleShower = useEffectEvent(() => onShower?.())

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const random = seededRandom(seed)
    let stars = []
    let streaks = []
    let sparks = []
    let driftOffset = 0
    let isPaused = false
    let width = 0
    let height = 0
    let frame = 0
    let nextStreakAt = 0
    let nextShowerAt = 0
    let meteors = []
    let colors = { star: '#fff', streak: '#fff' }
    const isStill = reducedMotion()

    const readColors = () => {
      const style = getComputedStyle(canvas)
      colors = {
        star: style.getPropertyValue('--star').trim() || '#ffffff',
        streak: style.getPropertyValue('--streak').trim() || '#ffffff',
      }
    }

    const resize = () => {
      // Dots don't need full retina sharpness; 1.5× keeps them crisp for far less drawing.
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * ratio)
      canvas.height = Math.round(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const count = Math.max(40, Math.round(width * height * density))
      stars = Array.from({ length: count }, () => ({
        x: random() * width,
        y: random() * height,
        r: random() < 0.08 ? 1.3 + random() * 0.9 : 0.4 + random() * 0.8,
        phase: random() * Math.PI * 2,
        speed: 0.6 + random() * 1.6,
      }))
      readColors()
    }

    const launchStreak = (now) => {
      const fromLeft = random() < 0.5
      const angle = (fromLeft ? 0.35 : Math.PI - 0.35) + (random() - 0.5) * 0.3
      streaks.push({
        x: fromLeft ? random() * width * 0.6 : width * 0.4 + random() * width * 0.6,
        y: random() * height * 0.45,
        dx: Math.cos(angle),
        dy: Math.sin(angle),
        born: now,
        life: (900 + random() * 500) * streakSlowdown,
        length: 90 + random() * 90,
      })
      nextStreakAt = now + (shootingMin + random() * (shootingMax - shootingMin)) * 1000
    }

    // A meteor shower: meteors fly out from one radiant point, a few at a time.
    const launchShower = (now) => {
      const radiant = { x: width * (0.2 + random() * 0.6), y: height * (-0.1 + random() * 0.35) }
      const count = 7 + Math.floor(random() * 6)
      for (let index = 0; index < count; index += 1) meteors.push({ at: now + random() * 3600, radiant })
      nextShowerAt = now + (showerMin + random() * (showerMax - showerMin)) * 1000
      handleShower()
    }

    const launchMeteor = (now, { radiant }) => {
      const angle = Math.PI / 2 + (random() - 0.5) * 2.4
      const start = 30 + random() * 240
      streaks.push({
        x: radiant.x + Math.cos(angle) * start,
        y: radiant.y + Math.sin(angle) * start,
        dx: Math.cos(angle),
        dy: Math.sin(angle),
        born: now,
        life: 450 + random() * 650,
        length: 45 + random() * 110,
        distance: 110 + random() * 230,
        width: 1.1 + random() * 0.8,
      })
    }

    const draw = (now) => {
      context.clearRect(0, 0, width, height)
      context.fillStyle = colors.star
      const batches = Array.from({ length: ALPHA_STEPS + 1 }, () => new Path2D())
      for (const star of stars) {
        const x = (((star.x + driftOffset) % width) + width) % width
        const alpha = isStill ? 0.75 : 0.45 + 0.55 * (0.5 + 0.5 * Math.sin((now / 1000) * star.speed + star.phase))
        const batch = batches[Math.round(alpha * ALPHA_STEPS)]
        batch.moveTo(x + star.r, star.y)
        batch.arc(x, star.y, star.r, 0, Math.PI * 2)
      }
      batches.forEach((batch, step) => {
        context.globalAlpha = step / ALPHA_STEPS
        context.fill(batch)
      })
      streaks = streaks.filter((streak) => now - streak.born < streak.life)
      for (const streak of streaks) {
        const progress = (now - streak.born) / streak.life
        const travel = progress * (streak.distance ?? width * 0.35)
        const headX = streak.x + streak.dx * travel
        const headY = streak.y + streak.dy * travel
        streak.head = [headX, headY]
        const gradient = context.createLinearGradient(headX, headY, headX - streak.dx * streak.length, headY - streak.dy * streak.length)
        gradient.addColorStop(0, colors.streak)
        gradient.addColorStop(1, 'transparent')
        context.globalAlpha = Math.sin(progress * Math.PI)
        context.strokeStyle = gradient
        context.lineWidth = streak.width ?? 1.6
        context.beginPath()
        context.moveTo(headX, headY)
        context.lineTo(headX - streak.dx * streak.length, headY - streak.dy * streak.length)
        context.stroke()
      }
      sparks = sparks.filter((spark) => now - spark.born < spark.life)
      context.fillStyle = colors.streak
      for (const spark of sparks) {
        const age = (now - spark.born) / 1000
        const progress = (now - spark.born) / spark.life
        context.globalAlpha = 1 - progress
        context.beginPath()
        context.arc(spark.x + spark.vx * age, spark.y + spark.vy * age + 30 * age * age, spark.r * (1 - progress * 0.6), 0, Math.PI * 2)
        context.fill()
      }
      context.globalAlpha = 1
    }

    // Distance from a point to a streak, measured along its visible trail.
    const distanceTo = (streak, x, y) => {
      if (!streak.head) return Infinity
      const [hx, hy] = streak.head
      const tx = hx - streak.dx * streak.length
      const ty = hy - streak.dy * streak.length
      const along = Math.max(0, Math.min(1, ((x - hx) * (tx - hx) + (y - hy) * (ty - hy)) / streak.length ** 2))
      return Math.hypot(x - (hx + (tx - hx) * along), y - (hy + (ty - hy) * along))
    }
    const streakAt = (event) => {
      if (event.target.closest?.('button, a, input, [role="dialog"]')) return null
      const box = canvas.getBoundingClientRect()
      const x = event.clientX - box.left
      const y = event.clientY - box.top
      const streak = streaks.find((item) => distanceTo(item, x, y) < 22)
      return streak ? { streak, x, y } : null
    }

    const host = canvas.parentElement
    const handleEnter = () => {
      isPaused = true
    }
    const handleLeave = () => {
      isPaused = false
    }
    const handleDown = (event) => {
      const hit = canCatch && streakAt(event)
      if (!hit) return
      event.preventDefault()
      streaks = streaks.filter((item) => item !== hit.streak)
      const now = performance.now()
      for (let index = 0; index < 18; index += 1) {
        const angle = random() * Math.PI * 2
        const speed = 30 + random() * 90
        sparks.push({ x: hit.x, y: hit.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 0.8 + random() * 1.4, born: now, life: 600 + random() * 500 })
      }
      handleCatch({ x: hit.x, y: hit.y })
    }
    host?.addEventListener('pointerenter', handleEnter)
    host?.addEventListener('pointerleave', handleLeave)
    host?.addEventListener('pointerdown', handleDown)

    let last = 0
    const tick = (now) => {
      frame = requestAnimationFrame(tick)
      if (document.hidden || now - last < 33) return
      if (drift && !isPaused && last) driftOffset += (drift * Math.min(now - last, 100)) / 1000
      last = now
      if (shooting && now >= nextStreakAt) launchStreak(now)
      if (showers && now >= nextShowerAt) launchShower(now)
      if (meteors.length) {
        for (const meteor of meteors.filter((item) => item.at <= now)) launchMeteor(now, meteor)
        meteors = meteors.filter((item) => item.at > now)
      }
      draw(now)
    }

    resize()
    const observer = new ResizeObserver(() => {
      resize()
      if (isStill) draw(0)
    })
    observer.observe(canvas)
    const themeObserver = new MutationObserver(() => {
      readColors()
      if (isStill) draw(0)
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    if (isStill) draw(0)
    else {
      nextStreakAt = performance.now() + 2500
      // The first shower comes fairly soon, so it's not missed.
      nextShowerAt = performance.now() + 10000 + random() * 6000
      frame = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      themeObserver.disconnect()
      host?.removeEventListener('pointerenter', handleEnter)
      host?.removeEventListener('pointerleave', handleLeave)
      host?.removeEventListener('pointerdown', handleDown)
    }
  }, [density, seed, shooting, shootingMin, shootingMax, drift, streakSlowdown, showers, showerMin, showerMax, canCatch])

  return <canvas ref={canvasRef} className={`starfield ${className}`} aria-hidden="true" />
}

export default Starfield
