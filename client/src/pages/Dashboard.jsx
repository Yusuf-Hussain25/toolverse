import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, CalendarClockIcon, HeartIcon, LayersIcon, SparklesIcon } from 'lucide-react'
import api from '../config/api'
import { useAccount } from '../hooks/useAccount'
import ToolCard from '../components/ToolCard'
import UsageMeter from '../components/UsageMeter'
import ActivityChart from '../components/dashboard/ActivityChart'
import CreationCard, { CreationCardSkeleton } from '../components/creations/CreationCard'
import CreationViewer from '../components/creations/CreationViewer'
import EmptyState from '../components/ui/EmptyState'
import { TOOLS } from '../lib/tools'
import { formatDate } from '../lib/format'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const Stat = ({ icon: Icon, label, value }) => (
  <div className="card p-4">
    <p className="flex items-center gap-1.5 text-xs text-fg-3"><Icon size={13} /> {label}</p>
    {value === null ? <div className="skeleton mt-2 h-7 w-12" /> : <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>}
  </div>
)

const Dashboard = () => {
  const { me, usage, tools, refresh } = useAccount()
  const [recent, setRecent] = useState(null)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    api.get('/api/creations').then(({ data }) => setRecent(data.creations.slice(0, 6))).catch(() => setRecent([]))
  }, [])

  const firstName = me?.user.name?.split(' ')[0]
  const update = (c) => {
    setRecent((list) => list.map((i) => (i.id === c.id ? c : i)))
    setOpen(c)
  }
  const remove = (c) => {
    setRecent((list) => list.filter((i) => i.id !== c.id))
    refresh()
  }

  return (
    <div className="animate-fade-up">
      <p className="eyebrow">Dashboard</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
        {greeting()}{firstName ? `, ${firstName}` : ''}
      </h1>
      <p className="mt-1.5 text-sm text-fg-3">Pick a tool, or pick up where you left off.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={LayersIcon} label="Creations" value={me ? me.stats.total : null} />
        <Stat icon={HeartIcon} label="Likes received" value={me ? me.stats.likesReceived : null} />
        <div className="card col-span-2 flex flex-col justify-center gap-3 p-4">
          <UsageMeter kind="text" usage={usage} />
          <UsageMeter kind="image" usage={usage} />
          {usage && (
            <p className="flex items-center gap-1 text-[11px] text-fg-3">
              <CalendarClockIcon size={12} /> Resets {formatDate(usage.resetsAt, { day: 'numeric', month: 'long' })} · <Link to="/plan" className="text-accent-text hover:underline">Plan & usage</Link>
            </p>
          )}
        </div>
      </div>

      <section className="mt-10" aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="text-lg font-semibold tracking-tight">Tools</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <ToolCard key={t.id} tool={t} count={me?.stats.byType[t.id] || 0} unavailable={t.id === 'object' && tools && !tools.object.available} compact />
          ))}
        </ul>
      </section>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_340px]">
        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-lg font-semibold tracking-tight">Recent</h2>
            <Link to="/library" className="inline-flex items-center gap-1 text-sm text-fg-2 hover:text-fg">All creations <ArrowRightIcon size={14} /></Link>
          </div>
          {recent && recent.length === 0 ? (
            <div className="card mt-4">
              <EmptyState icon={SparklesIcon} title="Your first creation is one click away" text="Try the article writer or the image generator. Everything you make shows up here." />
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 sm:gap-4">
              {recent === null
                ? Array.from({ length: 4 }, (_, i) => <CreationCardSkeleton key={i} />)
                : recent.map((c) => <CreationCard key={c.id} creation={c} onOpen={setOpen} />)}
            </ul>
          )}
        </section>
        <section className="card h-fit p-5" aria-label="Activity">
          {me ? <ActivityChart days={me.stats.last14} /> : <div className="skeleton h-40" />}
          {me && (
            <ul className="mt-5 space-y-2 text-sm">
              {TOOLS.filter((t) => me.stats.byType[t.id]).map((t) => (
                <li key={t.id} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-fg-2"><t.icon size={14} /> {t.name}</span>
                  <span className="font-mono tabular-nums text-fg-3">{me.stats.byType[t.id]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {open && <CreationViewer creation={open} onClose={() => setOpen(null)} onChange={update} onDelete={remove} />}
    </div>
  )
}

export default Dashboard
