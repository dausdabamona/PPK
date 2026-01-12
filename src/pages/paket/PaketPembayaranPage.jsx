import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Calculator
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
import { calculateProcurementTaxes } from '../../utils/taxCalculations'
import { getPaketDetail } from '../../api/paket'
import toast from 'react-hot-toast'

const getId = (item) => item?.id || item?._id || item?.terminId || item?.rowId || item?.ID || null

// Payment types
const JENIS_PEMBAYARAN = [
  { value: 'UANG_MUKA', label: 'Uang Muka', maxPercent: 30 },
  { value: 'TERMIN', label: 'Termin Progress', maxPercent: 95 },
  { value: 'FINAL', label: 'Pembayaran Final', maxPercent: 100 },
  { value: 'RETENSI', label: 'Retensi', maxPercent: 5 },
]

const STATUS_PEMBAYARAN = [
  { value: 'DRAFT', label: 'Draft', color: 'gray' },
  { value: 'DIAJUKAN', label: 'Diajukan', color: 'primary' },
  { value: 'VERIFIKASI', label: 'Verifikasi', color: 'warning' },
  { value: 'DISETUJUI', label: 'Disetujui', color: 'success' },
  { value: 'DIBAYAR', label: 'Dibayar', color: 'success' },
  { value: 'DITOLAK', label: 'Ditolak', color: 'error' },
]

