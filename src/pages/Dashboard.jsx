import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  Users,
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight,
  AlertCircle,
  XCircle,
  BarChart3,
  FileCheck,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardBody, CardHeader, CardTitle, StatCard } from '../components/common/Card'
import { Button } from '../components/common/Button'
import { StatusBadge } from '../components/common/Badge'
import { LoadingPage } from '../components/common/Loading'
import { ErrorState } from '../components/common/ErrorState'
import { formatRupiah } from '../utils/formatters'
import { STATUS, STATUS_LABELS, WORKFLOW_STAGES } from '../utils/constants'
import { getPaketList, getAuditCompliance } from '../api/paket'
import { getComplianceDashboard } from '../api/reporting'

// Chart colors
const COLORS = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899']

// Status colors for pie chart
const STATUS_PIE_COLORS = {
  [STATUS.DRAFT]: '#94a3b8',
  [STATUS.PERENCANAAN]: '#3b82f6',
  [STATUS.PERSIAPAN]: '#60a5fa',
  [STATUS.PEMILIHAN]: '#eab308',
  [STATUS.KONTRAK]: '#f59e0b',
  [STATUS.PELAKSANAAN]: '#22c55e',
  [STATUS.SERAH_TERIMA]: '#16a34a',
  [STATUS.PEMBAYARAN]: '#059669',
  [STATUS.SELESAI]: '#10b981',
  [STATUS.BATAL]: '#ef4444',
}

