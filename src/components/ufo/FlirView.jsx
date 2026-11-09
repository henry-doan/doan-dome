import { useEffect, useEffectEvent, useRef } from 'react'
import { TicTac } from './UfoArt.jsx'

const PLAY_MS = 4800

/** A small tile of grey noise, made once, for the camera's grain. */
let grainUrl = null
const grain = () => {
  if (grainUrl) return grainUrl
  const canvas = Object.assign(document.createElement('canvas'), { width: 128, height: 128 })
  const context = canvas.getContext('2d')
  const image = context.createImageData(128, 128)
  for (let index = 0; index < image.data.length; index += 4) {
    const value = Math.random() * 255
    image.data.set([value, value, value, 255], index)
  }
  context.putImageData(image, 0, 0)
  grainUrl = canvas.toDataURL()
  return grainUrl
}

const pad = (value, length) => String(Math.round(value)).padStart(length, '0')

/**
 * The tic tac caught on an infrared targeting camera: a grey, grainy picture
 * with a crosshair and readouts. The tracking box locks on, the tic tac
 * turns in the crosshair, then it shoots off faster than the camera can
 * follow and the track is lost. Everything moves with CSS animations; only
 * the readouts' numbers are updated, a few times a second.
 */
const FlirView = ({ onDone }) => {
  const readouts = useRef(null)
  const finish = useEffectEvent(() => onDone())

  useEffect(() => {
    const started = performance.now()
    const fields = readouts.current
    const update = () => {
      const t = (performance.now() - started) / 1000
      fields.querySelector('[data-range]').textContent = (14.2 - t * 0.31).toFixed(1)
      fields.querySelector('[data-alt]').textContent = pad(24870 + Math.sin(t * 2) * 40, 5)
      fields.querySelector('[data-bearing]').textContent = pad(312 + t * 1.6, 3)
      fields.querySelector('[data-clock]').textContent = `00:0${t.toFixed(1)}`
    }
    update()
    const ticker = setInterval(update, 120)
    const timer = setTimeout(finish, PLAY_MS)
    return () => {
      clearInterval(ticker)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="flir" role="img" aria-label="An infrared camera locks on to the tic tac before it speeds away">
      <div className="flir-grain" style={{ backgroundImage: `url(${grain()})` }} />
      <div className="flir-target">
        <TicTac />
      </div>
      <div className="flir-box" />
      <div className="flir-cross" />
      <div ref={readouts} className="flir-readouts">
        <p className="flir-tl">
          IR&nbsp;&nbsp;WHT
          <br />
          <span className="flir-track">TRK&nbsp;AUTO</span>
        </p>
        <p className="flir-tr">
          RNG&nbsp;<span data-range />&nbsp;NM
          <br />
          ALT&nbsp;<span data-alt />
          <br />
          BRG&nbsp;<span data-bearing />
        </p>
        <p className="flir-bl">
          <span data-clock />
        </p>
        <p className="flir-status">
          <span className="flir-lock">LOCK</span>
          <span className="flir-lost">TRACK LOST</span>
        </p>
      </div>
    </div>
  )
}

export default FlirView
