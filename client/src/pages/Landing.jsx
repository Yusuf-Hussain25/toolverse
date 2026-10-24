import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import { ArrowRightIcon, BadgeCheckIcon, CheckIcon, CrownIcon, LayersIcon, LockIcon, SparklesIcon, UsersIcon, WandSparklesIcon } from 'lucide-react'
import Logo from '../components/ui/Logo'
import ThemeToggle from '../components/ui/ThemeToggle'
import ToolPreview from '../components/marketing/ToolPreview'
import ToolArt from '../components/dashboard/ToolArt'
import { TOOLS } from '../lib/tools'

const DEMO_ENABLED = Boolean(import.meta.env.VITE_DEMO_EMAIL)

const WHY = [
  { icon: LayersIcon, title: 'Six tools, one workspace', text: 'Write, brainstorm, generate, cut out, clean up and review without juggling apps or accounts.' },
  { icon: WandSparklesIcon, title: 'Prompts done for you', text: 'Pick a tone, length, category or style. Toolverse turns it into the right prompt for the model.' },
  { icon: SparklesIcon, title: 'Strong models behind it', text: 'Leading language models write and review; modern image models paint. Everything you make is saved and searchable.' },
  { icon: UsersIcon, title: 'A community gallery', text: 'Share your best images, like other people’s and find ideas for your next prompt.' },
  { icon: LockIcon, title: 'Private by default', text: 'Your creations are yours. Files are served through short-lived signed links, and sharing is opt-in.' },
  { icon: CrownIcon, title: 'Free every month', text: '30 writing and 15 image actions on the free plan. Failed runs never count.' },
]

const FAQ = [
  ['Is Toolverse free?', 'Yes. The free plan includes 30 writing and 15 image actions every month across all six tools, with no card needed.'],
  ['What counts as an action?', 'One finished result: an article, a list of titles, a review, an image or an edited photo. If a tool fails, the action is given back.'],
  ['Who can see what I make?', 'Only you. Images appear in the community only when you choose to share them, and you can make them private again at any time.'],
  ['Can I download my work?', 'Yes. Copy or download any text as Markdown and download any image in full size from your creations.'],
]

