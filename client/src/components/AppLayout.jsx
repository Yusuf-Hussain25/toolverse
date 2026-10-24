import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { UserButton } from '@clerk/react'
import { CrownIcon, GalleryHorizontalEndIcon, LayoutDashboardIcon, LayoutGridIcon, MenuIcon, SparklesIcon, UsersIcon, XIcon } from 'lucide-react'
import Logo from './ui/Logo'
import ThemeToggle from './ui/ThemeToggle'
import UsageMeter from './UsageMeter'
import { useAccount } from '../hooks/useAccount'
import { TOOLS, toolGradient } from '../lib/tools'
import { formatDate } from '../lib/format'

const MAIN = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { to: '/library', label: 'My creations', icon: GalleryHorizontalEndIcon },
  { to: '/community', label: 'Community', icon: UsersIcon },
  { to: '/plan', label: 'Plan & usage', icon: CrownIcon },
]

const navClass = (active) =>
  `flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-sm transition-colors ${active ? 'bg-surface-3 font-medium text-fg' : 'text-fg-2 hover:bg-surface-2 hover:text-fg'}`

// Sidebar content, shared by the desktop rail and the mobile drawer
const SidebarContent = ({ isActive }) => {
  const { usage, plan, isDemo } = useAccount()
  return (
    <div className="flex h-full flex-col">
      <nav className="space-y-0.5" aria-label="Main">
        {MAIN.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navClass(isActive(to))}>
            <Icon size={17} /> {label}
          </NavLink>
        ))}
      </nav>

      <p className="eyebrow mt-6 mb-2 px-2.5">Tools</p>
      <nav className="space-y-0.5" aria-label="Tools">
        {TOOLS.map((t) => (
          <NavLink key={t.id} to={t.path} className={navClass(isActive(t.path))}>
            <span className="grid size-6 place-items-center rounded-lg text-white" style={{ background: toolGradient(t) }}>
              <t.icon size={13} />
            </span>
            {t.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="rounded-2xl border border-line bg-surface p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className={`chip ${plan === 'premium' ? 'chip-accent' : ''}`}>
              {plan === 'premium' ? <CrownIcon size={12} /> : <SparklesIcon size={12} />} {plan === 'premium' ? 'Premium' : 'Free plan'}
            </span>
            {usage && <span className="text-[11px] text-fg-3">Resets {formatDate(usage.resetsAt, { day: 'numeric', month: 'short' })}</span>}
          </div>
          <div className="space-y-3">
            <UsageMeter kind="text" usage={usage} compact />
            <UsageMeter kind="image" usage={usage} compact />
          </div>
          {isDemo && <p className="mt-3 text-[11px] text-fg-3">Shared demo account: the allowance refreshes for each visitor.</p>}
        </div>
      </div>
    </div>
  )
}

// Signed-in shell: sidebar on desktop; top bar, drawer and tab bar on phones
const AppLayout = () => {
  const { pathname } = useLocation()
  const { isDemo } = useAccount()
  const [drawer, setDrawer] = useState(false)
  const isActive = (to) => pathname === to || pathname.startsWith(`${to}/`)

  // Close the drawer after navigating
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route changes come from outside React state
    setDrawer(false)
  }, [pathname])

  useEffect(() => {
    if (!drawer) return
    const onKey = (e) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawer])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="glass sticky top-0 hidden h-dvh flex-col border-y-0 border-l-0 px-3 py-5 lg:flex" aria-label="Sidebar">
        <div className="mb-6 flex items-center justify-between px-1.5">
          <Logo to="/dashboard" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          <SidebarContent isActive={isActive} />
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-10">
        <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 sm:px-8">
            <button className="icon-btn lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><MenuIcon size={20} /></button>
            <div className="lg:hidden"><Logo to="/dashboard" size={26} /></div>
            {isDemo && <span className="chip chip-accent hidden sm:inline-flex"><SparklesIcon size={12} /> Demo account</span>}
            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />
              <div className="ml-1 grid size-9 place-items-center">
                <UserButton appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }} />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8 sm:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col overflow-y-auto px-3 py-5 animate-[fade-up_.2s_ease-out_both]" style={{ background: 'var(--panel-solid)' }}>
            <div className="mb-6 flex items-center justify-between px-1.5">
              <Logo to="/dashboard" />
              <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu"><XIcon size={19} /></button>
            </div>
            <SidebarContent isActive={isActive} />
          </div>
        </div>
      )}

      {/* Mobile tab bar */}
      <nav className="glass fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl p-1.5 shadow-deep lg:hidden" aria-label="Quick navigation">
        {[
          { to: '/dashboard', label: 'Home', icon: LayoutDashboardIcon },
          { to: '/tools', label: 'Tools', icon: LayoutGridIcon },
          { to: '/library', label: 'Mine', icon: GalleryHorizontalEndIcon },
          { to: '/community', label: 'Community', icon: UsersIcon },
        ].map(({ to, label, icon: Icon }) => {
          const active = isActive(to) || (to === '/tools' && pathname.startsWith('/tools'))
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors ${active ? 'bg-accent-soft text-accent-text' : 'text-fg-3'}`}>
              <Icon size={19} /> {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default AppLayout
