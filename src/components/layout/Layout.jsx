import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useStore } from '../../store'

export default function Layout() {
  const { sidebarCollapsed } = useStore()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-4 border-t border-slate-200 bg-white">
          <p className="text-sm text-slate-500 text-center">
            PPK-OS © {new Date().getFullYear()} - Sistem Manajemen Pengadaan Barang/Jasa
          </p>
        </footer>
      </div>
    </div>
  )
}
