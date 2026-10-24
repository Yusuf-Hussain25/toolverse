import { useState } from 'react'
import { SignIn, SignUp, useClerk, useUser } from '@clerk/react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, GaugeIcon, ShieldCheckIcon, SparklesIcon, UsersIcon, WandSparklesIcon, LayersIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Logo from '../components/ui/Logo'
import ThemeToggle from '../components/ui/ThemeToggle'
import ToolPreview from '../components/marketing/ToolPreview'
import api, { errorMessage } from '../config/api'

// Shows the demo button; the server issues the actual sign-in ticket
const DEMO_ENABLED = Boolean(import.meta.env.VITE_DEMO_EMAIL)

const FEATURES = [
  { icon: LayersIcon, title: 'Six tools, one place', text: 'Write, brainstorm, generate, cut out, clean up and review without switching apps.' },
  { icon: WandSparklesIcon, title: 'Built-in prompts', text: 'Pick a tone, length, category or style; Toolverse writes the prompt for you.' },
  { icon: UsersIcon, title: 'Community gallery', text: 'Share your best images and see what others are creating.' },
  { icon: GaugeIcon, title: 'Free every month', text: '30 writing and 15 image actions on the free plan, refreshed monthly.' },
]

// Clerk renders its own form; we hide its header and frame it in our glass card.
const embedded = {
  elements: {
    header: { display: 'none' },
    rootBox: { width: '100%' },
  },
}

const Auth = ({ mode = 'login' }) => {
  const isRegister = mode === 'register'
  const { isLoaded, isSignedIn } = useUser()
  const clerk = useClerk()
  const navigate = useNavigate()
  const [demoLoading, setDemoLoading] = useState(false)

  if (isLoaded && isSignedIn) {
    return <Navigate to="/dashboard" replace />
  }

  const signInAsDemo = async () => {
    if (!clerk.loaded) return
    setDemoLoading(true)
    try {
      const { data } = await api.post('/api/demo/session')
      const attempt = await clerk.client.signIn.create({ strategy: 'ticket', ticket: data.ticket })
      if (attempt.status !== 'complete') {
        throw new Error('The demo account needs an extra verification step. Use the form instead.')
      }
      await clerk.setActive({ session: attempt.createdSessionId })
      toast.success('Signed in to the demo account')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.errors?.[0]?.longMessage || errorMessage(err, 'Could not open the demo account'))
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-1">
          <Link to="/" className="btn btn-ghost btn-sm hidden sm:inline-flex"><ArrowLeftIcon size={15} /> Home</Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile order: headline, auth card, preview. Desktop: hero left, card right. */}
      <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-14 sm:px-8 lg:grid-cols-[1.12fr_1fr] lg:gap-x-14 lg:pt-4">
        <section className="min-w-0 animate-fade-up lg:col-start-1 lg:row-start-1">
          <span className="chip chip-accent"><SparklesIcon size={13} /> Toolverse 2.0 is here</span>
          <h1 className="mt-5 text-[40px] leading-[1.04] font-semibold tracking-[-0.045em] sm:text-[54px]">
            One workspace.<br className="hidden sm:block" /> <span className="gradient-text">A universe of AI tools.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-fg-2 sm:text-lg">
            Write articles, brainstorm titles, generate images, remove backgrounds and objects, and get your resume reviewed. Everything you make is saved.
          </p>
        </section>

        <section className="min-w-0 animate-fade-up [animation-delay:.08s] lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <div className="card mx-auto w-full max-w-[460px] p-5 shadow-deep sm:p-7">
            <div className="segmented mb-6 w-full" role="group" aria-label="Choose log in or sign up">
              <button aria-pressed={!isRegister} className="flex-1 justify-center" onClick={() => navigate('/login', { replace: true })}>Log in</button>
              <button aria-pressed={isRegister} className="flex-1 justify-center" onClick={() => navigate('/register', { replace: true })}>Sign up</button>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h2>
            <p className="mt-1 text-sm text-fg-3">
              {isRegister ? 'Free plan included, no card needed.' : 'Log in to open your workspace.'}
            </p>

            <div className="mt-5 min-h-[300px]">
              {!isLoaded && (
                <div className="space-y-3" aria-hidden="true">
                  <div className="skeleton h-11" />
                  <div className="skeleton mx-auto h-3 w-16" />
                  <div className="skeleton h-11" />
                  <div className="skeleton h-11" />
                  <div className="skeleton h-11" />
                </div>
              )}
              {isRegister ? (
                <SignUp routing="path" path="/register" signInUrl="/login" fallbackRedirectUrl="/dashboard" appearance={embedded} />
              ) : (
                <SignIn routing="path" path="/login" signUpUrl="/register" fallbackRedirectUrl="/dashboard" appearance={embedded} />
              )}
            </div>

            {DEMO_ENABLED && (
              <>
                <div className="my-5 flex items-center gap-3 text-xs text-fg-3">
                  <span className="h-px flex-1 bg-line-strong" /> or <span className="h-px flex-1 bg-line-strong" />
                </div>
                <button className="btn btn-ghost btn-block" onClick={signInAsDemo} disabled={demoLoading || !isLoaded}>
                  {demoLoading ? <span className="spinner" /> : <SparklesIcon size={17} className="text-accent-text" />}
                  {demoLoading ? 'Opening demo…' : 'Explore with a demo account'}
                </button>
              </>
            )}

            <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-fg-3">
              <ShieldCheckIcon size={13} /> Your creations stay private unless you share them
            </p>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-8 animate-fade-up [animation-delay:.12s] lg:col-start-1 lg:row-start-2">
          <ToolPreview />

          <ul className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="card flex gap-3 rounded-[20px] p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text"><Icon size={17} /></span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-fg-3">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

export default Auth
