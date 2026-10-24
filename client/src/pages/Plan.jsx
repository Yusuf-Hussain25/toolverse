import { CalendarClockIcon, CheckIcon, CpuIcon, CrownIcon, ImageIcon, InfoIcon, PenLineIcon, SparklesIcon } from 'lucide-react'
import { useAccount } from '../hooks/useAccount'
import UsageMeter from '../components/UsageMeter'
import { TOOLS } from '../lib/tools'
import { formatDate } from '../lib/format'

const ENGINE_LABELS = {
  anthropic: 'Claude (Anthropic)',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  pollinations: 'Pollinations (free)',
  local: 'On-server model (IMG.LY)',
  cloudinary: 'Cloudinary AI',
  clipdrop: 'ClipDrop',
}

const PlanCard = ({ name, icon: Icon, current, limits, perks, footer, highlight }) => (
  <div className={`card relative flex flex-col !rounded-[22px] p-6 ${highlight ? 'shadow-glow' : ''}`}>
    {current && <span className="chip chip-accent absolute top-5 right-5">Current plan</span>}
    <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-text"><Icon size={20} /></span>
    <h3 className="mt-4 text-lg font-semibold tracking-tight">{name}</h3>
    <ul className="mt-4 space-y-2.5 text-sm">
      <li className="flex items-center gap-2.5"><PenLineIcon size={16} className="text-fg-3" /> <b className="font-semibold">{limits.text}</b> writing actions a month</li>
      <li className="flex items-center gap-2.5"><ImageIcon size={16} className="text-fg-3" /> <b className="font-semibold">{limits.image}</b> image actions a month</li>
      {perks.map((p) => <li key={p} className="flex items-start gap-2.5 text-fg-2"><CheckIcon size={16} className="mt-0.5 shrink-0 text-ok" /> {p}</li>)}
    </ul>
    <div className="mt-auto pt-6">{footer}</div>
  </div>
)

// Current plan, this month's usage, what each plan includes, and which AI engines run the tools
const Plan = () => {
  const { me, usage, plan, tools } = useAccount()
  const limits = me?.limits
  const engines = tools && [
    { label: 'Writing tools', value: ENGINE_LABELS[tools.text.name] },
    { label: 'Image generation', value: ENGINE_LABELS[tools.image.name] },
    { label: 'Background removal', value: ENGINE_LABELS[tools.background.name] },
    { label: 'Object removal', value: tools.object.available ? ENGINE_LABELS.cloudinary : 'Not set up on this server' },
  ]

  return (
    <div className="animate-fade-up">
      <p className="eyebrow">Plan & usage</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Your plan</h1>
      <p className="mt-1.5 text-sm text-fg-2">Writing tools share one monthly allowance and image tools another. Failed runs never count.</p>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="card !rounded-[22px] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`chip !h-8 !px-3 ${plan === 'premium' ? 'chip-accent' : ''}`}>
              {plan === 'premium' ? <CrownIcon size={14} /> : <SparklesIcon size={14} />} {plan === 'premium' ? 'Premium' : 'Free plan'}
            </span>
            {usage && <span className="flex items-center gap-1.5 text-xs text-fg-3"><CalendarClockIcon size={14} /> Resets {formatDate(usage.resetsAt, { day: 'numeric', month: 'long' })}</span>}
          </div>
          <div className="mt-6 space-y-5">
            <UsageMeter kind="text" usage={usage} />
            <UsageMeter kind="image" usage={usage} />
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            {TOOLS.map((t) => (
              <div key={t.id} className="rounded-xl border border-line bg-surface p-2.5">
                <t.icon size={16} className="mx-auto" style={{ color: t.colors[0] }} />
                <p className="mt-1 text-lg font-semibold tabular-nums">{me ? me.stats.byType[t.id] || 0 : '–'}</p>
                <p className="truncate text-[11px] text-fg-3">{t.short}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card !rounded-[22px] p-6">
          <p className="flex items-center gap-2 font-semibold"><CpuIcon size={17} className="text-accent-text" /> What powers your tools</p>
          <ul className="mt-4 divide-y divide-[var(--border)] text-sm">
            {(engines || [0, 1, 2, 3].map(() => null)).map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                {e ? <><span className="text-fg-2">{e.label}</span><span className="text-right font-medium">{e.value}</span></> : <div className="skeleton h-4 w-full" />}
              </li>
            ))}
          </ul>
          {me?.demo && <p className="mt-4 flex items-start gap-2 text-xs text-fg-3"><InfoIcon size={14} className="mt-0.5 shrink-0" /> This is the shared demo account: its allowance refreshes for each visitor.</p>}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="plans-heading">
        <h2 id="plans-heading" className="text-xl font-semibold tracking-tight">Plans</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {limits ? (
            <>
              <PlanCard
                name="Free"
                icon={SparklesIcon}
                current={plan === 'free'}
                limits={limits.free}
                perks={['All six tools', 'Your creations saved and searchable', 'Share images with the community']}
                footer={<p className="text-sm text-fg-3">Free forever. The allowance refreshes on the 1st of every month.</p>}
              />
              <PlanCard
                name="Premium"
                icon={CrownIcon}
                highlight
                current={plan === 'premium'}
                limits={limits.premium}
                perks={['Everything in Free', 'For people who write and design every day']}
                footer={
                  plan === 'premium' ? (
                    <p className="text-sm text-fg-3">You're on Premium. Manage it from your account menu.</p>
                  ) : (
                    <p className="flex items-start gap-2 rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-fg-2">
                      <InfoIcon size={16} className="mt-0.5 shrink-0 text-accent-text" />
                      Premium is granted through a Clerk Billing plan named “premium”. Paid checkout isn't switched on for this deployment yet.
                    </p>
                  )
                }
              />
            </>
          ) : (
            [0, 1].map((i) => <div key={i} className="skeleton h-72 !rounded-[22px]" />)
          )}
        </div>
      </section>
    </div>
  )
}

export default Plan
