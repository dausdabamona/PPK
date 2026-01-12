import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  ClipboardCheck,
  Camera,
  Calendar,
  User
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
import { getPaketDetail } from '../../api/paket'
import toast from 'react-hot-toast'

const getId = (item) => item?.id || item?._id || item?.serahTerimaId || item?.rowId || item?.ID || null

// Handover types
const JENIS_SERAH_TERIMA = [
  { value: 'BAPP', label: 'Berita Acara Pemeriksaan Pekerjaan (BAPP)' },
  { value: 'BAST_SEMENTARA', label: 'BAST Sementara (PHO)' },
  { value: 'BAST_AKHIR', label: 'BAST Akhir (FHO)' },
  { value: 'BA_STOCK_OPNAME', label: 'Berita Acara Stock Opname' },
]

const STATUS_SERAH_TERIMA = [
  { value: 'DRAFT', label: 'Draft', color: 'gray' },
  { value: 'PEMERIKSAAN', label: 'Pemeriksaan', color: 'primary' },
  { value: 'PERBAIKAN', label: 'Perlu Perbaikan', color: 'warning' },
  { value: 'DITERIMA', label: 'Diterima', color: 'success' },
  { value: 'DITOLAK', label: 'Ditolak', color: 'error' },
]

// Checklist items for inspection
const DEFAULT_CHECKLIST = [
  { id: 'spesifikasi', label: 'Kesesuaian spesifikasi teknis', checked: false },
  { id: 'volume', label: 'Kesesuaian volume/kuantitas', checked: false },
  { id: 'kualitas', label: 'Kualitas barang/jasa sesuai standar', checked: false },
  { id: 'fungsi', label: 'Fungsi berjalan dengan baik', checked: false },
  { id: 'kelengkapan', label: 'Kelengkapan dokumen pendukung', checked: false },
  { id: 'garansi', label: 'Dokumen garansi/jaminan', checked: false },
  { id: 'manual', label: 'Buku manual/panduan penggunaan', checked: false },
]

