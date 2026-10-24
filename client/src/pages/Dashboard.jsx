import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightIcon, ArrowDownRightIcon, ArrowUpRightIcon, BarChart3Icon, ChevronDownIcon, DownloadIcon, EyeIcon, FileTextIcon, ImageIcon,
  PenLineIcon, Trash2Icon,
} from 'lucide-react'
import api, { fileUrl } from '../config/api'
import { useAccount } from '../hooks/useAccount'
import { useCreationActions } from '../hooks/useCreationActions'
import Sparkline from '../components/ui/Sparkline'
import LineChart from '../components/dashboard/LineChart'
import ToolArt from '../components/dashboard/ToolArt'
import CreationViewer from '../components/creations/CreationViewer'
import EmptyState from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/Modal'
import { TOOLS, toolById, toolGradient } from '../lib/tools'
import { imageDownloadUrl, isImage } from '../lib/creations'
import { timeAgo } from '../lib/format'

const RANGES = [7, 14, 30]

const StatCard = ({ icon: Icon, tint, label, value, series, change, sparkColor }) => (
  <div className="card !rounded-[20px] p-5">
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${tint} 14%, transparent)`, color: tint }}>
        <Icon size={20} />
      </span>
      <p className="text-sm font-medium text-fg-2">{label}</p>
    </div>
    <div className="mt-3 flex items-end justify-between gap-3">
      {value === null ? (
        <div className="skeleton h-8 w-16" />
      ) : (
        <p className="flex items-baseline gap-2">
          <span className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">{value.toLocaleString()}</span>
          {change !== undefined && (
            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${change >= 0 ? 'bg-ok/12 text-ok' : 'bg-danger/12 text-danger'}`} title="Compared with the previous 7 days">
              {change >= 0 ? <ArrowUpRightIcon size={12} /> : <ArrowDownRightIcon size={12} />}{Math.abs(change)}%
            </span>
          )}
        </p>
      )}
      {series && <Sparkline values={series} color={sparkColor || tint} width={104} height={36} label={`${label}, last 14 days`} />}
    </div>
  </div>
)

const ToolTile = ({ tool, unavailable }) => (
  <li>
    <Link to={tool.path} className="group card relative flex h-full min-h-[148px] flex-col overflow-hidden !rounded-[20px] p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft">
      <ToolArt toolId={tool.id} />
      <div className="relative flex max-w-[58%] items-start gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${tool.colors[0]} 14%, transparent)`, color: tool.colors[0] }}>
          <tool.icon size={22} />
        </span>
        <div className="min-w-0">
          <h3 className="font-semibold tracking-tight">{tool.name}</h3>
          <p className="mt-1 text-[13px] leading-snug text-fg-2">{tool.tagline}</p>
          {unavailable && <p className="mt-1.5 text-[11px] font-medium text-warn">Needs Cloudinary setup</p>}
        </div>
      </div>
      <span className="relative mt-auto grid size-9 place-items-center rounded-full border border-line bg-[var(--panel-solid)] text-fg-2 shadow-[var(--shadow-sm)] transition-transform group-hover:translate-x-0.5 group-hover:text-fg">
        <ArrowRightIcon size={16} />
      </span>
    </Link>
  </li>
)

