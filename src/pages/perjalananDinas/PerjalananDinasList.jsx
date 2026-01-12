import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Trash2, Plane, Calendar, MapPin } from 'lucide-react'
import { Card, CardBody } from '../../components/common/Card'
import { Button, IconButton } from '../../components/common/Button'
import { DataTable } from '../../components/common/DataTable'
import { StatusBadge } from '../../components/common/Badge'
import { SearchInput, Select } from '../../components/common/FormField'
import { ConfirmDialog } from '../../components/common/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { formatTanggalPendek, formatRupiah } from '../../utils/formatters'
import { STATUS_PD, STATUS_PD_LABELS } from '../../utils/constants'
import { getPerjalananDinasList, deletePerjalananDinas } from '../../api/perjalananDinas'
import { usePerjalananDinasStore } from '../../store'
import toast from 'react-hot-toast'

// Helper to get ID from various possible field names
const getId = (item) => {
  if (!item) return null
  return item.id ?? item.pdId ?? item._id ?? item.ID ?? item.Id ?? item.key ?? null
}

// Helper to normalize field names from Google Sheet to frontend format
const normalizeData = (data) => {
  return data.map((item, index) => ({
    ...item,
    // Ensure ID exists - use numeric fallback for backend compatibility
    id: getId(item) || (index + 1),
    // Map field names
    tujuanDinas: item.tujuanDinas || item.tujuan || item.maksudTujuan || '',
    nomorSuratTugas: item.nomorSuratTugas || item.nomorST || '',
    nomorSPPD: item.nomorSPPD || '',
    tanggalSuratTugas: item.tanggalSuratTugas || item.tanggalST || '',
  }))
}

export default function PerjalananDinasList() {
  const navigate = useNavigate()
  const { pdList, setPdList, pdLoading, setPdLoading, filters, setFilters, resetFilters } = usePerjalananDinasStore()
  const [error, setError] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ open: false, pd: null })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setPdLoading(true)
    setError(null)

    try {
      const result = await getPerjalananDinasList(filters)

      if (result.success) {
        const rawData = Array.isArray(result.data) ? result.data : result.data?.items || []
        const data = normalizeData(rawData)
        setPdList(data)
      } else {
        setError(result.error || 'Gagal memuat data perjalanan dinas')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setPdLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.pd) return

    setDeleting(true)
    try {
      const result = await deletePerjalananDinas(deleteModal.pd.id)

      if (result.success) {
        toast.success('Perjalanan dinas berhasil dihapus')
        setDeleteModal({ open: false, pd: null })
        fetchData()
      } else {
        toast.error(result.error || 'Gagal menghapus perjalanan dinas')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  const filteredData = useMemo(() => {
    let data = [...pdList]

    if (filters.status) {
      data = data.filter(p => p.status === filters.status)
    }
    if (filters.search) {
      const search = filters.search.toLowerCase()
      data = data.filter(p =>
        p.tujuanDinas?.toLowerCase().includes(search) ||
        p.kotaTujuan?.toLowerCase().includes(search) ||
        p.nomorSuratTugas?.toLowerCase().includes(search)
      )
    }

    return data
  }, [pdList, filters])

  const columns = useMemo(() => [
    {
      accessorKey: 'tujuanDinas',
      header: 'Tujuan Dinas',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.tujuanDinas}</p>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <MapPin className="w-3 h-3" />
            {row.original.kotaTujuan}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tanggal',
      header: 'Tanggal',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-slate-600">
            <Calendar className="w-3 h-3" />
            {formatTanggalPendek(row.original.tanggalBerangkat)}
          </div>
          <div className="text-xs text-slate-500">
            s/d {formatTanggalPendek(row.original.tanggalKembali)}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'nomorSuratTugas',
      header: 'No. Surat Tugas',
      cell: ({ getValue }) => (
        <span className="text-sm font-mono">{getValue() || '-'}</span>
      ),
    },
    {
      accessorKey: 'totalBiaya',
      header: 'Total Biaya',
      cell: ({ getValue }) => (
        <span className="text-sm font-medium">
          {formatRupiah(getValue() || 0)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge status={getValue()} type="pd" />,
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
              navigate(`/perjalanan-dinas/${row.original.id}`)
            }}
            title="Lihat Detail"
          />
          <IconButton
            icon={Edit}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/perjalanan-dinas/${row.original.id}/edit`)
            }}
            title="Edit"
          />
          <IconButton
            icon={Trash2}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteModal({ open: true, pd: row.original })
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
    ...Object.entries(STATUS_PD_LABELS).map(([value, label]) => ({ value, label })),
  ]

  if (error && pdList.length === 0) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Perjalanan Dinas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola surat tugas dan SPPD
          </p>
        </div>
        <Link to="/perjalanan-dinas/create">
          <Button icon={Plus}>Buat Perjalanan Dinas</Button>
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
                placeholder="Cari tujuan dinas, kota, atau nomor surat..."
              />
            </div>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
              options={statusOptions}
              className="w-full sm:w-48"
            />
          </div>
        </CardBody>
      </Card>

      {/* Data table */}
      {filteredData.length > 0 || pdLoading ? (
        <Card>
          <CardBody>
            <DataTable
              columns={columns}
              data={filteredData}
              loading={pdLoading}
              searchable={false}
              onRowClick={(row) => navigate(`/perjalanan-dinas/${row.id}`)}
              emptyMessage="Tidak ada perjalanan dinas yang sesuai filter"
            />
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <EmptyState
              icon={Plane}
              title="Belum ada perjalanan dinas"
              description="Mulai dengan membuat perjalanan dinas baru."
              actionText="Buat Perjalanan Dinas"
              onAction={() => navigate('/perjalanan-dinas/create')}
            />
          </CardBody>
        </Card>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, pd: null })}
        onConfirm={handleDelete}
        title="Hapus Perjalanan Dinas"
        message={`Apakah Anda yakin ingin menghapus perjalanan dinas "${deleteModal.pd?.tujuanDinas}"?`}
        type="danger"
        confirmText="Ya, Hapus"
        loading={deleting}
      />
    </div>
  )
}
