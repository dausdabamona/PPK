import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  ChevronRight,
  Plus,
  UserPlus,
  DollarSign,
  FileText,
  Plane,
  MapPin,
  Calendar,
  Users,
  Clock,
} from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button, IconButton } from '../../components/common/Button'
import { StatusBadge, Badge } from '../../components/common/Badge'
import { Tabs } from '../../components/common/Tabs'
import { SimpleTable } from '../../components/common/DataTable'
import { WorkflowTimeline } from '../../components/common/Stepper'
import { LoadingPage, LoadingSpinner } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { Modal, ModalBody, ModalFooter, ConfirmDialog } from '../../components/common/Modal'
import { EmptyState } from '../../components/common/EmptyState'
import { TextField, SelectField, MoneyField, TextareaField } from '../../components/common/FormField'
import { formatRupiah, formatTanggal, formatTanggalPendek } from '../../utils/formatters'
import { STATUS_PD, STATUS_PD_LABELS, TINGKAT_BIAYA } from '../../utils/constants'
import {
  getPerjalananDinasDetail,
  deletePerjalananDinas,
  getPelaksana,
  addPelaksana,
  updatePelaksana,
  deletePelaksana,
  getBiaya,
  addBiaya,
  updateBiaya,
  deleteBiaya,
  advanceWorkflow,
  revertWorkflow,
} from '../../api/perjalananDinas'
import toast from 'react-hot-toast'

const getId = (item) => item?.id || item?._id || item?.pelaksanaId || item?.biayaId || item?.rowId || item?.ID || null

const WORKFLOW_STAGES_PD = Object.keys(STATUS_PD_LABELS)

const JENIS_BIAYA = [
  { value: 'uang_harian', label: 'Uang Harian' },
  { value: 'transport', label: 'Transport' },
  { value: 'penginapan', label: 'Penginapan' },
  { value: 'representasi', label: 'Representasi' },
  { value: 'lainnya', label: 'Lainnya' },
]

const initialPelaksanaForm = {
  nama: '',
  nip: '',
  jabatan: '',
  golongan: '',
  tingkatBiaya: 'B',
}

const initialBiayaForm = {
  jenisBiaya: 'uang_harian',
  keterangan: '',
  jumlahHari: 1,
  tarif: 0,
  jumlah: 0,
}