const Dashboard = () => {
  const { me, tools, refresh } = useAccount()
  const [recent, setRecent] = useState(null)
  const [open, setOpen] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [range, setRange] = useState(14)

  useEffect(() => {
    api.get('/api/creations').then(({ data }) => setRecent(data.creations.slice(0, 6))).catch(() => setRecent([]))
  }, [])

  const actions = useCreationActions({
    onChange: (c) => {
      setRecent((list) => list.map((i) => (i.id === c.id ? c : i)))
      setOpen((o) => (o?.id === c.id ? c : o))
    },
    onDelete: (c) => {
      setRecent((list) => list.filter((i) => i.id !== c.id))
      setToDelete(null)
      refresh()
    },
  })

  const stats = me?.stats
  const last14 = stats?.daily.slice(-14) || []
  const firstName = me?.user.name?.split(' ')[0]
  const chartDays = (stats?.daily || []).slice(-range).map((d) => ({ day: d.day, count: d.creations }))

  return (
    <div className="animate-fade-up">
      {/* Welcome + promo */}
      <section className="grid items-stretch gap-5 xl:grid-cols-[1fr_minmax(0,600px)]">
        <div className="flex flex-col justify-center py-2">
          <p className="eyebrow">Welcome back{firstName ? `, ${firstName}` : ''}</p>
          <h1 className="mt-2 text-[34px] leading-tight font-semibold tracking-[-0.035em] sm:text-[42px]">
            Create smarter, faster <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-2 text-base text-fg-2 sm:text-lg">Explore powerful tools to bring your ideas to life.</p>
        </div>
        <div className="card relative grid min-h-[170px] overflow-hidden !rounded-[22px] sm:grid-cols-[1fr_1.1fr]">
          <img src="/samples/workspace.webp" alt="" className="hidden size-full object-cover sm:block" />
          <div className="relative flex flex-col justify-center gap-1.5 p-6">
            <p className="text-lg font-semibold tracking-tight">Turn ideas into content</p>
            <p className="text-sm text-fg-2">Write, design and polish with AI tools in seconds.</p>
            <Link to="/tools" className="btn btn-mono btn-sm mt-3 self-start">Explore tools <ArrowRightIcon size={15} /></Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Your numbers">
        <StatCard icon={PenLineIcon} tint="#3b82f6" label="Total creations" value={stats ? stats.total : null} change={stats?.weekChange} series={last14.map((d) => d.creations)} />
        <StatCard icon={FileTextIcon} tint="#8b5cf6" label="Words generated" value={stats ? stats.words : null} series={last14.map((d) => d.words)} />
        <StatCard icon={ImageIcon} tint="#f59e0b" label="Images created" value={stats ? stats.images : null} series={last14.map((d) => d.images)} />
        <StatCard icon={BarChart3Icon} tint="#10b981" label="Tool uses this month" value={stats ? stats.toolUses : null} series={last14.map((d) => d.creations)} />
      </section>

      {/* Tools */}
      <section className="mt-10" aria-labelledby="tools-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="tools-heading" className="text-xl font-semibold tracking-tight">Tools</h2>
            <p className="mt-0.5 text-sm text-fg-2">Choose a tool to start creating.</p>
          </div>
          <Link to="/tools" className="inline-flex items-center gap-1 text-sm font-medium text-fg-2 hover:text-fg">View all tools <ArrowRightIcon size={15} /></Link>
        </div>
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TOOLS.map((t) => <ToolTile key={t.id} tool={t} unavailable={t.id === 'object' && tools && !tools.object.available} />)}
        </ul>
      </section>

      {/* Recent + chart */}
      <section className="mt-10 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="card min-w-0 !rounded-[22px] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent creations</h2>
            <Link to="/library" className="inline-flex items-center gap-1 text-sm font-medium text-fg-2 hover:text-fg">View all <ArrowRightIcon size={15} /></Link>
          </div>
          {recent && recent.length === 0 ? (
            <EmptyState icon={FileTextIcon} title="No creations yet" text="Start using a tool to create something amazing." />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] tracking-wider text-fg-3 uppercase">
                    <th className="pb-2.5 font-medium">Title</th>
                    <th className="pb-2.5 font-medium">Type</th>
                    <th className="pb-2.5 font-medium">Created</th>
                    <th className="pb-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recent === null
                    ? [0, 1, 2, 3].map((i) => (
                        <tr key={i}><td colSpan={4} className="py-3"><div className="skeleton h-9" /></td></tr>
                      ))
                    : recent.map((c) => {
                        const tool = toolById(c.type)
                        return (
                          <tr key={c.id} className="border-b border-line last:border-0">
                            <td className="py-2.5 pr-3">
                              <button onClick={() => setOpen(c)} className="flex max-w-[280px] items-center gap-3 text-left hover:text-accent-text">
                                {isImage(c) ? (
                                  <img src={fileUrl(c.imageUrl)} alt="" className={`size-9 shrink-0 rounded-lg object-cover ${c.type === 'background' ? 'checker !object-contain' : ''}`} />
                                ) : (
                                  <span className="grid size-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: toolGradient(tool) }}><tool.icon size={15} /></span>
                                )}
                                <span className="truncate font-medium">{c.title}</span>
                              </button>
                            </td>
                            <td className="py-2.5 pr-3"><span className="chip">{tool.short}</span></td>
                            <td className="py-2.5 pr-3 whitespace-nowrap text-fg-2">{timeAgo(c.createdAt)}</td>
                            <td className="py-2.5">
                              <div className="flex justify-end gap-0.5">
                                <button className="icon-btn !size-8" onClick={() => setOpen(c)} aria-label={`Open ${c.title}`} data-tip="Open"><EyeIcon size={15} /></button>
                                {isImage(c) && <a className="icon-btn !size-8" href={imageDownloadUrl(c)} aria-label={`Download ${c.title}`} data-tip="Download"><DownloadIcon size={15} /></a>}
                                <button className="icon-btn !size-8 hover:!text-danger" onClick={() => setToDelete(c)} aria-label={`Delete ${c.title}`} data-tip="Delete"><Trash2Icon size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card min-w-0 !rounded-[22px] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Creations per day</h2>
            <label className="relative">
              <span className="sr-only">Range</span>
              <select value={range} onChange={(e) => setRange(Number(e.target.value))} className="input !h-9 cursor-pointer appearance-none !pr-9 !pl-3 text-sm">
                {RANGES.map((r) => <option key={r} value={r}>Last {r} days</option>)}
              </select>
              <ChevronDownIcon size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-fg-3" />
            </label>
          </div>
          <div className="mt-4">
            {stats ? <LineChart days={chartDays} /> : <div className="skeleton h-[220px]" />}
          </div>
        </div>
      </section>

      {open && <CreationViewer creation={open} onClose={() => setOpen(null)} onChange={(c) => { setRecent((l) => l.map((i) => (i.id === c.id ? c : i))); setOpen(c) }} onDelete={(c) => { setRecent((l) => l.filter((i) => i.id !== c.id)); refresh() }} />}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.title.slice(0, 60)}”?`}
        text="It's removed from your creations and the community. This can't be undone."
        confirmLabel="Delete"
        danger
        busy={actions.busy}
        onConfirm={() => actions.remove(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

export default Dashboard
