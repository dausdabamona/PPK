import { Package, FileText, Users, Search, Plus } from 'lucide-react'
import { Button } from './Button'

const icons = {
  package: Package,
  document: FileText,
  users: Users,
  search: Search,
  default: Package,
}

export function EmptyState({
  icon = 'default',
  title = 'Tidak ada data',
  description,
  action,
  actionText = 'Tambah Baru',
  onAction,
  className = '',
}) {
  const Icon = typeof icon === 'string' ? icons[icon] || icons.default : icon

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-slate-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {(action || onAction) && (
        <div className="mt-6">
          {action || (
            <Button onClick={onAction} icon={Plus}>
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function NoSearchResults({ query, onClear }) {
  return (
    <EmptyState
      icon="search"
      title="Tidak ditemukan"
      description={`Tidak ada hasil untuk pencarian "${query}". Coba kata kunci lain.`}
      action={
        onClear && (
          <Button variant="secondary" onClick={onClear}>
            Hapus Pencarian
          </Button>
        )
      }
    />
  )
}

export default EmptyState
