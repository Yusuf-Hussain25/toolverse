import { useState } from 'react'
import { ScissorsIcon, WrenchIcon } from 'lucide-react'
import ToolShell from '../../components/tools/ToolShell'
import FileDrop from '../../components/tools/FileDrop'
import { Field, SubmitButton } from '../../components/tools/Fields'
import { useToolRun } from '../../hooks/useToolRun'
import { useAccount } from '../../hooks/useAccount'
import { toolById } from '../../lib/tools'

const tool = toolById('object')
const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/avif'

const RemoveObject = () => {
  const { run, running, elapsed, result, setResult, quotaHit } = useToolRun('remove-object')
  const { tools } = useAccount()
  const [file, setFile] = useState(null)
  const [object, setObject] = useState('')
  const unavailable = tools && !tools.object.available

  const submit = (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('image', file)
    form.append('object', object)
    run(form)
  }

  const form = (
    <form onSubmit={submit} className="space-y-5">
      <FileDrop file={file} onFile={setFile} accept={IMAGE_TYPES} maxMb={10} disabled={running || unavailable} />
      <Field label="What should disappear?" htmlFor="object" hint="One thing, in a word or two: “car”, “person”, “coffee cup”.">
        <input id="object" className="input" value={object} onChange={(e) => setObject(e.target.value)} placeholder="e.g. car" maxLength={60} disabled={unavailable} />
      </Field>
      <SubmitButton running={running} disabled={!file || object.trim().length < 2 || unavailable} icon={ScissorsIcon}>Remove it</SubmitButton>
    </form>
  )

  const notice = unavailable && (
    <div className="card mt-5 flex items-start gap-3 !rounded-2xl p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warn/15 text-warn"><WrenchIcon size={17} /></span>
      <div className="text-sm">
        <p className="font-medium">Object removal isn't set up on this server</p>
        <p className="mt-0.5 text-fg-3">It uses Cloudinary's generative remove. Add <code className="font-mono">CLOUDINARY_*</code> keys to <code className="font-mono">server/.env</code> to turn it on; nothing is charged to your allowance until then.</p>
      </div>
    </div>
  )

  return (
    <ToolShell
      tool={tool}
      form={form}
      notice={notice}
      running={running}
      elapsed={elapsed}
      result={result}
      setResult={setResult}
      quotaHit={quotaHit}
      waitingHint="Removing it and filling the gap"
      emptyHint="Drop a photo and name the object. Compare before and after with the slider."
    />
  )
}

export default RemoveObject
