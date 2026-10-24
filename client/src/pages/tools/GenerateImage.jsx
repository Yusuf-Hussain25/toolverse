import { useState } from 'react'
import { ImageIcon, RectangleHorizontalIcon, RectangleVerticalIcon, SquareIcon } from 'lucide-react'
import ToolShell from '../../components/tools/ToolShell'
import { ChipChoice, Field, Suggestions, SubmitButton } from '../../components/tools/Fields'
import { useToolRun } from '../../hooks/useToolRun'
import { useAccount } from '../../hooks/useAccount'
import { toolById } from '../../lib/tools'

const tool = toolById('image')
const STYLES = ['Realistic', 'Cinematic', 'Anime', 'Ghibli-inspired', '3D render', 'Watercolor', 'Pixel art', 'Minimal flat']
const ASPECTS = [
  { id: 'square', label: 'Square', icon: SquareIcon },
  { id: 'landscape', label: 'Landscape', icon: RectangleHorizontalIcon },
  { id: 'portrait', label: 'Portrait', icon: RectangleVerticalIcon },
]
const IDEAS = ['a cozy cabin in a snowy forest at night', 'a robot barista making latte art', 'a koi pond seen from above', 'a tiny planet with a single tree']

const GenerateImage = () => {
  const { run, running, elapsed, result, setResult, quotaHit } = useToolRun('image')
  const { tools } = useAccount()
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('Realistic')
  const [aspect, setAspect] = useState('square')
  const [publish, setPublish] = useState(false)

  const form = (
    <form onSubmit={(e) => { e.preventDefault(); run({ prompt, style, aspect, publish }) }} className="space-y-5">
      <Field label="Describe the image" htmlFor="prompt">
        <textarea
          id="prompt"
          className="input !h-auto min-h-24 resize-y !py-3"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. a lighthouse on a cliff at sunset, waves crashing"
          maxLength={400}
          required
          minLength={3}
        />
      </Field>
      <Suggestions items={IDEAS} onPick={setPrompt} />
      <ChipChoice label="Style" options={STYLES} value={style} onChange={setStyle} />
      <div className="field">
        <span className="text-[13px] font-medium text-fg-2">Shape</span>
        <div className="segmented w-full" role="group" aria-label="Shape">
          {ASPECTS.map((a) => (
            <button type="button" key={a.id} aria-pressed={aspect === a.id} className="flex-1 justify-center" onClick={() => setAspect(a.id)}>
              <a.icon size={14} /> {a.label}
            </button>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
        <span className="text-sm">
          Share with the community
          <span className="block text-xs text-fg-3">You can change this later</span>
        </span>
        <input type="checkbox" className="peer sr-only" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        <span className="relative h-6 w-10 shrink-0 rounded-full bg-surface-3 transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" aria-hidden="true" />
      </label>
      <SubmitButton running={running} disabled={prompt.trim().length < 3} icon={ImageIcon}>Generate image</SubmitButton>
      {tools?.image.name === 'pollinations' && (
        <p className="text-[11px] text-fg-3">Images come from Pollinations' free service and carry its small mark.</p>
      )}
    </form>
  )

  return (
    <ToolShell
      tool={tool}
      form={form}
      running={running}
      elapsed={elapsed}
      result={result}
      setResult={setResult}
      quotaHit={quotaHit}
      waitingHint="Painting your image"
      emptyHint="Describe a scene, pick a style and a shape. Share the ones you like with the community."
    />
  )
}

export default GenerateImage
