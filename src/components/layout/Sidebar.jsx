import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Plane,
  Settings,
  ChevronLeft,
  ChevronRight,
  Hash,
  Server,
  X,
} from 'lucide-react'
import { useStore } from '../../store'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Paket Pengadaan', href: '/paket', icon: Package },
  { name: 'Penyedia', href: '/penyedia', icon: Users },
  { name: 'Perjalanan Dinas', href: '/perjalanan-dinas', icon: Plane },
  { name: 'Dokumen', href: '/dokumen', icon: FileText },
]

const settingsNav = [
  { name: 'Konfigurasi', href: '/settings', icon: Settings },
  { name: 'Penomoran', href: '/settings/numbering', icon: Hash },
  { name: 'API', href: '/settings/api', icon: Server },
]

export default function Sidebar() {
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed } = useStore()
  const location = useLocation()

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  const NavItem = ({ item }) => (
    <NavLink
      to={item.href}
      onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
      className={({ isActive: active }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active || isActive(item.href)
            ? 'bg-primary-50 text-primary-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      <item.icon className={`w-5 h-5 flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''}`} />
      {!sidebarCollapsed && <span>{item.name}</span>}
    </NavLink>
  )

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-50 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">PPK-OS</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
              <Package className="w-5 h-5 text-white" />
            </div>
          )}

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}

          {/* Separator */}
          <div className="pt-4 mt-4 border-t border-slate-200">
            {!sidebarCollapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pengaturan
              </p>
            )}
            {settingsNav.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </nav>

        {/* Collapse toggle - desktop only */}
        <div className="hidden lg:block absolute bottom-4 right-0 transform translate-x-1/2">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
