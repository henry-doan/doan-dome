import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { recordSighting, subscribeToUfoRequests, takeUfoRequest, UFO_KINDS } from '../../lib/ufoStore.js'
import FlirView from './FlirView.jsx'
import Hyperspace from './Hyperspace.jsx'
import MemoryWipe from './MemoryWipe.jsx'
import { UFO_ART } from './UfoArt.jsx'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const between = (min, max) => min + Math.random() * (max - min)
const LABELS = { saucer: 'A flying saucer', tictac: 'A tic tac UFO', freighter: 'A space freighter' }
// Seconds before a UFO appears: the first visit, then later ones.
const TIMING = {
  sky: { first: [25, 50], later: [70, 160] },
  explore: { first: [15, 30], later: [40, 90] },
}
const SIZE = { saucer: [96, 52], tictac: [64, 26], freighter: [176, 87] }
// Clear of the header at the top and the navigation dial at the bottom.
const HEADER_H = 64
const DIAL_H = 96

/** The part of the panel that's on screen, in the panel's own coordinates. */
const visibleArea = (panel, mode) => {
  const box = panel.getBoundingClientRect()
  if (mode === 'explore') return { left: 0, right: box.width, top: 70, bottom: box.height - 40 }
  return {
    left: 0,
    right: box.width,
    top: Math.max(30, HEADER_H - box.top + 20),
    bottom: Math.min(box.height - 30, window.innerHeight - box.top - DIAL_H),
  }
}

/** How each UFO moves: a function of time giving its position, tilt and facing. */
const flightPlan = (kind, area) => {
  const { left, right, top, bottom } = area
  const span = bottom - top
  const dir = Math.random() < 0.5 ? 1 : -1
  const startX = dir > 0 ? left - 90 : right + 90

  if (kind === 'saucer') {
    const y = top + span * between(0.1, 0.45)
    return {
      step: (t) => ({ x: startX + dir * 70 * (t / 1000), y: y + Math.sin(t / 800) * 12, rot: Math.sin(t / 650) * 5, flip: false }),
    }
  }

  if (kind === 'freighter') {
    const y0 = top + span * between(0.15, 0.6)
    const slope = between(-0.12, 0.12)
    return {
      step: (t) => {
        const dx = dir * 150 * (t / 1000)
        return { x: startX + dx, y: y0 + Math.abs(dx) * slope, rot: Math.atan(slope) * (180 / Math.PI) * dir, flip: dir < 0 }
      },
    }
  }

  // The tic tac: hangs still, then jumps to a new spot almost instantly. It
  // dodges the pointer some of the time, and finally shoots off screen.
  const randomSpot = () => [between(left + 60, right - 60), between(top + 30, bottom - 30)]
  let from = randomSpot()
  let to = from
  let hopAt = 0
  let holdUntil = between(1400, 2600)
  let hops = 0
  let lastDodge = -Infinity
  const HOP_MS = 140
  return {
    appearsInPlace: true,
    step: (t) => {
      if (t >= holdUntil && t >= hopAt + HOP_MS) {
        hops += 1
        from = to
        to = hops > 7 ? [dir > 0 ? right + 200 : left - 200, between(top, bottom)] : randomSpot()
        hopAt = t
        holdUntil = t + (hops > 7 ? 300 : between(900, 2400))
      }
      const progress = Math.min(1, (t - hopAt) / (hops > 7 ? 260 : HOP_MS))
      const x = from[0] + (to[0] - from[0]) * progress
      const y = from[1] + (to[1] - from[1]) * progress
      return { x, y, rot: 0, flip: false, done: hops > 7 && progress >= 1 }
    },
    dodge: (t) => {
      if (t - lastDodge < 500 || t < hopAt + HOP_MS || Math.random() > 0.6) return
      lastDodge = t
      holdUntil = t
    },
  }
}

/**
 * The UFO easter eggs, for the Sky view and the night sky explore view. Now
 * and then a UFO crosses the sky. Clicking it:
 * - Saucer: it hovers, beams up a constellation, studies it and drops it
 *   back; then an agent in a black suit wipes your memory with a flash.
 * - Tic tac: an infrared targeting camera locks on before it speeds away.
 * - Freighter: a jump to lightspeed from its cockpit; while exploring, you
 *   come out somewhere else in the sky.
 *
 * Nothing runs between visits except one timer; the flight loop runs only
 * while a UFO is on screen.
 */
