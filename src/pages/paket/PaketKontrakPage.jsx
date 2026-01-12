import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Shield,
  Download,
  Eye
} from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Badge } from '../../components/common/Badge'
import { Modal, ConfirmDialog } from '../../components/common/Modal'
import { TextField, TextareaField, SelectField, DateField } from '../../components/common/FormField'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { formatRupiah, formatTanggal } from '../../utils/formatters'
import { TaxCalculator } from '../../components/paket/TaxCalculator'
import { getPaketDetail } from '../../api/paket'
import toast from 'react-hot-toast'

const getId = (item) => item?.id || item?._id || item?.kontrakId || item?.rowId || item?.ID || null

// Contract types
const JENIS_KONTRAK = [
  { value: 'SPK', label: 'Surat Perintah Kerja (SPK)' },
  { value: 'SURAT_PERJANJIAN', label: 'Surat Perjanjian' },
  { value: 'BUKTI_PEMBELIAN', label: 'Bukti Pembelian/Kuitansi' },
]

// Jaminan types
const JENIS_JAMINAN = [
  { value: 'PELAKSANAAN', label: 'Jaminan Pelaksanaan' },
  { value: 'UANG_MUKA', label: 'Jaminan Uang Muka' },
  { value: 'PEMELIHARAAN', label: 'Jaminan Pemeliharaan' },
]

const STATUS_JAMINAN = [
  { value: 'AKTIF', label: 'Aktif', color: 'success' },
  { value: 'AKAN_BERAKHIR', label: 'Akan Berakhir', color: 'warning' },
  { value: 'BERAKHIR', label: 'Berakhir', color: 'error' },
  { value: 'DICAIRKAN', label: 'Dicairkan', color: 'gray' },
]

