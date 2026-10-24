import { useState } from 'react'
import toast from 'react-hot-toast'
import api, { errorMessage } from '../config/api'

// Actions shared by the viewer and the tool pages: copy/download, share, delete
export const useCreationActions = ({ onChange, onDelete }) => {
  const [busy, setBusy] = useState(false)
  const togglePublish = async (c) => {
    setBusy(true)
    try {
      const { data } = await api.patch(`/api/creations/${c.id}`, { published: !c.published })
      onChange?.({ ...c, published: data.creation.published })
      toast.success(data.creation.published ? 'Shared with the community' : 'Removed from the community')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  const remove = async (c) => {
    setBusy(true)
    try {
      await api.delete(`/api/creations/${c.id}`)
      toast.success('Deleted')
      onDelete?.(c)
      return true
    } catch (err) {
      toast.error(errorMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }
  const copy = async (c) => {
    try {
      await navigator.clipboard.writeText(c.content || '')
      toast.success('Copied as Markdown')
    } catch {
      toast.error("Your browser didn't allow copying")
    }
  }
  return { busy, togglePublish, remove, copy }
}
