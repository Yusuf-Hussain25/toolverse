import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { FlameIcon, HeartIcon, ImageIcon, SparklesIcon, XIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { errorMessage, fileUrl } from '../config/api'
import Avatar from '../components/ui/Avatar'
import EmptyState from '../components/ui/EmptyState'
import { imageDownloadUrl } from '../lib/creations'
import { timeAgo } from '../lib/format'

const LikeButton = ({ item, onToggle, large = false }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onToggle(item) }}
    aria-pressed={item.liked}
    aria-label={item.liked ? `Unlike, ${item.likes} likes` : `Like, ${item.likes} likes`}
    className={`inline-flex items-center gap-1.5 rounded-full font-medium backdrop-blur transition-transform active:scale-95 ${large ? 'btn btn-ghost btn-sm' : 'bg-black/45 px-2.5 py-1 text-xs text-white hover:bg-black/60'}`}
  >
    <HeartIcon size={large ? 16 : 13} className={item.liked ? 'fill-rose-500 text-rose-500' : ''} /> {item.likes}
  </button>
)

// Large view of a shared image: prompt, style, author and likes
const Viewer = ({ item, onClose, onToggle }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={item.title} className="card relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden shadow-deep animate-pop-in md:grid-cols-[1fr_320px]" style={{ background: 'var(--panel-solid)' }}>
        <div className={`grid min-h-[280px] place-items-center ${item.type === 'background' ? 'checker' : 'bg-black'}`}>
          <img src={fileUrl(item.imageUrl)} alt={item.title} className="max-h-[70vh] w-full object-contain md:max-h-[92vh]" />
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          <div className="flex items-center gap-3">
            <Avatar name={item.author.name} src={item.author.photo} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.author.name}{item.mine && <span className="ml-1.5 text-xs font-normal text-fg-3">(you)</span>}</p>
              <p className="text-xs text-fg-3">{timeAgo(item.createdAt)}</p>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><XIcon size={19} /></button>
          </div>
          <div>
            <p className="eyebrow mb-1.5">Prompt</p>
            <p className="text-sm leading-relaxed text-fg-2">{item.prompt || item.title}</p>
          </div>
          {item.options?.style && (
            <div className="flex flex-wrap gap-1.5">
              <span className="chip">{item.options.style}</span>
              {item.options.aspect && <span className="chip capitalize">{item.options.aspect}</span>}
            </div>
          )}
          <div className="mt-auto flex flex-wrap gap-2">
            <LikeButton item={item} onToggle={onToggle} large />
            <a href={imageDownloadUrl(item)} className="btn btn-ghost btn-sm">Download</a>
            <Link to={`/tools/generate-image`} className="btn btn-primary btn-sm"><SparklesIcon size={15} /> Make your own</Link>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// Shared images from everyone, newest or most liked, with likes and a large viewer
const Community = () => {
  const [sort, setSort] = useState('new')
  const [items, setItems] = useState(null)
  const [nextPage, setNextPage] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [open, setOpen] = useState(null)
  const requestId = useRef(0)

  const load = useCallback(async (page = 0) => {
    const id = ++requestId.current
    if (page) setLoadingMore(true)
    try {
      const { data } = await api.get('/api/community', { params: { sort, page } })
      if (id !== requestId.current) return
      setItems((prev) => (page ? [...(prev || []), ...data.creations] : data.creations))
      setNextPage(data.nextPage)
    } catch (err) {
      if (id === requestId.current) {
        toast.error(errorMessage(err, 'Could not load the community'))
        setItems((prev) => prev || [])
      }
    } finally {
      if (id === requestId.current) setLoadingMore(false)
    }
  }, [sort])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show skeletons while the new order loads
    setItems(null)
    load()
  }, [load])

  // Optimistic like, rolled back if the API refuses
  const toggleLike = async (item) => {
    const flip = (i) => (i.id === item.id ? { ...i, liked: !item.liked, likes: item.likes + (item.liked ? -1 : 1) } : i)
    setItems((list) => list.map(flip))
    setOpen((o) => (o?.id === item.id ? flip(o) : o))
    try {
      const { data } = await api.post(`/api/community/${item.id}/like`)
      const settle = (i) => (i.id === item.id ? { ...i, liked: data.liked, likes: data.likes } : i)
      setItems((list) => list.map(settle))
      setOpen((o) => (o?.id === item.id ? settle(o) : o))
    } catch (err) {
      const undo = (i) => (i.id === item.id ? item : i)
      setItems((list) => list.map(undo))
      setOpen((o) => (o?.id === item.id ? item : o))
      toast.error(errorMessage(err))
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Community</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">Made with Toolverse</h1>
          <p className="mt-1.5 text-sm text-fg-2">Images people chose to share. Like your favourites, or share your own from the image generator.</p>
        </div>
        <div className="segmented" role="group" aria-label="Sort">
          <button aria-pressed={sort === 'new'} onClick={() => setSort('new')}><SparklesIcon size={14} /> Newest</button>
          <button aria-pressed={sort === 'top'} onClick={() => setSort('top')}><FlameIcon size={14} /> Most liked</button>
        </div>
      </div>

      {items?.length === 0 ? (
        <div className="card mt-6">
          <EmptyState
            icon={ImageIcon}
            title="Nothing shared yet"
            text="Generate an image and switch on “Share with the community” to be the first."
            action={<Link to="/tools/generate-image" className="btn btn-primary btn-sm">Generate an image</Link>}
          />
        </div>
      ) : (
        <ul className="mt-6 columns-1 gap-4 min-[460px]:columns-2 lg:columns-3 2xl:columns-4">
          {items === null
            ? [300, 220, 360, 260, 320, 240].map((h, i) => <li key={i} className="skeleton mb-4 break-inside-avoid !rounded-[22px]" style={{ height: h }} />)
            : items.map((item) => (
                <li key={item.id} className="mb-4 break-inside-avoid animate-fade-up">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpen(item)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(item))}
                    aria-label={`Open ${item.title}`}
                    className="group card relative block w-full cursor-zoom-in overflow-hidden !rounded-[22px] text-left focus-visible:outline-offset-2"
                  >
                    <img
                      src={fileUrl(item.imageUrl)}
                      alt={item.title}
                      loading="lazy"
                      className={`w-full transition-transform duration-500 group-hover:scale-[1.03] ${item.type === 'background' ? 'checker' : ''}`}
                      style={item.width && item.height ? { aspectRatio: `${item.width} / ${item.height}` } : undefined}
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pt-10">
                      <span className="flex min-w-0 items-center gap-2 text-white">
                        <Avatar name={item.author.name} src={item.author.photo} size={26} />
                        <span className="truncate text-xs font-medium">{item.mine ? 'You' : item.author.name}</span>
                      </span>
                      <LikeButton item={item} onToggle={toggleLike} />
                    </div>
                  </div>
                </li>
              ))}
        </ul>
      )}

      {nextPage !== null && items?.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button className="btn btn-ghost" onClick={() => load(nextPage)} disabled={loadingMore}>
            {loadingMore && <span className="spinner !size-4" />} Load more
          </button>
        </div>
      )}

      {open && <Viewer item={open} onClose={() => setOpen(null)} onToggle={toggleLike} />}
    </div>
  )
}

export default Community