const UfoLayer = ({ mode, panelRef, chartRef }) => {
  const [ufo, setUfo] = useState(null)
  const [scene, setScene] = useState(null)
  const [beam, setBeam] = useState(null)
  const [lifted, setLifted] = useState(null)
  const [notice, setNotice] = useState(null)
  const shipRef = useRef(null)
  const position = useRef({ x: 0, y: 0, rot: 0, flip: false })
  const caught = useRef(false)
  const visits = useRef(0)
  const timers = useRef(new Set())

  const later = (callback, ms) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      callback()
    }, ms)
    timers.current.add(timer)
  }

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  // Schedule the next visit while the sky is empty.
  useEffect(() => {
    if (ufo || scene || reducedMotion()) return
    const [min, max] = TIMING[mode][visits.current === 0 ? 'first' : 'later']
    const timer = setTimeout(() => {
      if (document.hidden) return
      visits.current += 1
      setUfo({ id: Date.now(), kind: UFO_KINDS[Math.floor(Math.random() * UFO_KINDS.length)] })
    }, between(min, max) * 1000)
    return () => clearTimeout(timer)
  }, [mode, ufo, scene])

  // Replays from the account menu: the saucer flies in and abducts on its own;
  // the tic tac and freighter scenes play straight away. They don't count as sightings.
  const playRequest = useEffectEvent(() => {
    const replay = takeUfoRequest()
    if (!replay) return
    caught.current = true
    setScene(null)
    if (replay.kind === 'saucer') {
      setUfo({ id: replay.id, kind: 'saucer', replay: true })
    } else {
      setUfo(null)
      setScene({ kind: replay.kind === 'tictac' ? 'flir' : 'hyperspace', log: null })
    }
  })

  useEffect(() => {
    // A request made before this view was on screen (the menu switched to it) plays once it is.
    const pending = setTimeout(playRequest, 0)
    const unsubscribe = subscribeToUfoRequests(playRequest)
    return () => {
      clearTimeout(pending)
      unsubscribe()
    }
  }, [])

  // Summon one by hand while developing: ufo('saucer' | 'tictac' | 'freighter').
  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.ufo = (kind = 'saucer') => setUfo({ id: Date.now(), kind })
    return () => delete window.ufo
  }, [])

  const place = ({ x, y, rot = 0, flip = false }) => {
    position.current = { x, y, rot, flip }
    shipRef.current?.style.setProperty('transform', `translate(${x}px, ${y}px) rotate(${rot}deg) scaleX(${flip ? -1 : 1})`)
  }

  // Fly the UFO along its plan until it leaves or is caught.
  useEffect(() => {
    if (!ufo) return
    const panel = panelRef.current
    if (!panel) return
    caught.current = false
    const area = visibleArea(panel, mode)
    const plan = flightPlan(ufo.kind, area)
    const started = performance.now()
    let frame = 0

    const tick = (now) => {
      if (caught.current) return
      const next = plan.step(now - started)
      place(next)
      const offScreen = next.x < area.left - 160 || next.x > area.right + 160
      if (next.done || (now - started > 1000 && offScreen)) {
        setUfo(null)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    place(plan.step(0))
    frame = requestAnimationFrame(tick)

    // The tic tac dodges a pointer that comes close.
    const onPointerMove = (event) => {
      if (!plan.dodge) return
      const box = panel.getBoundingClientRect()
      const { x, y } = position.current
      if (Math.hypot(event.clientX - box.left - x, event.clientY - box.top - y) < 110) plan.dodge(performance.now() - started)
    }
    panel.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      panel.removeEventListener('pointermove', onPointerMove)
    }
  }, [ufo, mode, panelRef])

  /** Moves the caught UFO smoothly to (x, y). */
  const glide = (x, y, ms) =>
    new Promise((done) => {
      const start = { ...position.current }
      const began = performance.now()
      const step = (now) => {
        const progress = Math.min(1, (now - began) / ms)
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2
        place({ x: start.x + (x - start.x) * eased, y: start.y + (y - start.y) * eased, rot: start.rot * (1 - eased) })
        if (progress < 1) requestAnimationFrame(step)
        else done()
      }
      requestAnimationFrame(step)
    })

  const announce = (text) => {
    setNotice({ id: Date.now(), text })
    later(() => setNotice(null), 4200)
  }

  // Replays from the menu aren't sightings, so they have no sightings line.
  const sightingsLine = (log) => (log ? ` · UFO sightings: ${log.total} (${log.kinds} of ${UFO_KINDS.length} kinds)` : '')

  /** The saucer beams up a constellation, studies it and drops it back. */
  const abduct = async (log) => {
    const panel = panelRef.current
    const area = visibleArea(panel, mode)
    const { x } = position.current
    let target = null

    if (mode === 'explore') {
      const picked = chartRef.current?.pick(x, (area.top + area.bottom) / 2)
      if (picked) target = { center: picked.center, top: picked.top, name: picked.name, picked }
    } else {
      const box = panel.getBoundingClientRect()
      const options = [...panel.querySelectorAll('.constellation:not(.is-dimmed)')]
        .filter((item) => !item.querySelector('.new-constellation'))
        .map((item) => {
          const rect = item.querySelector('.constellation-button').getBoundingClientRect()
          return { item, rect: { left: rect.left - box.left, top: rect.top - box.top, width: rect.width, height: rect.height } }
        })
        .filter(({ rect }) => rect.top > area.top + 60 && rect.top + rect.height < area.bottom)
      const nearest = options.sort((a, b) => Math.abs(a.rect.left + a.rect.width / 2 - x) - Math.abs(b.rect.left + b.rect.width / 2 - x))[0]
      if (nearest) {
        const { rect, item } = nearest
        target = { center: [rect.left + rect.width / 2, rect.top + rect.height * 0.4], top: rect.top, name: item.querySelector('.constellation-name')?.textContent, item }
      }
    }

    if (!target) {
      announce(`The saucer found nothing to study.${sightingsLine(log)}`)
      await glide(position.current.x, area.top - 200, 1200)
      setUfo(null)
      return
    }

    const hoverY = Math.max(area.top + 10, target.top - 120)
    await glide(target.center[0], hoverY, 900)
    setBeam({ x: target.center[0], top: hoverY + 20, height: target.center[1] - hoverY + 30 })
    // How far up the beam carries the constellation, to the saucer.
    const liftY = hoverY - target.center[1]

    later(() => {
      if (target.item) {
        target.item.style.setProperty('--abduct-y', `${liftY}px`)
        target.item.classList.add('is-abducted')
      } else {
        chartRef.current?.hide(target.picked.id)
        setLifted({ ...target.picked, up: false, dy: liftY })
        requestAnimationFrame(() => requestAnimationFrame(() => setLifted((current) => current && { ...current, up: true })))
      }
    }, 350)

    // Studied for a moment, then returned.
    later(() => {
      if (target.item) target.item.classList.remove('is-abducted')
      else setLifted((current) => current && { ...current, up: false })
    }, 3200)

    later(() => {
      setBeam(null)
      if (!target.item) {
        chartRef.current?.show()
        setLifted(null)
      }
      // The saucer zips away, then an agent arrives to wipe everyone's memory.
      glide(position.current.x + (Math.random() < 0.5 ? -1 : 1) * 900, area.top - 160, 700).then(() => {
        setUfo(null)
        setScene({ kind: 'memory', log })
      })
    }, 4700)
  }

  const catchUfo = (isReplay = false) => {
    if (!ufo || caught.current) return
    caught.current = true
    // Only a UFO caught in the wild counts toward the sightings log.
    const log = isReplay ? null : recordSighting(ufo.kind)
    if (ufo.kind === 'saucer') {
      abduct(log)
    } else if (ufo.kind === 'tictac') {
      setUfo(null)
      setScene({ kind: 'flir', log })
    } else {
      setUfo(null)
      setScene({ kind: 'hyperspace', log })
    }
  }

  // A replayed saucer abducts on its own once it's well into view.
  const autoCatch = useEffectEvent(() => catchUfo(true))
  useEffect(() => {
    if (!ufo?.replay) return
    const timer = setTimeout(autoCatch, 1800)
    return () => clearTimeout(timer)
  }, [ufo])

  const endScene = () => {
    // Guarded: an unguarded read of scene here lets the compiler assume it's
    // never null and drop the optional checks in the render below.
    if (!scene) return
    const { kind, log } = scene
    setScene(null)
    if (kind === 'flir') {
      announce(`Tic tac sighted, and gone.${sightingsLine(log)}`)
    } else if (kind === 'memory') {
      announce(`Nothing to see here.${sightingsLine(log)}`)
    } else {
      if (mode === 'explore') chartRef.current?.jumpTo(between(0, 360), between(-50, 70))
      announce(`${mode === 'explore' ? 'Dropped out of lightspeed somewhere new.' : 'Back from lightspeed.'}${sightingsLine(log)}`)
    }
  }

  const sceneKind = scene ? scene.kind : null
  const Art = ufo ? UFO_ART[ufo.kind] : null
  const [w, h] = ufo ? SIZE[ufo.kind] : [0, 0]

  return (
    <>
      {beam && <div className="ufo-beam" style={{ left: beam.x, top: beam.top, height: beam.height }} />}
      {lifted && (
        <svg className={`ufo-lifted ${lifted.up ? 'is-up' : ''}`} style={{ '--lift-y': `${lifted.dy}px`, transformOrigin: `${lifted.center[0]}px ${lifted.center[1]}px` }} aria-hidden="true">
          {lifted.lines.map((line, index) => (
            <polyline key={index} points={line.map((point) => point.join(',')).join(' ')} />
          ))}
          {lifted.stars.map(([x, y], index) => (
            <circle key={index} cx={x} cy={y} r="2" />
          ))}
        </svg>
      )}
      {ufo && (
        <button
          key={ufo.id}
          ref={shipRef}
          type="button"
          tabIndex={-1}
          className={`ufo ufo-${ufo.kind}`}
          style={{ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2 }}
          aria-label={LABELS[ufo.kind]}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            catchUfo(Boolean(ufo.replay))
          }}
        >
          <Art />
        </button>
      )}
      {sceneKind === 'flir' && <FlirView onDone={endScene} />}
      {sceneKind === 'hyperspace' && <Hyperspace onDone={endScene} />}
      {sceneKind === 'memory' && <MemoryWipe onDone={endScene} />}
      {notice && (
        <p key={notice.id} className="ufo-notice" role="status">
          {notice.text}
        </p>
      )}
    </>
  )
}

export default UfoLayer
