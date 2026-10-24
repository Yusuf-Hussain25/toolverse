import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon, CopyIcon, CrownIcon, HourglassIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { fileUrl } from '../../config/api'
import { useAccount } from '../../hooks/useAccount'
import { useCreationActions } from '../../hooks/useCreationActions'
import { CreationActions, CreationBody } from '../creations/CreationViewer'
import UsageMeter from '../UsageMeter'
import EmptyState from '../ui/EmptyState'
import { ConfirmDialog } from '../ui/Modal'
import { toolGradient } from '../../lib/tools'
import { isImage, titleLines } from '../../lib/creations'
import { timeAgo } from '../../lib/format'

// Blog titles as a list with a copy button per title
const TitlesResult = ({ creation }) => {
  const [copied, setCopied] = useState(null)
  const copy = async (t, i) => {
    try {
      await navigator.clipboard.writeText(t)
      setCopied(i)
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500)
    } catch {
      toast.error("Your browser didn't allow copying")
    }
  }
  return (
    <ol className="space-y-2">
      {titleLines(creation.content).map((t, i) => (
        <li key={i} className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <span className="w-5 font-mono text-xs text-fg-3">{i + 1}</span>
          <span className="min-w-0 flex-1 text-sm">{t}</span>
          <button className="icon-btn !size-8" onClick={() => copy(t, i)} aria-label={`Copy “${t}”`}>
            {copied === i ? <CheckIcon size={15} className="text-ok" /> : <CopyIcon size={15} />}
          </button>
        </li>
      ))}
    </ol>
  )
}

const Working = ({ tool, elapsed, waitingHint }) => {
  const slowFree = elapsed >= 8 && tool.kind === 'text'
  return (
    <div className="flex h-full flex-col" role="status" aria-live="polite">
      {isImageTool(tool) ? (
        <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-surface-2">
          <div className="absolute inset-0 animate-[scan_1.8s_var(--ease-out)_infinite] bg-gradient-to-b from-transparent via-[rgba(124,92,255,.25)] to-transparent" />
          <span className="spinner !size-7 text-accent-text" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="skeleton h-7 w-3/4" />
          {[92, 100, 84, 96, 70, 100, 88].map((w, i) => <div key={i} className="skeleton h-3.5" style={{ width: `${w}%` }} />)}
        </div>
      )}
      <p className="mt-5 flex items-center gap-2 text-sm text-fg-2">
        <HourglassIcon size={15} className="text-accent-text" /> {waitingHint} <span className="font-mono text-fg-3 tabular-nums">{elapsed}s</span>
      </p>
      {slowFree && <p className="mt-1 text-xs text-fg-3">The free AI provider answers one request at a time, so this can take up to a minute.</p>}
    </div>
  )
}

const isImageTool = (tool) => tool.kind === 'image'

// Layout for every tool: header, form on the left, result on the right, recent results below
const ToolShell = ({ tool, form, running, elapsed, result, setResult, quotaHit, waitingHint, emptyHint, notice }) => {
  const { usage } = useAccount()
  const [recent, setRecent] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const actions = useCreationActions({
    onChange: (c) => {
      setResult(c)
      setRecent((list) => list?.map((i) => (i.id === c.id ? c : i)))
    },
    onDelete: (c) => {
      setResult(null)
      setRecent((list) => list?.filter((i) => i.id !== c.id))
      setConfirm(false)
    },
  })

  useEffect(() => {
    let cancelled = false
    api.get('/api/creations', { params: { type: tool.id } })
      .then(({ data }) => !cancelled && setRecent(data.creations.slice(0, 6)))
      .catch(() => !cancelled && setRecent([]))
    return () => { cancelled = true }
  }, [tool.id])

  // A new result goes to the top of the recent list
  useEffect(() => {
    if (!result) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeps the list in step with the latest result
    setRecent((list) => (list && !list.some((i) => i.id === result.id) ? [result, ...list].slice(0, 6) : list))
  }, [result])

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-soft" style={{ background: toolGradient(tool) }}>
            <tool.icon size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{tool.name}</h1>
            <p className="mt-0.5 max-w-xl text-sm text-fg-3">{tool.blurb}</p>
          </div>
        </div>
        <div className="w-full sm:w-56"><UsageMeter kind={tool.kind} usage={usage} compact /></div>
      </div>

      {notice}

      {quotaHit && (
        <div className="card mt-5 flex flex-wrap items-center justify-between gap-3 !rounded-2xl p-4" role="alert">
          <p className="text-sm text-fg-2">You've used this month's {tool.kind === 'text' ? 'writing' : 'image'} allowance.</p>
          <Link to="/plan" className="btn btn-primary btn-sm"><CrownIcon size={15} /> See plans</Link>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <section className="card h-fit p-5" aria-label="Settings">{form}</section>

        <section className="card flex min-h-[360px] min-w-0 flex-col p-5" aria-label="Result">
          {running ? (
            <Working tool={tool} elapsed={elapsed} waitingHint={waitingHint} />
          ) : result ? (
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="truncate text-sm font-medium" title={result.title}>{result.title}</p>
                <CreationActions creation={result} actions={actions} onAskDelete={() => setConfirm(true)} compact />
              </div>
              <div className="min-w-0 flex-1">
                {result.type === 'blog-titles' ? <TitlesResult creation={result} /> : <CreationBody creation={result} />}
              </div>
              <p className="mt-4 text-xs text-fg-3">Saved to My creations · {(result.durationMs / 1000).toFixed(1)} s</p>
            </div>
          ) : (
            <EmptyState icon={tool.icon} title="Your result appears here" text={emptyHint} className="m-auto" />
          )}
        </section>
      </div>

      {recent?.length > 0 && (
        <section className="mt-10" aria-labelledby="recent-tool">
          <h2 id="recent-tool" className="text-base font-semibold tracking-tight">Recent with this tool</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recent.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => { setResult(c); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className={`card block w-full overflow-hidden !rounded-2xl text-left transition-transform hover:-translate-y-0.5 ${result?.id === c.id ? 'ring-2 ring-accent' : ''}`}
                  aria-label={`Show ${c.title}`}
                >
                  {isImage(c) ? (
                    <div className={`aspect-square ${c.type === 'background' ? 'checker' : 'bg-surface-2'}`}>
                      <img src={fileUrl(c.imageUrl)} alt="" loading="lazy" className={`size-full ${c.type === 'background' ? 'object-contain p-2' : 'object-cover'}`} />
                    </div>
                  ) : (
                    <div className="h-1" style={{ background: toolGradient(tool) }} />
                  )}
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-xs font-medium">{c.title}</p>
                    <p className="mt-0.5 text-[11px] text-fg-3">{timeAgo(c.createdAt)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result && (
        <ConfirmDialog
          open={confirm}
          title={`Delete “${result.title.slice(0, 60)}”?`}
          text="It's removed from your creations and the community. This can't be undone."
          confirmLabel="Delete"
          danger
          busy={actions.busy}
          onConfirm={() => actions.remove(result)}
          onClose={() => setConfirm(false)}
        />
      )}
    </div>
  )
}

export default ToolShell
