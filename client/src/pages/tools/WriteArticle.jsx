import { useState } from 'react'
import { PenLineIcon } from 'lucide-react'
import ToolShell from '../../components/tools/ToolShell'
import { ChipChoice, Field, Suggestions, SubmitButton } from '../../components/tools/Fields'
import { useToolRun } from '../../hooks/useToolRun'
import { toolById } from '../../lib/tools'

const tool = toolById('article')
const LENGTHS = { short: 'Short · 500-700 words', medium: 'Medium · 900-1,200', long: 'Long · 1,400+' }
const TONES = ['Informative', 'Conversational', 'Professional', 'Persuasive']
const IDEAS = ['The future of remote work', 'How to start journaling', 'Beginner tips for indoor plants', 'Why side projects make better developers']

const WriteArticle = () => {
  const { run, running, elapsed, result, setResult, quotaHit } = useToolRun('article')
  const [topic, setTopic] = useState('')
  const [length, setLength] = useState('short')
  const [tone, setTone] = useState('Informative')

  const submit = (e) => {
    e.preventDefault()
    run({ topic, length, tone })
  }

  const form = (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Topic" htmlFor="topic" hint="A sentence is enough. Be specific for better results.">
        <textarea
          id="topic"
          className="input !h-auto min-h-24 resize-y !py-3"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Why sleep matters more than caffeine for programmers"
          maxLength={200}
          required
          minLength={3}
        />
      </Field>
      <Suggestions items={IDEAS} onPick={setTopic} />
      <ChipChoice label="Length" options={Object.keys(LENGTHS)} value={length} onChange={setLength} render={(o) => LENGTHS[o]} />
      <ChipChoice label="Tone" options={TONES} value={tone} onChange={setTone} />
      <SubmitButton running={running} disabled={topic.trim().length < 3} icon={PenLineIcon}>Write the article</SubmitButton>
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
      waitingHint="Writing your article"
      emptyHint="Pick a topic, length and tone. The article arrives with a title, sections and a conclusion, ready to copy or download as Markdown."
    />
  )
}

export default WriteArticle
