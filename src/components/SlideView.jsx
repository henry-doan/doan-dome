import { SLIDE_SIZES } from '../lib/layouts.js'
import { seededRandom } from '../lib/random.js'
import { getShape } from '../lib/shapes.js'
import { getSlideTheme, resolveTextStyle, shapeColors } from '../lib/slideThemes.js'

/** Theme artwork behind the content: stars, an atlas border, nebula clouds or a band. */
const Decoration = ({ theme, seed, width, height }) => {
  if (!theme.decoration) return null

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
