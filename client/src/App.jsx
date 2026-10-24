import { Navigate, Route, Routes } from 'react-router-dom'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Tools from './pages/Tools'
import Library from './pages/Library'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import { AccountProvider } from './context/AccountContext'

const App = () => (
  <Routes>
    <Route path="/login/*" element={<Auth mode="login" />} />
    <Route path="/register/*" element={<Auth mode="register" />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AccountProvider><AppLayout /></AccountProvider>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/library" element={<Library />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
)

export default App
