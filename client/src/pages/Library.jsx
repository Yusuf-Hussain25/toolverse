import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GalleryHorizontalEndIcon, LayoutGridIcon, SearchIcon, SearchXIcon, XIcon } from 'lucide-react'
import api, { errorMessage } from '../config/api'
import CreationCard, { CreationCardSkeleton } from '../components/creations/CreationCard'
import CreationViewer from '../components/creations/CreationViewer'
import EmptyState from '../components/ui/EmptyState'
import { TOOLS, toolById } from '../lib/tools'
import { plural } from '../lib/format'

// Everything you've made, filterable by tool (?type=image) and searchable
const Library = () => {
  const [params, setParams] = useSearchParams()
  const type = toolById(params.get('type')) ? params.get('type') : ''
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(null)
  const requestId = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  // Only the latest request may update the grid, so fast typing can't show stale results
  const load = useCallback(async (cursor = null) => {
    const id = ++requestId.current
    cursor ? setLoadingMore(true) : setLoading(true)
    try {
      const { data } = await api.get('/api/creations', { params: { type: type || undefined, q: search || undefined, cursor: cursor || undefined } })
      if (id !== requestId.current) return
      setItems((prev) => (cursor ? [...prev, ...data.creations] : data.creations))
      setTotal(data.total)
      setNextCursor(data.nextCursor)
      setError(null)
    } catch (err) {
      if (id === requestId.current) setError(errorMessage(err, 'Could not load your creations'))
    } finally {
      if (id === requestId.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [type, search])

  useEffect(() => {
    // Refetch when the filter or search changes; showing skeletons right away is intended
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  // /library?open=<id> (from search or a notification) opens that creation
  const openId = params.get('open')
  useEffect(() => {
    if (!openId) return
    let cancelled = false
    api.get(`/api/creations/${openId}`).then(({ data }) => !cancelled && setOpen(data.creation)).catch(() => {})
    return () => { cancelled = true }
  }, [openId])
  const closeViewer = () => {
    setOpen(null)
    if (openId) {
      const next = new URLSearchParams(params)
      next.delete('open')
      setParams(next, { replace: true })
    }
  }

  const setType = (t) => setParams(t ? { type: t } : {}, { replace: true })
  const filtered = Boolean(type || search)
  const update = (c) => {
    setItems((list) => list.map((i) => (i.id === c.id ? c : i)))
    setOpen(c)
  }
  const removeItem = (c) => {
    setItems((list) => list.filter((i) => i.id !== c.id))
    setTotal((t) => t - 1)
  }

  return (
    <div className="animate-fade-up">
      <p className="eyebrow">Library</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">My creations</h1>
      <p className="mt-1.5 text-sm text-fg-3" aria-live="polite">
        {loading ? 'Loading…' : filtered ? plural(total, 'match', 'matches') : `${plural(total, 'creation')}, saved to your account`}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <div className="input-wrap sm:max-w-sm">
          <SearchIcon size={17} />
          <input className="input" type="search" placeholder="Search titles and prompts" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search your creations" />
        </div>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by tool">
          <button className={`chip !h-8 shrink-0 !px-3 ${!type ? 'chip-accent' : 'hover:border-line-strong'}`} aria-pressed={!type} onClick={() => setType('')}>
            <LayoutGridIcon size={13} /> All
          </button>
          {TOOLS.map((t) => (
            <button key={t.id} className={`chip !h-8 shrink-0 !px-3 ${type === t.id ? 'chip-accent' : 'hover:border-line-strong'}`} aria-pressed={type === t.id} onClick={() => setType(t.id)}>
              <t.icon size={13} /> {t.short}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-5" role="alert">
          <p className="text-sm text-fg-2">{error}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => load()}>Try again</button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="card mt-6">
          {filtered ? (
            <EmptyState
              icon={SearchXIcon}
              title={search ? `Nothing matches “${search}”` : `No ${toolById(type)?.short.toLowerCase()} creations yet`}
              text="Try another search, or clear the filters."
              action={<button className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setType('') }}><XIcon size={15} /> Clear filters</button>}
            />
          ) : (
            <EmptyState
              icon={GalleryHorizontalEndIcon}
              title="Nothing here yet"
              text="Everything you make with the tools is saved here: articles, titles, images and reviews."
              action={<Link to="/tools" className="btn btn-primary btn-sm">Pick a tool</Link>}
            />
          )}
        </div>
      )}

      <ul className="mt-6 grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }, (_, i) => <CreationCardSkeleton key={i} />)
          : items.map((c) => <CreationCard key={c.id} creation={c} onOpen={setOpen} />)}
      </ul>

      {!loading && nextCursor && (
        <div className="mt-8 flex justify-center">
          <button className="btn btn-ghost" onClick={() => load(nextCursor)} disabled={loadingMore}>
            {loadingMore && <span className="spinner !size-4" />} Load more
          </button>
        </div>
      )}

      {open && <CreationViewer creation={open} onClose={closeViewer} onChange={update} onDelete={removeItem} />}
    </div>
  )
}

export default Library
