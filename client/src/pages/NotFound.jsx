import { Link } from 'react-router-dom'
import { ArrowLeftIcon, OrbitIcon } from 'lucide-react'
import Logo from '../components/ui/Logo'
import EmptyState from '../components/ui/EmptyState'

const NotFound = () => (
  <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-5 sm:px-8">
    <Logo />
    <div className="card my-auto">
      <EmptyState
        icon={OrbitIcon}
        title="This page drifted out of orbit"
        text="The link may be old or mistyped. Let's get you back to familiar space."
        action={<Link to="/" className="btn btn-primary btn-sm"><ArrowLeftIcon size={15} /> Back to Toolverse</Link>}
      />
    </div>
  </div>
)

export default NotFound
