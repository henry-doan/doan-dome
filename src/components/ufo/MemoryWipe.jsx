import { useEffect, useEffectEvent } from 'react'
import agent from '../../assets/agent.webp'

const PLAY_MS = 2600
// Where the gadget's red lens is in the picture (docs/mib.png), as a share of
// its width and height. Update these when the picture changes.
const LENS = { x: 0.312, y: 0.539 }

/**
 * The saucer's encore: an agent in a black suit steps in, raises a
 * memory-wipe gadget, its red lens charges and beams at you, and a white
 * flash wipes the whole thing from memory. The picture keeps its shape while
 * covering the screen, so the glow always sits on the lens. Everything moves
 * with CSS animations.
 */
const MemoryWipe = ({ onDone }) => {
  const finish = useEffectEvent(() => onDone())

  useEffect(() => {
    const timer = setTimeout(finish, PLAY_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="memory-wipe" role="img" aria-label="An agent in a black suit wipes your memory with a flash of light">
      <div className="memory-wipe-scene">
        <img src={agent} alt="" draggable="false" />
        <div className="memory-wipe-lens" style={{ left: `${LENS.x * 100}%`, top: `${LENS.y * 100}%` }}>
          <span className="memory-wipe-charge" />
          <span className="memory-wipe-beam" />
        </div>
      </div>
      <div className="memory-wipe-flash" />
    </div>
  )
}

export default MemoryWipe
