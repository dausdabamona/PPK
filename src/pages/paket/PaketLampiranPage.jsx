import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Upload, FileText, Image, File, Trash2, Download, Eye, FolderOpen, X } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button, IconButton } from '../../components/common/Button'
import { Modal, ModalBody, ModalFooter, ConfirmDialog } from '../../components/common/Modal'
import { TextField, SelectField, TextareaField } from '../../components/common/FormField'
import { LoadingPage, LoadingSpinner } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { Badge } from '../../components/common/Badge'
import { formatDate, formatFileSize } from '../../utils/formatters'
import { getPaketDetail, getPaketLampiran, uploadLampiran, deleteLampiran, getKategoriUpload } from '../../api/paket'
import toast from 'react-hot-toast'

const getId = (item) => item?.id || item?._id || item?.lampiranId || item?.fileId || item?.rowId || item?.ID || null

const DEFAULT_CATEGORIES = [
  { value: 'kak', label: 'Kerangka Acuan Kerja' },
  { value: 'survey', label: 'Bukti Survey Harga' },
  { value: 'hps', label: 'Dokumen HPS' },
  { value: 'spk', label: 'Surat Perintah Kerja' },
  { value: 'bast', label: 'Berita Acara Serah Terima' },
  { value: 'faktur', label: 'Faktur/Invoice' },
  { value: 'foto', label: 'Foto Dokumentasi' },
  { value: 'lainnya', label: 'Lainnya' },
]

