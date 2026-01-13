import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  FileCheck,
  DollarSign,
  Download,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import toast from 'react-hot-toast'
import { Card, CardBody, CardHeader, CardTitle, StatCard } from '../../components/common/Card'
import { Button } from '../../components/common/Button'
import { SimpleTabs } from '../../components/common/Tabs'
import { LoadingPage, LoadingSpinner } from '../../components/common/Loading'
import { ErrorState } from '../../components/common/ErrorState'
import { formatRupiah } from '../../utils/formatters'
import {
  getPaketSummary,
  getContractVsPayment,
  getComplianceDashboard,
  exportReport,
} from '../../api/reporting'

const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export default function ReportingPage() {
  const [activeTab, setActiveTab] = useState('summary')
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)

  const [summaryData, setSummaryData] = useState(null)
  const [contractData, setContractData] = useState(null)
  const [complianceData, setComplianceData] = useState(null)

  useEffect(() => {
    fetchReportData()
  }, [year])

  const fetchReportData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [summaryResult, contractResult, complianceResult] = await Promise.all([
        getPaketSummary(year),
        getContractVsPayment(year),
        getComplianceDashboard(year),
      ])

      if (summaryResult.success) setSummaryData(summaryResult.data)
      if (contractResult.success) setContractData(contractResult.data)
      if (complianceResult.success) setComplianceData(complianceResult.data)

    } catch (err) {
      setError('Gagal memuat data laporan')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (reportType) => {
    setExporting(true)
    try {
      const result = await exportReport(reportType, { tahun: year })
      if (result.success && result.data?.url) {
        toast.success('Laporan berhasil di-export!')
        window.open(result.data.url, '_blank')
      } else {
        toast.error(result.error || 'Gagal export laporan')
      }
    } catch (err) {
      toast.error('Gagal export laporan')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <LoadingPage message="Memuat laporan..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchReportData} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan & Analisis</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dashboard laporan pengadaan dan compliance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={fetchReportData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <SimpleTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: 'summary', label: 'Ringkasan Paket' },
          { key: 'contract', label: 'Contract vs Payment' },
          { key: 'compliance', label: 'Compliance' },
        ]}
      />

      {/* Tab Content */}
      {activeTab === 'summary' && summaryData && (
        <SummaryTab data={summaryData} onExport={() => handleExport('PAKET_SUMMARY')} exporting={exporting} />
      )}
      {activeTab === 'contract' && contractData && (
        <ContractTab data={contractData} onExport={() => handleExport('CONTRACT_PAYMENT')} exporting={exporting} />
      )}
      {activeTab === 'compliance' && complianceData && (
        <ComplianceTab data={complianceData} onExport={() => handleExport('COMPLIANCE')} exporting={exporting} />
      )}
    </div>
  )
}

// Summary Tab Component
function SummaryTab({ data, onExport, exporting }) {
  const monthlyData = data.perBulan?.map((m, idx) => ({
    ...m,
    bulan: MONTHS[idx],
  })) || []

  const statusData = Object.entries(data.paketByStatus || {}).map(([status, value]) => ({
    name: status,
    value,
  }))

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Paket"
          value={data.totalPaket || 0}
          icon={BarChart3}
        />
        <StatCard
          title="Total Pagu"
          value={formatRupiah(data.totalPagu || 0)}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Kontrak"
          value={formatRupiah(data.totalKontrak || 0)}
          subtitle={`${data.percentageRealized || 0}% realisasi`}
          icon={DollarSign}
        />
        <StatCard
          title="Total Terbayar"
          value={formatRupiah(data.totalTerbayar || 0)}
          subtitle={`${data.percentagePaid || 0}% pembayaran`}
          icon={CheckCircle}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader
            action={
              <Button variant="ghost" size="sm" icon={Download} onClick={onExport} disabled={exporting}>
                Export
              </Button>
            }
          >
            <CardTitle>Trend Bulanan</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [formatRupiah(value), 'Nilai']} />
                  <Bar dataKey="pagu" fill="#3b82f6" name="Pagu" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="kontrak" fill="#22c55e" name="Kontrak" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Pengadaan</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-3xl font-bold text-slate-900">{data.paketDraft || 0}</div>
              <div className="text-sm text-slate-500">Draft</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{data.paketBerjalan || 0}</div>
              <div className="text-sm text-blue-600">Berjalan</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{data.paketSelesai || 0}</div>
              <div className="text-sm text-green-600">Selesai</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{data.paketBatal || 0}</div>
              <div className="text-sm text-red-600">Batal</div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// Contract vs Payment Tab
