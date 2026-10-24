import { Navigate, Route, Routes } from 'react-router-dom'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Tools from './pages/Tools'
import Library from './pages/Library'
import WriteArticle from './pages/tools/WriteArticle'
import BlogTitles from './pages/tools/BlogTitles'
import GenerateImage from './pages/tools/GenerateImage'
import RemoveBackground from './pages/tools/RemoveBackground'
import RemoveObject from './pages/tools/RemoveObject'
import ReviewResume from './pages/tools/ReviewResume'
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
        <Route path="/tools/write-article" element={<WriteArticle />} />
        <Route path="/tools/blog-titles" element={<BlogTitles />} />
        <Route path="/tools/generate-image" element={<GenerateImage />} />
        <Route path="/tools/remove-background" element={<RemoveBackground />} />
        <Route path="/tools/remove-object" element={<RemoveObject />} />
        <Route path="/tools/review-resume" element={<ReviewResume />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
)

export default App
