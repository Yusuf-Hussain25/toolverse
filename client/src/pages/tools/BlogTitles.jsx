import { useState } from 'react'
import { HashIcon } from 'lucide-react'
import ToolShell from '../../components/tools/ToolShell'
import { ChipChoice, Field, Suggestions, SubmitButton } from '../../components/tools/Fields'
import { useToolRun } from '../../hooks/useToolRun'
import { toolById } from '../../lib/tools'

const tool = toolById('blog-titles')
const CATEGORIES = ['General', 'Technology', 'Business', 'Health', 'Lifestyle', 'Education', 'Travel', 'Food']
const IDEAS = ['meal prep on a budget', 'learning a language as an adult', 'AI tools for small shops', 'weekend hiking trips']

const BlogTitles = () => {
  const { run, running, elapsed, result, setResult, quotaHit } = useToolRun('blog-titles')
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('General')

  const form = (
    <form onSubmit={(e) => { e.preventDefault(); run({ keyword, category }) }} className="space-y-5">
      <Field label="Topic or keyword" htmlFor="keyword">
        <input
          id="keyword"
          className="input"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="e.g. home espresso"
          maxLength={120}
          required
          minLength={2}
        />
      </Field>
      <Suggestions items={IDEAS} onPick={setKeyword} />
      <ChipChoice label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
      <SubmitButton running={running} disabled={keyword.trim().length < 2} icon={HashIcon}>Suggest 10 titles</SubmitButton>
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
      waitingHint="Brainstorming titles"
      emptyHint="Ten titles in different styles (how-to, lists, questions, bold claims), each one quick to copy."
    />
  )
}

export default BlogTitles
