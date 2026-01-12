import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Store, TrendingUp, Search, ExternalLink } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button, IconButton } from '../../components/common/Button'
import { Modal, ModalBody, ModalFooter, ConfirmDialog } from '../../components/common/Modal'
import { TextField, TextareaField, MoneyField, SelectField } from '../../components/common/FormField'
import { LoadingPage, LoadingSpinner } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { Badge } from '../../components/common/Badge'
import { formatRupiah, formatDate } from '../../utils/formatters'
import { getPaketDetail, getPaketItems, getItemSurveys, addItemSurvey, deleteSurvey } from '../../api/paket'
import toast from 'react-hot-toast'

const getId = (item) => item?.id || item?._id || item?.itemId || item?.surveyId || item?.rowId || item?.ID || null

// Normalize survey data from API (handle different field names)
const normalizeSurvey = (survey, index) => ({
  ...survey,
  id: getId(survey) || `survey-${index}`,
  namaToko: survey.namaToko || survey.nama_toko || survey.sumber || survey.namaSupplier || survey.toko || '',
  alamatToko: survey.alamatToko || survey.alamat_toko || survey.alamat || '',
  kontakToko: survey.kontakToko || survey.kontak_toko || survey.kontak || survey.telepon || '',
  harga: parseFloat(survey.harga) || 0,
  tanggalSurvey: survey.tanggalSurvey || survey.tanggal_survey || survey.tanggal || '',
  keterangan: survey.keterangan || survey.catatan || '',
  linkBukti: survey.linkBukti || survey.link_bukti || survey.buktiUrl || survey.bukti || '',
})

const initialSurveyData = {
  namaToko: '',
  alamatToko: '',
  kontakToko: '',
  harga: 0,
  tanggalSurvey: new Date().toISOString().split('T')[0],
  keterangan: '',
  linkBukti: '',
}

