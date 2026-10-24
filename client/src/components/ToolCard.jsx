import { Link } from 'react-router-dom'
import { ArrowUpRightIcon, WrenchIcon } from 'lucide-react'
import { toolGradient } from '../lib/tools'

// A tool tile with its colours, description and whether it can run on this server
const ToolCard = ({ tool, count, unavailable = false, compact = false }) => (
  <li>
    <Link
      to={tool.path}
      className="group card relative flex h-full flex-col overflow-hidden p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft"
    >
      <div className="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: toolGradient(tool) }} />
      <div className="relative flex items-start justify-between">
        <span className="grid size-11 place-items-center rounded-2xl text-white shadow-soft" style={{ background: toolGradient(tool) }}>
          <tool.icon size={20} />
        </span>
        <ArrowUpRightIcon size={18} className="text-fg-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
      </div>
      <h3 className="relative mt-4 font-semibold tracking-tight">{tool.name}</h3>
      {!compact && <p className="relative mt-1 text-sm text-fg-3">{tool.blurb}</p>}
      <div className="relative mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        <span className="chip">{tool.kind === 'text' ? 'Writing' : 'Images'}</span>
        {unavailable && <span className="chip chip-warn"><WrenchIcon size={11} /> Needs setup</span>}
        {count > 0 && <span className="chip">{count} made</span>}
      </div>
    </Link>
  </li>
)

export default ToolCard
