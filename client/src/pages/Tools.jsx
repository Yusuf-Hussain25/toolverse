import ToolCard from '../components/ToolCard'
import { useAccount } from '../hooks/useAccount'
import { TOOLS } from '../lib/tools'

// All six tools (the phone tab bar's "Tools" entry)
const Tools = () => {
  const { me, tools } = useAccount()
  return (
    <div className="animate-fade-up">
      <p className="eyebrow">Tools</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">What do you want to make?</h1>
      <p className="mt-1.5 text-sm text-fg-3">Writing tools share one monthly allowance and image tools another.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {TOOLS.map((t) => (
          <ToolCard key={t.id} tool={t} count={me?.stats.byType[t.id] || 0} unavailable={t.id === 'object' && tools && !tools.object.available} />
        ))}
      </ul>
    </div>
  )
}

export default Tools