export default function PaketSurveyPage() {
  const { id: paketId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [items, setItems] = useState([])
  const [surveys, setSurveys] = useState({}) // itemId -> surveys[]
  const [loadingSurveys, setLoadingSurveys] = useState({})

  const [selectedItem, setSelectedItem] = useState(null)
  const [surveyModal, setSurveyModal] = useState({ open: false, itemId: null })
  const [surveyData, setSurveyData] = useState(initialSurveyData)
  const [submitting, setSubmitting] = useState(false)

  const [deleteModal, setDeleteModal] = useState({ open: false, survey: null, itemId: null })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [paketId])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [paketResult, itemsResult] = await Promise.all([
        getPaketDetail(paketId),
        getPaketItems(paketId),
      ])

      if (paketResult.success) {
        setPaket(paketResult.data)
      } else {
        setError(paketResult.error || 'Gagal memuat data paket')
        return
      }

      if (itemsResult.success) {
        const data = Array.isArray(itemsResult.data) ? itemsResult.data : itemsResult.data?.items || []
        setItems(data)

        // Auto-select first item if available
        if (data.length > 0) {
          setSelectedItem(data[0])
          fetchItemSurveys(getId(data[0]))
        }
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchItemSurveys = async (itemId) => {
    if (!itemId) return

    setLoadingSurveys(prev => ({ ...prev, [itemId]: true }))
    try {
      const result = await getItemSurveys(itemId)
      if (result.success) {
        const rawData = Array.isArray(result.data) ? result.data : result.data?.surveys || []
        // Normalize survey data to handle different field names from API
        const data = rawData.map(normalizeSurvey)
        setSurveys(prev => ({ ...prev, [itemId]: data }))
      } else {
        // Notify user about the failure
        toast.error(result.error || 'Gagal memuat data survey untuk item ini')
        setSurveys(prev => ({ ...prev, [itemId]: [] }))
      }
    } catch (err) {
      // Notify user about the error
      toast.error('Gagal memuat data survey: ' + (err.message || 'terjadi kesalahan jaringan'))
      setSurveys(prev => ({ ...prev, [itemId]: [] }))
    } finally {
      setLoadingSurveys(prev => ({ ...prev, [itemId]: false }))
    }
  }

  const handleSelectItem = (item) => {
    setSelectedItem(item)
    const itemId = getId(item)
    if (!surveys[itemId]) {
      fetchItemSurveys(itemId)
    }
  }

  const openSurveyModal = (itemId) => {
    setSurveyData(initialSurveyData)
    setSurveyModal({ open: true, itemId })
  }

  const handleSubmitSurvey = async () => {
    if (!surveyData.namaToko.trim()) {
      toast.error('Nama toko wajib diisi')
      return
    }
    if (surveyData.harga <= 0) {
      toast.error('Harga harus lebih dari 0')
      return
    }

    setSubmitting(true)
    try {
      const result = await addItemSurvey(surveyModal.itemId, surveyData)

      if (result.success) {
        toast.success('Survey berhasil ditambahkan')
        setSurveyModal({ open: false, itemId: null })
        fetchItemSurveys(surveyModal.itemId)
      } else {
        toast.error(result.error || 'Gagal menyimpan survey')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSurvey = async () => {
    if (!deleteModal.survey || !deleteModal.itemId) return

    setDeleting(true)
    try {
      // Pass both itemId and surveyId to the API
      const result = await deleteSurvey(deleteModal.itemId, getId(deleteModal.survey))

      if (result.success) {
        toast.success('Survey berhasil dihapus')
        setDeleteModal({ open: false, survey: null, itemId: null })
        fetchItemSurveys(deleteModal.itemId)
      } else {
        toast.error(result.error || 'Gagal menghapus survey')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  const calculateSurveyStats = (itemId) => {
    const itemSurveys = surveys[itemId] || []
    if (itemSurveys.length === 0) return { count: 0, min: 0, max: 0, avg: 0 }

    const prices = itemSurveys.map(s => s.harga || 0)
    return {
      count: itemSurveys.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    }
  }

  if (loading) {
    return <LoadingPage message="Memuat data survey..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  const selectedItemId = getId(selectedItem)
  const selectedSurveys = surveys[selectedItemId] || []
  const stats = calculateSurveyStats(selectedItemId)

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
          <h1 className="text-2xl font-bold text-slate-900">Survey Harga</h1>
          <p className="mt-1 text-sm text-slate-500">{paket?.namaPaket}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Daftar Item</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {items.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <p>Belum ada item</p>
                  <Link to={`/paket/${paketId}/items`} className="text-primary-600 hover:underline text-sm">
                    Tambah Item
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {items.map((item) => {
                    const itemId = getId(item)
                    const itemStats = calculateSurveyStats(itemId)
                    const isSelected = selectedItemId === itemId

                    return (
                      <button
                        key={itemId}
                        onClick={() => handleSelectItem(item)}
                        className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                        }`}
                      >
                        <p className="font-medium text-slate-900 truncate">{item.namaBarang}</p>
                        <p className="text-sm text-slate-500">{item.volume} {item.satuan}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant={itemStats.count >= 3 ? 'success' : itemStats.count > 0 ? 'warning' : 'default'}>
                            {itemStats.count} survey
                          </Badge>
                          {itemStats.count >= 3 && (
                            <TrendingUp className="w-4 h-4 text-success-500" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Survey Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedItem ? (
            <>
              {/* Item Info */}
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{selectedItem.namaBarang}</h3>
                      <p className="text-sm text-slate-500 mt-1">{selectedItem.spesifikasi || 'Tidak ada spesifikasi'}</p>
                      <p className="text-sm text-slate-600 mt-2">
                        Volume: {selectedItem.volume} {selectedItem.satuan}
                      </p>
                    </div>
                    <Button icon={Plus} onClick={() => openSurveyModal(selectedItemId)}>
                      Tambah Survey
                    </Button>
                  </div>
                </CardBody>
              </Card>

              {/* Statistics */}
              {stats.count > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardBody className="text-center">
                      <p className="text-sm text-slate-500">Jumlah Survey</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.count}</p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody className="text-center">
                      <p className="text-sm text-slate-500">Harga Terendah</p>
                      <p className="text-lg font-bold text-success-600">{formatRupiah(stats.min)}</p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody className="text-center">
                      <p className="text-sm text-slate-500">Harga Tertinggi</p>
                      <p className="text-lg font-bold text-error-600">{formatRupiah(stats.max)}</p>
                    </CardBody>
                  </Card>
                  <Card className="bg-primary-50 border-primary-200">
                    <CardBody className="text-center">
                      <p className="text-sm text-primary-600">Rata-rata</p>
                      <p className="text-lg font-bold text-primary-700">{formatRupiah(stats.avg)}</p>
                    </CardBody>
                  </Card>
                </div>
              )}

              {/* Survey List */}
              <Card>
                <CardHeader>
                  <CardTitle>Hasil Survey</CardTitle>
                </CardHeader>
                <CardBody>
                  {loadingSurveys[selectedItemId] ? (
                    <div className="py-8 flex justify-center">
                      <LoadingSpinner />
                    </div>
                  ) : selectedSurveys.length === 0 ? (
                    <EmptyState
                      icon={Search}
                      title="Belum ada survey"
                      description="Lakukan survey harga minimal dari 3 toko berbeda"
                      actionText="Tambah Survey"
                      onAction={() => openSurveyModal(selectedItemId)}
                    />
                  ) : (
                    <div className="space-y-4">
                      {selectedSurveys.map((survey, index) => (
                        <div
                          key={getId(survey) || index}
                          className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Store className="w-5 h-5 text-slate-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{survey.namaToko}</p>
                                <p className="text-sm text-slate-500">{survey.alamatToko || 'Alamat tidak tersedia'}</p>
                                {survey.kontakToko && (
                                  <p className="text-sm text-slate-500">Kontak: {survey.kontakToko}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-900">{formatRupiah(survey.harga)}</p>
                              <p className="text-xs text-slate-500">{formatDate(survey.tanggalSurvey)}</p>
                            </div>
                          </div>

                          {(survey.keterangan || survey.linkBukti) && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              {survey.keterangan && (
                                <p className="text-sm text-slate-600">{survey.keterangan}</p>
                              )}
                              {survey.linkBukti && (
                                <a
                                  href={survey.linkBukti}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline mt-2"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Lihat Bukti
                                </a>
                              )}
                            </div>
                          )}

                          <div className="mt-3 flex justify-end">
                            <IconButton
                              icon={Trash2}
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteModal({ open: true, survey, itemId: selectedItemId })}
                              title="Hapus"
                              className="text-error-600 hover:text-error-700 hover:bg-error-50"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            </>
          ) : (
            <Card>
              <CardBody className="py-12 text-center">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Pilih item untuk melihat dan menambah survey harga</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Survey Modal */}
      <Modal
        open={surveyModal.open}
        onClose={() => setSurveyModal({ open: false, itemId: null })}
        title="Tambah Survey Harga"
        size="lg"
      >
        <ModalBody className="space-y-4">
          <TextField
            label="Nama Toko/Supplier"
            value={surveyData.namaToko}
            onChange={(e) => setSurveyData({ ...surveyData, namaToko: e.target.value })}
            placeholder="Nama toko atau supplier"
            required
          />

          <TextField
            label="Alamat"
            value={surveyData.alamatToko}
            onChange={(e) => setSurveyData({ ...surveyData, alamatToko: e.target.value })}
            placeholder="Alamat lengkap toko"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Kontak"
              value={surveyData.kontakToko}
              onChange={(e) => setSurveyData({ ...surveyData, kontakToko: e.target.value })}
              placeholder="No. HP / Email"
            />

            <TextField
              label="Tanggal Survey"
              type="date"
              value={surveyData.tanggalSurvey}
              onChange={(e) => setSurveyData({ ...surveyData, tanggalSurvey: e.target.value })}
              required
            />
          </div>

          <MoneyField
            label="Harga"
            value={surveyData.harga}
            onChange={(val) => setSurveyData({ ...surveyData, harga: val })}
            required
          />

          <TextField
            label="Link Bukti (Optional)"
            value={surveyData.linkBukti}
            onChange={(e) => setSurveyData({ ...surveyData, linkBukti: e.target.value })}
            placeholder="https://..."
            hint="Link screenshot/foto harga dari marketplace/website"
          />

          <TextareaField
            label="Keterangan"
            value={surveyData.keterangan}
            onChange={(e) => setSurveyData({ ...surveyData, keterangan: e.target.value })}
            placeholder="Catatan tambahan..."
            rows={2}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setSurveyModal({ open: false, itemId: null })}>
            Batal
          </Button>
          <Button onClick={handleSubmitSurvey} loading={submitting}>
            Simpan Survey
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, survey: null, itemId: null })}
        onConfirm={handleDeleteSurvey}
        title="Hapus Survey"
        message={`Apakah Anda yakin ingin menghapus survey dari "${deleteModal.survey?.namaToko || 'toko ini'}"?`}
        type="danger"
        confirmText="Ya, Hapus"
        loading={deleting}
      />
    </div>
  )
}
