import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { PerfOverlay } from './PerfOverlay'

export function Layout() {
  return (
    <div className="flex h-screen bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
      <PerfOverlay />
    </div>
  )
}
