import { useEffect, useId, useRef, useState } from 'react'
import { formatDate } from '../../lib/format'

const H = 220
const PAD = { top: 12, right: 12, bottom: 28, left: 30 }

// Whole-number ticks that cover the max: 0, step, 2*step ...
const ticksFor = (max) => {
  const step = max <= 4 ? 1 : max <= 8 ? 2 : Math.ceil(max / 4)
  const top = Math.max(step * 4, Math.ceil(max / step) * step)
  return Array.from({ length: top / step + 1 }, (_, i) => i * step)
}

const label = (day, opts) => formatDate(`${day}T12:00:00`, opts)

// One series (creations per day), so the card title names it and there's no legend.
// 2px line, a soft area, recessive grid, a hover crosshair with a tooltip, and a table for screen readers.
const LineChart = ({ days, unit = 'creation' }) => {
  const box = useRef(null)
  const id = useId().replace(/:/g, '')
  const [width, setWidth] = useState(560)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const ticks = ticksFor(Math.max(0, ...days.map((d) => d.count)))
  const top = ticks.at(-1)
  const innerW = width - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const x = (i) => PAD.left + (days.length > 1 ? (i / (days.length - 1)) * innerW : innerW / 2)
  const y = (v) => PAD.top + innerH - (v / top) * innerH
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(' ')
  const labelEvery = Math.ceil(days.length / 5)
  const total = days.reduce((s, d) => s + d.count, 0)

  return (
    <div ref={box} className="relative w-full" onPointerLeave={() => setHover(null)}>
      <svg width={width} height={H} className="block" aria-hidden="true">
        <defs>
          <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".18" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-[var(--text-3)] font-mono text-[10px]">{t}</text>
          </g>
        ))}
        {days.map((d, i) => (i % labelEvery === 0 ? (days.length - 1 - i >= labelEvery / 2 || i === days.length - 1) : i === days.length - 1) && (
          <text key={d.day} x={x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle'} className="fill-[var(--text-3)] text-[10.5px]">
            {label(d.day, { month: 'short', day: 'numeric' })}
          </text>
        ))}
        <path d={`${line} L${x(days.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#a${id})`} />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={y(0)} stroke="var(--border-strong)" />}
        {days.map((d, i) => (
          <circle key={d.day} cx={x(i)} cy={y(d.count)} r={hover === i ? 5 : 3.5} fill="var(--panel-solid)" stroke="var(--accent)" strokeWidth="2" />
        ))}
        {/* Hit targets wider than the marks */}
        {days.map((d, i) => (
          <rect key={d.day} x={x(i) - innerW / days.length / 2} y={PAD.top} width={innerW / days.length} height={innerH} fill="transparent" onPointerEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line-strong bg-[var(--panel-solid)] px-2.5 py-1.5 text-xs whitespace-nowrap shadow-soft"
          style={{ left: Math.min(Math.max(x(hover), 60), width - 60), top: y(days[hover].count) - 10 }}
        >
          <p className="text-fg-3">{label(days[hover].day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p className="font-semibold">{days[hover].count} {days[hover].count === 1 ? unit : `${unit}s`}</p>
        </div>
      )}
      <table className="sr-only">
        <caption>{`${unit}s per day, ${total} in total`}</caption>
        <thead><tr><th>Day</th><th>Count</th></tr></thead>
        <tbody>{days.map((d) => <tr key={d.day}><td>{label(d.day, { weekday: 'long', day: 'numeric', month: 'long' })}</td><td>{d.count}</td></tr>)}</tbody>
      </table>
    </div>
  )
}

export default LineChart
