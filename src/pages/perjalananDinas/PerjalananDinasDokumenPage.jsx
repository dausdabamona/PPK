import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, FileText, Settings, Printer, Download, Eye, X } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { Modal, ModalBody, ModalFooter } from '../../components/common/Modal'
import { TextField } from '../../components/common/FormField'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { Badge, StatusBadge } from '../../components/common/Badge'
import { getPerjalananDinasDetail, getPelaksana, getBiaya } from '../../api/perjalananDinas'
import { getConfig } from '../../api/config'
import {
  DOCUMENT_GENERATORS_PD,
  getRequiredDocumentsPD,
  getDocumentStyles
} from '../../utils/documentTemplates'
import { formatRupiah, formatTanggal } from '../../utils/formatters'
import toast from 'react-hot-toast'

const getId = (item) => item?.id || item?._id || item?.pdId || item?.rowId || item?.ID || null

// Document info
const DOCUMENT_INFO = {
  surat_tugas: {
    name: 'Surat Tugas',
    description: 'Surat penugasan untuk melaksanakan perjalanan dinas',
  },
  sppd: {
    name: 'SPPD',
    description: 'Surat Perintah Perjalanan Dinas',
  },
  kuitansi_rampung: {
    name: 'Kuitansi Rampung',
    description: 'Bukti pengeluaran/pertanggungjawaban biaya perjalanan dinas',
  },
}

// Default settings
const DEFAULT_SETTINGS = {
  namaPPK: '',
  nipPPK: '',
  satuanKerja: '',
  namaInstansi: '',
  alamatKantor: '',
  tempatTTD: '',
  namaBendahara: '',
  nipBendahara: '',
}

// Load settings from localStorage
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('ppk_document_settings')
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('Failed to load settings:', e)
  }
  return DEFAULT_SETTINGS
}

