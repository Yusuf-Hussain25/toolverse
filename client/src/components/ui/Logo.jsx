import { useId } from 'react'
import { Link } from 'react-router-dom'

// The Toolverse mark: a planet with an orbit and a moon, on the nebula gradient.
// Each tool is a world; Toolverse is the system they orbit in.
export const LogoMark = ({ size = 32, className = '' }) => {
  const id = useId().replace(/:/g, '')
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset=".5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id={`p${id}`} cx=".35" cy=".35" r=".75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e0e7ff" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#g${id})`} />
      <ellipse cx="16" cy="16" rx="11.5" ry="4.6" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="1.5" transform="rotate(-28 16 16)" />
      <circle cx="16" cy="16" r="4.6" fill={`url(#p${id})`} />
      <circle cx="25.4" cy="10.6" r="1.9" fill="#fff" />
    </svg>
  )
}

const Logo = ({ size = 30, to = '/', showText = true }) => (
  <Link to={to} className="inline-flex items-center gap-2.5 rounded-xl" aria-label="Toolverse home">
    <LogoMark size={size} />
    {showText && (
      <span className="text-[19px] font-semibold tracking-[-0.035em]">
        Tool<span className="gradient-text">verse</span>
      </span>
    )}
  </Link>
)

export default Logo
