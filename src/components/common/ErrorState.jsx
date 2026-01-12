import { Component } from 'react'
import { AlertCircle, RefreshCw, WifiOff, ServerOff, Ban } from 'lucide-react'
import { Button } from './Button'

// Detect error type from error message
function getErrorType(error) {
  const message = error?.toLowerCase?.() || ''

  if (message.includes('network') || message.includes('fetch') || message.includes('koneksi')) {
    return 'network'
  }
  if (message.includes('timeout')) {
    return 'timeout'
  }
  if (message.includes('not found') || message.includes('404') || message.includes('tidak ditemukan')) {
    return 'not_found'
  }
  if (message.includes('unauthorized') || message.includes('401') || message.includes('403')) {
    return 'auth'
  }
  if (message.includes('server') || message.includes('500')) {
    return 'server'
  }
  return 'generic'
}

const ERROR_CONFIGS = {
  network: {
    icon: WifiOff,
    bgColor: 'bg-slate-100',
    iconColor: 'text-slate-400',
    title: 'Tidak Ada Koneksi',
    message: 'Periksa koneksi internet Anda dan coba lagi.',
  },
  timeout: {
    icon: RefreshCw,
    bgColor: 'bg-warning-100',
    iconColor: 'text-warning-600',
    title: 'Koneksi Timeout',
    message: 'Server terlalu lama merespon. Silakan coba lagi.',
  },
  not_found: {
    icon: Ban,
    bgColor: 'bg-slate-100',
    iconColor: 'text-slate-400',
    title: 'Data Tidak Ditemukan',
    message: 'Data yang Anda cari tidak tersedia atau telah dihapus.',
  },
  auth: {
    icon: Ban,
    bgColor: 'bg-error-100',
    iconColor: 'text-error-600',
    title: 'Akses Ditolak',
    message: 'Anda tidak memiliki akses untuk melihat data ini.',
  },
  server: {
    icon: ServerOff,
    bgColor: 'bg-error-100',
    iconColor: 'text-error-600',
    title: 'Server Error',
    message: 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.',
  },
  generic: {
    icon: AlertCircle,
    bgColor: 'bg-error-100',
    iconColor: 'text-error-600',
    title: 'Terjadi Kesalahan',
    message: 'Gagal memuat data. Silakan coba lagi.',
  },
}

export function ErrorState({
  title,
  message,
  error,
  onRetry,
  className = '',
}) {
  const errorType = error ? getErrorType(error) : 'generic'
  const config = ERROR_CONFIGS[errorType]
  const Icon = config.icon

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className={`mx-auto w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center`}>
        <Icon className={`w-8 h-8 ${config.iconColor}`} />
      </div>
      <h3 className="mt-4 text-lg font-medium text-slate-900">
        {title || config.title}
      </h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
        {message || error || config.message}
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

/**
 * Error Boundary class component to catch rendering errors
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <ErrorState
            title="Terjadi Kesalahan"
            message="Aplikasi mengalami masalah. Silakan refresh halaman atau coba lagi."
            onRetry={this.handleReset}
          />
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorState
