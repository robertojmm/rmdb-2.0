import { useState } from 'react'
import { Clapperboard, PlusCircle, Inbox, Settings, Info, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const navItems = [
  { to: '/', end: true, icon: Clapperboard, labelKey: 'nav.library' },
  { to: '/add-movie', end: false, icon: PlusCircle, labelKey: 'nav.addMovie' },
  { to: '/drafts', end: false, icon: Inbox, labelKey: 'nav.drafts' },
  { to: '/settings', end: false, icon: Settings, labelKey: 'nav.settings' },
] as const

const tooltipClass = 'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md text-xs font-medium bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50'

function navLinkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
    ? 'bg-neutral-900/10 text-neutral-900 dark:bg-white/10 dark:text-white'
    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-900/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5'
  }`
}

export function Sidebar() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true')

  function toggle() {
    setCollapsed(c => {
      localStorage.setItem('sidebar-collapsed', String(!c))
      return !c
    })
  }

  return (
    <aside className={`${collapsed ? 'w-14' : 'w-56'} h-screen bg-white dark:bg-neutral-900 flex flex-col shrink-0 border-r border-neutral-200 dark:border-neutral-800 transition-[width] duration-200`}>
      <div className={`flex items-center ${collapsed ? 'justify-center px-0 py-3' : 'justify-end px-3 py-3'}`}>
        <div className="relative group">
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <div className={tooltipClass}>
            {t(collapsed ? 'nav.expand' : 'nav.collapse')}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 flex flex-col gap-1">
        {navItems.map(({ to, end, icon: Icon, labelKey }) => (
          <div key={to} className="relative group">
            <NavLink to={to} end={end} className={navLinkClass}>
              <Icon size={18} className="shrink-0" />
              {!collapsed && t(labelKey)}
            </NavLink>
            {collapsed && (
              <div className={tooltipClass}>{t(labelKey)}</div>
            )}
          </div>
        ))}
      </nav>

      <div className="px-2 pb-4 border-t border-neutral-100 dark:border-neutral-800 pt-2">
        <div className="relative group">
          <NavLink to="/about" className={navLinkClass}>
            <Info size={18} className="shrink-0" />
            {!collapsed && t('nav.about')}
          </NavLink>
          {collapsed && (
            <div className={tooltipClass}>{t('nav.about')}</div>
          )}
        </div>
      </div>
    </aside>
  )
}
