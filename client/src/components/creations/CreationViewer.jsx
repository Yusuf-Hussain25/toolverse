import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CopyIcon, DownloadIcon, GlobeIcon, LockIcon, Trash2Icon, XIcon } from 'lucide-react'
import { fileUrl } from '../../config/api'
import { useCreationActions } from '../../hooks/useCreationActions'
import CompareSlider from '../ui/CompareSlider'
import ScoreRing from '../ui/ScoreRing'
import { ConfirmDialog } from '../ui/Modal'
import { toolById, toolGradient } from '../../lib/tools'
import { downloadText, imageDownloadUrl, isImage, wordCount } from '../../lib/creations'
import { formatDate, timeAgo } from '../../lib/format'

// The result itself: Markdown, an image, or a before/after for the editing tools
export const CreationBody = ({ creation: c }) => {
  if (isImage(c)) {
    const after = (
      <div className={`size-full ${c.type === 'background' ? 'checker' : 'bg-surface-2'}`}>
        <img src={fileUrl(c.imageUrl)} alt={c.title} className="size-full object-contain" />
      </div>
    )
    const ratio = c.width && c.height ? `${c.width} / ${c.height}` : '4 / 3'
    return (
      <div className="mx-auto w-full overflow-hidden rounded-2xl" style={{ maxWidth: c.height > c.width ? 480 : '100%' }}>
        {c.sourceUrl ? (
          <CompareSlider before={fileUrl(c.sourceUrl)} beforeAlt={`${c.title}, original`} ratio={ratio}>{after}</CompareSlider>
        ) : (
          <div style={{ aspectRatio: ratio }}>{after}</div>
        )}
      </div>
    )
  }
  return (
    <div>
      {c.type === 'resume-review' && (
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
          <ScoreRing score={c.options?.score} size={76} label="Resume score" />
          <div className="text-sm">
            <p className="font-semibold">{c.options?.file || 'Resume'}</p>
            <p className="text-fg-3">{c.options?.role ? `Reviewed for ${c.options.role}` : 'General review'}</p>
          </div>
        </div>
      )}
      <article className="prose-tv">
        <Markdown remarkPlugins={[remarkGfm]}>{c.content || ''}</Markdown>
      </article>
    </div>
  )
}

export const CreationActions = ({ creation: c, actions, onAskDelete, compact = false }) => (
  <div className="flex flex-wrap items-center gap-2">
    {isImage(c) ? (
      <a href={imageDownloadUrl(c)} className="btn btn-primary btn-sm"><DownloadIcon size={15} /> Download</a>
    ) : (
      <>
        <button className="btn btn-primary btn-sm" onClick={() => actions.copy(c)}><CopyIcon size={15} /> Copy</button>
        <button className="btn btn-ghost btn-sm" onClick={() => downloadText(c)}><DownloadIcon size={15} /> {compact ? '.md' : 'Download .md'}</button>
      </>
    )}
    {isImage(c) && (
      <button className="btn btn-ghost btn-sm" onClick={() => actions.togglePublish(c)} disabled={actions.busy} aria-pressed={c.published}>
        {c.published ? <LockIcon size={15} /> : <GlobeIcon size={15} />} {c.published ? 'Make private' : 'Share'}
      </button>
    )}
    <button className="btn btn-ghost btn-sm !text-danger" onClick={onAskDelete} disabled={actions.busy} aria-label="Delete">
      <Trash2Icon size={15} /> {!compact && 'Delete'}
    </button>
  </div>
)

// Full-screen-ish panel for one creation, opened from the library or dashboard
const CreationViewer = ({ creation: c, onClose, onChange, onDelete }) => {
  const actions = useCreationActions({ onChange, onDelete: (gone) => { onDelete?.(gone); onClose() } })
  const [confirm, setConfirm] = useState(false)
  const tool = toolById(c.type)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !confirm && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, confirm])

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={c.title}
        className="relative flex h-full w-full max-w-3xl flex-col border-l border-line shadow-deep animate-[fade-up_.25s_var(--ease-out)_both]"
        style={{ background: 'var(--panel-solid)' }}
      >
        <header className="flex items-start gap-3 border-b border-line p-4 sm:p-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: toolGradient(tool) }}><tool.icon size={17} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight">{c.title}</h2>
            <p className="mt-0.5 text-xs text-fg-3">
              {tool.name} · {formatDate(c.createdAt)} ({timeAgo(c.createdAt)})
              {!isImage(c) && c.content && ` · ${wordCount(c.content).toLocaleString()} words`}
              {c.options?.style && ` · ${c.options.style}`}
              {c.options?.tone && ` · ${c.options.tone}`}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><XIcon size={19} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {c.prompt && c.type !== 'background' && (
            <p className="mb-5 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg-2"><span className="text-fg-3">Prompt: </span>{c.prompt}</p>
          )}
          <CreationBody creation={c} />
        </div>
        <footer className="border-t border-line p-4 sm:px-6">
          <CreationActions creation={c} actions={actions} onAskDelete={() => setConfirm(true)} />
        </footer>
      </section>
      <ConfirmDialog
        open={confirm}
        title={`Delete “${c.title.slice(0, 60)}”?`}
        text="It's removed from your creations and the community. This can't be undone."
        confirmLabel="Delete"
        danger
        busy={actions.busy}
        onConfirm={() => actions.remove(c)}
        onClose={() => setConfirm(false)}
      />
    </div>,
    document.body
  )
}

export default CreationViewer
