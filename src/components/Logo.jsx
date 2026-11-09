import emblem from '../assets/logo-emblem.webp'
import fullLogo from '../assets/logo-full.webp'

/**
 * The Doan Dome logo artwork (docs/DoanDome.png). Its background is the
 * app's deep violet (#190134), so it sits seamlessly on the header.
 * variant "full": the whole logo with lettering.
 * variant "compact": the observatory emblem beside the wordmark set in type.
 */
const Logo = ({ variant = 'compact', size = 40 }) => {
  if (variant === 'full') {
    return <img className="logo-full" src={fullLogo} width={Math.round(size * 1.5)} height={size} alt="Doan Dome" draggable="false" />
  }
  return (
    <span className="logo-compact" role="img" aria-label="Doan Dome">
      <img src={emblem} width={Math.round(size * 1.36)} height={size} alt="" draggable="false" />
      <span className="wordmark" aria-hidden="true">Doan Dome</span>
    </span>
  )
}

export default Logo
