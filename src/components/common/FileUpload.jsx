import { useState, useCallback } from 'react'
import { Upload, X, FileText, Image, File } from 'lucide-react'
import { formatFileSize } from '../../utils/formatters'

const fileIcons = {
  image: Image,
  pdf: FileText,
  document: FileText,
  default: File,
}

function getFileType(mimeType) {
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType?.includes('document') || mimeType?.includes('word') || mimeType?.includes('excel')) return 'document'
  return 'default'
}

export function FileUpload({
  onUpload,
  accept = '*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  disabled = false,
  className = '',
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `Ukuran file maksimal ${formatFileSize(maxSize)}`
    }
    return null
  }

  const processFile = async (file) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return null
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        try {
          if (!reader.result || typeof reader.result !== 'string') {
            setError('Gagal membaca file: hasil tidak valid')
            resolve(null)
            return
          }
          const parts = reader.result.split(',')
          if (parts.length < 2) {
            setError('Gagal membaca file: format tidak valid')
            resolve(null)
            return
          }
          const base64 = parts[1]
          resolve({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            base64Content: base64,
          })
        } catch (err) {
          setError('Gagal memproses file: ' + (err.message || 'terjadi kesalahan'))
          resolve(null)
        }
      }

      reader.onerror = () => {
        setError('Gagal membaca file: ' + (reader.error?.message || 'file tidak dapat dibaca'))
        resolve(null)
      }

      reader.onabort = () => {
        setError('Pembacaan file dibatalkan')
        resolve(null)
      }

      reader.readAsDataURL(file)
    })
  }

  const handleFiles = async (files) => {
    setError(null)
    const fileArray = Array.from(files)
    const processedFiles = await Promise.all(fileArray.map(processFile))
    const validFiles = processedFiles.filter(Boolean)

    if (validFiles.length > 0) {
      onUpload?.(multiple ? validFiles : validFiles[0])
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [disabled])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFiles(files)
    }
    e.target.value = '' // Reset input
  }

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <Upload className="mx-auto h-10 w-10 text-slate-400" />
        <p className="mt-4 text-sm font-medium text-slate-700">
          {isDragging ? 'Lepaskan file di sini' : 'Klik atau drag & drop file'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Maksimal {formatFileSize(maxSize)}
        </p>
      </div>

      {error && (
        <p className="mt-2 text-xs text-error-600">{error}</p>
      )}
    </div>
  )
}

// File preview item
export function FilePreview({ file, onRemove, className = '' }) {
  const fileType = getFileType(file.mimeType)
  const Icon = fileIcons[fileType]

  return (
    <div className={`flex items-center gap-3 p-3 bg-slate-50 rounded-lg ${className}`}>
      <div className="p-2 bg-white rounded-lg border border-slate-200">
        <Icon className="w-5 h-5 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {file.filename || file.name}
        </p>
        <p className="text-xs text-slate-500">
          {formatFileSize(file.size)}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

// Multiple file preview list
export function FileList({ files = [], onRemove, className = '' }) {
  if (!files.length) return null

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map((file, index) => (
        <FilePreview
          key={file.id || index}
          file={file}
          onRemove={() => onRemove?.(index)}
        />
      ))}
    </div>
  )
}

export default FileUpload
