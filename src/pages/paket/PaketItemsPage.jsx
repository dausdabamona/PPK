import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, Package, Calculator } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button, IconButton } from '../../components/common/Button'
import { SimpleTable } from '../../components/common/DataTable'
import { Modal, ModalBody, ModalFooter, ConfirmDialog } from '../../components/common/Modal'
import { TextField, TextareaField, SelectField, MoneyField } from '../../components/common/FormField'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { formatRupiah } from '../../utils/formatters'
import { SATUAN } from '../../utils/constants'
import { getPaketDetail, getPaketItems, addPaketItem, updateItem, deleteItem } from '../../api/paket'
import toast from 'react-hot-toast'

// Helper to get ID from various possible field names
const getId = (item) => {
  if (!item) return null
  const id = item.id ?? item.itemId ?? item._id ?? item.rowId ?? item.ID ?? item.Id
  if (id === null || id === undefined) {
    console.warn('Could not find ID in item:', Object.keys(item), item)
  }
  return id
}

// Helper to parse Indonesian number format (30.472,00 -> 30472)
const parseIndonesianNumber = (value) => {
  if (typeof value === 'number') return value
  if (!value || typeof value !== 'string') return 0
  // Remove thousand separator (.) and replace decimal separator (,) with (.)
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

// Normalize item data from Google Sheet
const normalizeItem = (item, index) => ({
  ...item,
  id: getId(item) || `item-${index}`,
  namaBarang: item.namaBarang || item.nama || '',
  volume: parseIndonesianNumber(item.volume) || 1,
  hargaSatuan: parseIndonesianNumber(item.hargaSatuan) || 0,
  jumlah: parseIndonesianNumber(item.jumlah) || 0,
  overhead: parseIndonesianNumber(item.overhead) || 0,
  biayaLain: parseIndonesianNumber(item.biayaLain) || 0,
})

const initialFormData = {
  namaBarang: '',
  spesifikasi: '',
  volume: 1,
  satuan: 'unit',
  hargaSatuan: 0,
  ongkirSatuan: 0,
  overheadPersen: 0,
  biayaLain: 0,
}

export default function PaketItemsPage() {
  const { id: paketId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [items, setItems] = useState([])

  const [formModal, setFormModal] = useState({ open: false, item: null })
  const [formData, setFormData] = useState(initialFormData)
  const [submitting, setSubmitting] = useState(false)

  const [deleteModal, setDeleteModal] = useState({ open: false, item: null })
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
        const rawData = Array.isArray(itemsResult.data) ? itemsResult.data : itemsResult.data?.items || []
        console.log('API Response - Items:', itemsResult.data) // Debug log
        if (rawData.length > 0) console.log('Sample item:', Object.keys(rawData[0]), rawData[0]) // Debug log
        const data = rawData.map(normalizeItem)
        setItems(data)
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setFormData(initialFormData)
    setFormModal({ open: true, item: null })
  }

  const openEditModal = (item) => {
    setFormData({
      namaBarang: item.namaBarang || '',
      spesifikasi: item.spesifikasi || '',
      volume: item.volume || 1,
      satuan: item.satuan || 'unit',
      hargaSatuan: item.hargaSatuan || 0,
      ongkirSatuan: item.ongkirSatuan || 0,
      overheadPersen: item.overheadPersen || 0,
      biayaLain: item.biayaLain || 0,
    })
    setFormModal({ open: true, item })
  }

  const handleSubmit = async () => {
    if (!formData.namaBarang.trim()) {
      toast.error('Nama barang wajib diisi')
      return
    }
    if (formData.volume <= 0) {
      toast.error('Volume harus lebih dari 0')
      return
    }

    setSubmitting(true)
    try {
      const isEdit = formModal.item !== null
      const result = isEdit
        ? await updateItem(getId(formModal.item), formData)
        : await addPaketItem(paketId, formData)

      if (result.success) {
        toast.success(isEdit ? 'Item berhasil diperbarui' : 'Item berhasil ditambahkan')
        setFormModal({ open: false, item: null })
        fetchData()
      } else {
        toast.error(result.error || 'Gagal menyimpan item')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.item) return

    setDeleting(true)
    try {
      const result = await deleteItem(getId(deleteModal.item))

      if (result.success) {
        toast.success('Item berhasil dihapus')
        setDeleteModal({ open: false, item: null })
        fetchData()
      } else {
        toast.error(result.error || 'Gagal menghapus item')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  const calculateItemTotal = (item) => {
    const subtotal = item.volume * item.hargaSatuan
    const ongkir = item.volume * (item.ongkirSatuan || 0)
    const overhead = subtotal * ((item.overheadPersen || 0) / 100)
    return subtotal + ongkir + overhead + (item.biayaLain || 0)
  }

  const totalHPS = useMemo(() => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  }, [items])

  const columns = [
    {
      accessorKey: 'namaBarang',
      header: 'Nama Barang',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-900">{row.original.namaBarang}</p>
          {row.original.spesifikasi && (
            <p className="text-xs text-slate-500 truncate max-w-xs">{row.original.spesifikasi}</p>
          )}
        </div>
      )
    },
    {
      accessorKey: 'volume',
      header: 'Volume',
      cell: ({ row }) => `${row.original.volume} ${row.original.satuan}`
    },
    {
      accessorKey: 'hargaSatuan',
      header: 'Harga Satuan',
      cell: ({ getValue }) => formatRupiah(getValue())
    },
    {
      accessorKey: 'ongkirSatuan',
      header: 'Ongkir/Satuan',
      cell: ({ getValue }) => formatRupiah(getValue() || 0)
    },
    {
      id: 'jumlah',
      header: 'Jumlah',
      cell: ({ row }) => (
        <span className="font-medium">{formatRupiah(calculateItemTotal(row.original))}</span>
      )
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
            onClick={() => openEditModal(row.original)}
            title="Edit"
          />
          <IconButton
            icon={Trash2}
            variant="ghost"
            size="sm"
            onClick={() => setDeleteModal({ open: true, item: row.original })}
            title="Hapus"
            className="text-error-600 hover:text-error-700 hover:bg-error-50"
          />
        </div>
      ),
    },
  ]

  if (loading) {
    return <LoadingPage message="Memuat data items..." />
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
          <h1 className="text-2xl font-bold text-slate-900">Items Paket</h1>
          <p className="mt-1 text-sm text-slate-500">{paket?.namaPaket}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/paket/${paketId}/survey`}>
            <Button variant="outline" icon={Calculator}>Survey Harga</Button>
          </Link>
          <Button icon={Plus} onClick={openAddModal}>Tambah Item</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Total Items</p>
            <p className="text-2xl font-bold text-slate-900">{items.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Subtotal</p>
            <p className="text-2xl font-bold text-slate-900">{formatRupiah(totalHPS)}</p>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-primary-200">
          <CardBody>
            <p className="text-sm text-primary-600">Total + PPN (11%)</p>
            <p className="text-2xl font-bold text-primary-700">{formatRupiah(totalHPS * 1.11)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Items</CardTitle>
        </CardHeader>
        <CardBody>
          {items.length > 0 ? (
            <SimpleTable columns={columns} data={items} />
          ) : (
            <EmptyState
              icon={Package}
              title="Belum ada item"
              description="Tambahkan item barang/jasa untuk paket ini"
              actionText="Tambah Item"
              onAction={openAddModal}
            />
          )}
        </CardBody>
      </Card>

      {/* Form Modal */}
      <Modal
        open={formModal.open}
        onClose={() => setFormModal({ open: false, item: null })}
        title={formModal.item ? 'Edit Item' : 'Tambah Item Baru'}
        size="lg"
      >
        <ModalBody className="space-y-4">
          <TextField
            label="Nama Barang"
            value={formData.namaBarang}
            onChange={(e) => setFormData({ ...formData, namaBarang: e.target.value })}
            placeholder="Nama barang/jasa"
            required
          />

          <TextareaField
            label="Spesifikasi"
            value={formData.spesifikasi}
            onChange={(e) => setFormData({ ...formData, spesifikasi: e.target.value })}
            placeholder="Spesifikasi detail..."
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Volume"
              type="number"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: parseFloat(e.target.value) || 0 })}
              min="0.01"
              step="0.01"
              required
            />

            <SelectField
              label="Satuan"
              value={formData.satuan}
              onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
              options={SATUAN}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <MoneyField
              label="Harga Satuan"
              value={formData.hargaSatuan}
              onChange={(val) => setFormData({ ...formData, hargaSatuan: val })}
            />

            <MoneyField
              label="Ongkir per Satuan"
              value={formData.ongkirSatuan}
              onChange={(val) => setFormData({ ...formData, ongkirSatuan: val })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Overhead (%)"
              type="number"
              value={formData.overheadPersen}
              onChange={(e) => setFormData({ ...formData, overheadPersen: parseFloat(e.target.value) || 0 })}
              min="0"
              max="100"
              step="0.1"
            />

            <MoneyField
              label="Biaya Lain"
              value={formData.biayaLain}
              onChange={(val) => setFormData({ ...formData, biayaLain: val })}
            />
          </div>

          {/* Preview calculation */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500 mb-2">Preview Perhitungan:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span>Subtotal:</span>
              <span className="text-right">{formatRupiah(formData.volume * formData.hargaSatuan)}</span>
              <span>Ongkir:</span>
              <span className="text-right">{formatRupiah(formData.volume * formData.ongkirSatuan)}</span>
              <span>Overhead ({formData.overheadPersen}%):</span>
              <span className="text-right">{formatRupiah(formData.volume * formData.hargaSatuan * (formData.overheadPersen / 100))}</span>
              <span>Biaya Lain:</span>
              <span className="text-right">{formatRupiah(formData.biayaLain)}</span>
              <span className="font-semibold pt-2 border-t">Total:</span>
              <span className="font-semibold text-right pt-2 border-t text-primary-600">
                {formatRupiah(
                  formData.volume * formData.hargaSatuan +
                  formData.volume * formData.ongkirSatuan +
                  formData.volume * formData.hargaSatuan * (formData.overheadPersen / 100) +
                  formData.biayaLain
                )}
              </span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setFormModal({ open: false, item: null })}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {formModal.item ? 'Simpan Perubahan' : 'Tambah Item'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, item: null })}
        onConfirm={handleDelete}
        title="Hapus Item"
        message={`Apakah Anda yakin ingin menghapus "${deleteModal.item?.namaBarang}"?`}
        type="danger"
        confirmText="Ya, Hapus"
        loading={deleting}
      />
    </div>
  )
}
