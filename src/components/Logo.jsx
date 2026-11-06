import emblem from '../assets/logo-emblem.webp'
import fullLogo from '../assets/logo-full.webp'

/**
 * The Doan Dome logo artwork (docs/DoanDome.png). Its background is the
 * app's deep midnight (#03132F), so it sits seamlessly on the header.
 * variant "full": the whole logo with lettering.
 * variant "compact": the observatory emblem beside the wordmark set in type.
 * variant "icon": the emblem alone, cropped round.
 */
const Logo = ({ variant = 'compact', size = 40 }) => {
  if (variant === 'full') {
    return <img className="logo-full" src={fullLogo} width={Math.round(size * 1.5)} height={size} alt="Doan Dome" draggable="false" />
  }
  if (variant === 'icon') {
    return <img className="logo-icon" src={emblem} width={size} height={size} alt="Doan Dome" draggable="false" />
  }
  return (
    <span className="logo-compact" role="img" aria-label="Doan Dome">
      <img src={emblem} width={Math.round(size * 1.36)} height={size} alt="" draggable="false" />
      <span className="wordmark" aria-hidden="true">Doan Dome</span>
    </span>
  )
}

export default Logo
