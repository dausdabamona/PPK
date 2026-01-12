import { Link, useLocation } from 'react-router-dom'
import { Menu, Bell, Search, ChevronRight, Home } from 'lucide-react'
import { useStore } from '../../store'

// Breadcrumb mapping
const breadcrumbNames = {
  paket: 'Paket Pengadaan',
  penyedia: 'Penyedia',
  'perjalanan-dinas': 'Perjalanan Dinas',
  dokumen: 'Dokumen',
  settings: 'Pengaturan',
  numbering: 'Penomoran',
  create: 'Buat Baru',
  edit: 'Edit',
  items: 'Items',
  survey: 'Survey Harga',
  hps: 'HPS',
  compliance: 'Compliance',
  lampiran: 'Lampiran',
}

function Breadcrumb() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  if (pathnames.length === 0) {
    return (
      <div className="flex items-center text-sm text-slate-500">
        <Home className="w-4 h-4" />
        <span className="ml-2 font-medium text-slate-900">Dashboard</span>
      </div>
    )
  }

  return (
    <nav className="flex items-center text-sm">
      <Link to="/" className="text-slate-500 hover:text-slate-700">
        <Home className="w-4 h-4" />
      </Link>

      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1

        // Check if it's an ID (number or alphanumeric)
        const isId = /^[a-zA-Z0-9-_]+$/.test(name) && !breadcrumbNames[name]
        const displayName = breadcrumbNames[name] || (isId ? `#${name.slice(0, 8)}...` : name)

        return (
          <div key={name} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-2 text-slate-400" />
            {isLast ? (
              <span className="font-medium text-slate-900">{displayName}</span>
            ) : (
              <Link to={routeTo} className="text-slate-500 hover:text-slate-700">
                {displayName}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function Header() {
  const { setSidebarOpen } = useStore()

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>

          {/* Breadcrumb */}
          <Breadcrumb />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search button - optional */}
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications - optional */}
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full" />
          </button>

          {/* User avatar */}
          <div className="ml-2 flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">PPK</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">P</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