function ContractTab({ data, onExport, exporting }) {
  const cashFlowData = data.cashFlow?.map((m, idx) => ({
    ...m,
    bulan: MONTHS[idx],
  })) || []

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Kontrak"
          value={formatRupiah(data.totalKontrak || 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Total Terbayar"
          value={formatRupiah(data.totalTerbayar || 0)}
          subtitle={`${data.summary?.percentageRealized || 0}%`}
          icon={CheckCircle}
        />
        <StatCard
          title="Outstanding"
          value={formatRupiah(data.totalOutstanding || 0)}
          icon={AlertTriangle}
        />
        <StatCard
          title="Kontrak Lunas"
          value={data.summary?.lunas || 0}
          subtitle={`dari ${data.summary?.totalKontrak || 0}`}
          icon={FileCheck}
        />
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader
          action={
            <Button variant="ghost" size="sm" icon={Download} onClick={onExport} disabled={exporting}>
              Export
            </Button>
          }
        >
          <CardTitle>Cash Flow Bulanan</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [formatRupiah(value), '']} />
                <Legend />
                <Line type="monotone" dataKey="kontrak" stroke="#3b82f6" name="Kontrak" strokeWidth={2} />
                <Line type="monotone" dataKey="pembayaran" stroke="#22c55e" name="Pembayaran" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardBody>
      </Card>

      {/* Payment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Pembayaran</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-red-700">Belum Bayar</span>
                <span className="text-lg font-bold text-red-600">{data.kontrakBelumBayar?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm font-medium text-yellow-700">Sebagian Bayar</span>
                <span className="text-lg font-bold text-yellow-600">{data.kontrakSebagianBayar?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-green-700">Lunas</span>
                <span className="text-lg font-bold text-green-600">{data.kontrakLunas?.length || 0}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metode Pembayaran</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {Object.entries(data.byPaymentType || {}).map(([type, info]) => (
                <div key={type} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-slate-700">{type}</span>
                    <span className="ml-2 text-xs text-slate-500">({info.count} transaksi)</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatRupiah(info.total || 0)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

// Compliance Tab
function ComplianceTab({ data, onExport, exporting }) {
  const scoreData = [
    { name: 'Excellent', value: data.scoreDistribution?.excellent || 0, color: '#22c55e' },
    { name: 'Good', value: data.scoreDistribution?.good || 0, color: '#3b82f6' },
    { name: 'Fair', value: data.scoreDistribution?.fair || 0, color: '#eab308' },
    { name: 'Poor', value: data.scoreDistribution?.poor || 0, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Avg Score"
          value={`${data.avgScore || 0}%`}
          icon={BarChart3}
        />
        <StatCard
          title="Compliant"
          value={data.compliant || 0}
          icon={CheckCircle}
        />
        <StatCard
          title="Non-Compliant"
          value={data.nonCompliant || 0}
          icon={XCircle}
        />
        <StatCard
          title="Warnings"
          value={data.warnings || 0}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader
            action={
              <Button variant="ghost" size="sm" icon={Download} onClick={onExport} disabled={exporting}>
                Export
              </Button>
            }
          >
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {scoreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Top Violations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Violations</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {(data.topWarnings || []).map((warning, idx) => (
                <div key={warning.code} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500">#{idx + 1}</span>
                    <span className="text-sm font-medium text-slate-700">{warning.code}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{warning.count}</span>
                </div>
              ))}
              {(!data.topWarnings || data.topWarnings.length === 0) && (
                <div className="text-center text-slate-500 py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-300" />
                  <p className="mt-2">Tidak ada violations</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Requires Attention */}
      {data.requiresAttention?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Paket Membutuhkan Perhatian</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Paket</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Score</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Hard Stops</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Warnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.requiresAttention.slice(0, 10).map((paket) => (
                    <tr key={paket.paketId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{paket.namaPaket}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{paket.status}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-bold ${
                          paket.score >= 70 ? 'text-green-600' :
                          paket.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {paket.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {paket.hardStopCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            {paket.hardStopCount}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {paket.warningCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                            {paket.warningCount}
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
