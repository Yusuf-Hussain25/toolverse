import { useState } from 'react'
import { EraserIcon } from 'lucide-react'
import ToolShell from '../../components/tools/ToolShell'
import FileDrop from '../../components/tools/FileDrop'
import { SubmitButton } from '../../components/tools/Fields'
import { useToolRun } from '../../hooks/useToolRun'
import { toolById } from '../../lib/tools'
import { prepareImage } from '../../lib/uploadImage'

const tool = toolById('background')
const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/avif'

const RemoveBackground = () => {
  const { run, running, elapsed, result, setResult, quotaHit } = useToolRun('remove-background')
  const [file, setFile] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('image', await prepareImage(file))
    run(form)
  }

  const form = (
    <form onSubmit={submit} className="space-y-5">
      <FileDrop file={file} onFile={setFile} accept={IMAGE_TYPES} maxMb={10} disabled={running} />
      <p className="text-xs text-fg-3">Works best on a clear subject: people, products, pets, cars. You get a transparent PNG.</p>
      <SubmitButton running={running} disabled={!file} icon={EraserIcon}>Remove the background</SubmitButton>
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
      waitingHint="Cutting out the subject"
      emptyHint="Drop a photo. Drag the slider on the result to compare it with the original."
    />
  )
}

export default RemoveBackground
