import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, FileText, Download, CheckCircle, Clock, AlertCircle, Eye, RefreshCw } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { Badge } from '../../components/common/Badge'
import { formatDate } from '../../utils/formatters'
import { getPaketDetail, getPaketChecklist } from '../../api/paket'
import { post } from '../../api/client'
import toast from 'react-hot-toast'

const DOKUMEN_TEMPLATES = [
  {
    id: 'kak',
    nama: 'Kerangka Acuan Kerja (KAK)',
    kategori: 'Perencanaan',
    deskripsi: 'Dokumen perencanaan yang memuat latar belakang, tujuan, ruang lingkup, dan spesifikasi teknis',
    required: true,
  },
  {
    id: 'hps',
    nama: 'Harga Perkiraan Sendiri (HPS)',
    kategori: 'Perencanaan',
    deskripsi: 'Dokumen perhitungan perkiraan harga berdasarkan survey pasar',
    required: true,
  },
  {
    id: 'spk',
    nama: 'Surat Perintah Kerja (SPK)',
    kategori: 'Kontrak',
    deskripsi: 'Dokumen perintah mulai kerja untuk penyedia',
    required: true,
  },
  {
    id: 'bast',
    nama: 'Berita Acara Serah Terima (BAST)',
    kategori: 'Serah Terima',
    deskripsi: 'Dokumen serah terima hasil pekerjaan',
    required: true,
  },
  {
    id: 'ba_pemeriksaan',
    nama: 'Berita Acara Pemeriksaan',
    kategori: 'Serah Terima',
    deskripsi: 'Dokumen hasil pemeriksaan pekerjaan',
    required: true,
  },
  {
    id: 'kuitansi',
    nama: 'Kuitansi Pembayaran',
    kategori: 'Pembayaran',
    deskripsi: 'Bukti pembayaran kepada penyedia',
    required: true,
  },
  {
    id: 'surat_pesanan',
    nama: 'Surat Pesanan',
    kategori: 'Kontrak',
    deskripsi: 'Surat pesanan barang/jasa kepada penyedia',
    required: false,
  },
  {
    id: 'ba_nego',
    nama: 'Berita Acara Negosiasi',
    kategori: 'Kontrak',
    deskripsi: 'Dokumen hasil negosiasi harga dengan penyedia',
    required: false,
  },
]

const KATEGORI_ORDER = ['Perencanaan', 'Kontrak', 'Serah Terima', 'Pembayaran']

