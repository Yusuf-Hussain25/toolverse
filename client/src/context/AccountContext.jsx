import { useCallback, useEffect, useState } from 'react'
import api, { errorMessage } from '../config/api'
import { AccountContext } from './account'

// The signed-in user's Toolverse account from GET /api/me: plan, monthly usage, stats and which tools run
export const AccountProvider = ({ children }) => {
  const [me, setMe] = useState(null)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/api/me')
      setMe(data)
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Could not load your account'))
    }
  }, [])

  useEffect(() => {
    // Loads the account once on mount; state is only set after the request resolves
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  // Tool endpoints return this month's usage after each run
  const setUsage = useCallback((usage) => {
    if (!usage) return
    setMe((m) => (m ? { ...m, usage } : m))
  }, [])

  return (
    <AccountContext.Provider value={{ me, usage: me?.usage ?? null, plan: me?.plan ?? 'free', tools: me?.tools ?? null, isDemo: Boolean(me?.demo), error, refresh, setUsage }}>
      {children}
    </AccountContext.Provider>
  )
}
