import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeftIcon, CrownIcon, GalleryHorizontalEndIcon, LayoutDashboardIcon, SearchIcon, UsersIcon } from 'lucide-react'
import api from '../config/api'
import { TOOLS, toolById, toolGradient } from '../lib/tools'
import { timeAgo } from '../lib/format'

const PAGES = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboardIcon },
  { label: 'My creations', to: '/library', icon: GalleryHorizontalEndIcon },
  { label: 'Community', to: '/community', icon: UsersIcon },
  { label: 'Plan & usage', to: '/plan', icon: CrownIcon },
]

// Search tools, pages and your own creations; arrow keys + Enter, or click
const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate()
  const input = useRef(null)
  const [q, setQ] = useState('')
  const [found, setFound] = useState([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- each opening starts from an empty search
    setQ('')
    setActive(0)
    setTimeout(() => input.current?.focus(), 10)
  }, [open])

  // Creations matching the text, debounced; only the latest request may update the list
  useEffect(() => {
    if (!open) return
    const term = q.trim()
    let cancelled = false
    const t = setTimeout(() => {
      if (term.length < 2) return setFound([])
      api.get('/api/creations', { params: { q: term } })
        .then(({ data }) => !cancelled && setFound(data.creations.slice(0, 5)))
        .catch(() => !cancelled && setFound([]))
    }, 200)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, open])

  const items = useMemo(() => {
    const term = q.trim().toLowerCase()
    const match = (s) => !term || s.toLowerCase().includes(term)
    return [
      ...TOOLS.filter((t) => match(t.name) || match(t.blurb)).map((t) => ({ key: t.id, group: 'Tools', label: t.name, hint: t.blurb, tool: t, to: t.path })),
      ...PAGES.filter((p) => match(p.label)).map((p) => ({ key: p.to, group: 'Pages', label: p.label, icon: p.icon, to: p.to })),
      ...found.map((c) => ({ key: c.id, group: 'Your creations', label: c.title, hint: `${toolById(c.type)?.short} · ${timeAgo(c.createdAt)}`, tool: toolById(c.type), to: `/library?open=${c.id}` })),
    ]
  }, [q, found])

  if (!open) return null
  const go = (item) => {
    onClose()
    navigate(item.to)
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    if (e.key === 'Enter' && items[active]) go(items[active])
    if (e.key === 'Escape') onClose()
  }

  let lastGroup = null
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Search" className="card relative w-full max-w-xl overflow-hidden shadow-deep animate-pop-in" style={{ background: 'var(--panel-solid)' }}>
        <div className="flex items-center gap-3 border-b border-line px-4">
          <SearchIcon size={18} className="text-fg-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0) }}
            onKeyDown={onKey}
            placeholder="Search tools, pages or your creations…"
            className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-fg-3"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `pi-${items[active].key}` : undefined}
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <ul id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-fg-3">Nothing matches “{q}”</li>}
          {items.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null
            lastGroup = item.group
            const Icon = item.tool?.icon || item.icon
            return (
              <li key={`${item.group}-${item.key}`}>
                {header && <p className="eyebrow px-3 pt-3 pb-1.5">{header}</p>}
                <button
                  id={`pi-${item.key}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === active ? 'bg-surface-2' : ''}`}
                >
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${item.tool ? 'text-white' : 'bg-surface-2 text-fg-2'}`} style={item.tool ? { background: toolGradient(item.tool) } : undefined}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.label}</span>
                    {item.hint && <span className="block truncate text-xs text-fg-3">{item.hint}</span>}
                  </span>
                  {i === active && <CornerDownLeftIcon size={14} className="text-fg-3" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>,
    document.body
  )
}

export default CommandPalette
