import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calculator, RefreshCw, Download, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { SimpleTable } from '../../components/common/DataTable'
import { LoadingPage } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { Badge } from '../../components/common/Badge'
import { formatRupiah } from '../../utils/formatters'
import { getPaketDetail, getPaketItems, getItemSurveys, getPaketHPS, calculateHPS } from '../../api/paket'
import toast from 'react-hot-toast'

const getId = (item) => item?.id || item?._id || item?.itemId || item?.rowId || item?.ID || null

export default function PaketHPSPage() {
  const { id: paketId } = useParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paket, setPaket] = useState(null)
  const [items, setItems] = useState([])
  const [surveys, setSurveys] = useState({})
  const [hpsData, setHpsData] = useState(null)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [paketId])

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [paketResult, itemsResult, hpsResult] = await Promise.all([
        getPaketDetail(paketId),
        getPaketItems(paketId),
        getPaketHPS(paketId),
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

        // Fetch surveys for all items
        const surveyPromises = data.map(item =>
          getItemSurveys(getId(item)).then(result => ({
            itemId: getId(item),
            surveys: result.success ? (Array.isArray(result.data) ? result.data : result.data?.surveys || []) : []
          }))
        )

        const surveyResults = await Promise.all(surveyPromises)
        const surveyMap = {}
        surveyResults.forEach(({ itemId, surveys }) => {
          surveyMap[itemId] = surveys
        })
        setSurveys(surveyMap)
      }

      if (hpsResult.success) {
        setHpsData(hpsResult.data)
      }
    } catch (err) {
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleCalculateHPS = async () => {
    setCalculating(true)
    try {
      const result = await calculateHPS(paketId)
      if (result.success) {
        toast.success('HPS berhasil dikalkulasi')
        setHpsData(result.data)
      } else {
        toast.error(result.error || 'Gagal mengkalkulasi HPS')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan')
    } finally {
      setCalculating(false)
    }
  }

  // Calculate HPS locally based on surveys
  const localHPSCalculation = useMemo(() => {
    const itemCalculations = items.map(item => {
      const itemId = getId(item)
      const itemSurveys = surveys[itemId] || []

      // Calculate average price from surveys
      let hargaSatuan = item.hargaSatuan || 0
      let priceSource = 'manual'

      if (itemSurveys.length >= 3) {
        const prices = itemSurveys.map(s => s.harga || 0).sort((a, b) => a - b)
        // Use average of middle values (exclude outliers)
        const trimmedPrices = prices.length >= 5
          ? prices.slice(1, -1)
          : prices
        hargaSatuan = trimmedPrices.reduce((a, b) => a + b, 0) / trimmedPrices.length
        priceSource = 'survey'
      } else if (itemSurveys.length > 0) {
        // Use lowest survey price if less than 3 surveys
        hargaSatuan = Math.min(...itemSurveys.map(s => s.harga || 0))
        priceSource = 'survey_partial'
      }

      const subtotal = item.volume * hargaSatuan
      const ongkir = item.volume * (item.ongkirSatuan || 0)
      const overhead = subtotal * ((item.overheadPersen || 0) / 100)
      const biayaLain = item.biayaLain || 0
      const total = subtotal + ongkir + overhead + biayaLain

      return {
        ...item,
        itemId,
        surveyCount: itemSurveys.length,
        hargaSatuanHPS: hargaSatuan,
        priceSource,
        subtotal,
        ongkir,
        overhead,
        biayaLain,
        total,
      }
    })

    const totalHPS = itemCalculations.reduce((sum, item) => sum + item.total, 0)
    const ppn = totalHPS * 0.11
    const grandTotal = totalHPS + ppn

    return {
      items: itemCalculations,
      totalHPS,
      ppn,
      grandTotal,
    }
  }, [items, surveys])

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
      accessorKey: 'surveyCount',
      header: 'Survey',
      cell: ({ row }) => {
        const count = row.original.surveyCount
        return (
          <Badge variant={count >= 3 ? 'success' : count > 0 ? 'warning' : 'default'}>
            {count} survey
          </Badge>
        )
      }
    },
    {
      accessorKey: 'hargaSatuanHPS',
      header: 'Harga Satuan HPS',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{formatRupiah(row.original.hargaSatuanHPS)}</p>
          <p className="text-xs text-slate-500">
            {row.original.priceSource === 'survey' ? 'dari survey' :
             row.original.priceSource === 'survey_partial' ? 'survey terbatas' : 'manual'}
          </p>
        </div>
      )
    },
    {
      id: 'total',
      header: 'Total HPS',
      cell: ({ row }) => (
        <span className="font-medium">{formatRupiah(row.original.total)}</span>
      )
    },
  ]

  if (loading) {
    return <LoadingPage message="Memuat data HPS..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchData} />
  }

  const allItemsSurveyed = localHPSCalculation.items.every(item => item.surveyCount >= 3)
  const someItemsSurveyed = localHPSCalculation.items.some(item => item.surveyCount > 0)

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
          <h1 className="text-2xl font-bold text-slate-900">Kalkulator HPS</h1>
          <p className="mt-1 text-sm text-slate-500">{paket?.namaPaket}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/paket/${paketId}/survey`}>
            <Button variant="outline">Input Survey</Button>
          </Link>
          <Button icon={RefreshCw} onClick={handleCalculateHPS} loading={calculating}>
            Kalkulasi HPS
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {items.length > 0 && (
        <Card className={allItemsSurveyed ? 'bg-success-50 border-success-200' : 'bg-warning-50 border-warning-200'}>
          <CardBody>
            <div className="flex items-start gap-3">
              {allItemsSurveyed ? (
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-warning-600 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${allItemsSurveyed ? 'text-success-800' : 'text-warning-800'}`}>
                  {allItemsSurveyed
                    ? 'Semua item sudah memiliki minimal 3 survey'
                    : 'Beberapa item belum memiliki 3 survey'}
                </p>
                <p className={`text-sm mt-1 ${allItemsSurveyed ? 'text-success-700' : 'text-warning-700'}`}>
                  {allItemsSurveyed
                    ? 'HPS dapat dikalkulasi dengan data survey lengkap'
                    : 'Lengkapi survey untuk hasil HPS yang lebih akurat'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Total Items</p>
            <p className="text-2xl font-bold text-slate-900">{items.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Items dengan Survey Lengkap</p>
            <p className="text-2xl font-bold text-slate-900">
              {localHPSCalculation.items.filter(i => i.surveyCount >= 3).length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">Subtotal HPS</p>
            <p className="text-2xl font-bold text-slate-900">{formatRupiah(localHPSCalculation.totalHPS)}</p>
          </CardBody>
        </Card>
        <Card className="bg-primary-50 border-primary-200">
          <CardBody>
            <p className="text-sm text-primary-600">Total HPS + PPN (11%)</p>
            <p className="text-2xl font-bold text-primary-700">{formatRupiah(localHPSCalculation.grandTotal)}</p>
          </CardBody>
        </Card>
      </div>

      {/* HPS Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Rincian HPS per Item</CardTitle>
          <Button variant="outline" size="sm" icon={Download}>
            Export Excel
          </Button>
        </CardHeader>
        <CardBody>
          {items.length > 0 ? (
            <>
              <SimpleTable columns={columns} data={localHPSCalculation.items} />

              {/* Summary Footer */}
              <div className="mt-6 border-t border-slate-200 pt-6">
                <div className="max-w-md ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium">{formatRupiah(localHPSCalculation.totalHPS)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">PPN (11%)</span>
                    <span className="font-medium">{formatRupiah(localHPSCalculation.ppn)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                    <span>Total HPS</span>
                    <span className="text-primary-600">{formatRupiah(localHPSCalculation.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Calculator}
              title="Belum ada item"
              description="Tambahkan item terlebih dahulu untuk kalkulasi HPS"
              actionText="Tambah Item"
              actionHref={`/paket/${paketId}/items`}
            />
          )}
        </CardBody>
      </Card>

      {/* Info */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-400 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-700 mb-2">Metode Perhitungan HPS:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Harga satuan HPS diambil dari rata-rata hasil survey harga (minimal 3 survey)</li>
                <li>Jika survey kurang dari 3, akan menggunakan harga terendah dari survey yang ada</li>
                <li>Jika tidak ada survey, akan menggunakan harga manual yang diinput</li>
                <li>Total HPS = (Volume × Harga Satuan) + Ongkir + Overhead + Biaya Lain</li>
                <li>PPN dihitung 11% dari total HPS</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
