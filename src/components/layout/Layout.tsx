import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Calendar, BookOpen, Users, Settings } from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV = [
  { to: '/',              label: 'Accueil',        icon: Home },
  { to: '/calendar',      label: 'Calendrier',     icon: Calendar },
  { to: '/clients',       label: 'Réservations',   icon: BookOpen },
  { to: '/collaborators', label: 'Équipe',         icon: Users },
  { to: '/general',       label: 'Paramètres',     icon: Settings },
]

export default function Layout() {
  const { pathname } = useLocation()

  return (
    /* app-shell = hauteur dynamique iOS (dvh), pas de scroll global */
    <div className="app-shell bg-cream-100">

      {/* ── Zone de défilement principale ─── */}
      <main className="main-scroll">
        {/*
          key={pathname} : force un re-render + animation à chaque navigation.
          Les données React Query sont en cache → pas de flash de chargement.
        */}
        <div key={pathname} className="page-enter min-h-full">
          <Outlet />
        </div>
      </main>

      {/* ── Bottom navigation bar ─────────── */}
      <nav
        className="bottom-nav shadow-nav"
        style={{ background: 'linear-gradient(135deg, #1A2567 0%, #243580 100%)' }}
      >
        <div className="flex items-end justify-around px-1 pt-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const isActive = to === '/'
              ? pathname === '/'
              : pathname.startsWith(to)

            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-0.5 min-w-0 flex-1 pb-1 relative"
              >
                {/* Indicateur actif — pilule dorée animée */}
                {isActive && (
                  <span className="nav-active-pip absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-brand-400" />
                )}

                {/* Zone tactile élargie pour faciliter le tap */}
                <span
                  className={cn(
                    'flex items-center justify-center w-11 h-10 rounded-2xl transition-all duration-200',
                    isActive
                      ? 'bg-white/12 text-brand-300'
                      : 'text-navy-400 active:bg-white/10 active:text-brand-300'
                  )}
                >
                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.2 : 1.7}
                    className="transition-all duration-200"
                  />
                </span>

                {/* Label */}
                <span
                  className={cn(
                    'text-[9px] font-semibold tracking-wide transition-colors duration-200 truncate max-w-full px-0.5 text-center',
                    isActive ? 'text-brand-300' : 'text-navy-400'
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
