import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Shield, CheckCircle, XCircle, AlertTriangle, RefreshCw, FileText, ExternalLink } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { Badge } from '../../components/common/Badge'
import { getPaketDetail, getPaketCompliance } from '../../api/paket'
import toast from 'react-hot-toast'

const COMPLIANCE_CHECKS = [
  {
    id: 'data_paket',
    kategori: 'Data Paket',
    items: [
      { id: 'nama_paket', label: 'Nama paket terisi', required: true },
      { id: 'nilai_paket', label: 'Nilai paket terisi', required: true },
      { id: 'jenis_pengadaan', label: 'Jenis pengadaan dipilih', required: true },
      { id: 'metode_pengadaan', label: 'Metode pengadaan sesuai nilai', required: true },
      { id: 'sumber_dana', label: 'Sumber dana terisi', required: true },
      { id: 'tahun_anggaran', label: 'Tahun anggaran terisi', required: true },
    ],
  },
  {
    id: 'items',
    kategori: 'Items & HPS',
    items: [
      { id: 'min_items', label: 'Minimal 1 item barang/jasa', required: true },
      { id: 'items_complete', label: 'Semua item memiliki harga', required: true },
      { id: 'survey_complete', label: 'Semua item memiliki minimal 3 survey', required: true },
      { id: 'hps_calculated', label: 'HPS telah dikalkulasi', required: true },
      { id: 'hps_reasonable', label: 'Nilai HPS sesuai dengan survey', required: false },
    ],
  },
  {
    id: 'penyedia',
    kategori: 'Penyedia',
    items: [
      { id: 'penyedia_assigned', label: 'Penyedia telah dipilih', required: true },
      { id: 'penyedia_npwp', label: 'NPWP penyedia valid', required: true },
      { id: 'penyedia_nib', label: 'NIB/SIUP penyedia valid', required: false },
      { id: 'penyedia_rekening', label: 'Rekening penyedia terisi', required: true },
    ],
  },
  {
    id: 'dokumen',
    kategori: 'Dokumen',
    items: [
      { id: 'doc_kak', label: 'KAK tersedia', required: true },
      { id: 'doc_hps', label: 'Dokumen HPS tersedia', required: true },
      { id: 'doc_spk', label: 'SPK tersedia', required: true },
      { id: 'doc_bast', label: 'BAST tersedia', required: true },
      { id: 'doc_kuitansi', label: 'Kuitansi tersedia', required: true },
    ],
  },
  {
    id: 'perpajakan',
    kategori: 'Perpajakan',
    items: [
      { id: 'ppn_calculated', label: 'PPN 11% dihitung', required: true },
      { id: 'pph_calculated', label: 'PPh sesuai jenis pengadaan', required: true },
      { id: 'billing_created', label: 'Billing pajak dibuat', required: false },
    ],
  },
]