const ALLOWED_TYPES = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function PaketLampiranPage() {
  const { id: paketId } = useParams()
  const fileInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [lampiran, setLampiran] = useState([])
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

  const [uploadModal, setUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadData, setUploadData] = useState({ kategori: '', keterangan: '' })
  const [uploading, setUploading] = useState(false)

  const [previewModal, setPreviewModal] = useState({ open: false, file: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, file: null })
  const [deleting, setDeleting] = useState(false)

  const [filterKategori, setFilterKategori] = useState('')

  useEffect(() => {
    fetchData()
  }, [paketId])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [paketResult, lampiranResult, kategoriResult] = await Promise.all([
        getPaketDetail(paketId),
        getPaketLampiran(paketId),
        getKategoriUpload(),
      ])

      if (paketResult.success) {
        setPaket(paketResult.data)
      } else {
        setError(paketResult.error || 'Gagal memuat data paket')
        return
      }

      if (lampiranResult.success) {
        const data = Array.isArray(lampiranResult.data) ? lampiranResult.data : lampiranResult.data?.files || []
        setLampiran(data)
      }

      if (kategoriResult.success && kategoriResult.data) {
        setCategories(kategoriResult.data)
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!ALLOWED_TYPES[file.type]) {
      toast.error('Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, XLS, XLSX, atau gambar.')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ukuran file maksimal 10MB')
      return
    }

    setSelectedFile(file)
    setUploadModal(true)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    if (!uploadData.kategori) {
      toast.error('Pilih kategori file')
      return
    }

    setUploading(true)
    try {
      // Convert file to base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Content = reader.result.split(',')[1]

        const result = await uploadLampiran(paketId, {
          filename: selectedFile.name,
          base64Content,
          mimeType: selectedFile.type,
          kategori: uploadData.kategori,
          keterangan: uploadData.keterangan,
        })

        if (result.success) {
          toast.success('File berhasil diupload')
          setUploadModal(false)
          setSelectedFile(null)
          setUploadData({ kategori: '', keterangan: '' })
          fetchData()
        } else {
          toast.error(result.error || 'Gagal mengupload file')
        }
        setUploading(false)
      }
      reader.onerror = () => {
        toast.error('Gagal membaca file')
        setUploading(false)
      }
      reader.readAsDataURL(selectedFile)
    } catch (err) {
      toast.error('Terjadi kesalahan')
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.file) return

    setDeleting(true)
    try {
      const result = await deleteLampiran(getId(deleteModal.file))

      if (result.success) {
        toast.success('File berhasil dihapus')
        setDeleteModal({ open: false, file: null })
        fetchData()
      } else {
        toast.error(result.error || 'Gagal menghapus file')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = (file) => {
    if (file.downloadUrl) {
      window.open(file.downloadUrl, '_blank')
    } else {
      toast.error('Link download tidak tersedia')
    }
  }

  const handlePreview = (file) => {
    if (file.previewUrl || file.downloadUrl) {
      setPreviewModal({ open: true, file })
    } else {
      toast.error('Preview tidak tersedia')
    }
  }

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return Image
    if (mimeType?.includes('pdf') || mimeType?.includes('word')) return FileText
    return File
  }

  const filteredLampiran = filterKategori
    ? lampiran.filter(f => f.kategori === filterKategori)
    : lampiran

  const groupedByKategori = filteredLampiran.reduce((acc, file) => {
    const kategori = file.kategori || 'lainnya'
    if (!acc[kategori]) acc[kategori] = []
    acc[kategori].push(file)
    return acc
  }, {})

  if (loading) {
    return <LoadingPage message="Memuat data lampiran..." />
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
          <h1 className="text-2xl font-bold text-slate-900">Lampiran Dokumen</h1>
          <p className="mt-1 text-sm text-slate-500">{paket?.namaPaket}</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            className="hidden"
          />
          <Button icon={Upload} onClick={() => fileInputRef.current?.click()}>
            Upload File
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-600">Total: {lampiran.length} file</p>
              {filterKategori && (
                <Badge variant="primary" className="flex items-center gap-1">
                  {categories.find(c => c.value === filterKategori)?.label || filterKategori}
                  <button onClick={() => setFilterKategori('')} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
            <SelectField
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              options={[{ value: '', label: 'Semua Kategori' }, ...categories]}
              className="w-48"
            />
          </div>
        </CardBody>
      </Card>

      {/* Files List */}
      {lampiran.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={FolderOpen}
              title="Belum ada lampiran"
              description="Upload dokumen pendukung untuk paket ini"
              actionText="Upload File"
              onAction={() => fileInputRef.current?.click()}
            />
          </CardBody>
        </Card>
      ) : filteredLampiran.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <p className="text-slate-500">Tidak ada file untuk kategori ini</p>
          </CardBody>
        </Card>
      ) : (
        Object.entries(groupedByKategori).map(([kategori, files]) => (
          <Card key={kategori}>
            <CardHeader>
              <CardTitle className="text-base">
                {categories.find(c => c.value === kategori)?.label || kategori}
                <Badge variant="default" className="ml-2">{files.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-200">
                {files.map((file, index) => {
                  const FileIcon = getFileIcon(file.mimeType)

                  return (
                    <div key={getId(file) || index} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileIcon className="w-6 h-6 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{file.filename || file.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            <span>{ALLOWED_TYPES[file.mimeType] || 'FILE'}</span>
                            {file.size && <span>{formatFileSize(file.size)}</span>}
                            {file.uploadedAt && <span>{formatDate(file.uploadedAt)}</span>}
                          </div>
                          {file.keterangan && (
                            <p className="text-sm text-slate-600 mt-2">{file.keterangan}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <IconButton
                            icon={Eye}
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(file)}
                            title="Preview"
                          />
                          <IconButton
                            icon={Download}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(file)}
                            title="Download"
                          />
                          <IconButton
                            icon={Trash2}
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteModal({ open: true, file })}
                            title="Hapus"
                            className="text-error-600 hover:text-error-700 hover:bg-error-50"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        ))
      )}

      {/* Upload Modal */}
      <Modal
        open={uploadModal}
        onClose={() => {
          setUploadModal(false)
          setSelectedFile(null)
          setUploadData({ kategori: '', keterangan: '' })
        }}
        title="Upload Lampiran"
      >
        <ModalBody className="space-y-4">
          {selectedFile && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <File className="w-8 h-8 text-slate-500" />
                <div>
                  <p className="font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500">
                    {ALLOWED_TYPES[selectedFile.type]} - {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <SelectField
            label="Kategori"
            value={uploadData.kategori}
            onChange={(e) => setUploadData({ ...uploadData, kategori: e.target.value })}
            options={[{ value: '', label: 'Pilih kategori...' }, ...categories]}
            required
          />

          <TextareaField
            label="Keterangan"
            value={uploadData.keterangan}
            onChange={(e) => setUploadData({ ...uploadData, keterangan: e.target.value })}
            placeholder="Keterangan tambahan (opsional)"
            rows={2}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setUploadModal(false)}>
            Batal
          </Button>
          <Button onClick={handleUpload} loading={uploading}>
            Upload
          </Button>
        </ModalFooter>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={previewModal.open}
        onClose={() => setPreviewModal({ open: false, file: null })}
        title={previewModal.file?.filename || 'Preview'}
        size="xl"
      >
        <ModalBody>
          {previewModal.file && (
            <div className="min-h-[400px]">
              {previewModal.file.mimeType?.startsWith('image/') ? (
                <img
                  src={previewModal.file.previewUrl || previewModal.file.downloadUrl}
                  alt={previewModal.file.filename}
                  className="max-w-full h-auto mx-auto"
                />
              ) : previewModal.file.mimeType === 'application/pdf' ? (
                <iframe
                  src={previewModal.file.previewUrl || previewModal.file.downloadUrl}
                  className="w-full h-[500px]"
                  title={previewModal.file.filename}
                />
              ) : (
                <div className="text-center py-12">
                  <File className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Preview tidak tersedia untuk tipe file ini</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    icon={Download}
                    onClick={() => handleDownload(previewModal.file)}
                  >
                    Download File
                  </Button>
                </div>
              )}
            </div>
          )}
        </ModalBody>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, file: null })}
        onConfirm={handleDelete}
        title="Hapus Lampiran"
        message={`Apakah Anda yakin ingin menghapus "${deleteModal.file?.filename}"?`}
        type="danger"
        confirmText="Ya, Hapus"
        loading={deleting}
      />
    </div>
  )
}
