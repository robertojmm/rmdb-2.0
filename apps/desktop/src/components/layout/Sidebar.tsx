import { Clapperboard, PlusCircle, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/', end: true, icon: Clapperboard, labelKey: 'nav.library' },
  { to: '/add-movie', end: false, icon: PlusCircle, labelKey: 'nav.addMovie' },
  { to: '/settings', end: false, icon: Settings, labelKey: 'nav.settings' },
] as const

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="w-56 h-screen bg-neutral-900 flex flex-col shrink-0 border-r border-neutral-800">
      <div className="px-4 py-5">
        <span className="text-white font-bold text-lg tracking-wide">RMDB</span>
      </div>

      <nav className="flex-1 px-2 pb-4 flex flex-col gap-1">
        {navItems.map(({ to, end, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