export default function PaketSerahTerimaPage() {
  const { id: paketId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [serahTerimaList, setSerahTerimaList] = useState([])

  // Modal states
  const [serahTerimaModal, setSerahTerimaModal] = useState(false)
  const [checklistModal, setChecklistModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [serahTerimaForm, setSerahTerimaForm] = useState({
    jenisSerahTerima: 'BAPP',
    nomorBA: '',
    tanggalPemeriksaan: '',
    tanggalSerahTerima: '',
    pihakPenyerah: '',
    pihakPenerima: '',
    lokasi: '',
    hasil: '',
    catatan: '',
    checklist: DEFAULT_CHECKLIST,
    status: 'DRAFT',
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
        // In real implementation, fetch from API
        if (paketResult.data.serahTerima) {
          setSerahTerimaList(paketResult.data.serahTerima)
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

  // Open modal
  const openSerahTerimaModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setSerahTerimaForm({
        jenisSerahTerima: item.jenisSerahTerima || 'BAPP',
        nomorBA: item.nomorBA || '',
        tanggalPemeriksaan: item.tanggalPemeriksaan || '',
        tanggalSerahTerima: item.tanggalSerahTerima || '',
        pihakPenyerah: item.pihakPenyerah || '',
        pihakPenerima: item.pihakPenerima || '',
        lokasi: item.lokasi || '',
        hasil: item.hasil || '',
        catatan: item.catatan || '',
        checklist: item.checklist || DEFAULT_CHECKLIST,
        status: item.status || 'DRAFT',
      })
    } else {
      setEditingItem(null)
      setSerahTerimaForm({
        jenisSerahTerima: 'BAPP',
        nomorBA: '',
        tanggalPemeriksaan: new Date().toISOString().split('T')[0],
        tanggalSerahTerima: '',
        pihakPenyerah: paket?.penyedia?.nama || '',
        pihakPenerima: '',
        lokasi: '',
        hasil: '',
        catatan: '',
        checklist: DEFAULT_CHECKLIST.map(c => ({ ...c, checked: false })),
        status: 'DRAFT',
      })
    }
    setSerahTerimaModal(true)
  }

  // Handle checklist change
  const handleChecklistChange = (checkId) => {
    setSerahTerimaForm({
      ...serahTerimaForm,
      checklist: serahTerimaForm.checklist.map(item =>
        item.id === checkId ? { ...item, checked: !item.checked } : item
      ),
    })
  }

  // Calculate checklist progress
  const getChecklistProgress = (checklist) => {
    if (!checklist || checklist.length === 0) return 0
    const checked = checklist.filter(c => c.checked).length
    return Math.round((checked / checklist.length) * 100)
  }

  // Save serah terima
  const handleSave = async () => {
    if (!serahTerimaForm.nomorBA || !serahTerimaForm.tanggalPemeriksaan) {
      toast.error('Lengkapi data serah terima')
      return
    }

    setSaving(true)
    try {
      const saved = {
        ...serahTerimaForm,
        id: editingItem ? getId(editingItem) : Date.now().toString(),
        paketId,
        checklistProgress: getChecklistProgress(serahTerimaForm.checklist),
      }

      if (editingItem) {
        setSerahTerimaList(serahTerimaList.map(s => getId(s) === getId(editingItem) ? saved : s))
        toast.success('Serah terima berhasil diperbarui')
      } else {
        setSerahTerimaList([...serahTerimaList, saved])
        toast.success('Serah terima berhasil ditambahkan')
      }
      setSerahTerimaModal(false)
    } catch (err) {
      toast.error('Gagal menyimpan serah terima')
    } finally {
      setSaving(false)
    }
  }

  // Update status
  const handleUpdateStatus = async (item, newStatus) => {
    try {
      const updated = {
        ...item,
        status: newStatus,
        tanggalSerahTerima: newStatus === 'DITERIMA' ? new Date().toISOString().split('T')[0] : item.tanggalSerahTerima,
      }
      setSerahTerimaList(serahTerimaList.map(s => getId(s) === getId(item) ? updated : s))
      toast.success(`Status diperbarui menjadi ${STATUS_SERAH_TERIMA.find(s => s.value === newStatus)?.label}`)
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }

  // Delete
  const confirmDelete = (item) => {
    setDeleteTarget(item)
    setDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setSerahTerimaList(serahTerimaList.filter(s => getId(s) !== getId(deleteTarget)))
      toast.success('Serah terima berhasil dihapus')
      setDeleteModal(false)
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Gagal menghapus serah terima')
    }
  }

  // Open checklist modal for viewing
  const openChecklistModal = (item) => {
    setEditingItem(item)
    setSerahTerimaForm({
      ...serahTerimaForm,
      checklist: item.checklist || DEFAULT_CHECKLIST,
    })
    setChecklistModal(true)
  }

  if (loading) {
    return <LoadingPage message="Memuat data serah terima..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  // Summary stats
  const totalSerahTerima = serahTerimaList.length
  const diterima = serahTerimaList.filter(s => s.status === 'DITERIMA').length
  const pending = serahTerimaList.filter(s => ['DRAFT', 'PEMERIKSAAN', 'PERBAIKAN'].includes(s.status)).length

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
          <h1 className="text-2xl font-bold text-slate-900">Serah Terima</h1>
          <p className="mt-1 text-sm text-slate-500">{paket?.namaPaket}</p>
        </div>
        <Button onClick={() => openSerahTerimaModal()} icon={Plus}>
          Tambah Berita Acara
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Total Berita Acara</p>
            <p className="text-2xl font-bold text-slate-900">{totalSerahTerima}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Diterima</p>
            <p className="text-2xl font-bold text-success-600">{diterima}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Proses</p>
            <p className="text-2xl font-bold text-warning-600">{pending}</p>
          </CardBody>
        </Card>
      </div>

      {/* Timeline/Workflow */}
      {serahTerimaList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alur Serah Terima</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {['BAPP', 'BAST_SEMENTARA', 'BAST_AKHIR'].map((jenis, idx) => {
                const item = serahTerimaList.find(s => s.jenisSerahTerima === jenis)
                const isCompleted = item?.status === 'DITERIMA'
                const isInProgress = item && item.status !== 'DITERIMA'

                return (
                  <div key={jenis} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-success-100 text-success-600' :
                        isInProgress ? 'bg-primary-100 text-primary-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : isInProgress ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-medium">{idx + 1}</span>
                        )}
                      </div>
                      <p className={`mt-2 text-xs text-center ${
                        isCompleted ? 'text-success-600 font-medium' :
                        isInProgress ? 'text-primary-600' :
                        'text-slate-400'
                      }`}>
                        {JENIS_SERAH_TERIMA.find(j => j.value === jenis)?.label.split('(')[0]}
                      </p>
                    </div>
                    {idx < 2 && (
                      <div className={`w-20 h-0.5 mx-2 ${
                        isCompleted ? 'bg-success-300' : 'bg-slate-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Serah Terima List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Daftar Berita Acara
          </CardTitle>
        </CardHeader>
        <CardBody>
          {serahTerimaList.length > 0 ? (
            <div className="space-y-4">
              {serahTerimaList.map((item) => {
                const statusConfig = STATUS_SERAH_TERIMA.find(s => s.value === item.status)
                const checklistProgress = getChecklistProgress(item.checklist)

                return (
                  <div key={getId(item)} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={statusConfig?.color || 'default'}>
                            {statusConfig?.label || item.status}
                          </Badge>
                        </div>
                        <h4 className="font-medium text-slate-900">
                          {JENIS_SERAH_TERIMA.find(j => j.value === item.jenisSerahTerima)?.label}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">{item.nomorBA}</p>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <p className="flex items-center justify-end gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatTanggal(item.tanggalPemeriksaan)}
                        </p>
                        {item.tanggalSerahTerima && (
                          <p className="text-success-600">
                            Diterima: {formatTanggal(item.tanggalSerahTerima)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100 text-sm">
                      <div>
                        <p className="text-slate-500">Pihak Penyerah</p>
                        <p className="font-medium flex items-center gap-1">
                          <User className="w-4 h-4 text-slate-400" />
                          {item.pihakPenyerah || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Pihak Penerima</p>
                        <p className="font-medium flex items-center gap-1">
                          <User className="w-4 h-4 text-slate-400" />
                          {item.pihakPenerima || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Checklist Progress */}
                    {item.checklist && item.checklist.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-600">Checklist Pemeriksaan</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openChecklistModal(item)}
                          >
                            Lihat Detail
                          </Button>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              checklistProgress === 100 ? 'bg-success-500' :
                              checklistProgress >= 50 ? 'bg-primary-500' :
                              'bg-warning-500'
                            }`}
                            style={{ width: `${checklistProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {item.checklist.filter(c => c.checked).length} dari {item.checklist.length} item selesai
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {item.catatan && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-sm text-slate-500">Catatan:</p>
                        <p className="text-sm text-slate-700">{item.catatan}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(item, 'PEMERIKSAAN')}
                          >
                            Mulai Pemeriksaan
                          </Button>
                        )}
                        {item.status === 'PEMERIKSAAN' && (
                          <>
                            {checklistProgress === 100 ? (
                              <Button
                                variant="success"
                                size="sm"
                                icon={CheckCircle}
                                onClick={() => handleUpdateStatus(item, 'DITERIMA')}
                              >
                                Terima
                              </Button>
                            ) : (
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => handleUpdateStatus(item, 'PERBAIKAN')}
                              >
                                Perlu Perbaikan
                              </Button>
                            )}
                          </>
                        )}
                        {item.status === 'PERBAIKAN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(item, 'PEMERIKSAAN')}
                          >
                            Periksa Ulang
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" icon={Download}>
                          Cetak BA
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openSerahTerimaModal(item)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {item.status === 'DRAFT' && (
                          <Button variant="ghost" size="sm" onClick={() => confirmDelete(item)}>
                            <Trash2 className="w-4 h-4 text-error-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={ClipboardCheck}
              title="Belum ada serah terima"
              description="Buat berita acara serah terima untuk paket ini"
              actionText="Tambah Berita Acara"
              onAction={() => openSerahTerimaModal()}
            />
          )}
        </CardBody>
      </Card>

      {/* Serah Terima Modal */}
      <Modal
        open={serahTerimaModal}
        onClose={() => setSerahTerimaModal(false)}
        title={editingItem ? 'Edit Berita Acara' : 'Tambah Berita Acara'}
        size="lg"
      >
        <div className="space-y-4">
          <SelectField
            label="Jenis Berita Acara"
            value={serahTerimaForm.jenisSerahTerima}
            onChange={(e) => setSerahTerimaForm({ ...serahTerimaForm, jenisSerahTerima: e.target.value })}
            options={JENIS_SERAH_TERIMA}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Nomor Berita Acara"
              value={serahTerimaForm.nomorBA}
              onChange={(e) => setSerahTerimaForm({ ...serahTerimaForm, nomorBA: e.target.value })}
              required
            />
            <DateField
              label="Tanggal Pemeriksaan"
              value={serahTerimaForm.tanggalPemeriksaan}
              onChange={(e) => setSerahTerimaForm({ ...serahTerimaForm, tanggalPemeriksaan: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Pihak Penyerah"
              value={serahTerimaForm.pihakPenyerah}
              onChange={(e) => setSerahTerimaForm({ ...serahTerimaForm, pihakPenyerah: e.target.value })}
              placeholder="Nama penyedia/rekanan"
            />
            <TextField
              label="Pihak Penerima"
              value={serahTerimaForm.pihakPenerima}
              onChange={(e) => setSerahTerimaForm({ ...serahTerimaForm, pihakPenerima: e.target.value })}
              placeholder="Nama penerima/PPK"
            />
          </div>

          <TextField
            label="Lokasi Serah Terima"
            value={serahTerimaForm.lokasi}
            onChange={(e) => setSerahTerimaForm({ ...serahTerimaForm, lokasi: e.target.value })}
          />

          {/* Checklist */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Checklist Pemeriksaan
            </label>
            <div className="space-y-2 bg-slate-50 rounded-lg p-3">
              {serahTerimaForm.checklist.map((item) => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleChecklistChange(item.id)}
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className={`text-sm ${item.checked ? 'text-slate-900' : 'text-slate-600'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Progress: {serahTerimaForm.checklist.filter(c => c.checked).length} dari {serahTerimaForm.checklist.length} item
            </p>
          </div>

          <TextareaField
            label="Hasil Pemeriksaan"
            value={serahTerimaForm.hasil}
            onChange={(e) => setSerahTerimaForm({ ...serahTerimaForm, hasil: e.target.value })}
            rows={2}
            placeholder="Kesimpulan hasil pemeriksaan"
          />

          <TextareaField
            label="Catatan"
            value={serahTerimaForm.catatan}
            onChange={(e) => setSerahTerimaForm({ ...serahTerimaForm, catatan: e.target.value })}
            rows={2}
          />

          {editingItem && (
            <SelectField
              label="Status"
              value={serahTerimaForm.status}
              onChange={(e) => setSerahTerimaForm({ ...serahTerimaForm, status: e.target.value })}
              options={STATUS_SERAH_TERIMA}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setSerahTerimaModal(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Checklist Detail Modal */}
      <Modal
        open={checklistModal}
        onClose={() => setChecklistModal(false)}
        title="Detail Checklist Pemeriksaan"
      >
        <div className="space-y-3">
          {editingItem?.checklist?.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                item.checked ? 'bg-success-50 border border-success-200' : 'bg-slate-50'
              }`}
            >
              {item.checked ? (
                <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
              )}
              <span className={item.checked ? 'text-success-800' : 'text-slate-600'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex justify-end">
          <Button variant="outline" onClick={() => setChecklistModal(false)}>
            Tutup
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Hapus Berita Acara"
        message="Yakin ingin menghapus berita acara ini? Tindakan ini tidak dapat dibatalkan."
        type="danger"
      />
    </div>
  )
}