export default function PaketCompliancePage() {
  const { id: paketId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [compliance, setCompliance] = useState({})
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    fetchData()
  }, [paketId])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [paketResult, complianceResult] = await Promise.all([
        getPaketDetail(paketId),
        getPaketCompliance(paketId),
      ])

      if (paketResult.success) {
        setPaket(paketResult.data)
      } else {
        setError(paketResult.error || 'Gagal memuat data paket')
        return
      }

      if (complianceResult.success) {
        setCompliance(complianceResult.data || {})
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleRecheck = async () => {
    setChecking(true)
    try {
      const result = await getPaketCompliance(paketId)
      if (result.success) {
        setCompliance(result.data || {})
        toast.success('Compliance check selesai')
      } else {
        toast.error(result.error || 'Gagal melakukan pengecekan')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setChecking(false)
    }
  }

  const getItemStatus = (itemId) => {
    const status = compliance[itemId]
    if (status === true || status === 'passed') return 'passed'
    if (status === false || status === 'failed') return 'failed'
    if (status === 'warning') return 'warning'
    return 'unchecked'
  }

  const getItemMessage = (itemId) => {
    const message = compliance[`${itemId}_message`]
    return message || null
  }

  // Calculate statistics
  const calculateStats = () => {
    let total = 0
    let required = 0
    let passed = 0
    let failed = 0
    let warnings = 0
    let requiredPassed = 0

    COMPLIANCE_CHECKS.forEach(category => {
      category.items.forEach(item => {
        total++
        if (item.required) required++

        const status = getItemStatus(item.id)
        if (status === 'passed') {
          passed++
          if (item.required) requiredPassed++
        } else if (status === 'failed') {
          failed++
        } else if (status === 'warning') {
          warnings++
        }
      })
    })

    return { total, required, passed, failed, warnings, requiredPassed }
  }

  const stats = calculateStats()
  const overallScore = stats.required > 0 ? Math.round((stats.requiredPassed / stats.required) * 100) : 0

  const getOverallStatus = () => {
    if (overallScore === 100) return 'success'
    if (overallScore >= 70) return 'warning'
    return 'error'
  }

  if (loading) {
    return <LoadingPage message="Memuat data compliance..." />
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
          <h1 className="text-2xl font-bold text-slate-900">Compliance Check</h1>
          <p className="mt-1 text-sm text-slate-500">{paket?.namaPaket}</p>
        </div>
        <Button icon={RefreshCw} onClick={handleRecheck} loading={checking}>
          Cek Ulang
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={`${
        getOverallStatus() === 'success' ? 'bg-success-50 border-success-200' :
        getOverallStatus() === 'warning' ? 'bg-warning-50 border-warning-200' :
        'bg-error-50 border-error-200'
      }`}>
        <CardBody>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                getOverallStatus() === 'success' ? 'bg-success-100' :
                getOverallStatus() === 'warning' ? 'bg-warning-100' :
                'bg-error-100'
              }`}>
                <Shield className={`w-8 h-8 ${
                  getOverallStatus() === 'success' ? 'text-success-600' :
                  getOverallStatus() === 'warning' ? 'text-warning-600' :
                  'text-error-600'
                }`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${
                  getOverallStatus() === 'success' ? 'text-success-700' :
                  getOverallStatus() === 'warning' ? 'text-warning-700' :
                  'text-error-700'
                }`}>
                  {overallScore}% Compliance
                </p>
                <p className={`text-sm ${
                  getOverallStatus() === 'success' ? 'text-success-600' :
                  getOverallStatus() === 'warning' ? 'text-warning-600' :
                  'text-error-600'
                }`}>
                  {stats.requiredPassed} dari {stats.required} persyaratan wajib terpenuhi
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={getOverallStatus()} size="lg">
                {getOverallStatus() === 'success' ? 'Lengkap' :
                 getOverallStatus() === 'warning' ? 'Belum Lengkap' :
                 'Perlu Perhatian'}
              </Badge>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-slate-500">Total Cek</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-slate-500">Terpenuhi</p>
            <p className="text-2xl font-bold text-success-600">{stats.passed}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-slate-500">Belum Terpenuhi</p>
            <p className="text-2xl font-bold text-error-600">{stats.failed}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-sm text-slate-500">Peringatan</p>
            <p className="text-2xl font-bold text-warning-600">{stats.warnings}</p>
          </CardBody>
        </Card>
      </div>

      {/* Compliance Categories */}
      {COMPLIANCE_CHECKS.map((category) => {
        const categoryPassed = category.items.filter(i => getItemStatus(i.id) === 'passed').length
        const categoryTotal = category.items.length

        return (
          <Card key={category.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{category.kategori}</CardTitle>
              <Badge variant={categoryPassed === categoryTotal ? 'success' : 'warning'}>
                {categoryPassed}/{categoryTotal}
              </Badge>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-slate-200">
                {category.items.map((item) => {
                  const status = getItemStatus(item.id)
                  const message = getItemMessage(item.id)

                  return (
                    <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          status === 'passed' ? 'bg-success-100' :
                          status === 'failed' ? 'bg-error-100' :
                          status === 'warning' ? 'bg-warning-100' :
                          'bg-slate-100'
                        }`}>
                          {status === 'passed' ? (
                            <CheckCircle className="w-4 h-4 text-success-600" />
                          ) : status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-error-600" />
                          ) : status === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-warning-600" />
                          ) : (
                            <div className="w-2 h-2 bg-slate-400 rounded-full" />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm ${
                            status === 'passed' ? 'text-slate-700' :
                            status === 'failed' ? 'text-error-700 font-medium' :
                            'text-slate-600'
                          }`}>
                            {item.label}
                          </p>
                          {message && (
                            <p className="text-xs text-slate-500 mt-0.5">{message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.required && (
                          <Badge variant="error" size="sm">Wajib</Badge>
                        )}
                        {status === 'failed' && (
                          <Button variant="ghost" size="sm">
                            Perbaiki
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardBody>
          </Card>
        )
      })}

      {/* Recommendations */}
      {stats.failed > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rekomendasi</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {stats.failed > 0 && (
                <div className="flex items-start gap-3 p-3 bg-error-50 rounded-lg">
                  <XCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-error-800">
                      {stats.failed} item belum terpenuhi
                    </p>
                    <p className="text-sm text-error-700 mt-1">
                      Lengkapi semua persyaratan wajib sebelum melanjutkan ke tahap berikutnya
                    </p>
                  </div>
                </div>
              )}
              {stats.warnings > 0 && (
                <div className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning-800">
                      {stats.warnings} item perlu perhatian
                    </p>
                    <p className="text-sm text-warning-700 mt-1">
                      Item ini tidak wajib tetapi disarankan untuk dilengkapi
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Reference Links */}
      <Card>
        <CardHeader>
          <CardTitle>Referensi Peraturan</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            <a
              href="https://jdih.lkpp.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
            >
              <FileText className="w-4 h-4" />
              Perpres 16/2018 tentang Pengadaan Barang/Jasa
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://jdih.lkpp.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary-600 hover:underline"
            >
              <FileText className="w-4 h-4" />
              Perlem LKPP tentang Swakelola dan Pengadaan Langsung
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
