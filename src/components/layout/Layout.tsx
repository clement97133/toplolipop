import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, BookOpen, Users, Settings } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/',               label: 'Accueil',        icon: Home },
  { to: '/calendar',       label: 'Calendrier',     icon: Calendar },
  { to: '/clients',        label: 'Réservations',   icon: BookOpen },
  { to: '/collaborators',  label: 'Collaborateurs', icon: Users },
  { to: '/general',        label: 'Paramètres',     icon: Settings },
]

export default function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-cream-100">
      {/* ── Contenu principal ── */}
      <main className="flex-1 overflow-auto pb-24">
        <Outlet />
      </main>

      {/* ── Bottom navigation bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 shadow-nav bottom-nav-safe"
        style={{ background: 'linear-gradient(135deg, #1A2567 0%, #243580 100%)' }}
      >
        <div className="flex items-end justify-around px-2 pt-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const isActive = to === '/'
              ? pathname === '/'
              : pathname.startsWith(to)

            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 min-w-0 flex-1 pb-1 relative group"
              >
                {/* Indicateur actif — pilule dorée */}
                {isActive && (
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-brand-400 animate-fade-in" />
                )}

                {/* Icône */}
                <span
                  className={cn(
                    'flex items-center justify-center w-11 h-9 rounded-2xl transition-all duration-200',
                    isActive
                      ? 'bg-white/10 text-brand-300'
                      : 'text-navy-300 group-hover:text-brand-300'
                  )}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className="transition-all duration-200"
                  />
                </span>

                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] font-medium tracking-wide transition-colors duration-200 truncate max-w-full px-1',
                    isActive ? 'text-brand-300' : 'text-navy-300 group-hover:text-brand-200'
                  )}
                >
                  {label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