// Save settings to localStorage
const saveSettings = (settings) => {
  try {
    localStorage.setItem('ppk_document_settings', JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

// Map config keys to settings object
const mapConfigToSettings = (configData) => {
  const settings = { ...DEFAULT_SETTINGS }

  if (Array.isArray(configData)) {
    configData.forEach(item => {
      switch (item.key) {
        case 'ppk_nama': settings.namaPPK = item.value || ''; break
        case 'ppk_nip': settings.nipPPK = item.value || ''; break
        case 'satker_nama': settings.satuanKerja = item.value || ''; break
        case 'satker_alamat': settings.alamatKantor = item.value || ''; break
        case 'satker_kota': settings.tempatTTD = item.value || ''; break
        case 'instansi_nama': settings.namaInstansi = item.value || ''; break
        case 'bendahara_nama': settings.namaBendahara = item.value || ''; break
        case 'bendahara_nip': settings.nipBendahara = item.value || ''; break
      }
    })
  }

  return settings
}

// Document Preview Component
function DocumentPreview({ document: docData, onClose }) {
  const iframeRef = useRef(null)

  useEffect(() => {
    if (iframeRef.current && docData) {
      const iframeDoc = iframeRef.current.contentDocument
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${docData.title}</title>
          ${getDocumentStyles()}
        </head>
        <body>
          ${docData.content}
        </body>
        </html>
      `)
      iframeDoc.close()
    }
  }, [docData])

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print()
    }
  }

  const handleDownload = () => {
    if (!docData) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${docData.title}</title>
        ${getDocumentStyles()}
      </head>
      <body>
        ${docData.content}
      </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${docData.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!docData) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{docData.title}</h2>
            {docData.subtitle && (
              <p className="text-sm text-slate-500">{docData.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
              Cetak
            </Button>
            <Button variant="outline" size="sm" icon={Download} onClick={handleDownload}>
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden bg-slate-100 p-4">
          <iframe
            ref={iframeRef}
            className="w-full h-full bg-white shadow-lg"
            title="Document Preview"
          />
        </div>
      </div>
    </div>
  )
}

export default function PerjalananDinasDokumenPage() {
  const { id: pdId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pd, setPd] = useState(null)
  const [pelaksana, setPelaksana] = useState([])
  const [biaya, setBiaya] = useState([])
  const [settings, setSettings] = useState(loadSettings())
  const [settingsModal, setSettingsModal] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)

  useEffect(() => {
    fetchData()
    loadSettingsFromAPI()
  }, [pdId])

  const loadSettingsFromAPI = async () => {
    try {
      const result = await getConfig()
      if (result.success && result.data) {
        const apiSettings = mapConfigToSettings(result.data)
        const merged = { ...loadSettings(), ...apiSettings }
        setSettings(merged)
      }
    } catch (e) {
      // Use local settings as fallback
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const pdResult = await getPerjalananDinasDetail(pdId)

      if (pdResult.success) {
        setPd(pdResult.data)

        // Fetch pelaksana and biaya
        const [pelaksanaResult, biayaResult] = await Promise.all([
          getPelaksana(pdId),
          getBiaya(pdId),
        ])

        if (pelaksanaResult.success) {
          const data = Array.isArray(pelaksanaResult.data)
            ? pelaksanaResult.data
            : pelaksanaResult.data?.items || []
          setPelaksana(data)
        }

        if (biayaResult.success) {
          const data = Array.isArray(biayaResult.data)
            ? biayaResult.data
            : biayaResult.data?.items || []
          setBiaya(data)
        }
      } else {
        setError(pdResult.error || 'Gagal memuat data perjalanan dinas')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = () => {
    saveSettings(settings)
    setSettingsModal(false)
    toast.success('Pengaturan berhasil disimpan')
  }

  const handleGenerateDocument = (docType) => {
    const generator = DOCUMENT_GENERATORS_PD[docType]
    if (!generator) {
      toast.error('Generator dokumen tidak ditemukan')
      return
    }

    try {
      const doc = generator(pd, pelaksana, biaya, settings)
      setPreviewDoc(doc)
    } catch (err) {
      console.error('Error generating document:', err)
      toast.error('Gagal generate dokumen')
    }
  }

  // Calculate totals
  const totalBiaya = biaya.reduce((sum, b) => sum + (parseFloat(b.total) || 0), 0)
  const jumlahHari = (() => {
    if (!pd?.tanggalBerangkat || !pd?.tanggalKembali) return 0
    const start = new Date(pd.tanggalBerangkat)
    const end = new Date(pd.tanggalKembali)
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  })()

  // Get required documents for current status
  const requiredDocs = pd ? getRequiredDocumentsPD(pd.status) : []

  if (loading) {
    return <LoadingPage message="Memuat data dokumen..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to={`/perjalanan-dinas/${pdId}`}
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Kembali ke Detail Perjalanan Dinas
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Generate Dokumen</h1>
          <p className="mt-1 text-sm text-slate-500">{pd?.tujuanDinas}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={pd?.status} type="pd" />
          <Button variant="outline" icon={Settings} onClick={() => setSettingsModal(true)}>
            Pengaturan
          </Button>
          <Button variant="outline" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500">Tujuan</p>
              <p className="font-medium text-slate-900">{pd?.kotaTujuan || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Tanggal</p>
              <p className="font-medium text-slate-900">
                {formatTanggal(pd?.tanggalBerangkat)} - {formatTanggal(pd?.tanggalKembali)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Durasi / Pelaksana</p>
              <p className="font-medium text-slate-900">
                {jumlahHari} hari / {pelaksana.length} orang
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Biaya</p>
              <p className="font-medium text-primary-600">{formatRupiah(totalBiaya)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Dokumen Perjalanan Dinas
          </CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(DOCUMENT_INFO).map(([key, info]) => {
              const isRequired = requiredDocs.includes(key)

              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border-2 ${
                    isRequired
                      ? 'border-primary-200 bg-primary-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className={`w-5 h-5 ${isRequired ? 'text-primary-600' : 'text-slate-400'}`} />
                      <h3 className="font-medium text-slate-900">{info.name}</h3>
                    </div>
                    {isRequired && (
                      <Badge variant="primary" size="sm">Diperlukan</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-4">{info.description}</p>
                  <Button
                    variant={isRequired ? 'primary' : 'outline'}
                    size="sm"
                    icon={Eye}
                    onClick={() => handleGenerateDocument(key)}
                    className="w-full"
                  >
                    Generate & Preview
                  </Button>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>

      {/* Info */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-3 text-sm text-slate-600">
            <FileText className="w-5 h-5 text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700 mb-2">Petunjuk Penggunaan:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Klik <strong>Pengaturan</strong> untuk mengisi data PPK dan Bendahara</li>
                <li>Dokumen yang ditandai <strong>Diperlukan</strong> sesuai dengan tahap workflow saat ini</li>
                <li>Klik <strong>Generate & Preview</strong> untuk melihat dan mencetak dokumen</li>
                <li>Pastikan data pelaksana dan biaya sudah lengkap sebelum generate Kuitansi Rampung</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Settings Modal */}
      <Modal
        open={settingsModal}
        onClose={() => setSettingsModal(false)}
        title="Pengaturan Dokumen"
        size="lg"
      >
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Nama PPK"
              value={settings.namaPPK}
              onChange={(e) => setSettings({ ...settings, namaPPK: e.target.value })}
              placeholder="Nama Pejabat Pembuat Komitmen"
            />
            <TextField
              label="NIP PPK"
              value={settings.nipPPK}
              onChange={(e) => setSettings({ ...settings, nipPPK: e.target.value })}
              placeholder="NIP PPK"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Nama Bendahara"
              value={settings.namaBendahara}
              onChange={(e) => setSettings({ ...settings, namaBendahara: e.target.value })}
              placeholder="Nama Bendahara Pengeluaran"
            />
            <TextField
              label="NIP Bendahara"
              value={settings.nipBendahara}
              onChange={(e) => setSettings({ ...settings, nipBendahara: e.target.value })}
              placeholder="NIP Bendahara"
            />
          </div>
          <TextField
            label="Nama Instansi"
            value={settings.namaInstansi}
            onChange={(e) => setSettings({ ...settings, namaInstansi: e.target.value })}
            placeholder="Nama Kementerian/Lembaga"
          />
          <TextField
            label="Satuan Kerja"
            value={settings.satuanKerja}
            onChange={(e) => setSettings({ ...settings, satuanKerja: e.target.value })}
            placeholder="Nama Satuan Kerja"
          />
          <TextField
            label="Alamat Kantor"
            value={settings.alamatKantor}
            onChange={(e) => setSettings({ ...settings, alamatKantor: e.target.value })}
            placeholder="Alamat lengkap kantor"
          />
          <TextField
            label="Tempat TTD"
            value={settings.tempatTTD}
            onChange={(e) => setSettings({ ...settings, tempatTTD: e.target.value })}
            placeholder="Kota tempat tanda tangan"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setSettingsModal(false)}>
            Batal
          </Button>
          <Button onClick={handleSaveSettings}>
            Simpan Pengaturan
          </Button>
        </ModalFooter>
      </Modal>

      {/* Document Preview */}
      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  )
}
