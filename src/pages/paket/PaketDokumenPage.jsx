import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, AlertCircle, FileText, Settings } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { Badge } from '../../components/common/Badge'
import { getPaketDetail, getPaketItems, getItemSurveys } from '../../api/paket'
import { getPenyediaList } from '../../api/penyedia'
import DocumentGenerator from '../../components/paket/DocumentGenerator'
import { STATUS_LABELS } from '../../utils/constants'

export default function PaketDokumenPage() {
  const { id: paketId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [items, setItems] = useState([])
  const [surveyData, setSurveyData] = useState([])
  const [penyedia, setPenyedia] = useState({})

  useEffect(() => {
    fetchData()
  }, [paketId])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch paket detail
      const paketResult = await getPaketDetail(paketId)

      if (paketResult.success) {
        setPaket(paketResult.data)

        // If paket has penyediaId, fetch penyedia details
        if (paketResult.data.penyediaId) {
          const penyediaResult = await getPenyediaList()
          if (penyediaResult.success) {
            const found = penyediaResult.data?.find(p => p.id === paketResult.data.penyediaId)
            if (found) {
              setPenyedia(found)
            }
          }
        }
      } else {
        setError(paketResult.error || 'Gagal memuat data paket')
        return
      }

      // Fetch items
      const itemsResult = await getPaketItems(paketId)
      if (itemsResult.success) {
        setItems(itemsResult.data || [])

        // Fetch surveys for each item
        const allSurveys = []
        for (const item of (itemsResult.data || [])) {
          const surveysResult = await getItemSurveys(item.id)
          if (surveysResult.success && surveysResult.data) {
            allSurveys.push(...surveysResult.data.map(s => ({ ...s, itemId: item.id })))
          }
        }
        setSurveyData(allSurveys)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  // Build kontrak object from paket data
  const kontrak = {
    nomorKontrak: paket?.nomorKontrak || '',
    tanggalKontrak: paket?.tanggalKontrak,
    nilaiKontrak: paket?.nilaiKontrak || paket?.nilaiHPS || 0,
    jangkaWaktu: paket?.jangkaWaktu || 30,
    tanggalMulai: paket?.tanggalMulai,
    tanggalSelesai: paket?.tanggalSelesai,
    nomorSPMK: paket?.nomorSPMK || '',
  }

  // Build pembayaran object from paket data
  const pembayaran = {
    nomor: paket?.nomorKuitansi || '',
    nilaiGross: paket?.nilaiKontrak || paket?.nilaiHPS || 0,
    nilai: paket?.nilaiKontrak || paket?.nilaiHPS || 0,
    keterangan: `Pembayaran ${paket?.jenisPengadaan?.toLowerCase() || ''} ${paket?.namaPaket || ''}`,
  }

  // Build serahTerima object from paket data
  const serahTerima = {
    nomor: paket?.nomorBAST || '',
    jenis: 'PHO', // Default to Provisional Handover
    kondisi: 'baik dan sesuai dengan spesifikasi yang dipersyaratkan',
    catatan: '',
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
        <div className="flex items-center gap-2">
          <Badge variant={paket?.status === 'SELESAI' ? 'success' : 'primary'}>
            {STATUS_LABELS[paket?.status] || paket?.status}
          </Badge>
          <Button variant="outline" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Paket Info Card */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-500">Jenis Pengadaan</p>
              <p className="font-medium text-slate-900">{paket?.jenisPengadaan || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Metode</p>
              <p className="font-medium text-slate-900">{paket?.metodePengadaan || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Pagu</p>
              <p className="font-medium text-slate-900">
                {paket?.pagu ? `Rp ${paket.pagu.toLocaleString('id-ID')}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Item</p>
              <p className="font-medium text-slate-900">{items.length} item</p>
            </div>
          </div>

          {penyedia?.nama && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Penyedia</p>
                  <p className="font-medium text-slate-900">{penyedia.nama}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Direktur</p>
                  <p className="font-medium text-slate-900">{penyedia.direktur || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">NPWP</p>
                  <p className="font-medium text-slate-900">{penyedia.npwp || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Telepon</p>
                  <p className="font-medium text-slate-900">{penyedia.telepon || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Document Generator */}
      <DocumentGenerator
        paket={paket}
        items={items}
        surveyData={surveyData}
        kontrak={kontrak}
        penyedia={penyedia}
        pembayaran={pembayaran}
        serahTerima={serahTerima}
      />

      {/* Info Card */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-700 mb-2">Petunjuk Penggunaan:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Dokumen digenerate berdasarkan data paket yang telah diinput</li>
                <li>Klik tombol <strong>Pengaturan Dokumen</strong> untuk mengisi data PPK, Bendahara, dan Tim Pemeriksa</li>
                <li>Dokumen yang ditandai <strong>Diperlukan</strong> adalah dokumen yang harus ada di tahap saat ini</li>
                <li>Hasil generate dapat dicetak langsung atau didownload sebagai file HTML</li>
                <li>Untuk hasil terbaik, gunakan browser Chrome atau Firefox saat mencetak</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
