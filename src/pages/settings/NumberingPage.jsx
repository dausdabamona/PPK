import { useState, useEffect } from 'react'
import { Hash, Eye, RefreshCw } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { SimpleTable } from '../../components/common/DataTable'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { Modal, ModalBody, ModalFooter } from '../../components/common/Modal'
import { getCounters, getNomorTypes, previewNomor } from '../../api/dokumen'
import toast from 'react-hot-toast'

export default function NumberingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [counters, setCounters] = useState([])
  const [types, setTypes] = useState([])
  const [previewModal, setPreviewModal] = useState({ open: false, type: null, preview: null })
  const [previewing, setPreviewing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [countersResult, typesResult] = await Promise.all([
        getCounters(),
        getNomorTypes(),
      ])

      if (countersResult.success) {
        const data = Array.isArray(countersResult.data) ? countersResult.data : countersResult.data?.items || []
        setCounters(data)
      }

      if (typesResult.success) {
        const data = Array.isArray(typesResult.data) ? typesResult.data : typesResult.data?.items || []
        setTypes(data)
      }
    } catch (err) {
      setError('Gagal memuat data penomoran')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (jenisDokumen) => {
    setPreviewing(true)
    setPreviewModal({ open: true, type: jenisDokumen, preview: null })

    try {
      const result = await previewNomor(jenisDokumen)

      if (result.success) {
        setPreviewModal({ open: true, type: jenisDokumen, preview: result.data })
      } else {
        toast.error(result.error || 'Gagal preview nomor')
        setPreviewModal({ open: false, type: null, preview: null })
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
      setPreviewModal({ open: false, type: null, preview: null })
    } finally {
      setPreviewing(false)
    }
  }

  const counterColumns = [
    { accessorKey: 'jenisDokumen', header: 'Jenis Dokumen' },
    { accessorKey: 'prefix', header: 'Prefix', cell: ({ getValue }) => (
      <span className="font-mono text-sm">{getValue() || '-'}</span>
    )},
    { accessorKey: 'currentNumber', header: 'Nomor Saat Ini', cell: ({ getValue }) => (
      <span className="font-mono text-sm">{getValue() || 0}</span>
    )},
    { accessorKey: 'format', header: 'Format', cell: ({ getValue }) => (
      <span className="font-mono text-xs text-slate-500">{getValue() || '-'}</span>
    )},
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Eye}
          onClick={() => handlePreview(row.original.jenisDokumen)}
        >
          Preview
        </Button>
      ),
    },
  ]

  const typeColumns = [
    { accessorKey: 'code', header: 'Kode' },
    { accessorKey: 'name', header: 'Nama Dokumen' },
    { accessorKey: 'category', header: 'Kategori' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Eye}
          onClick={() => handlePreview(row.original.code)}
        >
          Preview
        </Button>
      ),
    },
  ]

  if (loading) {
    return <LoadingPage message="Memuat data penomoran..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Penomoran Dokumen</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola counter dan format penomoran dokumen
          </p>
        </div>
        <Button variant="outline" icon={RefreshCw} onClick={fetchData}>
          Refresh
        </Button>
      </div>

      {/* Counters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-slate-500" />
            <CardTitle>Counter Penomoran</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          {counters.length > 0 ? (
            <SimpleTable columns={counterColumns} data={counters} />
          ) : (
            <EmptyState
              title="Belum ada counter"
              description="Counter akan dibuat otomatis saat dokumen pertama digenerate"
            />
          )}
        </CardBody>
      </Card>

      {/* Document Types */}
      <Card>
        <CardHeader>
          <CardTitle>Jenis Dokumen</CardTitle>
        </CardHeader>
        <CardBody>
          {types.length > 0 ? (
            <SimpleTable columns={typeColumns} data={types} />
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>Jenis dokumen tersedia dari konfigurasi backend</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Preview Modal */}
      <Modal
        open={previewModal.open}
        onClose={() => setPreviewModal({ open: false, type: null, preview: null })}
        title="Preview Nomor Dokumen"
        size="sm"
      >
        <ModalBody>
          {previewing ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-slate-500">Mengambil preview...</p>
            </div>
          ) : previewModal.preview ? (
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">Nomor berikutnya untuk:</p>
              <p className="font-medium text-slate-900 mb-4">{previewModal.type}</p>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xl font-mono font-bold text-primary-600">
                  {previewModal.preview.nomor || previewModal.preview}
                </p>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Nomor ini belum disimpan. Nomor akan di-assign saat dokumen digenerate.
              </p>
            </div>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setPreviewModal({ open: false, type: null, preview: null })}
          >
            Tutup
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
