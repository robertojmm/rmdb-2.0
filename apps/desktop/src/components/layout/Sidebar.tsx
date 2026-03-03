import { Clapperboard, PlusCircle, Settings, Info } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/', end: true, icon: Clapperboard, labelKey: 'nav.library' },
  { to: '/add-movie', end: false, icon: PlusCircle, labelKey: 'nav.addMovie' },
  { to: '/settings', end: false, icon: Settings, labelKey: 'nav.settings' },
] as const

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
    ? 'bg-neutral-900/10 text-neutral-900 dark:bg-white/10 dark:text-white'
    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-900/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5'
  }`

export function Sidebar() {
  const { t } = useTranslation()

  return (
    <aside className="w-56 h-screen bg-white dark:bg-neutral-900 flex flex-col shrink-0 border-r border-neutral-200 dark:border-neutral-800">
      <div className="px-4 py-5">
        <span className="text-neutral-900 dark:text-white font-bold text-lg tracking-wide">RMDB 2.0</span>
      </div>

      <nav className="flex-1 px-2 flex flex-col gap-1">
        {navItems.map(({ to, end, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon size={18} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-4 border-t border-neutral-100 dark:border-neutral-800 pt-2">
        <NavLink to="/about" className={navLinkClass}>
          <Info size={18} />
          {t('nav.about')}
        </NavLink>
      </div>
    </aside>
  )
}
