import freighter from '../../assets/freighter.webp'

/** The three UFOs: two drawn as small SVGs, and the freighter as a painted picture. */

/** A classic flying saucer: glass dome, gold-rimmed disc, blinking rim lights. */
export const Saucer = () => (
  <svg className="ufo-art" width="96" height="52" viewBox="0 0 96 52" aria-hidden="true">
    <defs>
      <radialGradient id="ufo-dome" cx="0.4" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#efe4ff" stopOpacity="0.95" />
        <stop offset="0.55" stopColor="#9b7ad8" stopOpacity="0.75" />
        <stop offset="1" stopColor="#3a1d6b" stopOpacity="0.9" />
      </radialGradient>
      <linearGradient id="ufo-disc" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f4dc9c" />
        <stop offset="0.45" stopColor="#d4af5f" />
        <stop offset="1" stopColor="#6b4f1d" />
      </linearGradient>
    </defs>
    <path d="M30 24c0-11 8-19 18-19s18 8 18 19z" fill="url(#ufo-dome)" stroke="#e8c97a" strokeWidth="1" />
    <ellipse cx="48" cy="28" rx="45" ry="11" fill="url(#ufo-disc)" stroke="#f4dc9c" strokeWidth="0.8" />
    <ellipse cx="48" cy="31" rx="30" ry="5" fill="#2e1a53" opacity="0.55" />
    <g className="ufo-lights">
      {[14, 28, 48, 68, 82].map((cx, index) => (
        <circle key={cx} cx={cx} cy={index === 2 ? 34 : 31} r="2.4" style={{ animationDelay: `${index * 0.18}s` }} />
      ))}
    </g>
  </svg>
)

/** The "tic tac": a smooth white capsule with no wings, windows or exhaust. */
export const TicTac = () => (
  <svg className="ufo-art" width="64" height="26" viewBox="0 0 64 26" aria-hidden="true">
    <defs>
      <linearGradient id="ufo-tictac" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#e6e3ec" />
        <stop offset="1" stopColor="#b9b3c6" />
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="58" height="18" rx="9" fill="url(#ufo-tictac)" />
    <rect x="12" y="7" width="30" height="3" rx="1.5" fill="#ffffff" opacity="0.85" />
  </svg>
)

/**
 * The space freighter (src/assets/freighter.webp), facing right, with a
 * flickering glow over its engine so it feels alive in flight.
 */
export const Freighter = () => (
  <span className="ufo-art ufo-freighter-art">
    <img src={freighter} alt="" draggable="false" />
    <span className="ufo-engine-glow" />
  </span>
)

export const UFO_ART = { saucer: Saucer, tictac: TicTac, freighter: Freighter }