// Compliance indicator component
function ComplianceIndicator({ score, size = 'md' }) {
  let color = 'text-red-500 bg-red-50'
  let Icon = XCircle

  if (score >= 90) {
    color = 'text-green-500 bg-green-50'
    Icon = CheckCircle
  } else if (score >= 70) {
    color = 'text-yellow-500 bg-yellow-50'
    Icon = AlertCircle
  } else if (score >= 50) {
    color = 'text-orange-500 bg-orange-50'
    Icon = AlertTriangle
  }

  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${color}`}>
      <Icon className={sizeClasses} />
      <span className="text-xs font-medium">{score}%</span>
    </div>
  )
}

// Workflow progress component
function WorkflowProgress({ status }) {
  const currentIndex = WORKFLOW_STAGES.indexOf(status)
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / WORKFLOW_STAGES.length) * 100 : 0

  return (
    <div className="w-full bg-slate-200 rounded-full h-1.5">
      <div
        className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalPaket: 0,
    totalNilai: 0,
    paketAktif: 0,
    paketSelesai: 0,
  })
  const [paketList, setPaketList] = useState([])
  const [paketPerStatus, setPaketPerStatus] = useState([])
  const [nilaiPerBulan, setNilaiPerBulan] = useState([])
  const [complianceStats, setComplianceStats] = useState(null)
  const [paketCompliance, setPaketCompliance] = useState({})

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch paket list
      const paketResult = await getPaketList()

      if (paketResult.success && paketResult.data) {
        const list = Array.isArray(paketResult.data) ? paketResult.data : paketResult.data.items || []

        // Calculate stats
        const totalNilai = list.reduce((sum, p) => sum + (p.nilaiHPS || p.nilaiKontrak || 0), 0)
        const paketAktif = list.filter(p =>
          ![STATUS.SELESAI, STATUS.BATAL, STATUS.DRAFT].includes(p.status)
        ).length
        const paketSelesai = list.filter(p => p.status === STATUS.SELESAI).length

        setStats({
          totalPaket: list.length,
          totalNilai,
          paketAktif,
          paketSelesai,
        })

        // Sort by createdAt and get active paket
        const sorted = [...list].sort((a, b) => {
          const dateA = a.createdAt || a.tanggalBuat
          const dateB = b.createdAt || b.tanggalBuat
          if (!dateA && !dateB) return 0
          if (!dateA) return 1
          if (!dateB) return -1
          return new Date(dateB).getTime() - new Date(dateA).getTime()
        })

        // Filter to show active paket first, then recent
        const activePaket = sorted.filter(p =>
          ![STATUS.SELESAI, STATUS.BATAL].includes(p.status)
        ).slice(0, 10)

        setPaketList(activePaket)

        // Paket per status
        const statusCount = {}
        list.forEach(p => {
          statusCount[p.status] = (statusCount[p.status] || 0) + 1
        })
        const statusData = Object.entries(statusCount)
          .filter(([status]) => status !== STATUS.BATAL)
          .map(([status, value]) => ({
            name: STATUS_LABELS[status] || status,
            value,
            status,
          }))
        setPaketPerStatus(statusData)

        // Nilai per bulan
        const monthlyData = generateMonthlyData(list)
        setNilaiPerBulan(monthlyData)

        // Fetch compliance for each active paket (limited)
        fetchPaketCompliance(activePaket.slice(0, 5))
      } else {
        setDemoData()
      }

      // Fetch compliance dashboard
      try {
        const complianceResult = await getComplianceDashboard(new Date().getFullYear())
        if (complianceResult.success) {
          setComplianceStats(complianceResult.data)
        }
      } catch (e) {
        // Compliance is optional
      }

    } catch (err) {
      console.error('Dashboard error:', err)
      setDemoData()
    } finally {
      setLoading(false)
    }
  }

  const fetchPaketCompliance = async (paketArr) => {
    const complianceMap = {}
    for (const paket of paketArr) {
      try {
        const result = await getAuditCompliance(paket.paketId || paket.id)
        if (result.success) {
          complianceMap[paket.paketId || paket.id] = result.data
        }
      } catch (e) {
        // Ignore individual compliance fetch errors
      }
    }
    setPaketCompliance(complianceMap)
  }

  const setDemoData = () => {
    setStats({
      totalPaket: 24,
      totalNilai: 1250000000,
      paketAktif: 8,
      paketSelesai: 12,
    })
    setPaketList([])
    setPaketPerStatus([
      { name: 'Draft', value: 4, status: STATUS.DRAFT },
      { name: 'Perencanaan', value: 3, status: STATUS.PERENCANAAN },
      { name: 'Persiapan', value: 2, status: STATUS.PERSIAPAN },
      { name: 'Pemilihan', value: 2, status: STATUS.PEMILIHAN },
      { name: 'Kontrak', value: 1, status: STATUS.KONTRAK },
      { name: 'Selesai', value: 12, status: STATUS.SELESAI },
    ])
    setNilaiPerBulan([
      { bulan: 'Jan', nilai: 150000000 },
      { bulan: 'Feb', nilai: 200000000 },
      { bulan: 'Mar', nilai: 180000000 },
      { bulan: 'Apr', nilai: 250000000 },
      { bulan: 'Mei', nilai: 220000000 },
      { bulan: 'Jun', nilai: 250000000 },
    ])
  }

  const generateMonthlyData = (list) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const currentMonth = new Date().getMonth()

    const data = []
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12
      const monthPaket = list.filter(p => {
        const date = new Date(p.createdAt || p.tanggalBuat)
        return date.getMonth() === monthIndex
      })
      const totalNilai = monthPaket.reduce((sum, p) => sum + (p.nilaiHPS || p.nilaiKontrak || 0), 0)
      data.push({
        bulan: months[monthIndex],
        nilai: totalNilai,
      })
    }
    return data
  }

  if (loading) {
    return <LoadingPage message="Memuat dashboard..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PPK Command Center</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pusat kendali pengadaan dan perjalanan dinas
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/reporting">
            <Button variant="secondary" icon={BarChart3}>Laporan</Button>
          </Link>
          <Link to="/paket/create">
            <Button icon={Plus}>Buat Paket</Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Paket"
          value={stats.totalPaket}
          icon={Package}
        />
        <StatCard
          title="Total Nilai"
          value={formatRupiah(stats.totalNilai)}
          subtitle="Seluruh paket"
          icon={TrendingUp}
        />
        <StatCard
          title="Paket Aktif"
          value={stats.paketAktif}
          subtitle="Sedang berjalan"
          icon={Clock}
        />
        <StatCard
          title="Paket Selesai"
          value={stats.paketSelesai}
          icon={CheckCircle}
        />
      </div>

      {/* Compliance Overview */}
      {complianceStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary-600" />
              Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{complianceStats.avgScore || 0}%</div>
                <div className="text-xs text-slate-500">Avg Score</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{complianceStats.compliant || 0}</div>
                <div className="text-xs text-green-600">Compliant</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{complianceStats.nonCompliant || 0}</div>
                <div className="text-xs text-red-600">Non-Compliant</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{complianceStats.warnings || 0}</div>
                <div className="text-xs text-yellow-600">Warnings</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {complianceStats.requiresAttention?.length || 0}
                </div>
                <div className="text-xs text-blue-600">Perlu Perhatian</div>
              </div>
            </div>

            {/* Score Distribution */}
            {complianceStats.scoreDistribution && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-slate-700 mb-2">Distribusi Score</div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-green-500 rounded-full" />
                      <span className="text-xs text-slate-500">Excellent ({complianceStats.scoreDistribution.excellent})</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-blue-500 rounded-full" />
                      <span className="text-xs text-slate-500">Good ({complianceStats.scoreDistribution.good})</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-yellow-500 rounded-full" />
                      <span className="text-xs text-slate-500">Fair ({complianceStats.scoreDistribution.fair})</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 bg-red-500 rounded-full" />
                      <span className="text-xs text-slate-500">Poor ({complianceStats.scoreDistribution.poor})</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Active Paket with Timeline */}
      <Card>
        <CardHeader
          action={
            <Link to="/paket">
              <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                Lihat Semua
              </Button>
            </Link>
          }
        >
          <CardTitle>Paket Aktif</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {paketList.length > 0 ? (
            <div className="divide-y divide-slate-200">
              {paketList.map((paket) => {
                const id = paket.paketId || paket.id
                const compliance = paketCompliance[id]

                return (
                  <Link
                    key={id}
                    to={`/paket/${id}`}
                    className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {paket.namaPaket}
                          </p>
                          {compliance && (
                            <ComplianceIndicator score={compliance.complianceScore || 0} size="sm" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500">
                            {paket.jenisPengadaan}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">
                            {formatRupiah(paket.nilaiHPS || paket.nilaiKontrak || 0)}
                          </span>
                        </div>
                        {/* Workflow Progress */}
                        <div className="mt-2">
                          <WorkflowProgress status={paket.status} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={paket.status} />
                        {compliance?.violations?.length > 0 && (
                          <span className="text-xs text-red-500">
                            {compliance.violations.filter(v => v.severity === 'HARD_STOP').length} issues
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto text-slate-300" />
              <p className="mt-2">Belum ada paket aktif</p>
              <Link to="/paket/create">
                <Button variant="secondary" size="sm" className="mt-4">
                  Buat Paket Pertama
                </Button>
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart - Nilai per bulan */}
        <Card>
          <CardHeader>
            <CardTitle>Nilai Pengadaan per Bulan</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nilaiPerBulan}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#64748b"
                    tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
                  />
                  <Tooltip
                    formatter={(value) => [formatRupiah(value), 'Nilai']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="nilai" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Pie chart - Paket per status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status Paket</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paketPerStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {paketPerStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_PIE_COLORS[entry.status] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value + ' paket', name]}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {paketPerStatus.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: STATUS_PIE_COLORS[entry.status] || COLORS[index % COLORS.length],
                    }}
                  />
                  <span className="text-xs text-slate-600">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/paket/create">
          <Card className="hover:border-primary-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Buat Paket</p>
                <p className="text-sm text-slate-500">Mulai pengadaan baru</p>
              </div>
            </CardBody>
          </Card>
        </Link>

        <Link to="/document-center">
          <Card className="hover:border-primary-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Document Center</p>
                <p className="text-sm text-slate-500">Generate dokumen</p>
              </div>
            </CardBody>
          </Card>
        </Link>

        <Link to="/reporting">
          <Card className="hover:border-primary-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Laporan</p>
                <p className="text-sm text-slate-500">Analisis & report</p>
              </div>
            </CardBody>
          </Card>
        </Link>

        <Link to="/perjalanan-dinas">
          <Card className="hover:border-primary-300 hover:shadow-md transition-all cursor-pointer h-full">
            <CardBody className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Perjalanan Dinas</p>
                <p className="text-sm text-slate-500">Kelola SPPD</p>
              </div>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  )
}
