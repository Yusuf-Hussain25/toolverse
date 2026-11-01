import { useState } from 'react'
import { FileTextIcon, LockIcon } from 'lucide-react'
import ToolShell from '../../components/tools/ToolShell'
import FileDrop from '../../components/tools/FileDrop'
import { Field, SubmitButton } from '../../components/tools/Fields'
import { useToolRun } from '../../hooks/useToolRun'
import { toolById } from '../../lib/tools'

const tool = toolById('resume-review')

const ReviewResume = () => {
  const { run, running, elapsed, result, setResult, quotaHit } = useToolRun('resume-review')
  const [file, setFile] = useState(null)
  const [role, setRole] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('resume', file)
    if (role.trim()) form.append('role', role.trim())
    run(form)
  }

  const form = (
    <form onSubmit={submit} className="space-y-5">
      <FileDrop file={file} onFile={setFile} accept="application/pdf" maxMb={4} kind="pdf" disabled={running} />
      <Field label="Target role (optional)" htmlFor="role" hint="Feedback and keywords are tailored to it.">
        <input id="role" className="input" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" maxLength={80} />
      </Field>
      <SubmitButton running={running} disabled={!file} icon={FileTextIcon}>Review my resume</SubmitButton>
      <p className="flex items-center gap-1.5 text-[11px] text-fg-3"><LockIcon size={12} /> Only the text is used for the review, and the PDF isn't stored.</p>
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
      waitingHint="Reading your resume"
      emptyHint="Upload a PDF. You get a score out of 100, strengths, specific fixes, missing keywords and a rewritten summary."
    />
  )
}

export default ReviewResume
