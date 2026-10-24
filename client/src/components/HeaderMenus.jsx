import { useCallback, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClerk } from '@clerk/react'
import { BellIcon, ChevronDownIcon, CrownIcon, HeartIcon, LogOutIcon, MoonIcon, SunIcon, UserCogIcon } from 'lucide-react'
import api, { fileUrl } from '../config/api'
import Avatar from './ui/Avatar'
import { useAccount } from '../hooks/useAccount'
import { useDismiss } from '../hooks/useDismiss'
import { useTheme } from '../hooks/useTheme'
import { setThemePreference } from '../lib/theme'
import { timeAgo } from '../lib/format'

const panel = 'card absolute right-0 top-[calc(100%+8px)] z-40 overflow-hidden shadow-deep animate-pop-in'

// Likes other people left on your shared images; opening it marks them as seen
export const NotificationsMenu = () => {
  const { me, refresh } = useAccount()
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, ref, close)
  const unread = me?.unreadNotifications || 0

  const toggle = async () => {
    if (open) return setOpen(false)
    setOpen(true)
    try {
      const { data } = await api.get('/api/notifications')
      setItems(data.notifications)
      if (unread) {
        await api.post('/api/notifications/seen')
        refresh()
      }
    } catch {
      setItems([])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button className="icon-btn relative" onClick={toggle} aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'} aria-expanded={open}>
        <BellIcon size={19} />
        {unread > 0 && <span className="absolute top-2 right-2 size-2 rounded-full bg-danger ring-2 ring-[var(--panel-solid)]" />}
      </button>
      {open && (
        <div className={`${panel} w-[min(360px,calc(100vw-24px))]`} style={{ background: 'var(--panel-solid)' }} role="dialog" aria-label="Notifications">
          <p className="border-b border-line px-4 py-3 text-sm font-semibold">Notifications</p>
          <ul className="max-h-96 overflow-y-auto">
            {items === null && [0, 1, 2].map((i) => <li key={i} className="flex gap-3 px-4 py-3"><div className="skeleton size-9 !rounded-full" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-3/4" /><div className="skeleton h-3 w-1/3" /></div></li>)}
            {items?.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-fg-3">
                <HeartIcon size={20} className="mx-auto mb-2" />
                No notifications yet. Share an image with the community and likes show up here.
              </li>
            )}
            {items?.map((n) => (
              <li key={n.id}>
                <Link to={`/library?open=${n.creationId}`} onClick={close} className={`flex items-center gap-3 px-4 py-3 hover:bg-surface ${n.unread ? 'bg-accent-soft/50' : ''}`}>
                  <Avatar name={n.from.name} src={n.from.photo} size={36} />
                  <p className="min-w-0 flex-1 text-sm">
                    <span className="font-medium">{n.from.name}</span> liked <span className="font-medium">“{n.title}”</span>
                    <span className="block text-xs text-fg-3">{timeAgo(n.createdAt)}</span>
                  </p>
                  {n.imageUrl && <img src={fileUrl(n.imageUrl)} alt="" className="size-10 shrink-0 rounded-lg object-cover" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Avatar, name and plan; opens account settings, plan, theme and sign out
export const UserMenu = () => {
  const { me, plan } = useAccount()
  const clerk = useClerk()
  const navigate = useNavigate()
  const theme = useTheme()
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(open, ref, close)
  const user = me?.user

  const item = 'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg-2 hover:bg-surface-2 hover:text-fg'
  return (
    <div ref={ref} className="relative">
      <button className="flex items-center gap-2.5 rounded-xl py-1 pr-1.5 pl-1 transition-colors hover:bg-surface-2" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Account menu">
        {user ? <Avatar name={user.name} src={user.photo} size={34} /> : <span className="skeleton size-[34px] !rounded-full" />}
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[140px] truncate text-sm font-semibold">{user?.name || ' '}</span>
          <span className="block text-xs text-fg-3">{plan === 'premium' ? 'Premium' : 'Free plan'}</span>
        </span>
        <ChevronDownIcon size={16} className="hidden text-fg-3 sm:block" />
      </button>
      {open && (
        <div className={`${panel} w-60 p-1.5`} style={{ background: 'var(--panel-solid)' }} role="menu">
          <div className="border-b border-line px-2.5 pt-1.5 pb-2.5">
            <p className="truncate text-sm font-semibold">{user?.name}</p>
            <p className="truncate text-xs text-fg-3">{user?.email}</p>
          </div>
          <div className="pt-1.5">
            <button role="menuitem" className={item} onClick={() => { close(); clerk.openUserProfile() }}><UserCogIcon size={16} /> Manage account</button>
            <button role="menuitem" className={item} onClick={() => { close(); navigate('/plan') }}><CrownIcon size={16} /> Plan & usage</button>
            <button role="menuitem" className={item} onClick={() => setThemePreference(theme === 'light' ? 'dark' : 'light')}>
              {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />} {theme === 'light' ? 'Dark theme' : 'Light theme'}
            </button>
            <button role="menuitem" className={`${item} !text-danger`} onClick={() => clerk.signOut({ redirectUrl: '/' })}><LogOutIcon size={16} /> Sign out</button>
          </div>
        </div>
      )}
    </div>
  )
}
