import { useState, useRef, useEffect } from 'react'
import { X, Printer, Download, FileText, Settings, Eye, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '../common/Button'
import { Modal } from '../common/Modal'
import { TextField, TextareaField } from '../common/FormField'
import { Badge } from '../common/Badge'
import { getDocumentStyles, DOCUMENT_GENERATORS, getRequiredDocuments } from '../../utils/documentTemplates'
import { getConfig } from '../../api/config'
import toast from 'react-hot-toast'

// Default PPK settings - can be customized per user/organization
const DEFAULT_SETTINGS = {
  namaPPK: '',
  nipPPK: '',
  satuanKerja: '',
  alamatKantor: '',
  tempatTTD: '',
  namaBendahara: '',
  nipBendahara: '',
  ketuaTim: '',
  nipKetuaTim: '',
  anggota1: '',
  nipAnggota1: '',
  anggota2: '',
  nipAnggota2: '',
}

// Map config keys to settings object
const mapConfigToSettings = (configData) => {
  const settings = { ...DEFAULT_SETTINGS }

  if (Array.isArray(configData)) {
    // Config is array of {key, value} objects
    configData.forEach(item => {
      switch (item.key) {
        case 'ppk_nama': settings.namaPPK = item.value || ''; break
        case 'ppk_nip': settings.nipPPK = item.value || ''; break
        case 'satker_nama': settings.satuanKerja = item.value || ''; break
        case 'satker_alamat': settings.alamatKantor = item.value || ''; break
        case 'satker_kota': settings.tempatTTD = item.value || ''; break
      }
    })
  } else if (configData && typeof configData === 'object') {
    // Config might be a single object with keys
    settings.namaPPK = configData.ppk_nama || configData.namaPPK || ''
    settings.nipPPK = configData.ppk_nip || configData.nipPPK || ''
    settings.satuanKerja = configData.satker_nama || configData.satuanKerja || ''
    settings.alamatKantor = configData.satker_alamat || configData.alamatKantor || ''
    settings.tempatTTD = configData.satker_kota || configData.tempatTTD || ''
  }

  return settings
}

// Load settings from localStorage, with fallback to defaults
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

// Load settings from API config
const loadSettingsFromAPI = async () => {
  try {
    const result = await getConfig()
    if (result.success && result.data) {
      return mapConfigToSettings(result.data)
    }
  } catch (e) {
    console.error('Failed to load config from API:', e)
  }
  return null
}

// Save settings to localStorage
const saveSettings = (settings) => {
  try {
    localStorage.setItem('ppk_document_settings', JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

/**
 * Document Preview Component
 */
export function DocumentPreview({ document, onClose }) {
  const iframeRef = useRef(null)

  useEffect(() => {
    if (iframeRef.current && document) {
      const doc = iframeRef.current.contentDocument
      doc.open()
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${document.title}</title>
            ${getDocumentStyles()}
          </head>
          <body>
            ${document.content}
          </body>
        </html>
      `)
      doc.close()
    }
  }, [document])

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print()
    }
  }

  const handleDownloadHTML = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${document.title}</title>
          ${getDocumentStyles()}
        </head>
        <body>
          ${document.content}
        </body>
      </html>
    `
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${document.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Dokumen berhasil didownload')
  }

  if (!document) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{document.title}</h2>
            <p className="text-sm text-slate-500">{document.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
              Cetak
            </Button>
            <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadHTML}>
              Download
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-hidden p-4 bg-slate-100">
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

/**
 * Settings Modal
 */
export function DocumentSettingsModal({ isOpen, onClose, settings, onSave }) {
  const [form, setForm] = useState(settings)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    onSave(form)
    saveSettings(form)
    toast.success('Pengaturan berhasil disimpan')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan Dokumen" size="lg">
      <div className="space-y-6">
        {/* PPK Info */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Informasi PPK</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Nama PPK"
              value={form.namaPPK}
              onChange={(e) => handleChange('namaPPK', e.target.value)}
              placeholder="Nama lengkap PPK"
            />
            <TextField
              label="NIP PPK"
              value={form.nipPPK}
              onChange={(e) => handleChange('nipPPK', e.target.value)}
              placeholder="NIP PPK"
            />
            <TextField
              label="Satuan Kerja"
              value={form.satuanKerja}
              onChange={(e) => handleChange('satuanKerja', e.target.value)}
              placeholder="Nama satuan kerja"
            />
            <TextField
              label="Tempat Tanda Tangan"
              value={form.tempatTTD}
              onChange={(e) => handleChange('tempatTTD', e.target.value)}
              placeholder="Kota tempat TTD"
            />
          </div>
          <div className="mt-4">
            <TextareaField
              label="Alamat Kantor"
              value={form.alamatKantor}
              onChange={(e) => handleChange('alamatKantor', e.target.value)}
              placeholder="Alamat lengkap kantor"
              rows={2}
            />
          </div>
        </div>

        {/* Bendahara Info */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Informasi Bendahara</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Nama Bendahara"
              value={form.namaBendahara}
              onChange={(e) => handleChange('namaBendahara', e.target.value)}
              placeholder="Nama bendahara"
            />
            <TextField
              label="NIP Bendahara"
              value={form.nipBendahara}
              onChange={(e) => handleChange('nipBendahara', e.target.value)}
              placeholder="NIP bendahara"
            />
          </div>
        </div>

        {/* Tim Pemeriksa Info */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 mb-3">Tim Pemeriksa</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Ketua Tim"
              value={form.ketuaTim}
              onChange={(e) => handleChange('ketuaTim', e.target.value)}
              placeholder="Nama ketua tim"
            />
            <TextField
              label="NIP Ketua Tim"
              value={form.nipKetuaTim}
              onChange={(e) => handleChange('nipKetuaTim', e.target.value)}
              placeholder="NIP ketua tim"
            />
            <TextField
              label="Anggota 1"
              value={form.anggota1}
              onChange={(e) => handleChange('anggota1', e.target.value)}
              placeholder="Nama anggota 1"
            />
            <TextField
              label="NIP Anggota 1"
              value={form.nipAnggota1}
              onChange={(e) => handleChange('nipAnggota1', e.target.value)}
              placeholder="NIP anggota 1"
            />
            <TextField
              label="Anggota 2"
              value={form.anggota2}
              onChange={(e) => handleChange('anggota2', e.target.value)}
              placeholder="Nama anggota 2"
            />
            <TextField
              label="NIP Anggota 2"
              value={form.nipAnggota2}
              onChange={(e) => handleChange('nipAnggota2', e.target.value)}
              placeholder="NIP anggota 2"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </Modal>
  )
}

/**
 * Document Generator Component
 * Main component for generating procurement documents
 */
export default function DocumentGenerator({
  paket,
  items = [],
  surveyData = [],
  kontrak = {},
  penyedia = {},
  pembayaran = {},
  serahTerima = {},
}) {
  const [settings, setSettings] = useState(loadSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [generating, setGenerating] = useState(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // Load settings from API on mount
  useEffect(() => {
    const initSettings = async () => {
      setLoadingSettings(true)
      // First try to load from localStorage
      let localSettings = loadSettings()

      // If localStorage is empty, try to load from API
      if (!localSettings.namaPPK) {
        const apiSettings = await loadSettingsFromAPI()
        if (apiSettings && apiSettings.namaPPK) {
          localSettings = { ...localSettings, ...apiSettings }
          saveSettings(localSettings) // Cache to localStorage
        }
      }

      setSettings(localSettings)
      setLoadingSettings(false)
    }

    initSettings()
  }, [])

  // Get required documents for current stage
  const requiredDocs = getRequiredDocuments(paket?.status)

  // Document definitions
  const documents = [
    {
      id: 'kak',
      name: 'Kerangka Acuan Kerja (KAK)',
      description: 'Dokumen perencanaan yang memuat latar belakang, tujuan, dan spesifikasi teknis',
      category: 'Perencanaan',
      stages: ['PERENCANAAN', 'PERSIAPAN'],
      generate: () => DOCUMENT_GENERATORS.kak(paket, items, settings),
    },
    {
      id: 'hps',
      name: 'Harga Perkiraan Sendiri (HPS)',
      description: 'Dokumen perhitungan perkiraan harga berdasarkan survey pasar',
      category: 'Perencanaan',
      stages: ['PERENCANAAN', 'PERSIAPAN'],
      generate: () => DOCUMENT_GENERATORS.hps(paket, items, surveyData, settings),
    },
    {
      id: 'ba_nego',
      name: 'Berita Acara Negosiasi',
      description: 'Dokumen hasil negosiasi teknis dan harga dengan penyedia',
      category: 'Pemilihan',
      stages: ['PEMILIHAN'],
      generate: () => DOCUMENT_GENERATORS.ba_nego(paket, penyedia, items, settings),
    },
    {
      id: 'sppbj',
      name: 'Surat Penetapan Penyedia',
      description: 'Surat penetapan penyedia barang/jasa terpilih',
      category: 'Pemilihan',
      stages: ['PEMILIHAN', 'KONTRAK'],
      generate: () => DOCUMENT_GENERATORS.sppbj(paket, penyedia, settings),
    },
    {
      id: 'spk',
      name: 'Surat Perintah Kerja (SPK)',
      description: 'Dokumen kontrak perintah kerja kepada penyedia',
      category: 'Kontrak',
      stages: ['KONTRAK', 'PELAKSANAAN'],
      generate: () => DOCUMENT_GENERATORS.spk(paket, kontrak, penyedia, items, settings),
    },
    {
      id: 'spmk',
      name: 'Surat Perintah Mulai Kerja',
      description: 'Surat perintah kepada penyedia untuk memulai pekerjaan',
      category: 'Kontrak',
      stages: ['KONTRAK', 'PELAKSANAAN'],
      generate: () => DOCUMENT_GENERATORS.spmk(paket, kontrak, penyedia, settings),
    },
    {
      id: 'ba_pemeriksaan',
      name: 'Berita Acara Pemeriksaan',
      description: 'Dokumen hasil pemeriksaan pekerjaan oleh tim pemeriksa',
      category: 'Serah Terima',
      stages: ['SERAH_TERIMA'],
      generate: () => DOCUMENT_GENERATORS.ba_pemeriksaan(paket, kontrak, penyedia, serahTerima, items, settings),
    },
    {
      id: 'bast',
      name: 'Berita Acara Serah Terima',
      description: 'Dokumen serah terima hasil pekerjaan',
      category: 'Serah Terima',
      stages: ['SERAH_TERIMA', 'SELESAI'],
      generate: () => DOCUMENT_GENERATORS.bast(paket, kontrak, penyedia, serahTerima, settings),
    },
    {
      id: 'kuitansi',
      name: 'Kuitansi Pembayaran',
      description: 'Bukti pembayaran kepada penyedia',
      category: 'Pembayaran',
      stages: ['PEMBAYARAN', 'SELESAI'],
      generate: () => DOCUMENT_GENERATORS.kuitansi(paket, pembayaran, penyedia, settings),
    },
  ]

  // Group documents by category
  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = []
    }
    acc[doc.category].push(doc)
    return acc
  }, {})

  const handleGenerate = (doc) => {
    setGenerating(doc.id)
    try {
      const generated = doc.generate()
      setPreviewDoc(generated)
    } catch (error) {
      console.error('Error generating document:', error)
      toast.error('Gagal generate dokumen')
    } finally {
      setGenerating(null)
    }
  }

  const isRelevantForStage = (doc) => {
    if (!paket?.status) return true
    return doc.stages.includes(paket.status)
  }

  const isRequired = (docId) => requiredDocs.includes(docId)

  return (
    <div className="space-y-6">
      {/* Settings Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          icon={Settings}
          onClick={() => setShowSettings(true)}
        >
          Pengaturan Dokumen
        </Button>
      </div>

      {/* Document Groups */}
      {Object.entries(groupedDocuments).map(([category, docs]) => (
        <div key={category} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="font-medium text-slate-900">{category}</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {docs.map((doc) => {
              const relevant = isRelevantForStage(doc)
              const required = isRequired(doc.id)

              return (
                <div
                  key={doc.id}
                  className={`p-4 transition-colors ${
                    relevant ? 'hover:bg-slate-50' : 'bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        relevant ? 'bg-primary-100' : 'bg-slate-200'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          relevant ? 'text-primary-600' : 'text-slate-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{doc.name}</p>
                          {required && relevant && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-error-100 text-error-700">
                              Diperlukan
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{doc.description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Tahap: {doc.stages.join(', ')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={relevant ? 'primary' : 'outline'}
                        size="sm"
                        icon={Eye}
                        onClick={() => handleGenerate(doc)}
                        loading={generating === doc.id}
                        disabled={!relevant}
                      >
                        Generate
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Settings Modal */}
      <DocumentSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreview
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  )
}

// Named exports for external use
export { loadSettings, saveSettings, DEFAULT_SETTINGS }