export default function PerjalananDinasDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pd, setPd] = useState(null)
  const [pelaksana, setPelaksana] = useState([])
  const [biaya, setBiaya] = useState([])
  const [loadingPelaksana, setLoadingPelaksana] = useState(false)
  const [loadingBiaya, setLoadingBiaya] = useState(false)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [workflowModal, setWorkflowModal] = useState({ open: false, action: null })
  const [workflowLoading, setWorkflowLoading] = useState(false)

  // Pelaksana modal
  const [pelaksanaModal, setPelaksanaModal] = useState({ open: false, item: null })
  const [pelaksanaForm, setPelaksanaForm] = useState(initialPelaksanaForm)
  const [savingPelaksana, setSavingPelaksana] = useState(false)
  const [deletePelaksanaModal, setDeletePelaksanaModal] = useState({ open: false, item: null })
  const [deletingPelaksana, setDeletingPelaksana] = useState(false)

  // Biaya modal
  const [biayaModal, setBiayaModal] = useState({ open: false, item: null })
  const [biayaForm, setBiayaForm] = useState(initialBiayaForm)
  const [savingBiaya, setSavingBiaya] = useState(false)
  const [deleteBiayaModal, setDeleteBiayaModal] = useState({ open: false, item: null })
  const [deletingBiaya, setDeletingBiaya] = useState(false)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getPerjalananDinasDetail(id)
      if (result.success) {
        setPd(result.data)
        // Fetch pelaksana and biaya
        fetchPelaksana()
        fetchBiaya()
      } else {
        setError(result.error || 'Gagal memuat data perjalanan dinas')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPelaksana = async () => {
    setLoadingPelaksana(true)
    try {
      const result = await getPelaksana(id)
      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : result.data?.items || []
        setPelaksana(data)
      }
    } catch (err) {
      console.error('Error fetching pelaksana:', err)
    } finally {
      setLoadingPelaksana(false)
    }
  }

  const fetchBiaya = async () => {
    setLoadingBiaya(true)
    try {
      const result = await getBiaya(id)
      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : result.data?.items || []
        setBiaya(data)
      }
    } catch (err) {
      console.error('Error fetching biaya:', err)
    } finally {
      setLoadingBiaya(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deletePerjalananDinas(id)
      if (result.success) {
        toast.success('Perjalanan dinas berhasil dihapus')
        navigate('/perjalanan-dinas')
      } else {
        toast.error(result.error || 'Gagal menghapus perjalanan dinas')
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
        fetchData()
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

  // Pelaksana handlers
  const openPelaksanaModal = (item = null) => {
    if (item) {
      setPelaksanaForm({
        nama: item.nama || '',
        nip: item.nip || '',
        jabatan: item.jabatan || '',
        golongan: item.golongan || '',
        tingkatBiaya: item.tingkatBiaya || 'B',
      })
    } else {
      setPelaksanaForm(initialPelaksanaForm)
    }
    setPelaksanaModal({ open: true, item })
  }

  const handleSavePelaksana = async () => {
    if (!pelaksanaForm.nama.trim()) {
      toast.error('Nama pelaksana wajib diisi')
      return
    }

    setSavingPelaksana(true)
    try {
      const isEdit = pelaksanaModal.item !== null
      const result = isEdit
        ? await updatePelaksana(getId(pelaksanaModal.item), pelaksanaForm)
        : await addPelaksana(id, pelaksanaForm)

      if (result.success) {
        toast.success(isEdit ? 'Pelaksana berhasil diperbarui' : 'Pelaksana berhasil ditambahkan')
        setPelaksanaModal({ open: false, item: null })
        fetchPelaksana()
      } else {
        toast.error(result.error || 'Gagal menyimpan pelaksana')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSavingPelaksana(false)
    }
  }

  const handleDeletePelaksana = async () => {
    if (!deletePelaksanaModal.item) return

    setDeletingPelaksana(true)
    try {
      const result = await deletePelaksana(getId(deletePelaksanaModal.item))
      if (result.success) {
        toast.success('Pelaksana berhasil dihapus')
        setDeletePelaksanaModal({ open: false, item: null })
        fetchPelaksana()
      } else {
        toast.error(result.error || 'Gagal menghapus pelaksana')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingPelaksana(false)
    }
  }

  // Biaya handlers
  const openBiayaModal = (item = null) => {
    if (item) {
      setBiayaForm({
        jenisBiaya: item.jenisBiaya || 'uang_harian',
        keterangan: item.keterangan || '',
        jumlahHari: item.jumlahHari || 1,
        tarif: item.tarif || 0,
        jumlah: item.jumlah || 0,
      })
    } else {
      setBiayaForm(initialBiayaForm)
    }
    setBiayaModal({ open: true, item })
  }

  const handleSaveBiaya = async () => {
    if (biayaForm.jumlah <= 0) {
      toast.error('Jumlah biaya harus lebih dari 0')
      return
    }

    setSavingBiaya(true)
    try {
      const isEdit = biayaModal.item !== null
      const result = isEdit
        ? await updateBiaya(getId(biayaModal.item), biayaForm)
        : await addBiaya(id, biayaForm)

      if (result.success) {
        toast.success(isEdit ? 'Biaya berhasil diperbarui' : 'Biaya berhasil ditambahkan')
        setBiayaModal({ open: false, item: null })
        fetchBiaya()
      } else {
        toast.error(result.error || 'Gagal menyimpan biaya')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSavingBiaya(false)
    }
  }

  const handleDeleteBiaya = async () => {
    if (!deleteBiayaModal.item) return

    setDeletingBiaya(true)
    try {
      const result = await deleteBiaya(getId(deleteBiayaModal.item))
      if (result.success) {
        toast.success('Biaya berhasil dihapus')
        setDeleteBiayaModal({ open: false, item: null })
        fetchBiaya()
      } else {
        toast.error(result.error || 'Gagal menghapus biaya')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeletingBiaya(false)
    }
  }

  // Calculations
  const totalBiaya = useMemo(() => {
    return biaya.reduce((sum, b) => sum + (b.jumlah || 0), 0)
  }, [biaya])

  const jumlahHari = useMemo(() => {
    if (!pd?.tanggalBerangkat || !pd?.tanggalKembali) return 0
    const start = new Date(pd.tanggalBerangkat)
    const end = new Date(pd.tanggalKembali)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  }, [pd])

  if (loading) {
    return <LoadingPage message="Memuat data perjalanan dinas..." />
  }

  if (error || !pd) {
    return <ErrorState message={error || 'Data tidak ditemukan'} onRetry={fetchData} />
  }

  const workflowStages = WORKFLOW_STAGES_PD.map(s => ({ value: s, label: STATUS_PD_LABELS[s] }))
  const currentStageIndex = WORKFLOW_STAGES_PD.indexOf(pd.status)
  const canAdvance = currentStageIndex < WORKFLOW_STAGES_PD.length - 1 && pd.status !== STATUS_PD.BATAL
  const canRevert = currentStageIndex > 0 && pd.status !== STATUS_PD.BATAL

  const pelaksanaColumns = [
    { accessorKey: 'nama', header: 'Nama' },
    { accessorKey: 'nip', header: 'NIP', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'jabatan', header: 'Jabatan', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'golongan', header: 'Golongan', cell: ({ getValue }) => getValue() || '-' },
    {
      accessorKey: 'tingkatBiaya',
      header: 'Tingkat',
      cell: ({ getValue }) => (
        <Badge variant="primary">{getValue() || 'B'}</Badge>
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
            onClick={() => openPelaksanaModal(row.original)}
            title="Edit"
          />
          <IconButton
            icon={Trash2}
            variant="ghost"
            size="sm"
            onClick={() => setDeletePelaksanaModal({ open: true, item: row.original })}
            title="Hapus"
            className="text-error-600 hover:text-error-700 hover:bg-error-50"
          />
        </div>
      ),
    },
  ]

  const biayaColumns = [
    {
      accessorKey: 'jenisBiaya',
      header: 'Jenis Biaya',
      cell: ({ getValue }) => {
        const jenis = JENIS_BIAYA.find(j => j.value === getValue())
        return jenis?.label || getValue()
      },
    },
    { accessorKey: 'keterangan', header: 'Keterangan', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'jumlahHari', header: 'Jumlah Hari', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'tarif', header: 'Tarif', cell: ({ getValue }) => formatRupiah(getValue() || 0) },
    {
      accessorKey: 'jumlah',
      header: 'Jumlah',
      cell: ({ getValue }) => (
        <span className="font-medium">{formatRupiah(getValue() || 0)}</span>
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
            onClick={() => openBiayaModal(row.original)}
            title="Edit"
          />
          <IconButton
            icon={Trash2}
            variant="ghost"
            size="sm"
            onClick={() => setDeleteBiayaModal({ open: true, item: row.original })}
            title="Hapus"
            className="text-error-600 hover:text-error-700 hover:bg-error-50"
          />
        </div>
      ),
    },
  ]

  const tabs = [
    {
      key: 'info',
      label: 'Informasi',
      icon: Plane,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tujuan Dinas</label>
                <p className="mt-1 text-slate-900">{pd.tujuanDinas}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Kota Tujuan</label>
                <p className="mt-1 text-slate-900">{pd.kotaTujuan}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tanggal</label>
                <p className="mt-1 text-slate-900">
                  {formatTanggal(pd.tanggalBerangkat)} s/d {formatTanggal(pd.tanggalKembali)}
                  <span className="text-slate-500 ml-2">({jumlahHari} hari)</span>
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">No. Surat Tugas</label>
                <p className="mt-1 text-slate-900 font-mono">{pd.nomorSuratTugas || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tanggal Surat</label>
                <p className="mt-1 text-slate-900">{formatTanggal(pd.tanggalSuratTugas) || '-'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">MAK</label>
                <p className="mt-1 text-slate-900">{pd.mak || '-'}</p>
              </div>
            </div>
          </div>

          {pd.keterangan && (
            <div className="pt-4 border-t border-slate-200">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Keterangan</label>
              <p className="mt-1 text-slate-900">{pd.keterangan}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'pelaksana',
      label: 'Pelaksana',
      icon: Users,
      count: pelaksana.length,
      content: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">Daftar pegawai yang melaksanakan perjalanan dinas</p>
            <Button icon={UserPlus} size="sm" onClick={() => openPelaksanaModal()}>
              Tambah Pelaksana
            </Button>
          </div>
          {loadingPelaksana ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : pelaksana.length > 0 ? (
            <SimpleTable columns={pelaksanaColumns} data={pelaksana} />
          ) : (
            <EmptyState
              icon={Users}
              title="Belum ada pelaksana"
              description="Tambahkan pegawai yang akan melaksanakan perjalanan dinas"
              actionText="Tambah Pelaksana"
              onAction={() => openPelaksanaModal()}
            />
          )}
        </div>
      ),
    },
    {
      key: 'biaya',
      label: 'Biaya',
      icon: DollarSign,
      count: biaya.length,
      content: (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">Rincian biaya perjalanan dinas</p>
            <Button icon={Plus} size="sm" onClick={() => openBiayaModal()}>
              Tambah Biaya
            </Button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardBody>
                <p className="text-sm text-slate-500">Jumlah Item</p>
                <p className="text-2xl font-bold text-slate-900">{biaya.length}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-slate-500">Jumlah Hari</p>
                <p className="text-2xl font-bold text-slate-900">{jumlahHari}</p>
              </CardBody>
            </Card>
            <Card className="bg-primary-50 border-primary-200">
              <CardBody>
                <p className="text-sm text-primary-600">Total Biaya</p>
                <p className="text-2xl font-bold text-primary-700">{formatRupiah(totalBiaya)}</p>
              </CardBody>
            </Card>
          </div>

          {loadingBiaya ? (
            <div className="py-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : biaya.length > 0 ? (
            <SimpleTable columns={biayaColumns} data={biaya} />
          ) : (
            <EmptyState
              icon={DollarSign}
              title="Belum ada rincian biaya"
              description="Tambahkan rincian biaya perjalanan dinas"
              actionText="Tambah Biaya"
              onAction={() => openBiayaModal()}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/perjalanan-dinas" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali ke Daftar Perjalanan Dinas
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{pd.tujuanDinas}</h1>
            <StatusBadge status={pd.status} type="pd" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {pd.kotaTujuan}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatTanggalPendek(pd.tanggalBerangkat)} - {formatTanggalPendek(pd.tanggalKembali)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {jumlahHari} hari
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/perjalanan-dinas/${id}/edit`}>
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
            <WorkflowTimeline stages={workflowStages} currentStage={pd.status} />
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
        </CardBody>
      </Card>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Jumlah Pelaksana</p>
            <p className="text-2xl font-bold text-slate-900">{pelaksana.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Durasi</p>
            <p className="text-2xl font-bold text-slate-900">{jumlahHari} Hari</p>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-primary-200">
          <CardBody>
            <p className="text-sm text-primary-600">Total Biaya</p>
            <p className="text-2xl font-bold text-primary-700">{formatRupiah(pd.totalBiaya || totalBiaya)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Tabs content */}
      <Card>
        <CardBody>
          <Tabs tabs={tabs} />
        </CardBody>
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Hapus Perjalanan Dinas"
        message={`Apakah Anda yakin ingin menghapus perjalanan dinas "${pd.tujuanDinas}"? Semua data pelaksana dan biaya akan ikut terhapus.`}
        type="danger"
        confirmText="Ya, Hapus"
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
            ? 'Pastikan semua data sudah lengkap sebelum melanjutkan.'
            : 'Apakah Anda yakin ingin kembali ke tahap sebelumnya?'
        }
        type="info"
        confirmText={workflowModal.action === 'next' ? 'Ya, Lanjutkan' : 'Ya, Kembali'}
        loading={workflowLoading}
      />

      {/* Pelaksana Modal */}
      <Modal
        open={pelaksanaModal.open}
        onClose={() => setPelaksanaModal({ open: false, item: null })}
        title={pelaksanaModal.item ? 'Edit Pelaksana' : 'Tambah Pelaksana'}
      >
        <ModalBody className="space-y-4">
          <TextField
            label="Nama"
            value={pelaksanaForm.nama}
            onChange={(e) => setPelaksanaForm({ ...pelaksanaForm, nama: e.target.value })}
            placeholder="Nama lengkap"
            required
          />
          <TextField
            label="NIP"
            value={pelaksanaForm.nip}
            onChange={(e) => setPelaksanaForm({ ...pelaksanaForm, nip: e.target.value })}
            placeholder="Nomor Induk Pegawai"
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Jabatan"
              value={pelaksanaForm.jabatan}
              onChange={(e) => setPelaksanaForm({ ...pelaksanaForm, jabatan: e.target.value })}
              placeholder="Jabatan"
            />
            <TextField
              label="Golongan"
              value={pelaksanaForm.golongan}
              onChange={(e) => setPelaksanaForm({ ...pelaksanaForm, golongan: e.target.value })}
              placeholder="III/a"
            />
          </div>
          <SelectField
            label="Tingkat Biaya"
            value={pelaksanaForm.tingkatBiaya}
            onChange={(e) => setPelaksanaForm({ ...pelaksanaForm, tingkatBiaya: e.target.value })}
            options={TINGKAT_BIAYA.map(t => ({ value: t.value, label: `${t.value} - ${t.label}` }))}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setPelaksanaModal({ open: false, item: null })}>
            Batal
          </Button>
          <Button onClick={handleSavePelaksana} loading={savingPelaksana}>
            {pelaksanaModal.item ? 'Simpan' : 'Tambah'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Pelaksana Confirmation */}
      <ConfirmDialog
        open={deletePelaksanaModal.open}
        onClose={() => setDeletePelaksanaModal({ open: false, item: null })}
        onConfirm={handleDeletePelaksana}
        title="Hapus Pelaksana"
        message={`Apakah Anda yakin ingin menghapus "${deletePelaksanaModal.item?.nama}"?`}
        type="danger"
        confirmText="Ya, Hapus"
        loading={deletingPelaksana}
      />

      {/* Biaya Modal */}
      <Modal
        open={biayaModal.open}
        onClose={() => setBiayaModal({ open: false, item: null })}
        title={biayaModal.item ? 'Edit Biaya' : 'Tambah Biaya'}
      >
        <ModalBody className="space-y-4">
          <SelectField
            label="Jenis Biaya"
            value={biayaForm.jenisBiaya}
            onChange={(e) => setBiayaForm({ ...biayaForm, jenisBiaya: e.target.value })}
            options={JENIS_BIAYA}
          />
          <TextField
            label="Keterangan"
            value={biayaForm.keterangan}
            onChange={(e) => setBiayaForm({ ...biayaForm, keterangan: e.target.value })}
            placeholder="Keterangan biaya"
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Jumlah Hari/Unit"
              type="number"
              value={biayaForm.jumlahHari}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0
                setBiayaForm({
                  ...biayaForm,
                  jumlahHari: val,
                  jumlah: val * biayaForm.tarif,
                })
              }}
              min="0"
            />
            <MoneyField
              label="Tarif"
              value={biayaForm.tarif}
              onChange={(val) => {
                setBiayaForm({
                  ...biayaForm,
                  tarif: val,
                  jumlah: biayaForm.jumlahHari * val,
                })
              }}
            />
          </div>
          <MoneyField
            label="Jumlah"
            value={biayaForm.jumlah}
            onChange={(val) => setBiayaForm({ ...biayaForm, jumlah: val })}
            required
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setBiayaModal({ open: false, item: null })}>
            Batal
          </Button>
          <Button onClick={handleSaveBiaya} loading={savingBiaya}>
            {biayaModal.item ? 'Simpan' : 'Tambah'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Biaya Confirmation */}
      <ConfirmDialog
        open={deleteBiayaModal.open}
        onClose={() => setDeleteBiayaModal({ open: false, item: null })}
        onConfirm={handleDeleteBiaya}
        title="Hapus Biaya"
        message="Apakah Anda yakin ingin menghapus item biaya ini?"
        type="danger"
        confirmText="Ya, Hapus"
        loading={deletingBiaya}
      />
    </div>
  )
}
