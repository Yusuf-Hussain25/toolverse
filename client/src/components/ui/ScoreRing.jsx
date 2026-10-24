// Circular score out of 100 (resume reviews). Colour follows the band: under 50, 50-74, 75+.
const band = (score) => (score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#f43f5e')

const ScoreRing = ({ score, size = 88, label = 'Score' }) => {
  const stroke = size * 0.1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const value = Math.max(0, Math.min(100, score ?? 0))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${score ?? 'not available'} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={band(value)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-semibold tracking-tight tabular-nums" style={{ fontSize: size * 0.3 }}>{score ?? '–'}</p>
          <p className="-mt-0.5 text-fg-3" style={{ fontSize: Math.max(10, size * 0.12) }}>/ 100</p>
        </div>
      </div>
    </div>
  )
}

export default ScoreRing
