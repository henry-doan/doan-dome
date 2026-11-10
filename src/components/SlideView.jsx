import { SLIDE_SIZES } from '../lib/layouts.js'
import { seededRandom } from '../lib/random.js'
import { getShape } from '../lib/shapes.js'
import { getSlideTheme, resolveTextStyle, shapeColors } from '../lib/slideThemes.js'

const MONO = "'Courier Prime', 'Courier New', monospace"

/**
 * The Area 51 theme's artwork: a green radar grid, a classified banner top
 * and bottom, a red stamp, a radar scope with a sweep (it turns while
 * presenting) and a redacted file line.
 */
const Area51 = ({ seed, width, height }) => {
  const grid = `g51-${seed}`
  const sweep = `s51-${seed}`
  const glow = `v51-${seed}`
  const scope = { x: width - 230, y: height - 250, r: 150 }
  const corner = 70
  const brackets = [
    [48, 48, 1, 1],
    [width - 48, 48, -1, 1],
    [48, height - 48, 1, -1],
    [width - 48, height - 48, -1, -1],
  ]
  const random = seededRandom(seed)
  const fileNo = Math.floor(random() * 9000) + 1000
  // Black bars of random lengths, laid end to end after "SUBJECT:".
  let barX = 450
  const redactions = [180, 120, 230, 90].map((base) => {
    const w = base * (0.7 + random() * 0.6)
    const bar = { x: barX, w }
    barX += w + 14
    return bar
  })

  return (
    <svg className="slide-decoration" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <pattern id={grid} width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M80 0H0V80" fill="none" stroke="#2fd165" strokeWidth="1" opacity="0.16" />
        </pattern>
        <radialGradient id={glow} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor="#0b2a15" />
          <stop offset="1" stopColor="#020a05" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={sweep} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5dff8a" stopOpacity="0" />
          <stop offset="1" stopColor="#5dff8a" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${glow})`} />
      <rect width={width} height={height} fill={`url(#${grid})`} />

      {/* Targeting brackets in the corners. */}
      <g fill="none" stroke="#2fd165" strokeWidth="3" opacity="0.7">
        {brackets.map(([x, y, dx, dy]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y + dy * corner}V${y}H${x + dx * corner}`} />
        ))}
      </g>

      {/* Classification banners. */}
      <g fontFamily={MONO} fontWeight="700" textAnchor="middle" letterSpacing="6">
        <text x={width / 2} y="62" fontSize="26" fill="#5dff8a" opacity="0.85">TOP SECRET // MAJIC // EYES ONLY</text>
        <text x={width / 2} y={height - 40} fontSize="22" fill="#5dff8a" opacity="0.6">DECLASSIFY ON: NEVER</text>
      </g>

      {/* The redacted file line, bottom left. */}
      <g fontFamily={MONO} fontSize="22" fill="#b9f5c9" opacity="0.7">
        <text x="110" y={height - 96}>FILE 51-{fileNo} · SUBJECT:</text>
        {redactions.map(({ x, w }) => (
          <rect key={x} x={x} y={height - 116} width={w} height="26" fill="#1d5c31" stroke="#2fd165" strokeWidth="1.5" strokeOpacity="0.6" />
        ))}
      </g>

      {/* The radar scope, with a few blips. */}
      <g transform={`translate(${scope.x} ${scope.y})`}>
        <g fill="none" stroke="#2fd165" opacity="0.5">
          <circle r={scope.r} strokeWidth="2.5" />
          <circle r={scope.r * 0.66} strokeWidth="1.2" />
          <circle r={scope.r * 0.33} strokeWidth="1.2" />
          <path d={`M${-scope.r} 0H${scope.r}M0 ${-scope.r}V${scope.r}`} strokeWidth="1" />
        </g>
        <g className="area51-sweep">
          <path d={`M0 0L${scope.r} 0A${scope.r} ${scope.r} 0 0 0 ${scope.r * Math.cos(-0.9)} ${scope.r * Math.sin(-0.9)}Z`} fill={`url(#${sweep})`} />
          <path d={`M0 0H${scope.r}`} stroke="#5dff8a" strokeWidth="2.5" />
        </g>
        <g fill="#5dff8a">
          <circle cx="-52" cy="-70" r="6" />
          <circle cx="78" cy="38" r="4.5" opacity="0.7" />
          <ellipse cx="-30" cy="88" rx="12" ry="5" />
        </g>
      </g>

      {/* The stamp. */}
      <g transform={`translate(${width - 300} 150) rotate(-12)`} fill="none" stroke="#d93a3a" opacity="0.8">
        <rect x="-170" y="-48" width="340" height="96" strokeWidth="6" rx="6" />
        <rect x="-158" y="-36" width="316" height="72" strokeWidth="2" rx="3" />
        <text x="-136" y="16" textLength="272" lengthAdjust="spacingAndGlyphs" fontFamily={MONO} fontSize="44" fontWeight="700" fill="#d93a3a" stroke="none">
          CLASSIFIED
        </text>
      </g>
    </svg>
  )
}

/** Theme artwork behind the content: stars, an atlas border, nebula clouds or a band. */
const Decoration = ({ theme, seed, width, height }) => {
  if (!theme.decoration) return null

  if (theme.decoration === 'area51') return <Area51 seed={seed} width={width} height={height} />

  if (theme.decoration === 'band') {
    return (
      <div className="slide-decoration" aria-hidden="true">
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, background: theme.accents[0] }} />
        <div style={{ position: 'absolute', left: 28, top: 0, bottom: 0, width: 8, background: theme.accents[2] }} />
      </div>
    )
  }

  if (theme.decoration === 'atlas') {
    const inset = 36
    return (
      <svg className="slide-decoration" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <g fill="none" stroke="#b88a3e">
          <rect x={inset} y={inset} width={width - inset * 2} height={height - inset * 2} strokeWidth="3" />
          <rect x={inset + 12} y={inset + 12} width={width - inset * 2 - 24} height={height - inset * 2 - 24} strokeWidth="1.2" />
          {[
            [inset + 12, inset + 12],
            [width - inset - 12, inset + 12],
            [inset + 12, height - inset - 12],
            [width - inset - 12, height - inset - 12],
          ].map(([cx, cy]) => (
            <g key={`${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r="26" strokeWidth="1.4" />
              <path d={`M${cx - 34} ${cy}h68 M${cx} ${cy - 34}v68`} strokeWidth="1" />
              <path d={`M${cx} ${cy - 18}l5 13 13 5-13 5-5 13-5-13-13-5 13-5z`} fill="#b88a3e" stroke="none" />
            </g>
          ))}
        </g>
      </svg>
    )
  }

  const random = seededRandom(seed)
  const stars = Array.from({ length: theme.decoration === 'nebula' ? 90 : 120 }, () => ({
    x: random() * width,
    y: random() * height,
    r: random() < 0.1 ? 2.6 + random() * 2 : 0.8 + random() * 1.4,
    o: 0.35 + random() * 0.6,
  }))
  const corner = [
    [width - 330, 110],
    [width - 210, 170],
    [width - 250, 290],
    [width - 120, 330],
    [width - 160, 450],
  ]

  return (
    <svg className="slide-decoration" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {theme.decoration === 'nebula' && (
        <>
          <defs>
            <radialGradient id={`n1-${seed}`}>
              <stop offset="0" stopColor="#e58bb8" stopOpacity="0.55" />
              <stop offset="1" stopColor="#e58bb8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`n2-${seed}`}>
              <stop offset="0" stopColor="#3fb8af" stopOpacity="0.45" />
              <stop offset="1" stopColor="#3fb8af" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={width * 0.82} cy={height * 0.95} rx={width * 0.42} ry={height * 0.42} fill={`url(#n1-${seed})`} />
          <ellipse cx={width * 1.02} cy={height * 0.45} rx={width * 0.3} ry={height * 0.5} fill={`url(#n2-${seed})`} />
        </>
      )}
      <g fill={theme.decoration === 'nebula' ? '#ffffff' : '#c9d1e0'}>
        {stars.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} opacity={star.o} />
        ))}
      </g>
      {theme.decoration === 'stars' && (
        <g stroke="#d4af5f" strokeWidth="1.6" fill="#e8c97a" opacity="0.7">
          <polyline points={corner.map((point) => point.join(',')).join(' ')} fill="none" />
          {corner.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" stroke="none" />
          ))}
        </g>
      )}
    </svg>
  )
}

