import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import ProtectedRoute from './components/ProtectedRoute'
import Loader from './components/ui/Loader'
import { AccountProvider } from './context/AccountContext'

// The landing page loads first; everything behind sign-in is split into its own chunks
const AppLayout = lazy(() => import('./components/AppLayout'))
const Auth = lazy(() => import('./pages/Auth'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Tools = lazy(() => import('./pages/Tools'))
const Library = lazy(() => import('./pages/Library'))
const Community = lazy(() => import('./pages/Community'))
const Plan = lazy(() => import('./pages/Plan'))
const WriteArticle = lazy(() => import('./pages/tools/WriteArticle'))
const BlogTitles = lazy(() => import('./pages/tools/BlogTitles'))
const GenerateImage = lazy(() => import('./pages/tools/GenerateImage'))
const RemoveBackground = lazy(() => import('./pages/tools/RemoveBackground'))
const RemoveObject = lazy(() => import('./pages/tools/RemoveObject'))
const ReviewResume = lazy(() => import('./pages/tools/ReviewResume'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Keeps the shell on screen while a page chunk loads
const PageFallback = () => (
  <div className="space-y-4" aria-hidden="true">
    <div className="skeleton h-9 w-64" />
    <div className="skeleton h-40 !rounded-[22px]" />
  </div>
)

const App = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login/*" element={<Auth mode="login" />} />
      <Route path="/register/*" element={<Auth mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AccountProvider><Suspense fallback={<Loader />}><AppLayout /></Suspense></AccountProvider>}>
          {[
            ['/dashboard', <Dashboard />],
            ['/tools', <Tools />],
            ['/library', <Library />],
            ['/community', <Community />],
            ['/plan', <Plan />],
            ['/tools/write-article', <WriteArticle />],
            ['/tools/blog-titles', <BlogTitles />],
            ['/tools/generate-image', <GenerateImage />],
            ['/tools/remove-background', <RemoveBackground />],
            ['/tools/remove-object', <RemoveObject />],
            ['/tools/review-resume', <ReviewResume />],
          ].map(([path, page]) => (
            <Route key={path} path={path} element={<Suspense fallback={<PageFallback />}>{page}</Suspense>} />
          ))}
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
)

export default App