export default function PaketDokumenPage() {
  const { id: paketId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [checklist, setChecklist] = useState({})
  const [generating, setGenerating] = useState({})

  useEffect(() => {
    fetchData()
  }, [paketId])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [paketResult, checklistResult] = await Promise.all([
        getPaketDetail(paketId),
        getPaketChecklist(paketId),
      ])

      if (paketResult.success) {
        setPaket(paketResult.data)
      } else {
        setError(paketResult.error || 'Gagal memuat data paket')
        return
      }

      if (checklistResult.success) {
        setChecklist(checklistResult.data || {})
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDoc = async (docId) => {
    setGenerating(prev => ({ ...prev, [docId]: true }))
    try {
      const result = await post(`/api/paket/${paketId}/generate/${docId}`)

      if (result.success) {
        toast.success('Dokumen berhasil digenerate')
        // If there's a download URL, open it
        if (result.data?.downloadUrl) {
          window.open(result.data.downloadUrl, '_blank')
        }
        fetchData() // Refresh checklist
      } else {
        toast.error(result.error || 'Gagal generate dokumen')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setGenerating(prev => ({ ...prev, [docId]: false }))
    }
  }

  const handleDownloadDoc = (docId) => {
    const doc = checklist[docId]
    if (doc?.downloadUrl) {
      window.open(doc.downloadUrl, '_blank')
    } else {
      toast.error('Link download tidak tersedia')
    }
  }

  const handlePreviewDoc = (docId) => {
    const doc = checklist[docId]
    if (doc?.previewUrl) {
      window.open(doc.previewUrl, '_blank')
    } else if (doc?.downloadUrl) {
      window.open(doc.downloadUrl, '_blank')
    } else {
      toast.error('Preview tidak tersedia')
    }
  }

  const getDocStatus = (docId) => {
    const doc = checklist[docId]
    if (!doc) return 'pending'
    if (doc.generated) return 'generated'
    if (doc.uploaded) return 'uploaded'
    return 'pending'
  }

  const groupedDokumen = KATEGORI_ORDER.map(kategori => ({
    kategori,
    items: DOKUMEN_TEMPLATES.filter(d => d.kategori === kategori),
  }))

  const stats = {
    total: DOKUMEN_TEMPLATES.length,
    required: DOKUMEN_TEMPLATES.filter(d => d.required).length,
    completed: DOKUMEN_TEMPLATES.filter(d => getDocStatus(d.id) !== 'pending').length,
    requiredCompleted: DOKUMEN_TEMPLATES.filter(d => d.required && getDocStatus(d.id) !== 'pending').length,
  }

  if (loading) {
    return <LoadingPage message="Memuat data dokumen..." />
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
          <h1 className="text-2xl font-bold text-slate-900">Generate Dokumen</h1>
          <p className="mt-1 text-sm text-slate-500">{paket?.namaPaket}</p>
        </div>
        <Button variant="outline" icon={RefreshCw} onClick={fetchData}>
          Refresh
        </Button>
      </div>

      {/* Progress */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-slate-900">Progress Dokumen</p>
              <p className="text-sm text-slate-500">
                {stats.requiredCompleted} dari {stats.required} dokumen wajib telah selesai
              </p>
            </div>
            <Badge variant={stats.requiredCompleted === stats.required ? 'success' : 'warning'}>
              {Math.round((stats.requiredCompleted / stats.required) * 100)}%
            </Badge>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all"
              style={{ width: `${(stats.requiredCompleted / stats.required) * 100}%` }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Document Groups */}
      {groupedDokumen.map(({ kategori, items }) => (
        <Card key={kategori}>
          <CardHeader>
            <CardTitle>{kategori}</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-slate-200">
              {items.map((doc) => {
                const status = getDocStatus(doc.id)
                const docData = checklist[doc.id]

                return (
                  <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          status === 'pending' ? 'bg-slate-100' :
                          status === 'generated' ? 'bg-success-100' : 'bg-primary-100'
                        }`}>
                          {status === 'pending' ? (
                            <Clock className="w-5 h-5 text-slate-500" />
                          ) : status === 'generated' ? (
                            <CheckCircle className="w-5 h-5 text-success-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{doc.nama}</p>
                            {doc.required && (
                              <Badge variant="error" size="sm">Wajib</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{doc.deskripsi}</p>
                          {docData?.generatedAt && (
                            <p className="text-xs text-slate-400 mt-2">
                              Digenerate: {formatDate(docData.generatedAt)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {status !== 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Eye}
                              onClick={() => handlePreviewDoc(doc.id)}
                            >
                              Preview
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Download}
                              onClick={() => handleDownloadDoc(doc.id)}
                            >
                              Download
                            </Button>
                          </>
                        )}
                        <Button
                          variant={status === 'pending' ? 'primary' : 'outline'}
                          size="sm"
                          icon={FileText}
                          onClick={() => handleGenerateDoc(doc.id)}
                          loading={generating[doc.id]}
                        >
                          {status === 'pending' ? 'Generate' : 'Regenerate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      ))}

      {/* Info */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-700 mb-2">Catatan:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Dokumen akan digenerate otomatis berdasarkan data paket yang telah diinput</li>
                <li>Pastikan data paket, items, dan survey sudah lengkap sebelum generate dokumen</li>
                <li>Dokumen yang telah digenerate dapat didownload dalam format DOCX</li>
                <li>Anda dapat regenerate dokumen jika ada perubahan data</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
