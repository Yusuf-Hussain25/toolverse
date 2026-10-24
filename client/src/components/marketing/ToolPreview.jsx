import { useEffect, useState } from 'react'
import { CheckIcon, SparklesIcon } from 'lucide-react'
import CompareSlider from '../ui/CompareSlider'
import ScoreRing from '../ui/ScoreRing'
import { toolById, toolGradient } from '../../lib/tools'

const ARTICLE = `# Why Sleep Is a Programmer's Secret Weapon

You can't debug your way out of a tired brain. Sleep is when memory consolidates, so the pattern you fought with at 6 pm often makes sense at 9 am.

## Fewer bugs, faster fixes
Studies on sleep loss show slower reaction times and more errors on detail-heavy work. Code review is exactly that kind of work.`

// What each tool produces. The image and the cutout are real outputs; the article and review
// are short illustrative excerpts. Cycles until someone picks a tab.
const DEMOS = [
  { tool: 'article', prompt: 'Why sleep matters for programmers · Conversational' },
  { tool: 'image', prompt: 'A lighthouse on a cliff at sunset · Cinematic' },
  { tool: 'background', prompt: 'sneaker.jpg' },
  { tool: 'resume-review', prompt: 'resume.pdf · Senior Frontend Engineer' },
]

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Shows the article excerpt being written, character by character
const Typing = ({ text }) => {
  const [shown, setShown] = useState(() => (reducedMotion() ? text.length : 0))
  useEffect(() => {
    if (shown >= text.length) return
    const t = setTimeout(() => setShown((n) => Math.min(text.length, n + 3)), 16)
    return () => clearTimeout(t)
  }, [shown, text])
  const visible = text.slice(0, shown)
  return (
    <div className="prose-tv !text-[13.5px] !leading-relaxed" aria-label="Example article">
      {visible.split('\n').map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="!text-xl">{line.slice(2)}</h1>
        if (line.startsWith('## ')) return <h2 key={i} className="!mt-3 !text-base">{line.slice(3)}</h2>
        return line ? <p key={i}>{line}</p> : null
      })}
      {shown < text.length && <span className="inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-accent" />}
    </div>
  )
}

const ToolPreview = ({ className = '' }) => {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const demo = DEMOS[index]
  const tool = toolById(demo.tool)

  useEffect(() => {
    if (paused || reducedMotion()) return
    const t = setInterval(() => setIndex((i) => (i + 1) % DEMOS.length), 5200)
    return () => clearInterval(t)
  }, [paused])

  return (
    <div className={`card overflow-hidden shadow-deep ${className}`}>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: toolGradient(tool) }}>
          <tool.icon size={14} />
        </span>
        <p className="min-w-0 flex-1 truncate text-xs text-fg-3"><span className="font-medium text-fg-2">{tool.name}</span> · {demo.prompt}</p>
        <span className="chip chip-ok !h-6 hidden sm:inline-flex"><CheckIcon size={12} /> Done</span>
      </div>

      <div className="relative h-[300px] overflow-hidden sm:h-[340px]">
        {demo.tool === 'article' && (
          <div key="article" className="h-full overflow-hidden p-5 animate-pop-in [mask-image:linear-gradient(#000_75%,transparent)]">
            <Typing text={ARTICLE} />
          </div>
        )}
        {demo.tool === 'image' && (
          <img key="image" src="/samples/lighthouse.webp" alt="Generated image of a lighthouse on a cliff at sunset" className="size-full object-cover animate-pop-in" />
        )}
        {demo.tool === 'background' && (
          <div key="bg" className="size-full animate-pop-in">
            <CompareSlider before="/samples/white-sneaker.jpg" beforeAlt="Sneaker photo before" autoplay={!paused} className="size-full">
              <div className="checker size-full">
                <img src="/samples/white-sneaker-cutout.webp" alt="Sneaker with the background removed" className="size-full object-contain" />
              </div>
            </CompareSlider>
          </div>
        )}
        {demo.tool === 'resume-review' && (
          <div key="resume" className="flex h-full flex-col gap-4 p-5 animate-pop-in sm:flex-row">
            <ScoreRing score={82} size={96} label="Resume score" />
            <div className="min-w-0 text-[13.5px]">
              <p className="font-semibold">Strengths</p>
              <ul className="mt-1.5 space-y-1 text-fg-2">
                <li className="flex gap-2"><CheckIcon size={15} className="mt-0.5 shrink-0 text-ok" /> Measurable impact: “cart abandonment down 11%”</li>
                <li className="flex gap-2"><CheckIcon size={15} className="mt-0.5 shrink-0 text-ok" /> Modern stack that matches the role</li>
              </ul>
              <p className="mt-3 font-semibold">What to improve</p>
              <ul className="mt-1.5 space-y-1 text-fg-2">
                <li className="flex gap-2"><SparklesIcon size={15} className="mt-0.5 shrink-0 text-accent-text" /> Add accessibility and testing outcomes</li>
                <li className="flex gap-2"><SparklesIcon size={15} className="mt-0.5 shrink-0 text-accent-text" /> Lead with a one-line value statement</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-t border-line p-2" role="tablist" aria-label="Example tools">
        {DEMOS.map((d, i) => {
          const t = toolById(d.tool)
          return (
            <button
              key={d.tool}
              role="tab"
              aria-selected={i === index}
              onClick={() => { setPaused(true); setIndex(i) }}
              className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors ${i === index ? 'bg-surface-3 text-fg' : 'text-fg-3 hover:text-fg'}`}
            >
              <t.icon size={13} /> {t.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ToolPreview
