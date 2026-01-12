import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from './Button'

export function ErrorState({
  title = 'Terjadi Kesalahan',
  message = 'Gagal memuat data. Silakan coba lagi.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto w-16 h-16 bg-error-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-error-600" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="secondary" onClick={onRetry} icon={RefreshCw}>
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  )
}

export function NetworkError({ onRetry }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
        <WifiOff className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-slate-900">Tidak Ada Koneksi</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
        Periksa koneksi internet Anda dan coba lagi.
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="secondary" onClick={onRetry} icon={RefreshCw}>
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  )
}

export default ErrorState
