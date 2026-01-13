import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  FileText,
  Download,
  Eye,
  Package,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileCheck,
  FolderArchive,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, CardTitle } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { LoadingPage, LoadingSpinner } from '../components/common/Loading'
import { ErrorState } from '../components/common/ErrorState'
import { EmptyState } from '../components/common/EmptyState'
import { formatRupiah } from '../utils/formatters'
import { STATUS_LABELS } from '../utils/constants'
import { getPaketList, getDocumentTemplates, generateDocument, getPaketDocuments } from '../api/paket'
import { generateAuditBundle } from '../api/reporting'

// Document type icons and colors
const DOC_CONFIG = {
  HPS: { color: 'bg-blue-100 text-blue-600', name: 'HPS' },
  SPK: { color: 'bg-green-100 text-green-600', name: 'SPK' },
  SPMK: { color: 'bg-purple-100 text-purple-600', name: 'SPMK' },
  BAHP: { color: 'bg-yellow-100 text-yellow-600', name: 'BAHP' },
  BAST: { color: 'bg-orange-100 text-orange-600', name: 'BAST' },
  KUITANSI: { color: 'bg-pink-100 text-pink-600', name: 'Kuitansi' },
  SPM: { color: 'bg-indigo-100 text-indigo-600', name: 'SPM' },
  JUSTIFIKASI: { color: 'bg-teal-100 text-teal-600', name: 'Justifikasi' },
}

