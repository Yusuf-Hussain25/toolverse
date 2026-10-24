import { ImageIcon, PenLineIcon } from 'lucide-react'

const KINDS = {
  text: { label: 'Writing', icon: PenLineIcon },
  image: { label: 'Images', icon: ImageIcon },
}

// This month's allowance for one kind of tool, as a labelled bar
const UsageMeter = ({ kind, usage, compact = false }) => {
  const { label, icon: Icon } = KINDS[kind]
  if (!usage) {
    return <div className={`skeleton ${compact ? 'h-8' : 'h-14'}`} aria-hidden="true" />
  }
  const { used, limit } = usage[kind]
  const left = Math.max(0, limit - used)
  const pct = Math.min(100, (used / limit) * 100)
  const tone = left === 0 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--accent)'
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-fg-2"><Icon size={13} /> {label}</span>
        <span className="font-mono tabular-nums text-fg-3">{used}/{limit}</span>
      </div>
      <div
        className={`mt-1.5 overflow-hidden rounded-full bg-surface-2 ${compact ? 'h-1.5' : 'h-2'}`}
        role="meter"
        aria-label={`${label}: ${used} of ${limit} used this month`}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
      >
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: tone }} />
      </div>
    </div>
  )
}

export default UsageMeter
