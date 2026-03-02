import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