export default function DocumentCenter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paketList, setPaketList] = useState([])
  const [templates, setTemplates] = useState([])
  const [selectedPaket, setSelectedPaket] = useState(null)
  const [paketDocuments, setPaketDocuments] = useState([])
  const [generating, setGenerating] = useState({})
  const [generatingBundle, setGeneratingBundle] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const paketId = searchParams.get('paket')
    if (paketId && paketList.length > 0) {
      const paket = paketList.find(p => (p.paketId || p.id) === paketId)
      if (paket) {
        setSelectedPaket(paket)
        fetchPaketDocuments(paketId)
      }
    }
  }, [searchParams, paketList])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [paketResult, templatesResult] = await Promise.all([
        getPaketList(),
        getDocumentTemplates()
      ])

      if (paketResult.success) {
        const list = Array.isArray(paketResult.data) ? paketResult.data : paketResult.data.items || []
        setPaketList(list)
      }

      if (templatesResult.success) {
        setTemplates(templatesResult.data || [])
      }
    } catch (err) {
      setError('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaketDocuments = async (paketId) => {
    try {
      const result = await getPaketDocuments(paketId)
      if (result.success) {
        setPaketDocuments(result.data || [])
      }
    } catch (e) {
      // Ignore
    }
  }

  const handleSelectPaket = (paket) => {
    setSelectedPaket(paket)
    setSearchParams({ paket: paket.paketId || paket.id })
    fetchPaketDocuments(paket.paketId || paket.id)
  }

  const handleGenerateDocument = async (docType) => {
    if (!selectedPaket) return

    const paketId = selectedPaket.paketId || selectedPaket.id
    setGenerating(prev => ({ ...prev, [docType]: true }))

    try {
      const result = await generateDocument(paketId, docType)

      if (result.success) {
        toast.success(`${DOC_CONFIG[docType]?.name || docType} berhasil dibuat!`)
        // Refresh documents list
        fetchPaketDocuments(paketId)
        // Open document in new tab
        if (result.data?.googleDocUrl) {
          window.open(result.data.googleDocUrl, '_blank')
        }
      } else {
        toast.error(result.error || `Gagal membuat ${docType}`)
      }
    } catch (err) {
      toast.error(`Gagal membuat ${docType}`)
    } finally {
      setGenerating(prev => ({ ...prev, [docType]: false }))
    }
  }

  const handleGenerateBundle = async () => {
    if (!selectedPaket) return

    const paketId = selectedPaket.paketId || selectedPaket.id
    setGeneratingBundle(true)

    try {
      const result = await generateAuditBundle(paketId)

      if (result.success) {
        toast.success('Audit bundle berhasil dibuat!')
        if (result.data?.bundleFolderUrl) {
          window.open(result.data.bundleFolderUrl, '_blank')
        }
      } else {
        toast.error(result.error || 'Gagal membuat audit bundle')
      }
    } catch (err) {
      toast.error('Gagal membuat audit bundle')
    } finally {
      setGeneratingBundle(false)
    }
  }

  const isDocGenerated = (docType) => {
    return paketDocuments.some(d => d.jenisDokumen === docType)
  }

  const getDocUrl = (docType) => {
    const doc = paketDocuments.find(d => d.jenisDokumen === docType)
    return doc?.googleDocUrl
  }

  if (loading) {
    return <LoadingPage message="Memuat Document Center..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate dan kelola dokumen pengadaan
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Paket List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Pilih Paket</CardTitle>
          </CardHeader>
          <CardBody className="p-0 max-h-[600px] overflow-y-auto">
            {paketList.length > 0 ? (
              <div className="divide-y divide-slate-200">
                {paketList.map((paket) => {
                  const id = paket.paketId || paket.id
                  const isSelected = selectedPaket && (selectedPaket.paketId || selectedPaket.id) === id

                  return (
                    <button
                      key={id}
                      onClick={() => handleSelectPaket(paket)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {paket.namaPaket}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">
                          {STATUS_LABELS[paket.status] || paket.status}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {formatRupiah(paket.nilaiHPS || paket.nilaiKontrak || 0)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500">
                <Package className="w-12 h-12 mx-auto text-slate-300" />
                <p className="mt-2">Belum ada paket</p>
                <Link to="/paket/create">
                  <Button variant="secondary" size="sm" className="mt-4">
                    Buat Paket
                  </Button>
                </Link>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Document Generator */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedPaket ? `Dokumen: ${selectedPaket.namaPaket}` : 'Generate Dokumen'}
            </CardTitle>
          </CardHeader>
          <CardBody>
            {selectedPaket ? (
              <div className="space-y-6">
                {/* Quick Info */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <span className="ml-2 font-medium">{STATUS_LABELS[selectedPaket.status]}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Nilai:</span>
                      <span className="ml-2 font-medium">{formatRupiah(selectedPaket.nilaiHPS || selectedPaket.nilaiKontrak || 0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Jenis:</span>
                      <span className="ml-2 font-medium">{selectedPaket.jenisPengadaan}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Metode:</span>
                      <span className="ml-2 font-medium">{selectedPaket.metodePengadaan}</span>
                    </div>
                  </div>
                </div>

                {/* Document Templates */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Generate Dokumen</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(DOC_CONFIG).map(([docType, config]) => {
                      const isGenerated = isDocGenerated(docType)
                      const docUrl = getDocUrl(docType)
                      const isLoading = generating[docType]

                      return (
                        <div
                          key={docType}
                          className={`p-3 rounded-lg border ${
                            isGenerated ? 'border-green-200 bg-green-50' : 'border-slate-200'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${config.color}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-medium text-slate-900">{config.name}</p>
                          {isGenerated ? (
                            <div className="flex items-center gap-1 mt-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600">Generated</span>
                              {docUrl && (
                                <a
                                  href={docUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto text-primary-600 hover:text-primary-700"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="w-full mt-2"
                              onClick={() => handleGenerateDocument(docType)}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Generate'
                              )}
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Audit Bundle */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700">Audit Bundle</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Download semua dokumen dalam satu folder (termasuk PDF)
                      </p>
                    </div>
                    <Button
                      icon={generatingBundle ? Loader2 : FolderArchive}
                      onClick={handleGenerateBundle}
                      disabled={generatingBundle}
                    >
                      {generatingBundle ? 'Generating...' : 'Generate Bundle'}
                    </Button>
                  </div>
                </div>

                {/* Existing Documents */}
                {paketDocuments.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="text-sm font-medium text-slate-700 mb-3">Dokumen Tersedia</h3>
                    <div className="space-y-2">
                      {paketDocuments.map((doc, idx) => (
                        <div
                          key={doc.docId || idx}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${
                              DOC_CONFIG[doc.jenisDokumen]?.color || 'bg-slate-100 text-slate-600'
                            }`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {DOC_CONFIG[doc.jenisDokumen]?.name || doc.jenisDokumen}
                              </p>
                              {doc.nomorDokumen && (
                                <p className="text-xs text-slate-500">{doc.nomorDokumen}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.googleDocUrl && (
                              <>
                                <a
                                  href={doc.googleDocUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-slate-600 hover:text-primary-600 hover:bg-slate-100 rounded"
                                  title="View"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <a
                                  href={`${doc.googleDocUrl}/export?format=pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-slate-600 hover:text-primary-600 hover:bg-slate-100 rounded"
                                  title="Download PDF"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="Pilih Paket"
                description="Pilih paket dari daftar di samping untuk generate dokumen"
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