const Landing = () => {
  const { isSignedIn } = useAuth()
  const start = isSignedIn ? '/dashboard' : '/register'

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-8">
          <Logo />
          <nav className="ml-8 hidden items-center gap-1 md:flex" aria-label="Sections">
            {[['#tools', 'Tools'], ['#why', 'Why Toolverse'], ['#plans', 'Plans'], ['#faq', 'FAQ']].map(([href, label]) => (
              <a key={href} href={href} className="rounded-lg px-3 py-1.5 text-sm text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg">{label}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            {isSignedIn ? (
              <Link to="/dashboard" className="btn btn-mono btn-sm">Open dashboard <ArrowRightIcon size={15} /></Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">Log in</Link>
                <Link to="/register" className="btn btn-mono btn-sm">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-12 pb-16 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:pt-20">
          <div className="min-w-0 animate-fade-up">
            <span className="chip chip-accent"><SparklesIcon size={13} /> Toolverse 2.0 is here</span>
            <h1 className="mt-5 text-[44px] leading-[1.02] font-semibold tracking-[-0.05em] sm:text-[62px]">
              One workspace.<br /><span className="gradient-text">A universe of AI tools.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-fg-2 sm:text-lg">
              Write articles, brainstorm titles, generate images, remove backgrounds and objects, and get your resume reviewed. Everything you make is saved in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={start} className="btn btn-primary btn-lg"><SparklesIcon size={18} /> Start creating free</Link>
              {!isSignedIn && DEMO_ENABLED && <Link to="/login" className="btn btn-ghost btn-lg">Explore the demo</Link>}
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-3">
              {['No card needed', '6 tools included', 'Download everything'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><BadgeCheckIcon size={16} className="text-accent-text" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="min-w-0 animate-fade-up [animation-delay:.1s]"><ToolPreview /></div>
        </section>

        <section id="tools" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 pt-10 sm:px-8">
          <p className="eyebrow text-center">Tools</p>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Everything for words and images</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t) => (
              <li key={t.id}>
                <Link to={isSignedIn ? t.path : '/register'} className="group card relative flex h-full min-h-[150px] flex-col overflow-hidden !rounded-[22px] p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-soft">
                  <ToolArt toolId={t.id} />
                  <div className="relative max-w-[58%]">
                    <span className="grid size-11 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${t.colors[0]} 14%, transparent)`, color: t.colors[0] }}><t.icon size={20} /></span>
                    <h3 className="mt-3 font-semibold tracking-tight">{t.name}</h3>
                    <p className="mt-1 text-[13px] leading-snug text-fg-2">{t.tagline}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="why" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 pt-24 sm:px-8">
          <p className="eyebrow text-center">Why Toolverse</p>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Less juggling, better results</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map(({ icon: Icon, title, text }) => (
              <li key={title} className="card !rounded-[22px] p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-text"><Icon size={19} /></span>
                <h3 className="mt-4 font-semibold tracking-tight">{title}</h3>
                <p className="mt-1.5 text-sm text-fg-2">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="plans" className="mx-auto w-full max-w-4xl scroll-mt-20 px-4 pt-24 sm:px-8">
          <p className="eyebrow text-center">Plans</p>
          <h2 className="mt-2 text-center text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Start free, stay free</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              { name: 'Free', icon: SparklesIcon, text: 30, image: 15, perks: ['All six tools', 'Creations saved and searchable', 'Community sharing'], cta: true },
              { name: 'Premium', icon: CrownIcon, text: 500, image: 200, perks: ['Everything in Free', 'For daily writers and designers'] },
            ].map((p) => (
              <div key={p.name} className={`card flex flex-col !rounded-[22px] p-6 ${p.cta ? 'shadow-glow' : ''}`}>
                <span className="grid size-11 place-items-center rounded-2xl bg-accent-soft text-accent-text"><p.icon size={20} /></span>
                <h3 className="mt-4 text-lg font-semibold">{p.name}</h3>
                <ul className="mt-4 flex-1 space-y-2.5 text-sm">
                  <li><b>{p.text}</b> writing actions a month</li>
                  <li><b>{p.image}</b> image actions a month</li>
                  {p.perks.map((x) => <li key={x} className="flex gap-2 text-fg-2"><CheckIcon size={16} className="mt-0.5 text-ok" /> {x}</li>)}
                </ul>
                {p.cta ? <Link to={start} className="btn btn-primary mt-6">Start free</Link> : <p className="mt-6 text-sm text-fg-3">Upgrades open from inside the app.</p>}
              </div>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto w-full max-w-3xl scroll-mt-20 px-4 pt-24 sm:px-8">
          <h2 className="text-center text-3xl font-semibold tracking-[-0.035em]">Questions</h2>
          <div className="mt-8 space-y-2">
            {FAQ.map(([q, a]) => (
              <details key={q} className="card group !rounded-2xl px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {q}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-2 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-2 text-sm text-fg-2">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pt-24 sm:px-8">
          <div className="card relative overflow-hidden !rounded-[28px] px-6 py-14 text-center">
            <div className="pointer-events-none absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full opacity-30 blur-3xl" style={{ background: 'var(--accent-grad)' }} />
            <h2 className="relative text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Your next idea is a click away</h2>
            <p className="relative mt-3 text-fg-2">Free to start. No card, no clutter.</p>
            <Link to={start} className="btn btn-mono btn-lg relative mt-7">Open Toolverse <ArrowRightIcon size={18} /></Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-20 flex w-full max-w-7xl flex-col gap-4 border-t border-line px-4 py-8 text-sm text-fg-3 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo size={24} />
        <p>© 2026 Toolverse · Built by <a href="https://github.com/Yusuf-Hussain25" className="text-fg-2 hover:text-fg">Yusuf Hussain</a></p>
      </footer>
    </div>
  )
}

export default Landing
