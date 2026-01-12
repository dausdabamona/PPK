import { useState, useEffect } from 'react'
import { Server, RefreshCw, Check, X, ExternalLink } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { TextField } from '../../components/common/FormField'
import { Badge } from '../../components/common/Badge'
import { getApiUrl, setApiUrl, resetApiUrl } from '../../api/client'
import toast from 'react-hot-toast'

export default function ApiSettingsPage() {
  const [apiUrl, setApiUrlState] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // 'success', 'error', null

  useEffect(() => {
    setApiUrlState(getApiUrl())
  }, [])

  const handleSave = () => {
    if (!apiUrl.trim()) {
      toast.error('URL API tidak boleh kosong')
      return
    }

    try {
      new URL(apiUrl) // Validate URL
      setApiUrl(apiUrl.trim())
      toast.success('URL API berhasil disimpan. Refresh halaman untuk menerapkan.')
      setTestResult(null)
    } catch {
      toast.error('Format URL tidak valid')
    }
  }

  const handleReset = () => {
    resetApiUrl()
    setApiUrlState(getApiUrl())
    setTestResult(null)
    toast.success('URL API direset ke default')
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const testUrl = `${apiUrl}?path=/api/config&data={}`
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      })

      const data = await response.json()
      console.log('API Test Response:', data)

      if (data.success !== undefined) {
        setTestResult('success')
        toast.success('Koneksi API berhasil!')
      } else {
        setTestResult('error')
        toast.error('Response tidak valid')
      }
    } catch (error) {
      console.error('API Test Error:', error)
      setTestResult('error')
      toast.error(`Gagal terhubung: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan API</h1>
        <p className="mt-1 text-sm text-slate-500">
          Konfigurasi endpoint API backend Google Apps Script
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-500" />
            <CardTitle>API Endpoint</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <TextField
              label="URL API Google Apps Script"
              value={apiUrl}
              onChange={(e) => setApiUrlState(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              helpText="URL deployment Google Apps Script Web App"
            />
          </div>

          {/* Status indicator */}
          {testResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult === 'success' ? 'bg-success-50' : 'bg-error-50'
            }`}>
              {testResult === 'success' ? (
                <>
                  <Check className="w-5 h-5 text-success-600" />
                  <span className="text-success-700">Koneksi berhasil</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-error-600" />
                  <span className="text-error-700">Koneksi gagal</span>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleTest} loading={testing} variant="outline" icon={RefreshCw}>
              Test Koneksi
            </Button>
            <Button onClick={handleSave} variant="primary">
              Simpan
            </Button>
            <Button onClick={handleReset} variant="ghost">
              Reset ke Default
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-2">Cara mendapatkan URL API:</h4>
            <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
              <li>Buka Google Apps Script project</li>
              <li>Klik <strong>Deploy</strong> → <strong>Manage deployments</strong></li>
              <li>Copy URL dari deployment yang aktif</li>
              <li>Paste URL di field di atas</li>
            </ol>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-900 mb-2">URL saat ini:</h4>
            <code className="block p-3 bg-slate-100 rounded-lg text-xs break-all">
              {apiUrl}
            </code>
          </div>

          <div>
            <a
              href={apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="w-4 h-4" />
              Buka API di tab baru
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
