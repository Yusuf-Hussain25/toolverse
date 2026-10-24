import ScoreRing from '../ui/ScoreRing'

// Small illustrations on the dashboard's tool cards, built from real sample outputs and CSS.
// Decorative only: hidden from screen readers.

const Lines = ({ n = 6, widths = [100, 92, 96, 70, 88, 60] }) => (
  <div className="space-y-1.5">
    {Array.from({ length: n }, (_, i) => <div key={i} className="h-1.5 rounded-full bg-slate-300/70" style={{ width: `${widths[i % widths.length]}%` }} />)}
  </div>
)

const Paper = ({ className = '', style, children }) => (
  <div className={`absolute rounded-lg border border-slate-200 bg-white p-2.5 shadow-[0_10px_30px_rgba(17,24,39,.12)] ${className}`} style={style}>{children}</div>
)

const ARTS = {
  article: () => (
    <>
      <Paper className="top-5 right-8 h-28 w-24 rotate-[8deg] opacity-70"><Lines n={5} /></Paper>
      <Paper className="top-2 right-14 h-32 w-24 -rotate-[4deg]">
        <div className="mb-2 h-2 w-3/4 rounded-full bg-slate-400/80" />
        <Lines n={7} />
      </Paper>
    </>
  ),
  'blog-titles': () => (
    <>
      <Paper className="top-7 right-6 h-20 w-28 rotate-[10deg] !bg-violet-100"><Lines n={3} /></Paper>
      <Paper className="top-3 right-12 h-24 w-32 -rotate-[6deg]">
        <p className="mb-2 text-[8px] font-semibold text-slate-500">Blog titles</p>
        <Lines n={4} widths={[90, 75, 85, 60]} />
      </Paper>
    </>
  ),
  image: () => (
    <>
      <div className="absolute top-3 right-4 h-24 w-32 rotate-[7deg] overflow-hidden rounded-xl border-2 border-white shadow-[0_10px_30px_rgba(17,24,39,.18)]">
        <img src="/samples/snow-fox.webp" alt="" className="size-full object-cover" />
      </div>
      <div className="absolute top-8 right-14 h-24 w-32 -rotate-[4deg] overflow-hidden rounded-xl border-2 border-white shadow-[0_10px_30px_rgba(17,24,39,.2)]">
        <img src="/samples/lighthouse.webp" alt="" className="size-full object-cover" />
      </div>
    </>
  ),
  background: () => (
    <div className="absolute top-2 right-4 flex h-32 w-36 overflow-hidden rounded-xl border border-slate-200 shadow-[0_10px_30px_rgba(17,24,39,.12)]">
      <div className="relative w-1/2 overflow-hidden"><img src="/samples/peace-lily.jpg" alt="" className="absolute h-full w-[200%] max-w-none object-cover" /></div>
      <div className="checker relative w-1/2 overflow-hidden"><img src="/samples/peace-lily-cutout.webp" alt="" className="absolute right-0 h-full w-[200%] max-w-none object-cover" /></div>
      <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white shadow" />
    </div>
  ),
  object: () => (
    <div className="absolute top-3 right-4 h-28 w-36 overflow-hidden rounded-xl border-2 border-white shadow-[0_10px_30px_rgba(17,24,39,.18)]">
      <img src="/samples/lighthouse.webp" alt="" className="size-full object-cover" />
      <div className="absolute top-6 left-12 h-14 w-9 rounded-md border-2 border-rose-500 bg-rose-500/25" />
    </div>
  ),
  'resume-review': () => (
    <Paper className="top-2 right-6 h-32 w-32 !p-3">
      <p className="text-[9px] font-semibold text-slate-700">Jordan Ellis</p>
      <div className="mt-2 space-y-1.5">
        {[80, 65, 72].map((w, i) => (
          <div key={i} className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /><div className="h-1.5 rounded-full bg-slate-300/80" style={{ width: `${w}%` }} /></div>
        ))}
        <Lines n={2} widths={[90, 70]} />
      </div>
      <div className="absolute -top-3 -right-4 rounded-full bg-white p-0.5 shadow-md [&_p]:!text-slate-900"><ScoreRing score={85} size={42} label="Example score" /></div>
    </Paper>
  ),
}

const ToolArt = ({ toolId }) => {
  const Art = ARTS[toolId]
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-48 origin-top-right overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_30%)] max-sm:scale-75" aria-hidden="true">
      {Art && <Art />}
    </div>
  )
}

export default ToolArt
