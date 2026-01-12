import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, Filter, X } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button, IconButton } from '../../components/common/Button'
import { DataTable } from '../../components/common/DataTable'
import { StatusBadge } from '../../components/common/Badge'
import { Select, SearchInput } from '../../components/common/FormField'
import { ConfirmDialog } from '../../components/common/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { formatRupiah, formatTanggalPendek } from '../../utils/formatters'
import { STATUS, STATUS_LABELS, JENIS_PENGADAAN, METODE_PENGADAAN } from '../../utils/constants'
import { getPaketList, deletePaket } from '../../api/paket'
import { usePaketStore } from '../../store'
import toast from 'react-hot-toast'

export default function PaketList() {
  const navigate = useNavigate()
  const { paketList, setPaketList, paketLoading, setPaketLoading, filters, setFilters, resetFilters } = usePaketStore()
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, paket: null })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchPaket()
  }, [])

  const fetchPaket = async () => {
    setPaketLoading(true)
    setError(null)

    try {
      const result = await getPaketList(filters)

      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : result.data?.items || []
        setPaketList(data)
      } else {
        setError(result.error || 'Gagal memuat data paket')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setPaketLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.paket) return

    setDeleting(true)
    try {
      const result = await deletePaket(deleteModal.paket.id)

      if (result.success) {
        toast.success('Paket berhasil dihapus')
        setDeleteModal({ open: false, paket: null })
        fetchPaket()
      } else {
        toast.error(result.error || 'Gagal menghapus paket')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  const filteredData = useMemo(() => {
    let data = [...paketList]

    if (filters.status) {
      data = data.filter(p => p.status === filters.status)
    }
    if (filters.jenisPengadaan) {
      data = data.filter(p => p.jenisPengadaan === filters.jenisPengadaan)
    }
    if (filters.metodePengadaan) {
      data = data.filter(p => p.metodePengadaan === filters.metodePengadaan)
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      data = data.filter(p =>
        p.namaPaket?.toLowerCase().includes(search) ||
        p.jenisPengadaan?.toLowerCase().includes(search)
      )
    }

    return data
  }, [paketList, filters])

  const columns = useMemo(() => [
    {
      accessorKey: 'namaPaket',
      header: 'Nama Paket',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <p className="font-medium text-slate-900 truncate">{row.original.namaPaket}</p>
          <p className="text-xs text-slate-500">{row.original.jenisPengadaan}</p>
        </div>
      ),
    },
    {
      accessorKey: 'metodePengadaan',
      header: 'Metode',
      cell: ({ getValue }) => (
        <span className="text-sm">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'nilaiHPS',
      header: 'Nilai HPS',
      cell: ({ row }) => (
        <span className="text-sm font-medium">
          {formatRupiah(row.original.nilaiHPS || row.original.nilaiKontrak || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-sm text-slate-500">
          {formatTanggalPendek(row.original.createdAt || row.original.tanggalBuat)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          <IconButton
            icon={Eye}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/paket/${row.original.id}`)
            }}
            title="Lihat Detail"
          />
          <IconButton
            icon={Edit}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/paket/${row.original.id}/edit`)
            }}
            title="Edit"
          />
          <IconButton
            icon={Trash2}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteModal({ open: true, paket: row.original })
            }}
            title="Hapus"
            className="text-error-600 hover:text-error-700 hover:bg-error-50"
          />
        </div>
      ),
    },
  ], [navigate])

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ]

  const hasActiveFilters = filters.status || filters.jenisPengadaan || filters.metodePengadaan

  if (error && paketList.length === 0) {
    return <ErrorState message={error} onRetry={fetchPaket} />
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Paket Pengadaan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola paket pengadaan barang dan jasa
          </p>
        </div>
        <Link to="/paket/create">
          <Button icon={Plus}>Buat Paket Baru</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                placeholder="Cari nama paket..."
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              icon={showFilters ? X : Filter}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filter
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                  !
                </span>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
                options={statusOptions}
                placeholder="Pilih Status"
              />
              <Select
                value={filters.jenisPengadaan}
                onChange={(e) => setFilters({ jenisPengadaan: e.target.value })}
                options={[{ value: '', label: 'Semua Jenis' }, ...JENIS_PENGADAAN]}
                placeholder="Pilih Jenis"
              />
              <Select
                value={filters.metodePengadaan}
                onChange={(e) => setFilters({ metodePengadaan: e.target.value })}
                options={[{ value: '', label: 'Semua Metode' }, ...METODE_PENGADAAN]}
                placeholder="Pilih Metode"
              />
              {hasActiveFilters && (
                <div className="sm:col-span-3">
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Reset Filter
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Data table */}
      {filteredData.length > 0 || paketLoading ? (
        <Card>
          <CardBody>
            <DataTable
              columns={columns}
              data={filteredData}
              loading={paketLoading}
              searchable={false}
              onRowClick={(row) => navigate(`/paket/${row.id}`)}
              emptyMessage="Tidak ada paket yang sesuai filter"
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon="package"
              title="Belum ada paket pengadaan"
              description="Mulai dengan membuat paket pengadaan baru untuk mengelola proses pengadaan barang dan jasa."
              actionText="Buat Paket Baru"
              onAction={() => navigate('/paket/create')}
            />
          </CardBody>
        </Card>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, paket: null })}
        onConfirm={handleDelete}
        title="Hapus Paket"
        message={`Apakah Anda yakin ingin menghapus paket "${deleteModal.paket?.namaPaket}"? Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Ya, Hapus"
        loading={deleting}
      />
    </div>
  )
}