export default function PaketKontrakPage() {
  const { id: paketId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [kontrak, setKontrak] = useState(null)
  const [addendums, setAddendums] = useState([])
  const [jaminan, setJaminan] = useState([])

  // Modal states
  const [kontrakModal, setKontrakModal] = useState(false)
  const [addendumModal, setAddendumModal] = useState(false)
  const [jaminanModal, setJaminanModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [kontrakForm, setKontrakForm] = useState({
    jenisKontrak: 'SPK',
    nomorKontrak: '',
    tanggalKontrak: '',
    nilaiKontrak: '',
    masaBerlaku: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    keterangan: '',
  })

  const [addendumForm, setAddendumForm] = useState({
    nomorAddendum: '',
    tanggalAddendum: '',
    perihal: '',
    nilaiPerubahan: '',
    keterangan: '',
  })

  const [jaminanForm, setJaminanForm] = useState({
    jenisJaminan: 'PELAKSANAAN',
    penerbit: '',
    nomorJaminan: '',
    nilaiJaminan: '',
    tanggalMulai: '',
    tanggalBerakhir: '',
    status: 'AKTIF',
  })

  useEffect(() => {
    fetchData()
  }, [paketId])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const paketResult = await getPaketDetail(paketId)
      if (paketResult.success) {
        setPaket(paketResult.data)
        // In real implementation, fetch kontrak data from API
        // For now, use dummy/stored data
        if (paketResult.data.kontrak) {
          setKontrak(paketResult.data.kontrak)
        }
        if (paketResult.data.addendums) {
          setAddendums(paketResult.data.addendums)
        }
        if (paketResult.data.jaminan) {
          setJaminan(paketResult.data.jaminan)
        }
      } else {
        setError(paketResult.error || 'Gagal memuat data paket')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  // Contract handlers
  const openKontrakModal = () => {
    if (kontrak) {
      setKontrakForm({
        jenisKontrak: kontrak.jenisKontrak || 'SPK',
        nomorKontrak: kontrak.nomorKontrak || '',
        tanggalKontrak: kontrak.tanggalKontrak || '',
        nilaiKontrak: kontrak.nilaiKontrak || '',
        masaBerlaku: kontrak.masaBerlaku || '',
        tanggalMulai: kontrak.tanggalMulai || '',
        tanggalSelesai: kontrak.tanggalSelesai || '',
        keterangan: kontrak.keterangan || '',
      })
    } else {
      setKontrakForm({
        jenisKontrak: 'SPK',
        nomorKontrak: '',
        tanggalKontrak: '',
        nilaiKontrak: paket?.nilaiHPS || '',
        masaBerlaku: '',
        tanggalMulai: '',
        tanggalSelesai: '',
        keterangan: '',
      })
    }
    setKontrakModal(true)
  }

  const handleSaveKontrak = async () => {
    if (!kontrakForm.nomorKontrak || !kontrakForm.tanggalKontrak || !kontrakForm.nilaiKontrak) {
      toast.error('Lengkapi data kontrak')
      return
    }

    setSaving(true)
    try {
      // In real implementation, save to API
      const savedKontrak = {
        ...kontrakForm,
        nilaiKontrak: Number(kontrakForm.nilaiKontrak),
        paketId,
      }
      setKontrak(savedKontrak)
      toast.success('Kontrak berhasil disimpan')
      setKontrakModal(false)
    } catch (err) {
      toast.error('Gagal menyimpan kontrak')
    } finally {
      setSaving(false)
    }
  }

  // Addendum handlers
  const openAddendumModal = (addendum = null) => {
    if (addendum) {
      setEditingItem(addendum)
      setAddendumForm({
        nomorAddendum: addendum.nomorAddendum || '',
        tanggalAddendum: addendum.tanggalAddendum || '',
        perihal: addendum.perihal || '',
        nilaiPerubahan: addendum.nilaiPerubahan || '',
        keterangan: addendum.keterangan || '',
      })
    } else {
      setEditingItem(null)
      setAddendumForm({
        nomorAddendum: '',
        tanggalAddendum: '',
        perihal: '',
        nilaiPerubahan: '',
        keterangan: '',
      })
    }
    setAddendumModal(true)
  }

  const handleSaveAddendum = async () => {
    if (!addendumForm.nomorAddendum || !addendumForm.tanggalAddendum) {
      toast.error('Lengkapi data addendum')
      return
    }

    setSaving(true)
    try {
      const savedAddendum = {
        ...addendumForm,
        nilaiPerubahan: Number(addendumForm.nilaiPerubahan) || 0,
        id: editingItem ? getId(editingItem) : Date.now().toString(),
      }

      if (editingItem) {
        setAddendums(addendums.map(a => getId(a) === getId(editingItem) ? savedAddendum : a))
        toast.success('Addendum berhasil diperbarui')
      } else {
        setAddendums([...addendums, savedAddendum])
        toast.success('Addendum berhasil ditambahkan')
      }
      setAddendumModal(false)
    } catch (err) {
      toast.error('Gagal menyimpan addendum')
    } finally {
      setSaving(false)
    }
  }

  // Jaminan handlers
  const openJaminanModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setJaminanForm({
        jenisJaminan: item.jenisJaminan || 'PELAKSANAAN',
        penerbit: item.penerbit || '',
        nomorJaminan: item.nomorJaminan || '',
        nilaiJaminan: item.nilaiJaminan || '',
        tanggalMulai: item.tanggalMulai || '',
        tanggalBerakhir: item.tanggalBerakhir || '',
        status: item.status || 'AKTIF',
      })
    } else {
      setEditingItem(null)
      setJaminanForm({
        jenisJaminan: 'PELAKSANAAN',
        penerbit: '',
        nomorJaminan: '',
        nilaiJaminan: '',
        tanggalMulai: '',
        tanggalBerakhir: '',
        status: 'AKTIF',
      })
    }
    setJaminanModal(true)
  }

  const handleSaveJaminan = async () => {
    if (!jaminanForm.nomorJaminan || !jaminanForm.nilaiJaminan) {
      toast.error('Lengkapi data jaminan')
      return
    }

    setSaving(true)
    try {
      const savedJaminan = {
        ...jaminanForm,
        nilaiJaminan: Number(jaminanForm.nilaiJaminan),
        id: editingItem ? getId(editingItem) : Date.now().toString(),
      }

      if (editingItem) {
        setJaminan(jaminan.map(j => getId(j) === getId(editingItem) ? savedJaminan : j))
        toast.success('Jaminan berhasil diperbarui')
      } else {
        setJaminan([...jaminan, savedJaminan])
        toast.success('Jaminan berhasil ditambahkan')
      }
      setJaminanModal(false)
    } catch (err) {
      toast.error('Gagal menyimpan jaminan')
    } finally {
      setSaving(false)
    }
  }

  // Delete handlers
  const confirmDelete = (type, item) => {
    setDeleteTarget({ type, item })
    setDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'addendum') {
        setAddendums(addendums.filter(a => getId(a) !== getId(deleteTarget.item)))
        toast.success('Addendum berhasil dihapus')
      } else if (deleteTarget.type === 'jaminan') {
        setJaminan(jaminan.filter(j => getId(j) !== getId(deleteTarget.item)))
        toast.success('Jaminan berhasil dihapus')
      }
      setDeleteModal(false)
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Gagal menghapus data')
    }
  }

  // Calculate totals
  const totalNilaiKontrak = kontrak ? kontrak.nilaiKontrak : 0
  const totalAddendum = addendums.reduce((sum, a) => sum + (a.nilaiPerubahan || 0), 0)
  const nilaiKontrakAkhir = totalNilaiKontrak + totalAddendum
  const totalJaminan = jaminan.reduce((sum, j) => sum + (j.nilaiJaminan || 0), 0)

  // Check jaminan expiry
  const getJaminanStatus = (item) => {
    if (item.status === 'DICAIRKAN' || item.status === 'BERAKHIR') return item.status

    const today = new Date()
    const berakhir = new Date(item.tanggalBerakhir)
    const diffDays = Math.ceil((berakhir - today) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'BERAKHIR'
    if (diffDays <= 30) return 'AKAN_BERAKHIR'
    return 'AKTIF'
  }

  if (loading) {
    return <LoadingPage message="Memuat data kontrak..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to={`/paket/${paketId}`} className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali ke Detail Paket
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Kontrak</h1>
          <p className="mt-1 text-sm text-slate-500">{paket?.namaPaket}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Nilai Kontrak Awal</p>
            <p className="text-xl font-bold text-slate-900">{formatRupiah(totalNilaiKontrak)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Total Addendum</p>
            <p className={`text-xl font-bold ${totalAddendum >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {totalAddendum >= 0 ? '+' : ''}{formatRupiah(totalAddendum)}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-primary-200">
          <CardBody>
            <p className="text-sm text-primary-600">Nilai Kontrak Akhir</p>
            <p className="text-xl font-bold text-primary-700">{formatRupiah(nilaiKontrakAkhir)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Total Jaminan</p>
            <p className="text-xl font-bold text-slate-900">{formatRupiah(totalJaminan)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Contract Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Data Kontrak
          </CardTitle>
          <Button onClick={openKontrakModal} icon={kontrak ? Edit2 : Plus}>
            {kontrak ? 'Edit Kontrak' : 'Buat Kontrak'}
          </Button>
        </CardHeader>
        <CardBody>
          {kontrak ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Jenis Kontrak</p>
                  <p className="font-medium">
                    {JENIS_KONTRAK.find(j => j.value === kontrak.jenisKontrak)?.label || kontrak.jenisKontrak}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nomor Kontrak</p>
                  <p className="font-medium">{kontrak.nomorKontrak}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tanggal Kontrak</p>
                  <p className="font-medium">{formatTanggal(kontrak.tanggalKontrak)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Nilai Kontrak</p>
                  <p className="font-medium text-primary-600">{formatRupiah(kontrak.nilaiKontrak)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Masa Berlaku</p>
                  <p className="font-medium">{kontrak.masaBerlaku || '-'} hari</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Periode Pelaksanaan</p>
                  <p className="font-medium">
                    {kontrak.tanggalMulai && kontrak.tanggalSelesai
                      ? `${formatTanggal(kontrak.tanggalMulai)} - ${formatTanggal(kontrak.tanggalSelesai)}`
                      : '-'}
                  </p>
                </div>
                {kontrak.keterangan && (
                  <div>
                    <p className="text-sm text-slate-500">Keterangan</p>
                    <p className="font-medium">{kontrak.keterangan}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="Belum ada kontrak"
              description="Buat kontrak untuk paket pengadaan ini"
              actionText="Buat Kontrak"
              onAction={openKontrakModal}
            />
          )}
        </CardBody>
      </Card>

      {/* Tax Calculator */}
      {kontrak && (
        <TaxCalculator
          nilaiKontrak={kontrak.nilaiKontrak}
          jenisPengadaan={paket?.jenisPengadaan}
          metodePengadaan={paket?.metodePengadaan}
          penyedia={paket?.penyedia}
        />
      )}

      {/* Addendum Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Addendum Kontrak
          </CardTitle>
          {kontrak && (
            <Button variant="outline" onClick={() => openAddendumModal()} icon={Plus} size="sm">
              Tambah Addendum
            </Button>
          )}
        </CardHeader>
        <CardBody>
          {addendums.length > 0 ? (
            <div className="space-y-3">
              {addendums.map((addendum, idx) => (
                <div key={getId(addendum)} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Addendum {idx + 1}</Badge>
                      <span className="text-sm text-slate-500">{formatTanggal(addendum.tanggalAddendum)}</span>
                    </div>
                    <p className="font-medium mt-1">{addendum.nomorAddendum}</p>
                    <p className="text-sm text-slate-600">{addendum.perihal}</p>
                    {addendum.nilaiPerubahan !== 0 && (
                      <p className={`text-sm font-medium mt-1 ${addendum.nilaiPerubahan >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        Perubahan nilai: {addendum.nilaiPerubahan >= 0 ? '+' : ''}{formatRupiah(addendum.nilaiPerubahan)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openAddendumModal(addendum)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete('addendum', addendum)}>
                      <Trash2 className="w-4 h-4 text-error-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              Belum ada addendum kontrak
            </p>
          )}
        </CardBody>
      </Card>

      {/* Jaminan Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Jaminan
          </CardTitle>
          {kontrak && (
            <Button variant="outline" onClick={() => openJaminanModal()} icon={Plus} size="sm">
              Tambah Jaminan
            </Button>
          )}
        </CardHeader>
        <CardBody>
          {jaminan.length > 0 ? (
            <div className="space-y-3">
              {jaminan.map((item) => {
                const currentStatus = getJaminanStatus(item)
                const statusConfig = STATUS_JAMINAN.find(s => s.value === currentStatus)

                return (
                  <div key={getId(item)} className="flex items-start justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={statusConfig?.color || 'default'}>
                          {statusConfig?.label || currentStatus}
                        </Badge>
                        <span className="font-medium">
                          {JENIS_JAMINAN.find(j => j.value === item.jenisJaminan)?.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {item.penerbit} - {item.nomorJaminan}
                      </p>
                      <p className="text-sm font-medium text-primary-600">
                        {formatRupiah(item.nilaiJaminan)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatTanggal(item.tanggalMulai)} - {formatTanggal(item.tanggalBerakhir)}
                      </p>
                      {currentStatus === 'AKAN_BERAKHIR' && (
                        <p className="text-xs text-warning-600 flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          Jaminan akan segera berakhir
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openJaminanModal(item)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => confirmDelete('jaminan', item)}>
                        <Trash2 className="w-4 h-4 text-error-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              Belum ada jaminan yang tercatat
            </p>
          )}
        </CardBody>
      </Card>

      {/* Contract Modal */}
      <Modal
        open={kontrakModal}
        onClose={() => setKontrakModal(false)}
        title={kontrak ? 'Edit Kontrak' : 'Buat Kontrak'}
        size="lg"
      >
        <div className="space-y-4">
          <SelectField
            label="Jenis Kontrak"
            value={kontrakForm.jenisKontrak}
            onChange={(e) => setKontrakForm({ ...kontrakForm, jenisKontrak: e.target.value })}
            options={JENIS_KONTRAK}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nomor Kontrak"
              value={kontrakForm.nomorKontrak}
              onChange={(e) => setKontrakForm({ ...kontrakForm, nomorKontrak: e.target.value })}
              required
            />
            <DateField
              label="Tanggal Kontrak"
              value={kontrakForm.tanggalKontrak}
              onChange={(e) => setKontrakForm({ ...kontrakForm, tanggalKontrak: e.target.value })}
              required
            />
          </div>

          <TextField
            label="Nilai Kontrak"
            type="number"
            value={kontrakForm.nilaiKontrak}
            onChange={(e) => setKontrakForm({ ...kontrakForm, nilaiKontrak: e.target.value })}
            required
          />

          <TextField
            label="Masa Berlaku (Hari)"
            type="number"
            value={kontrakForm.masaBerlaku}
            onChange={(e) => setKontrakForm({ ...kontrakForm, masaBerlaku: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <DateField
              label="Tanggal Mulai"
              value={kontrakForm.tanggalMulai}
              onChange={(e) => setKontrakForm({ ...kontrakForm, tanggalMulai: e.target.value })}
            />
            <DateField
              label="Tanggal Selesai"
              value={kontrakForm.tanggalSelesai}
              onChange={(e) => setKontrakForm({ ...kontrakForm, tanggalSelesai: e.target.value })}
            />
          </div>

          <TextareaField
            label="Keterangan"
            value={kontrakForm.keterangan}
            onChange={(e) => setKontrakForm({ ...kontrakForm, keterangan: e.target.value })}
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setKontrakModal(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveKontrak} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Addendum Modal */}
      <Modal
        open={addendumModal}
        onClose={() => setAddendumModal(false)}
        title={editingItem ? 'Edit Addendum' : 'Tambah Addendum'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nomor Addendum"
              value={addendumForm.nomorAddendum}
              onChange={(e) => setAddendumForm({ ...addendumForm, nomorAddendum: e.target.value })}
              required
            />
            <DateField
              label="Tanggal Addendum"
              value={addendumForm.tanggalAddendum}
              onChange={(e) => setAddendumForm({ ...addendumForm, tanggalAddendum: e.target.value })}
              required
            />
          </div>

          <TextField
            label="Perihal"
            value={addendumForm.perihal}
            onChange={(e) => setAddendumForm({ ...addendumForm, perihal: e.target.value })}
          />

          <TextField
            label="Nilai Perubahan"
            type="number"
            value={addendumForm.nilaiPerubahan}
            onChange={(e) => setAddendumForm({ ...addendumForm, nilaiPerubahan: e.target.value })}
            helper="Gunakan nilai negatif untuk pengurangan nilai kontrak"
          />

          <TextareaField
            label="Keterangan"
            value={addendumForm.keterangan}
            onChange={(e) => setAddendumForm({ ...addendumForm, keterangan: e.target.value })}
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setAddendumModal(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveAddendum} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Jaminan Modal */}
      <Modal
        open={jaminanModal}
        onClose={() => setJaminanModal(false)}
        title={editingItem ? 'Edit Jaminan' : 'Tambah Jaminan'}
      >
        <div className="space-y-4">
          <SelectField
            label="Jenis Jaminan"
            value={jaminanForm.jenisJaminan}
            onChange={(e) => setJaminanForm({ ...jaminanForm, jenisJaminan: e.target.value })}
            options={JENIS_JAMINAN}
          />

          <TextField
            label="Penerbit (Bank/Asuransi)"
            value={jaminanForm.penerbit}
            onChange={(e) => setJaminanForm({ ...jaminanForm, penerbit: e.target.value })}
            placeholder="Nama bank atau perusahaan asuransi"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nomor Jaminan"
              value={jaminanForm.nomorJaminan}
              onChange={(e) => setJaminanForm({ ...jaminanForm, nomorJaminan: e.target.value })}
              required
            />
            <Input
              label="Nilai Jaminan"
              type="number"
              value={jaminanForm.nilaiJaminan}
              onChange={(e) => setJaminanForm({ ...jaminanForm, nilaiJaminan: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateField
              label="Tanggal Mulai"
              value={jaminanForm.tanggalMulai}
              onChange={(e) => setJaminanForm({ ...jaminanForm, tanggalMulai: e.target.value })}
            />
            <DateField
              label="Tanggal Berakhir"
              value={jaminanForm.tanggalBerakhir}
              onChange={(e) => setJaminanForm({ ...jaminanForm, tanggalBerakhir: e.target.value })}
            />
          </div>

          <SelectField
            label="Status"
            value={jaminanForm.status}
            onChange={(e) => setJaminanForm({ ...jaminanForm, status: e.target.value })}
            options={STATUS_JAMINAN}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setJaminanModal(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveJaminan} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Hapus Data"
        message={`Yakin ingin menghapus ${deleteTarget?.type === 'addendum' ? 'addendum' : 'jaminan'} ini?`}
        type="danger"
      />
    </div>
  )
}