export default function PaketPembayaranPage() {
  const { id: paketId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [termins, setTermins] = useState([])
  const [kontrak, setKontrak] = useState(null)

  // Modal states
  const [terminModal, setTerminModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [terminForm, setTerminForm] = useState({
    jenisPembayaran: 'TERMIN',
    nomorTermin: '',
    tanggalPengajuan: '',
    persenProgress: '',
    nilaiPembayaran: '',
    nilaiRetensi: '',
    keterangan: '',
    status: 'DRAFT',
  })

  // Tax settings
  const [taxSettings, setTaxSettings] = useState({
    isPKP: true,
    hasNPWP: true,
    isUMKM: false,
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
        if (paketResult.data.kontrak) {
          setKontrak(paketResult.data.kontrak)
        }
        if (paketResult.data.termins) {
          setTermins(paketResult.data.termins)
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

  // Calculate payment summary
  const paymentSummary = useMemo(() => {
    const nilaiKontrak = kontrak?.nilaiKontrak || paket?.nilaiHPS || 0
    const retensiPersen = 5 // 5% retention
    const nilaiRetensi = nilaiKontrak * (retensiPersen / 100)
    const maksimalDibayar = nilaiKontrak - nilaiRetensi

    const totalDibayar = termins
      .filter(t => t.status === 'DIBAYAR')
      .reduce((sum, t) => sum + (t.nilaiPembayaran || 0), 0)

    const totalRetensiDitahan = termins
      .filter(t => t.status === 'DIBAYAR')
      .reduce((sum, t) => sum + (t.nilaiRetensi || 0), 0)

    const sisaPembayaran = maksimalDibayar - totalDibayar
    const progressPersen = (totalDibayar / maksimalDibayar) * 100

    return {
      nilaiKontrak,
      retensiPersen,
      nilaiRetensi,
      maksimalDibayar,
      totalDibayar,
      totalRetensiDitahan,
      sisaPembayaran,
      progressPersen,
    }
  }, [kontrak, paket, termins])

  // Calculate taxes for a payment
  const calculatePaymentTaxes = (nilai) => {
    if (!nilai || nilai <= 0) return null

    return calculateProcurementTaxes({
      amount: nilai,
      jenisPengadaan: paket?.jenisPengadaan,
      ...taxSettings,
    })
  }

  // Open termin modal
  const openTerminModal = (termin = null) => {
    if (termin) {
      setEditingItem(termin)
      setTerminForm({
        jenisPembayaran: termin.jenisPembayaran || 'TERMIN',
        nomorTermin: termin.nomorTermin || '',
        tanggalPengajuan: termin.tanggalPengajuan || '',
        persenProgress: termin.persenProgress || '',
        nilaiPembayaran: termin.nilaiPembayaran || '',
        nilaiRetensi: termin.nilaiRetensi || '',
        keterangan: termin.keterangan || '',
        status: termin.status || 'DRAFT',
      })
    } else {
      setEditingItem(null)
      const nextTerminNumber = termins.length + 1
      setTerminForm({
        jenisPembayaran: 'TERMIN',
        nomorTermin: `Termin ${nextTerminNumber}`,
        tanggalPengajuan: new Date().toISOString().split('T')[0],
        persenProgress: '',
        nilaiPembayaran: '',
        nilaiRetensi: '',
        keterangan: '',
        status: 'DRAFT',
      })
    }
    setTerminModal(true)
  }

  // Auto-calculate values when progress changes
  const handleProgressChange = (persen) => {
    const progress = Number(persen) || 0
    const nilaiKontrak = paymentSummary.nilaiKontrak

    // Calculate cumulative value
    const nilaiKumulatif = nilaiKontrak * (progress / 100)

    // Get previous payments
    const previousPaid = termins
      .filter(t => t.status === 'DIBAYAR' && getId(t) !== getId(editingItem))
      .reduce((sum, t) => sum + (t.nilaiPembayaran || 0) + (t.nilaiRetensi || 0), 0)

    // This payment value
    const nilaiTermin = Math.max(0, nilaiKumulatif - previousPaid)

    // Calculate retention (5% of this payment)
    const retensi = nilaiTermin * 0.05

    setTerminForm({
      ...terminForm,
      persenProgress: persen,
      nilaiPembayaran: Math.round(nilaiTermin - retensi),
      nilaiRetensi: Math.round(retensi),
    })
  }

  // Save termin
  const handleSaveTermin = async () => {
    if (!terminForm.nilaiPembayaran) {
      toast.error('Lengkapi data pembayaran')
      return
    }

    setSaving(true)
    try {
      const savedTermin = {
        ...terminForm,
        persenProgress: Number(terminForm.persenProgress) || 0,
        nilaiPembayaran: Number(terminForm.nilaiPembayaran),
        nilaiRetensi: Number(terminForm.nilaiRetensi) || 0,
        id: editingItem ? getId(editingItem) : Date.now().toString(),
        paketId,
      }

      // Calculate taxes
      const taxes = calculatePaymentTaxes(savedTermin.nilaiPembayaran)
      if (taxes) {
        savedTermin.pajak = {
          ppn: taxes.ppn.amount,
          pph: taxes.pph.amount,
          pphType: taxes.pph.type,
          nilaiNett: taxes.netPayment,
        }
      }

      if (editingItem) {
        setTermins(termins.map(t => getId(t) === getId(editingItem) ? savedTermin : t))
        toast.success('Pembayaran berhasil diperbarui')
      } else {
        setTermins([...termins, savedTermin])
        toast.success('Pembayaran berhasil ditambahkan')
      }
      setTerminModal(false)
    } catch (err) {
      toast.error('Gagal menyimpan pembayaran')
    } finally {
      setSaving(false)
    }
  }

  // Update status
  const handleUpdateStatus = async (termin, newStatus) => {
    try {
      const updated = { ...termin, status: newStatus }
      if (newStatus === 'DIBAYAR') {
        updated.tanggalBayar = new Date().toISOString().split('T')[0]
      }
      setTermins(termins.map(t => getId(t) === getId(termin) ? updated : t))
      toast.success(`Status diperbarui menjadi ${STATUS_PEMBAYARAN.find(s => s.value === newStatus)?.label}`)
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }

  // Delete termin
  const confirmDelete = (termin) => {
    setDeleteTarget(termin)
    setDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setTermins(termins.filter(t => getId(t) !== getId(deleteTarget)))
      toast.success('Pembayaran berhasil dihapus')
      setDeleteModal(false)
      setDeleteTarget(null)
    } catch (err) {
      toast.error('Gagal menghapus pembayaran')
    }
  }

  if (loading) {
    return <LoadingPage message="Memuat data pembayaran..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  const currentTaxes = terminForm.nilaiPembayaran
    ? calculatePaymentTaxes(Number(terminForm.nilaiPembayaran))
    : null

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
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Pembayaran</h1>
          <p className="mt-1 text-sm text-slate-500">{paket?.namaPaket}</p>
        </div>
        <Button onClick={() => openTerminModal()} icon={Plus}>
          Tambah Pembayaran
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Nilai Kontrak</p>
            <p className="text-xl font-bold text-slate-900">{formatRupiah(paymentSummary.nilaiKontrak)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Total Dibayar</p>
            <p className="text-xl font-bold text-success-600">{formatRupiah(paymentSummary.totalDibayar)}</p>
            <p className="text-xs text-slate-500">{paymentSummary.progressPersen.toFixed(1)}% dari kontrak</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Retensi Ditahan</p>
            <p className="text-xl font-bold text-warning-600">{formatRupiah(paymentSummary.totalRetensiDitahan)}</p>
            <p className="text-xs text-slate-500">{paymentSummary.retensiPersen}% per pembayaran</p>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-primary-200">
          <CardBody>
            <p className="text-sm text-primary-600">Sisa Pembayaran</p>
            <p className="text-xl font-bold text-primary-700">{formatRupiah(paymentSummary.sisaPembayaran)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Progress Pembayaran</span>
            <span className="text-sm text-slate-500">{paymentSummary.progressPersen.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div
              className="bg-primary-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, paymentSummary.progressPersen)}%` }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Pengaturan Pajak Penyedia
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxSettings.isPKP}
                onChange={(e) => setTaxSettings({ ...taxSettings, isPKP: e.target.checked })}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700">Penyedia PKP (PPN 11%)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxSettings.hasNPWP}
                onChange={(e) => setTaxSettings({ ...taxSettings, hasNPWP: e.target.checked })}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700">Punya NPWP</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxSettings.isUMKM}
                onChange={(e) => setTaxSettings({ ...taxSettings, isUMKM: e.target.checked })}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700">UMKM (PPh Final 0.5%)</span>
            </label>
          </div>
        </CardBody>
      </Card>

      {/* Termin List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Daftar Pembayaran
          </CardTitle>
        </CardHeader>
        <CardBody>
          {termins.length > 0 ? (
            <div className="space-y-4">
              {termins.map((termin, idx) => {
                const statusConfig = STATUS_PEMBAYARAN.find(s => s.value === termin.status)
                const taxes = calculatePaymentTaxes(termin.nilaiPembayaran)

                return (
                  <div key={getId(termin)} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={statusConfig?.color || 'default'}>
                            {statusConfig?.label || termin.status}
                          </Badge>
                          <Badge variant="default">
                            {JENIS_PEMBAYARAN.find(j => j.value === termin.jenisPembayaran)?.label}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            Progress: {termin.persenProgress || 0}%
                          </span>
                        </div>
                        <h4 className="font-medium text-slate-900">{termin.nomorTermin}</h4>
                        <p className="text-sm text-slate-500">
                          Pengajuan: {formatTanggal(termin.tanggalPengajuan)}
                          {termin.tanggalBayar && ` | Dibayar: ${formatTanggal(termin.tanggalBayar)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{formatRupiah(termin.nilaiPembayaran)}</p>
                        {termin.nilaiRetensi > 0 && (
                          <p className="text-sm text-warning-600">Retensi: {formatRupiah(termin.nilaiRetensi)}</p>
                        )}
                        {taxes && (
                          <p className="text-sm text-primary-600">Nett: {formatRupiah(taxes.netPayment)}</p>
                        )}
                      </div>
                    </div>

                    {/* Tax breakdown */}
                    {taxes && (
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">DPP</p>
                          <p className="font-medium">{formatRupiah(taxes.dpp)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">PPN {taxes.ppn.ratePercent}%</p>
                          <p className="font-medium">{formatRupiah(taxes.ppn.amount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">{taxes.pph.type}</p>
                          <p className="font-medium text-error-600">-{formatRupiah(taxes.pph.amount)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Dibayar</p>
                          <p className="font-medium text-primary-600">{formatRupiah(taxes.netPayment)}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {termin.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(termin, 'DIAJUKAN')}
                          >
                            Ajukan
                          </Button>
                        )}
                        {termin.status === 'DIAJUKAN' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(termin, 'VERIFIKASI')}
                          >
                            Verifikasi
                          </Button>
                        )}
                        {termin.status === 'VERIFIKASI' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleUpdateStatus(termin, 'DISETUJUI')}
                            >
                              Setujui
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(termin, 'DITOLAK')}
                            >
                              Tolak
                            </Button>
                          </>
                        )}
                        {termin.status === 'DISETUJUI' && (
                          <Button
                            variant="success"
                            size="sm"
                            icon={CheckCircle}
                            onClick={() => handleUpdateStatus(termin, 'DIBAYAR')}
                          >
                            Tandai Dibayar
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openTerminModal(termin)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {termin.status === 'DRAFT' && (
                          <Button variant="ghost" size="sm" onClick={() => confirmDelete(termin)}>
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
              icon={CreditCard}
              title="Belum ada pembayaran"
              description="Tambahkan termin pembayaran untuk paket ini"
              actionText="Tambah Pembayaran"
              onAction={() => openTerminModal()}
            />
          )}
        </CardBody>
      </Card>

      {/* Termin Modal */}
      <Modal
        open={terminModal}
        onClose={() => setTerminModal(false)}
        title={editingItem ? 'Edit Pembayaran' : 'Tambah Pembayaran'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Jenis Pembayaran"
              value={terminForm.jenisPembayaran}
              onChange={(e) => setTerminForm({ ...terminForm, jenisPembayaran: e.target.value })}
              options={JENIS_PEMBAYARAN}
            />
            <TextField
              label="Nama/Nomor Termin"
              value={terminForm.nomorTermin}
              onChange={(e) => setTerminForm({ ...terminForm, nomorTermin: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateField
              label="Tanggal Pengajuan"
              value={terminForm.tanggalPengajuan}
              onChange={(e) => setTerminForm({ ...terminForm, tanggalPengajuan: e.target.value })}
            />
            <TextField
              label="Progress (%)"
              type="number"
              min="0"
              max="100"
              value={terminForm.persenProgress}
              onChange={(e) => handleProgressChange(e.target.value)}
              helper="Progress kumulatif pekerjaan"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Nilai Pembayaran"
              type="number"
              value={terminForm.nilaiPembayaran}
              onChange={(e) => setTerminForm({ ...terminForm, nilaiPembayaran: e.target.value })}
              required
            />
            <TextField
              label="Nilai Retensi (5%)"
              type="number"
              value={terminForm.nilaiRetensi}
              onChange={(e) => setTerminForm({ ...terminForm, nilaiRetensi: e.target.value })}
              helper="Ditahan hingga masa pemeliharaan selesai"
            />
          </div>

          {/* Live Tax Calculation */}
          {currentTaxes && (
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-3">Perhitungan Pajak</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">DPP</p>
                  <p className="font-medium">{formatRupiah(currentTaxes.dpp)}</p>
                </div>
                <div>
                  <p className="text-slate-500">PPN {currentTaxes.ppn.ratePercent}%</p>
                  <p className="font-medium">{formatRupiah(currentTaxes.ppn.amount)}</p>
                </div>
                <div>
                  <p className="text-slate-500">{currentTaxes.pph.type} {currentTaxes.pph.ratePercent}%</p>
                  <p className="font-medium text-error-600">-{formatRupiah(currentTaxes.pph.amount)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Dibayar ke Penyedia</p>
                  <p className="font-bold text-primary-600">{formatRupiah(currentTaxes.netPayment)}</p>
                </div>
              </div>
            </div>
          )}

          <TextareaField
            label="Keterangan"
            value={terminForm.keterangan}
            onChange={(e) => setTerminForm({ ...terminForm, keterangan: e.target.value })}
            rows={2}
          />

          {editingItem && (
            <SelectField
              label="Status"
              value={terminForm.status}
              onChange={(e) => setTerminForm({ ...terminForm, status: e.target.value })}
              options={STATUS_PEMBAYARAN}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setTerminModal(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveTermin} loading={saving}>
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
        title="Hapus Pembayaran"
        message="Yakin ingin menghapus pembayaran ini? Tindakan ini tidak dapat dibatalkan."
        type="danger"
      />
    </div>
  )
}
