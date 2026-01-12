import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  ChevronRight,
  FileText,
  Package,
  Users,
  Calculator,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  ClipboardCheck,
  Shield,
  FileSearch,
  Upload,
} from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button, IconButton } from '../../components/common/Button'
import { StatusBadge, Badge } from '../../components/common/Badge'
import { Tabs } from '../../components/common/Tabs'
import { SimpleTable } from '../../components/common/DataTable'
import { WorkflowTimeline } from '../../components/common/Stepper'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { Modal, ModalBody, ModalFooter, ConfirmDialog } from '../../components/common/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { SelectField } from '../../components/common/FormField'
import { formatRupiah, formatTanggal, formatTerbilang, formatNPWP } from '../../utils/formatters'
import { STATUS, STATUS_LABELS, WORKFLOW_STAGES, DOKUMEN_PER_TAHAP } from '../../utils/constants'
import {
  getPaketDetail,
  deletePaket,
  advanceWorkflow,
  revertWorkflow,
  getPaketItems,
  getPaketHPS,
  updatePaket,
} from '../../api/paket'
import { getPaketDokumen } from '../../api/dokumen'
import { getPenyediaList } from '../../api/penyedia'
import toast from 'react-hot-toast'

export default function PaketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [items, setItems] = useState([])
  const [dokumen, setDokumen] = useState([])
  const [hps, setHps] = useState(null)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [workflowModal, setWorkflowModal] = useState({ open: false, action: null })
  const [workflowLoading, setWorkflowLoading] = useState(false)

  // Penyedia assignment state
  const [penyediaModal, setPenyediaModal] = useState(false)
  const [penyediaList, setPenyediaList] = useState([])
  const [selectedPenyediaId, setSelectedPenyediaId] = useState('')
  const [penyediaLoading, setPenyediaLoading] = useState(false)
  const [assigningPenyedia, setAssigningPenyedia] = useState(false)

  useEffect(() => {
    fetchPaketData()
  }, [id])

  const fetchPaketData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [paketResult, itemsResult, dokumenResult] = await Promise.all([
        getPaketDetail(id),
        getPaketItems(id),
        getPaketDokumen(id),
      ])

      if (paketResult.success) {
        setPaket(paketResult.data)
      } else {
        setError(paketResult.error || 'Gagal memuat data paket')
        return
      }

      if (itemsResult.success) {
        setItems(Array.isArray(itemsResult.data) ? itemsResult.data : itemsResult.data?.items || [])
      }

      if (dokumenResult.success) {
        setDokumen(Array.isArray(dokumenResult.data) ? dokumenResult.data : dokumenResult.data?.items || [])
      }

      // Try to get HPS calculation
      const hpsResult = await getPaketHPS(id)
      if (hpsResult.success) {
        setHps(hpsResult.data)
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deletePaket(id)
      if (result.success) {
        toast.success('Paket berhasil dihapus')
        navigate('/paket')
      } else {
        toast.error(result.error || 'Gagal menghapus paket')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
      setDeleteModal(false)
    }
  }

  const handleWorkflowAction = async () => {
    setWorkflowLoading(true)
    try {
      const action = workflowModal.action === 'next' ? advanceWorkflow : revertWorkflow
      const result = await action(id)

      if (result.success) {
        toast.success(
          workflowModal.action === 'next'
            ? 'Berhasil maju ke tahap berikutnya'
            : 'Berhasil kembali ke tahap sebelumnya'
        )
        fetchPaketData()
      } else {
        toast.error(result.error || 'Gagal mengubah status workflow')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setWorkflowLoading(false)
      setWorkflowModal({ open: false, action: null })
    }
  }

  const openPenyediaModal = async () => {
    setPenyediaModal(true)
    setSelectedPenyediaId(paket.penyediaId || '')
    setPenyediaLoading(true)

    try {
      const result = await getPenyediaList()
      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : result.data?.items || []
        setPenyediaList(data)
      }
    } catch (err) {
      toast.error('Gagal memuat daftar penyedia')
    } finally {
      setPenyediaLoading(false)
    }
  }

  const handleAssignPenyedia = async () => {
    if (!selectedPenyediaId) {
      toast.error('Pilih penyedia terlebih dahulu')
      return
    }

    setAssigningPenyedia(true)
    try {
      const selectedPenyedia = penyediaList.find(p =>
        (p.id || p._id || p.penyediaId) === selectedPenyediaId
      )

      const result = await updatePaket(id, {
        ...paket,
        penyediaId: selectedPenyediaId,
        penyedia: selectedPenyedia ? {
          id: selectedPenyediaId,
          nama: selectedPenyedia.nama,
          npwp: selectedPenyedia.npwp,
          alamat: selectedPenyedia.alamat,
          noRekening: selectedPenyedia.noRekening,
          namaBank: selectedPenyedia.namaBank,
        } : null,
      })

      if (result.success) {
        toast.success('Penyedia berhasil ditetapkan')
        setPenyediaModal(false)
        fetchPaketData()
      } else {
        toast.error(result.error || 'Gagal menetapkan penyedia')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setAssigningPenyedia(false)
    }
  }

  const handleRemovePenyedia = async () => {
    setAssigningPenyedia(true)
    try {
      const result = await updatePaket(id, {
        ...paket,
        penyediaId: null,
        penyedia: null,
      })

      if (result.success) {
        toast.success('Penyedia berhasil dihapus dari paket')
        setPenyediaModal(false)
        fetchPaketData()
      } else {
        toast.error(result.error || 'Gagal menghapus penyedia')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setAssigningPenyedia(false)
    }
  }

  if (loading) {
    return <LoadingPage message="Memuat data paket..." />
  }

  if (error || !paket) {
    return <ErrorState message={error || 'Paket tidak ditemukan'} onRetry={fetchPaketData} />
  }

  const workflowStages = WORKFLOW_STAGES.map(s => ({ value: s, label: STATUS_LABELS[s] }))
  const currentStageIndex = WORKFLOW_STAGES.indexOf(paket.status)
  const canAdvance = currentStageIndex < WORKFLOW_STAGES.length - 1 && paket.status !== STATUS.BATAL
  const canRevert = currentStageIndex > 0 && paket.status !== STATUS.BATAL

  const itemColumns = [
    { accessorKey: 'namaBarang', header: 'Nama Barang' },
    { accessorKey: 'spesifikasi', header: 'Spesifikasi', cell: ({ getValue }) => (
      <span className="text-xs text-slate-500 max-w-xs truncate block">{getValue() || '-'}</span>
    )},
    { accessorKey: 'volume', header: 'Volume' },
    { accessorKey: 'satuan', header: 'Satuan' },
    { accessorKey: 'hargaSatuan', header: 'Harga Satuan', cell: ({ getValue }) => formatRupiah(getValue()) },
    { accessorKey: 'jumlah', header: 'Jumlah', cell: ({ row }) => formatRupiah((row.original.volume || 0) * (row.original.hargaSatuan || 0)) },
  ]

  const dokumenColumns = [
    { accessorKey: 'jenisDokumen', header: 'Jenis Dokumen' },
    { accessorKey: 'nomorDokumen', header: 'Nomor', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'tanggalDokumen', header: 'Tanggal', cell: ({ getValue }) => formatTanggal(getValue()) },
    {
      id: 'link',
      header: '',
      cell: ({ row }) => row.original.url && (
        <a href={row.original.url} target="_blank" rel="noopener noreferrer" className="link flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> Buka
        </a>
      ),
    },
  ]

  const tabs = [
    {
      key: 'info',
      label: 'Informasi',
      icon: Package,
      content: (
        <div className="space-y-6">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nama Paket</label>
                <p className="mt-1 text-slate-900">{paket.namaPaket}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Jenis Pengadaan</label>
                <p className="mt-1 text-slate-900">{paket.jenisPengadaan}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Metode Pengadaan</label>
                <p className="mt-1 text-slate-900">{paket.metodePengadaan}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sumber Dana</label>
                <p className="mt-1 text-slate-900">{paket.sumberDana}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tahun Anggaran</label>
                <p className="mt-1 text-slate-900">{paket.tahunAnggaran}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">MAK</label>
                <p className="mt-1 text-slate-900">{paket.mak || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Lokasi</label>
                <p className="mt-1 text-slate-900">{paket.lokasi || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Keterangan</label>
                <p className="mt-1 text-slate-900">{paket.keterangan || '-'}</p>
              </div>
            </div>
          </div>

          {/* Penyedia info */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-900">Informasi Penyedia</h4>
              <Button
                variant="outline"
                size="sm"
                icon={Users}
                onClick={openPenyediaModal}
              >
                {paket.penyedia ? 'Ganti Penyedia' : 'Tetapkan Penyedia'}
              </Button>
            </div>
            {paket.penyedia ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nama Penyedia</label>
                  <p className="mt-1 text-slate-900">{paket.penyedia.nama}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">NPWP</label>
                  <p className="mt-1 text-slate-900">{formatNPWP(paket.penyedia.npwp) || '-'}</p>
                </div>
                {paket.penyedia.alamat && (
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Alamat</label>
                    <p className="mt-1 text-slate-900">{paket.penyedia.alamat}</p>
                  </div>
                )}
                {paket.penyedia.noRekening && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">No. Rekening</label>
                    <p className="mt-1 text-slate-900">{paket.penyedia.noRekening} ({paket.penyedia.namaBank})</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Belum ada penyedia ditetapkan</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={openPenyediaModal}
                >
                  Pilih Penyedia
                </Button>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      icon: Package,
      count: items.length,
      content: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">Daftar barang/jasa dalam paket ini</p>
            <Link to={`/paket/${id}/items`}>
              <Button variant="outline" size="sm">Kelola Items</Button>
            </Link>
          </div>
          {items.length > 0 ? (
            <SimpleTable columns={itemColumns} data={items} />
          ) : (
            <EmptyState
              icon="package"
              title="Belum ada item"
              description="Tambahkan item barang/jasa untuk paket ini"
              actionText="Tambah Item"
              onAction={() => navigate(`/paket/${id}/items`)}
            />
          )}
        </div>
      ),
    },
    {
      key: 'hps',
      label: 'HPS',
      icon: Calculator,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Perhitungan Harga Perkiraan Sendiri</p>
            <Link to={`/paket/${id}/hps`}>
              <Button variant="outline" size="sm">Lihat Detail HPS</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardBody>
                <p className="text-sm text-slate-500">Subtotal</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatRupiah(hps?.subtotal || paket.subtotalHPS || 0)}
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-slate-500">PPN (11%)</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatRupiah(hps?.ppn || paket.ppnHPS || 0)}
                </p>
              </CardBody>
            </Card>
            <Card className="bg-primary-50 border-primary-200">
              <CardBody>
                <p className="text-sm text-primary-600">Total HPS</p>
                <p className="text-xl font-bold text-primary-700 mt-1">
                  {formatRupiah(hps?.total || paket.nilaiHPS || 0)}
                </p>
              </CardBody>
            </Card>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              <span className="font-medium">Terbilang:</span>{' '}
              {formatTerbilang(hps?.total || paket.nilaiHPS || 0)}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'dokumen',
      label: 'Dokumen',
      icon: FileText,
      count: dokumen.length,
      content: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">Dokumen yang sudah dibuat</p>
            <Link to={`/paket/${id}/dokumen`}>
              <Button variant="outline" size="sm">Generate Dokumen</Button>
            </Link>
          </div>
          {dokumen.length > 0 ? (
            <SimpleTable columns={dokumenColumns} data={dokumen} />
          ) : (
            <EmptyState
              icon="document"
              title="Belum ada dokumen"
              description="Generate dokumen sesuai tahap workflow"
              actionText="Generate Dokumen"
              onAction={() => navigate(`/paket/${id}/dokumen`)}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/paket" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali ke Daftar Paket
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{paket.namaPaket}</h1>
            <StatusBadge status={paket.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {paket.jenisPengadaan} • {paket.metodePengadaan} • {paket.tahunAnggaran}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/paket/${id}/edit`}>
            <Button variant="outline" icon={Edit}>Edit</Button>
          </Link>
          <Button
            variant="danger"
            icon={Trash2}
            onClick={() => setDeleteModal(true)}
          >
            Hapus
          </Button>
        </div>
      </div>

      {/* Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Status Workflow</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto pb-2">
            <WorkflowTimeline stages={workflowStages} currentStage={paket.status} />
          </div>

          <div className="mt-6 flex items-center gap-3">
            {canRevert && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWorkflowModal({ open: true, action: 'revert' })}
              >
                Kembali ke Tahap Sebelumnya
              </Button>
            )}
            {canAdvance && (
              <Button
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => setWorkflowModal({ open: true, action: 'next' })}
              >
                Maju ke Tahap Berikutnya
              </Button>
            )}
          </div>

          {/* Available documents for current stage */}
          {DOKUMEN_PER_TAHAP[paket.status] && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Dokumen yang tersedia untuk tahap ini:
              </p>
              <div className="flex flex-wrap gap-2">
                {DOKUMEN_PER_TAHAP[paket.status].map(doc => (
                  <Badge key={doc} color="primary">{doc}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabs content */}
      <Card>
        <CardBody>
          <Tabs tabs={tabs} />
        </CardBody>
      </Card>

      {/* Quick Links to Detail Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Akses Cepat</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              to={`/paket/${id}/items`}
              className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Package className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Items</span>
            </Link>
            <Link
              to={`/paket/${id}/survey`}
              className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <FileSearch className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Survey Harga</span>
            </Link>
            <Link
              to={`/paket/${id}/hps`}
              className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Calculator className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">HPS</span>
            </Link>
            <Link
              to={`/paket/${id}/kontrak`}
              className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Shield className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Kontrak</span>
            </Link>
            <Link
              to={`/paket/${id}/pembayaran`}
              className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <CreditCard className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Pembayaran</span>
            </Link>
            <Link
              to={`/paket/${id}/serah-terima`}
              className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <ClipboardCheck className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Serah Terima</span>
            </Link>
            <Link
              to={`/paket/${id}/dokumen`}
              className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <FileText className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Dokumen</span>
            </Link>
            <Link
              to={`/paket/${id}/lampiran`}
              className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <Upload className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Lampiran</span>
            </Link>
            <Link
              to={`/paket/${id}/compliance`}
              className="flex flex-col items-center p-4 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <CheckCircle className="w-6 h-6 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-slate-700">Compliance</span>
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Hapus Paket"
        message={`Apakah Anda yakin ingin menghapus paket "${paket.namaPaket}"? Semua data terkait termasuk items, survey, dan dokumen akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.`}
        type="danger"
        confirmText="Ya, Hapus Paket"
        loading={deleting}
      />

      {/* Workflow confirmation */}
      <ConfirmDialog
        open={workflowModal.open}
        onClose={() => setWorkflowModal({ open: false, action: null })}
        onConfirm={handleWorkflowAction}
        title={workflowModal.action === 'next' ? 'Maju ke Tahap Berikutnya' : 'Kembali ke Tahap Sebelumnya'}
        message={
          workflowModal.action === 'next'
            ? 'Pastikan semua dokumen untuk tahap ini sudah lengkap sebelum melanjutkan.'
            : 'Apakah Anda yakin ingin kembali ke tahap sebelumnya?'
        }
        type="info"
        confirmText={workflowModal.action === 'next' ? 'Ya, Lanjutkan' : 'Ya, Kembali'}
        loading={workflowLoading}
      />

      {/* Penyedia Assignment Modal */}
      <Modal
        open={penyediaModal}
        onClose={() => setPenyediaModal(false)}
        title="Tetapkan Penyedia"
      >
        <ModalBody>
          {penyediaLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : penyediaList.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Belum ada penyedia terdaftar</p>
              <Link to="/penyedia">
                <Button variant="outline">Tambah Penyedia</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <SelectField
                label="Pilih Penyedia"
                value={selectedPenyediaId}
                onChange={(e) => setSelectedPenyediaId(e.target.value)}
                options={[
                  { value: '', label: 'Pilih penyedia...' },
                  ...penyediaList.map(p => ({
                    value: p.id || p._id || p.penyediaId,
                    label: `${p.nama} (${p.npwp || 'No NPWP'})`,
                  })),
                ]}
              />

              {selectedPenyediaId && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  {(() => {
                    const selected = penyediaList.find(p =>
                      (p.id || p._id || p.penyediaId) === selectedPenyediaId
                    )
                    if (!selected) return null
                    return (
                      <div className="space-y-2 text-sm">
                        <p><span className="font-medium">Nama:</span> {selected.nama}</p>
                        <p><span className="font-medium">NPWP:</span> {formatNPWP(selected.npwp) || '-'}</p>
                        <p><span className="font-medium">Alamat:</span> {selected.alamat || '-'}</p>
                        {selected.noRekening && (
                          <p><span className="font-medium">Rekening:</span> {selected.noRekening} ({selected.namaBank})</p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {paket.penyedia && (
            <Button
              variant="danger"
              onClick={handleRemovePenyedia}
              loading={assigningPenyedia}
              className="mr-auto"
            >
              Hapus Penyedia
            </Button>
          )}
          <Button variant="secondary" onClick={() => setPenyediaModal(false)}>
            Batal
          </Button>
          <Button
            onClick={handleAssignPenyedia}
            loading={assigningPenyedia}
            disabled={!selectedPenyediaId || penyediaList.length === 0}
          >
            Tetapkan
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
