import { useEffect, useRef, useState } from 'react'
import { FileTextIcon, ImageUpIcon, XIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatBytes } from '../../lib/format'

// Drag and drop, click or paste (images) to pick one file, with a preview
const FileDrop = ({ file, onFile, accept, maxMb, kind = 'image', disabled = false }) => {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  const [preview, setPreview] = useState(null)
  const types = accept.split(',')

  useEffect(() => {
    if (!file || kind !== 'image') return
    const url = URL.createObjectURL(file)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the preview URL must follow the chosen file
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, kind])

  const pick = (f) => {
    if (!f) return
    if (!types.includes(f.type)) return toast.error(kind === 'pdf' ? 'Choose a PDF file' : 'Use a JPG, PNG, WebP or AVIF image')
    if (f.size > maxMb * 1024 * 1024) return toast.error(`That file is over ${maxMb} MB`)
    onFile(f)
  }

  useEffect(() => {
    if (disabled || kind !== 'image') return
    const onPaste = (e) => {
      const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'))
      if (f) {
        e.preventDefault()
        pick(f)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  })

  if (file) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
        {kind === 'image' && preview ? (
          <img src={preview} alt="Chosen file" className="max-h-64 w-full object-contain" />
        ) : (
          <div className="flex items-center gap-3 p-4">
            <span className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent-text"><FileTextIcon size={20} /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-fg-3">{formatBytes(file.size)}</p>
            </div>
          </div>
        )}
        <button type="button" className="icon-btn glass absolute top-2 right-2 !size-8" onClick={() => onFile(null)} disabled={disabled} aria-label="Remove file">
          <XIcon size={15} />
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) pick(e.dataTransfer.files[0]) }}
      className={`rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${over ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface'} ${disabled ? 'opacity-60' : ''}`}
    >
      <span className="mx-auto grid size-11 place-items-center rounded-xl bg-accent-soft text-accent-text">
        {kind === 'pdf' ? <FileTextIcon size={20} /> : <ImageUpIcon size={20} />}
      </span>
      <p className="mt-3 text-sm font-medium">{kind === 'pdf' ? 'Drop your resume (PDF)' : 'Drop an image, or paste one'}</p>
      <p className="mt-0.5 text-xs text-fg-3">{kind === 'pdf' ? `PDF with selectable text, up to ${maxMb} MB` : `JPG, PNG, WebP or AVIF up to ${maxMb} MB`}</p>
      <button type="button" className="btn btn-ghost btn-sm mt-4" onClick={() => input.current?.click()} disabled={disabled}>Choose a file</button>
      <input ref={input} type="file" accept={accept} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; pick(f) }} />
    </div>
  )
}

export default FileDrop
