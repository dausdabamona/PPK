import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, Building2, Phone, Mail } from 'lucide-react'
import { Card, CardBody } from '../../components/common/Card'
import { Button, IconButton } from '../../components/common/Button'
import { DataTable } from '../../components/common/DataTable'
import { Badge } from '../../components/common/Badge'
import { SearchInput } from '../../components/common/FormField'
import { ConfirmDialog, Modal, ModalBody, ModalFooter } from '../../components/common/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { formatNPWP, formatTelepon } from '../../utils/formatters'
import { getPenyediaList, deletePenyedia } from '../../api/penyedia'
import { usePenyediaStore } from '../../store'
import toast from 'react-hot-toast'
import PenyediaForm from './PenyediaForm'

export default function PenyediaList() {
  const navigate = useNavigate()
  const { penyediaList, setPenyediaList, penyediaLoading, setPenyediaLoading, searchQuery, setSearchQuery } = usePenyediaStore()
  const [error, setError] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, penyedia: null })
  const [deleting, setDeleting] = useState(false)
  const [formModal, setFormModal] = useState({ open: false, penyedia: null })

  useEffect(() => {
    fetchPenyedia()
  }, [])

  const fetchPenyedia = async () => {
    setPenyediaLoading(true)
    setError(null)

    try {
      const result = await getPenyediaList()

      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : result.data?.items || []
        setPenyediaList(data)
      } else {
        setError(result.error || 'Gagal memuat data penyedia')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setPenyediaLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.penyedia) return

    setDeleting(true)
    try {
      const result = await deletePenyedia(deleteModal.penyedia.id)

      if (result.success) {
        toast.success('Penyedia berhasil dihapus')
        setDeleteModal({ open: false, penyedia: null })
        fetchPenyedia()
      } else {
        toast.error(result.error || 'Gagal menghapus penyedia')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    setFormModal({ open: false, penyedia: null })
    fetchPenyedia()
  }

  const filteredData = useMemo(() => {
    if (!searchQuery) return penyediaList

    const query = searchQuery.toLowerCase()
    return penyediaList.filter(p =>
      p.nama?.toLowerCase().includes(query) ||
      p.npwp?.includes(query) ||
      p.email?.toLowerCase().includes(query)
    )
  }, [penyediaList, searchQuery])

  const columns = useMemo(() => [
    {
      accessorKey: 'nama',
      header: 'Nama Penyedia',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.nama}</p>
          {row.original.alamat && (
            <p className="text-xs text-slate-500 truncate max-w-xs">{row.original.alamat}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'npwp',
      header: 'NPWP',
      cell: ({ getValue }) => (
        <span className="text-sm font-mono">{formatNPWP(getValue()) || '-'}</span>
      ),
    },
    {
      accessorKey: 'telepon',
      header: 'Kontak',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.telepon && (
            <div className="flex items-center gap-1 text-slate-600">
              <Phone className="w-3 h-3" />
              {formatTelepon(row.original.telepon)}
            </div>
          )}
          {row.original.email && (
            <div className="flex items-center gap-1 text-slate-500">
              <Mail className="w-3 h-3" />
              {row.original.email}
            </div>
          )}
          {!row.original.telepon && !row.original.email && '-'}
        </div>
      ),
    },
    {
      accessorKey: 'isPKP',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge color={getValue() ? 'success' : 'gray'}>
          {getValue() ? 'PKP' : 'Non-PKP'}
        </Badge>
      ),
    },
    {
      accessorKey: 'namaBank',
      header: 'Bank',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.namaBank ? (
            <>
              <p>{row.original.namaBank}</p>
              <p className="text-xs text-slate-500 font-mono">{row.original.noRekening}</p>
            </>
          ) : (
            '-'
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <IconButton
            icon={Edit}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setFormModal({ open: true, penyedia: row.original })
            }}
            title="Edit"
          />
          <IconButton
            icon={Trash2}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteModal({ open: true, penyedia: row.original })
            }}
            title="Hapus"
            className="text-error-600 hover:text-error-700 hover:bg-error-50"
          />
        </div>
      ),
    },
  ], [])

  if (error && penyediaList.length === 0) {
    return <ErrorState message={error} onRetry={fetchPenyedia} />
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Penyedia</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data vendor dan supplier
          </p>
        </div>
        <Button icon={Plus} onClick={() => setFormModal({ open: true, penyedia: null })}>
          Tambah Penyedia
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardBody>
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NPWP, atau email..."
            className="max-w-md"
          />
        </CardBody>
      </Card>

      {/* Data table */}
      {filteredData.length > 0 || penyediaLoading ? (
        <Card>
          <CardBody>
            <DataTable
              columns={columns}
              data={filteredData}
              loading={penyediaLoading}
              searchable={false}
              emptyMessage="Tidak ada penyedia yang sesuai pencarian"
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon="users"
              title="Belum ada data penyedia"
              description="Tambahkan data vendor atau supplier untuk digunakan dalam paket pengadaan."
              actionText="Tambah Penyedia"
              onAction={() => setFormModal({ open: true, penyedia: null })}
            />
          </CardBody>
        </Card>
      )}

      {/* Form modal */}
      <Modal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, penyedia: null })}
        title={formModal.penyedia ? 'Edit Penyedia' : 'Tambah Penyedia Baru'}
        size="lg"
      >
        <PenyediaForm
          penyedia={formModal.penyedia}
          onSuccess={handleFormSuccess}
          onCancel={() => setFormModal({ open: false, penyedia: null })}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, penyedia: null })}
        onConfirm={handleDelete}
        title="Hapus Penyedia"
        message={`Apakah Anda yakin ingin menghapus penyedia "${deleteModal.penyedia?.nama}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Ya, Hapus"
        loading={deleting}
      />
    </div>
  )
}
