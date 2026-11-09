import { startTransition, useActionState, useEffect, useRef, useState } from 'react'
import domeOpen from '../assets/dome-open.webp'
import domeShutter from '../assets/dome-shutter.webp'
import slotMask from '../assets/dome-slot-mask.png'
import Icon from '../components/Icon.jsx'
import Logo from '../components/Logo.jsx'
import Starfield from '../components/Starfield.jsx'
import { useLibrary } from '../hooks/useLibrary.js'
import { DECK_FILE_ACCEPT, readDeckFile } from '../lib/deckFile.js'
import { createDeck, importDeck, setShowIntro } from '../lib/deckStore.js'
import { navigate } from '../lib/router.js'

const OPEN_MS = 1900
const LAUNCH_MS = 1300
const ARRIVE_MS = 900
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * The start screen: inside the observatory with the shutter closed.
 * Opening it slides the shutter up to reveal a live sky; choosing what to
 * do tilts the view up into the stars while the presentation is prepared.
 *
 * The scene is three layers: the starfield, the shutter strip (clipped to
 * the slot's shape) and the dome artwork with the slot cut out.
 */
const DomeIntro = () => {
  const { settings } = useLibrary()
  const [isOpen, setIsOpen] = useState(false)
  const [isReady, setIsReady] = useState(false)
  // Heading to the sky: 'launching' tilts up into the stars, 'arriving' fades out.
  const [skyFlight, setSkyFlight] = useState(null)
  const fileInput = useRef(null)
  const firstChoice = useRef(null)

  const [result, launch, isPending] = useActionState(async (_previous, request) => {
    try {
      const work = request.type === 'file' ? readDeckFile(request.file).then(importDeck) : Promise.resolve(createDeck())
      const [id] = await Promise.all([work, wait(reducedMotion() ? 150 : LAUNCH_MS)])
      return { id, error: null }
    } catch (error) {
      return { id: null, error: error.message }
    }
  }, { id: null, error: null })

  const isLaunching = isPending || Boolean(result.id) || Boolean(skyFlight)
  const isArriving = Boolean(result.id) || skyFlight === 'arriving'

  /** The same tilt into the stars as starting a presentation, then the sky. */
  const flyToSky = () => {
    if (isLaunching) return
    if (reducedMotion()) {
      navigate('/home')
      return
    }
    setSkyFlight('launching')
  }

  useEffect(() => {
    if (!skyFlight) return
    const timer =
      skyFlight === 'launching'
        ? setTimeout(() => setSkyFlight('arriving'), LAUNCH_MS)
        : setTimeout(() => navigate('/home'), ARRIVE_MS)
    return () => clearTimeout(timer)
  }, [skyFlight])

  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => setIsReady(true), reducedMotion() ? 0 : OPEN_MS * 0.8)
    return () => clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (isReady) firstChoice.current?.focus({ preventScroll: true })
  }, [isReady])

  useEffect(() => {
    if (!result.id) return
    const timer = setTimeout(() => navigate(`/deck/${result.id}`, { replace: true }), reducedMotion() ? 100 : ARRIVE_MS)
    return () => clearTimeout(timer)
  }, [result.id])

  const phase = isLaunching ? 'is-launching' : isOpen ? 'is-open' : 'is-closed'

  return (
    <main className={`dome-intro ${phase} ${isArriving ? 'is-arriving' : ''}`}>
      <title>Doan Dome</title>

      <div className="dome-scene" aria-hidden="true">
        <Starfield seed="dome" density={0.0006} shootingMin={3} shootingMax={7} className="dome-sky" />
        <div className="dome-shutter" style={{ maskImage: `url(${slotMask})`, WebkitMaskImage: `url(${slotMask})` }}>
          <img src={domeShutter} alt="" draggable="false" />
        </div>
        <img className="dome-art" src={domeOpen} alt="" draggable="false" />
      </div>

      <button type="button" className="intro-skip" onClick={flyToSky}>
        Skip to your sky
        <Icon name="chevronRight" size={16} />
      </button>

      <div className="dome-panel">
        {!isOpen ? (
          <div className="dome-welcome">
            <Logo variant="full" size={150} />
            <button type="button" className="button button-gold button-large" onClick={() => setIsOpen(true)}>
              <Icon name="moon" size={18} />
              Open the dome
            </button>
          </div>
        ) : (
          <div className={`dome-choices ${isReady ? 'is-ready' : ''}`} inert={!isReady || isLaunching}>
            <h1>What shall we present tonight?</h1>
            <div className="dome-choice-row">
              <button ref={firstChoice} type="button" className="button button-gold button-large" onClick={() => startTransition(() => launch({ type: 'new' }))}>
                <Icon name="plus" size={18} />
                New presentation
              </button>
              <button type="button" className="button button-ghost button-large" onClick={() => fileInput.current.click()}>
                <Icon name="open" size={18} />
                Open presentation
              </button>
              <input
                ref={fileInput}
                type="file"
                className="visually-hidden"
                accept={DECK_FILE_ACCEPT}
                tabIndex={-1}
                onChange={(event) => {
                  const [file] = event.target.files
                  event.target.value = ''
                  if (file) startTransition(() => launch({ type: 'file', file }))
                }}
              />
            </div>
            <p className="dome-hint">Opens Doan Dome (.dome) files. PowerPoint and PDF are coming.</p>
            {result.error && (
              <p className="dome-error" role="alert">
                {result.error}
              </p>
            )}
            <button type="button" className="text-link dome-library" onClick={flyToSky}>
              Go to your sky
            </button>
          </div>
        )}
      </div>

      <label className="intro-remember">
        <input type="checkbox" checked={!settings.showIntro} onChange={(event) => setShowIntro(!event.target.checked)} />
        Go straight to my sky next time
      </label>
    </main>
  )
}

export default DomeIntro
