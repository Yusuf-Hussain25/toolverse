import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowUpIcon, CrownIcon, FolderIcon, HouseIcon, LayoutGridIcon, MenuIcon, SearchIcon, SparklesIcon, UsersIcon, XIcon, ZapIcon,
} from 'lucide-react'
import Logo from './ui/Logo'
import UsageMeter from './UsageMeter'
import CommandPalette from './CommandPalette'
import { NotificationsMenu, UserMenu } from './HeaderMenus'
import { useAccount } from '../hooks/useAccount'
import { TOOLS } from '../lib/tools'
import { formatDate } from '../lib/format'

const MAIN = [
  { to: '/dashboard', label: 'Dashboard', icon: HouseIcon },
  { to: '/library', label: 'My creations', icon: FolderIcon },
  { to: '/community', label: 'Community', icon: UsersIcon },
  { to: '/plan', label: 'Plan & usage', icon: CrownIcon },
]

const navClass = (active) =>
  `flex h-10 items-center gap-3 rounded-xl px-3 text-[14.5px] transition-colors ${active ? 'bg-accent-soft font-semibold text-fg' : 'text-fg-2 hover:bg-surface-2 hover:text-fg'}`

// Sidebar content, shared by the desktop rail and the mobile drawer
const SidebarContent = ({ isActive }) => {
  const { usage, plan, isDemo } = useAccount()
  return (
    <div className="flex h-full flex-col">
      <nav className="space-y-1" aria-label="Main">
        {MAIN.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navClass(isActive(to))}>
            <Icon size={18} className={isActive(to) ? 'text-accent-text' : ''} /> {label}
          </NavLink>
        ))}
      </nav>

      <p className="eyebrow mt-7 mb-2 px-3">Tools</p>
      <nav className="space-y-1" aria-label="Tools">
        {TOOLS.map((t) => (
          <NavLink key={t.id} to={t.path} className={navClass(isActive(t.path))}>
            <t.icon size={18} style={{ color: t.colors[0] }} /> {t.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="rounded-2xl border border-line bg-[var(--panel-solid)] p-4 shadow-[var(--shadow-sm)]">
          <div className="mb-4 flex items-center justify-between">
            <span className="chip !h-7 !bg-transparent !px-2.5 font-semibold !text-fg">
              {plan === 'premium' ? <CrownIcon size={13} className="text-accent-text" /> : <SparklesIcon size={13} />} {plan === 'premium' ? 'Premium' : 'Free plan'}
            </span>
            {usage && <span className="text-[11px] text-fg-3">Resets {formatDate(usage.resetsAt, { month: 'short', day: 'numeric' })}</span>}
          </div>
          <div className="space-y-3.5">
            <UsageMeter kind="text" usage={usage} compact />
            <UsageMeter kind="image" usage={usage} compact />
          </div>
          {plan !== 'premium' && (
            <Link to="/plan" className="btn btn-mono btn-block btn-sm mt-4"><ArrowUpIcon size={15} /> Upgrade plan</Link>
          )}
          {isDemo && <p className="mt-3 text-[11px] leading-snug text-fg-3">Shared demo account: the allowance refreshes for each visitor.</p>}
        </div>
      </div>
    </div>
  )
}

// Signed-in shell: sidebar on desktop; top bar, drawer and tab bar on phones
const AppLayout = () => {
  const { pathname } = useLocation()
  const { plan, isDemo } = useAccount()
  const [drawer, setDrawer] = useState(false)
  const [palette, setPalette] = useState(false)
  const isActive = (to) => pathname === to || pathname.startsWith(`${to}/`)

  // Close the drawer after navigating
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- route changes come from outside React state
    setDrawer(false)
  }, [pathname])

  // Ctrl/Cmd + K opens search anywhere in the app
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette(true)
      }
      if (e.key === 'Escape') setDrawer(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-[var(--bg-elev)] px-4 py-6 lg:flex" aria-label="Sidebar">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Logo to="/dashboard" size={32} />
          <span className="chip chip-accent !h-6 !px-2 font-semibold">2.0</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          <SidebarContent isActive={isActive} />
        </div>
      </aside>

      <div className="min-w-0 pb-24 lg:pb-10">
        <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] w-full max-w-[1400px] items-center gap-3 px-4 sm:px-8">
            <button className="icon-btn lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu"><MenuIcon size={20} /></button>
            <div className="lg:hidden"><Logo to="/dashboard" size={28} showText={false} /></div>

            <button
              onClick={() => setPalette(true)}
              className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-[var(--panel-solid)] px-3.5 text-left text-sm text-fg-3 shadow-[var(--shadow-sm)] transition-colors hover:border-line-strong sm:max-w-xl"
              aria-label="Search tools and creations (Ctrl+K)"
            >
              <SearchIcon size={17} className="shrink-0" />
              <span className="truncate">Search tools or your creations…</span>
              <kbd className="kbd ml-auto hidden sm:inline-grid">Ctrl K</kbd>
            </button>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
              {isDemo && <span className="chip chip-accent hidden xl:inline-flex"><SparklesIcon size={12} /> Demo account</span>}
              {plan !== 'premium' ? (
                <Link to="/plan" className="btn btn-mono btn-sm hidden sm:inline-flex"><ZapIcon size={15} /> Upgrade</Link>
              ) : (
                <span className="chip chip-accent hidden sm:inline-flex"><CrownIcon size={12} /> Premium</span>
              )}
              <NotificationsMenu />
              <UserMenu />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 pt-6 sm:px-8 sm:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col overflow-y-auto px-4 py-5 animate-[fade-up_.2s_ease-out_both]" style={{ background: 'var(--panel-solid)' }}>
            <div className="mb-6 flex items-center justify-between px-1">
              <div className="flex items-center gap-2"><Logo to="/dashboard" /><span className="chip chip-accent !h-6 !px-2 font-semibold">2.0</span></div>
              <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close menu"><XIcon size={19} /></button>
            </div>
            <SidebarContent isActive={isActive} />
          </div>
        </div>
      )}

      {/* Mobile tab bar */}
      <nav className="glass fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl p-1.5 shadow-deep lg:hidden" aria-label="Quick navigation">
        {[
          { to: '/dashboard', label: 'Home', icon: HouseIcon },
          { to: '/tools', label: 'Tools', icon: LayoutGridIcon },
          { to: '/library', label: 'Mine', icon: FolderIcon },
          { to: '/community', label: 'Community', icon: UsersIcon },
        ].map(({ to, label, icon: Icon }) => {
          const active = isActive(to)
          return (
            <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors ${active ? 'bg-accent-soft text-accent-text' : 'text-fg-3'}`}>
              <Icon size={19} /> {label}
            </Link>
          )
        })}
      </nav>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </div>
  )
}

export default AppLayout