export const SlideElement = ({ element, theme }) => {
  const box = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.w,
    height: element.h,
    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
    opacity: element.opacity ?? 1,
  }

  if (element.type === 'text') {
    const style = resolveTextStyle(element, theme)
    return (
      <div className="slide-text" style={{ ...box, ...style, fontSize: style.fontSize }}>
        <div className="slide-text-inner">{element.text}</div>
      </div>
    )
  }

  if (element.type === 'image') {
    return <img className="slide-image" src={element.src} alt={element.alt ?? ''} style={{ ...box, objectFit: element.fit ?? 'cover' }} draggable="false" />
  }

  const colors = shapeColors(element, theme)
  const inset = colors.strokeWidth / 2
  return (
    <svg className="slide-shape" style={box} viewBox={`${-inset} ${-inset} ${element.w + colors.strokeWidth} ${element.h + colors.strokeWidth}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={getShape(element.shape).path(element.w, element.h)} fill={colors.fill} stroke={colors.stroke} strokeWidth={colors.strokeWidth} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

/**
 * Draws one slide at any size. The slide is laid out in slide units
 * (1920 × 1080 for 16:9) and scaled to `width` pixels, so thumbnails, the
 * editor and the full-screen show all render it identically.
 */
const SlideView = ({ slide, themeId, aspect = '16:9', width, className = '', children, label, hiddenId }) => {
  const theme = getSlideTheme(themeId)
  const size = SLIDE_SIZES[aspect] ?? SLIDE_SIZES['16:9']
  const scale = width / size.width

  return (
    <div
      className={`slide-frame ${className}`}
      style={{ width, height: size.height * scale }}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <div
        className="slide"
        style={{ width: size.width, height: size.height, transform: `scale(${scale})`, background: slide.background ?? theme.background }}
      >
        <Decoration theme={theme} seed={slide.id} width={size.width} height={size.height} />
        {slide.elements.map((element) =>
          element.id === hiddenId ? null : <SlideElement key={element.id} element={element} theme={theme} />,
        )}
        {children}
      </div>
    </div>
  )
}

export default SlideView
