import { Outlet } from 'react-router-dom'
import { NavLink } from 'react-router-dom'
import { Sparkles, Users, Calendar, UserCheck, BarChart3 } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/general', label: 'Général', icon: BarChart3 },
  { to: '/clients', label: 'Dossier Client', icon: Users },
  { to: '/calendar', label: 'Calendrier', icon: Calendar },
  { to: '/collaborators', label: 'Collaborateurs', icon: UserCheck },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-rose-500 flex items-center justify-center shadow-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">
              <span className="text-brand-600">TOPLO</span>
              <span className="text-rose-500">LIPOP</span>
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  )
                }
              >
                <Icon size={16} />
                <span className="hidden sm:block">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
