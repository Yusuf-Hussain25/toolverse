import { GlobeIcon, HeartIcon } from 'lucide-react'
import { fileUrl } from '../../config/api'
import { toolById, toolGradient } from '../../lib/tools'
import { excerpt, isImage, titleLines } from '../../lib/creations'
import { timeAgo } from '../../lib/format'

// One creation in a grid: image thumbnail or a text preview, with its tool, age and status
const CreationCard = ({ creation: c, onOpen }) => {
  const tool = toolById(c.type)
  const image = isImage(c)
  return (
    <li className="animate-fade-up">
      <button
        onClick={() => onOpen(c)}
        className="group card flex h-full w-full flex-col overflow-hidden !rounded-[22px] text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft"
        aria-label={`Open ${c.title}`}
      >
        {image ? (
          <div className={`relative aspect-[4/3] overflow-hidden ${c.type === 'background' ? 'checker' : 'bg-surface-2'}`}>
            <img
              src={fileUrl(c.imageUrl)}
              alt=""
              loading="lazy"
              className={`size-full transition-transform duration-500 group-hover:scale-[1.04] ${c.type === 'background' ? 'object-contain p-3' : 'object-cover'}`}
            />
            {c.published && (
              <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                <GlobeIcon size={11} /> Shared
              </span>
            )}
          </div>
        ) : (
          <div className="relative aspect-[4/3] overflow-hidden p-4">
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: toolGradient(tool) }} />
            {c.type === 'resume-review' && c.options?.score != null && (
              <p className="text-3xl font-semibold tracking-tight">{c.options.score}<span className="text-sm text-fg-3"> / 100</span></p>
            )}
            {c.type === 'blog-titles' ? (
              <ol className="space-y-1.5 text-[13px] leading-snug text-fg-2">
                {titleLines(c.content).slice(0, 4).map((t, i) => (
                  <li key={i} className="flex gap-2"><span className="font-mono text-fg-3">{i + 1}</span><span className="line-clamp-1">{t}</span></li>
                ))}
              </ol>
            ) : (
              <p className={`text-[13px] leading-relaxed text-fg-2 ${c.type === 'resume-review' ? 'mt-2 line-clamp-4' : 'line-clamp-6'}`}>
                {excerpt(c.content, 260)}
              </p>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--panel-solid)] to-transparent opacity-80" />
          </div>
        )}
        <div className="flex items-start gap-2.5 border-t border-line px-3.5 py-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: toolGradient(tool) }} aria-hidden="true">
            <tool.icon size={14} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" title={c.title}>{c.title}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-3">
              {tool.short} · {timeAgo(c.createdAt)}
              {c.published && c.likes > 0 && <span className="inline-flex items-center gap-0.5"><HeartIcon size={11} /> {c.likes}</span>}
            </p>
          </div>
        </div>
      </button>
    </li>
  )
}

export const CreationCardSkeleton = () => (
  <li className="card overflow-hidden !rounded-[22px]" aria-hidden="true">
    <div className="skeleton aspect-[4/3] !rounded-none" />
    <div className="flex gap-2.5 px-3.5 py-3">
      <div className="skeleton size-7 shrink-0 !rounded-lg" />
      <div className="flex-1 space-y-2"><div className="skeleton h-3.5 w-3/4" /><div className="skeleton h-3 w-1/3" /></div>
    </div>
  </li>
)

export default CreationCard
