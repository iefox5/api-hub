import { Outlet, Link, useLocation } from 'react-router-dom'
import { FileCode, ListTodo, BookOpen, Key, Braces } from 'lucide-react'

export function Layout() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-50 border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">API Hub</h1>
          <p className="text-sm text-gray-600 mt-1">Internal API Management</p>
        </div>

        <nav className="px-3 space-y-1">
          <NavLink
            to="/projects"
            icon={FileCode}
            label="Projects"
            active={isActive('/projects')}
          />
          <NavLink
            to="/tasks"
            icon={ListTodo}
            label="Tasks"
            active={isActive('/tasks')}
          />
          <NavLink
            to="/docs"
            icon={BookOpen}
            label="API Docs"
            active={isActive('/docs')}
          />
          <NavLink
            to="/graphql-docs"
            icon={Braces}
            label="GraphQL Docs"
            active={isActive('/graphql-docs')}
          />
          <NavLink
            to="/api-keys"
            icon={Key}
            label="API Keys"
            active={isActive('/api-keys')}
          />
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

interface NavLinkProps {
  to: string
  icon: React.ElementType
  label: string
  active: boolean
}

function NavLink({ to, icon: Icon, label, active }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${active
          ? 'bg-gray-900 text-white'
          : 'text-gray-700 hover:bg-gray-100'
        }
      `}
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  )
}
