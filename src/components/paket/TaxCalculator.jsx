import { useState, useMemo } from 'react'
import { Calculator, Info, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Card, CardBody, CardHeader, CardTitle } from '../common/Card'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'
import { formatRupiah } from '../../utils/formatters'
import { calculateProcurementTaxes, getRecommendedMethod, validateProcurementMethod } from '../../utils/taxCalculations'
import { PPN_RATE, PPH_RATES } from '../../utils/constants'

/**
 * Tax Calculator Component for Paket
 */
export function TaxCalculator({
  nilaiKontrak,
  jenisPengadaan,
  metodePengadaan,
  penyedia,
  onTaxCalculated
}) {
  const [expanded, setExpanded] = useState(false)
  const [settings, setSettings] = useState({
    isPKP: true,
    hasNPWP: true,
    isUMKM: false,
    ppnInclusive: false,
  })

  // Calculate taxes
  const taxResult = useMemo(() => {
    if (!nilaiKontrak || nilaiKontrak <= 0) return null

    const result = calculateProcurementTaxes({
      amount: nilaiKontrak,
      jenisPengadaan,
      ...settings,
    })

    // Notify parent if callback provided
    if (onTaxCalculated) {
      onTaxCalculated(result)
    }

    return result
  }, [nilaiKontrak, jenisPengadaan, settings, onTaxCalculated])

  // Validate procurement method
  const methodValidation = useMemo(() => {
    if (!metodePengadaan || !nilaiKontrak || !jenisPengadaan) return null
    return validateProcurementMethod(metodePengadaan, nilaiKontrak, jenisPengadaan)
  }, [metodePengadaan, nilaiKontrak, jenisPengadaan])

  // Get recommended methods
  const recommendedMethods = useMemo(() => {
    if (!nilaiKontrak || !jenisPengadaan) return null
    return getRecommendedMethod(nilaiKontrak, jenisPengadaan)
  }, [nilaiKontrak, jenisPengadaan])

  if (!nilaiKontrak || nilaiKontrak <= 0) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center gap-3 text-slate-500">
            <Calculator className="w-5 h-5" />
            <span>Masukkan nilai kontrak untuk menghitung pajak</span>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Kalkulator Pajak
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? ChevronUp : ChevronDown}
        >
          {expanded ? 'Sembunyikan' : 'Detail'}
        </Button>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Quick Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">DPP</p>
            <p className="font-semibold text-slate-900">{formatRupiah(taxResult?.dpp || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">PPN ({(PPN_RATE * 100)}%)</p>
            <p className="font-semibold text-slate-900">{formatRupiah(taxResult?.ppn.amount || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{taxResult?.pph.type || 'PPh'}</p>
            <p className="font-semibold text-error-600">-{formatRupiah(taxResult?.pph.amount || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Dibayar ke Penyedia</p>
            <p className="font-bold text-primary-600">{formatRupiah(taxResult?.netPayment || 0)}</p>
          </div>
        </div>

        {/* Method Validation Warning */}
        {methodValidation && !methodValidation.isValid && (
          <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
            <p className="text-sm font-medium text-error-800">{methodValidation.warning}</p>
            {methodValidation.suggestion && (
              <p className="text-sm text-error-700 mt-1">
                Saran: Gunakan metode <strong>{methodValidation.suggestion}</strong>
              </p>
            )}
          </div>
        )}

        {methodValidation && methodValidation.isValid && methodValidation.warning && (
          <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
            <p className="text-sm text-warning-800">{methodValidation.warning}</p>
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="pt-4 border-t border-slate-200 space-y-4">
            {/* Settings */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isPKP}
                  onChange={(e) => setSettings({ ...settings, isPKP: e.target.checked })}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700">Penyedia PKP</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.hasNPWP}
                  onChange={(e) => setSettings({ ...settings, hasNPWP: e.target.checked })}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700">Punya NPWP</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isUMKM}
                  onChange={(e) => setSettings({ ...settings, isUMKM: e.target.checked })}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700">UMKM (PPh Final)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ppnInclusive}
                  onChange={(e) => setSettings({ ...settings, ppnInclusive: e.target.checked })}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-slate-700">Harga termasuk PPN</span>
              </label>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-3">Rincian Perhitungan</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Nilai Kontrak (DPP)</span>
                  <span className="font-medium">{formatRupiah(taxResult?.dpp)}</span>
                </div>
                {taxResult?.ppn.amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">PPN {taxResult?.ppn.ratePercent}%</span>
                    <span className="font-medium">+ {formatRupiah(taxResult?.ppn.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="text-slate-700 font-medium">Nilai Bruto</span>
                  <span className="font-semibold">{formatRupiah(taxResult?.grossPayment)}</span>
                </div>
                {taxResult?.pph.amount > 0 && (
                  <div className="flex justify-between text-error-600">
                    <span>{taxResult?.pph.type} {taxResult?.pph.ratePercent}% (dipotong)</span>
                    <span className="font-medium">- {formatRupiah(taxResult?.pph.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-primary-600">
                  <span className="font-semibold">Dibayar ke Penyedia</span>
                  <span className="font-bold">{formatRupiah(taxResult?.netPayment)}</span>
                </div>
              </div>
            </div>

            {/* Recommended Methods */}
            {recommendedMethods && recommendedMethods.methods.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-900 mb-2">Metode Pengadaan yang Disarankan</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendedMethods.methods.map((method, idx) => (
                    <Badge
                      key={method.value}
                      variant={idx === 0 ? 'success' : 'default'}
                      className="cursor-help"
                      title={method.note}
                    >
                      {method.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Batas Pengadaan Langsung untuk {jenisPengadaan}: {formatRupiah(recommendedMethods.limit)}
                </p>
              </div>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p>Perhitungan pajak berdasarkan peraturan perpajakan yang berlaku:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>PPN: 11% (UU HPP)</li>
                  <li>PPh 21: 2.5% untuk honorarium orang pribadi</li>
                  <li>PPh 22: 1.5% untuk pembelian barang oleh instansi pemerintah</li>
                  <li>PPh 23: 2% untuk jasa</li>
                  <li>PPh Final UMKM: 0.5% untuk omzet di bawah 4.8M/tahun</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

/**
 * Simple Tax Summary Display
 */
export function TaxSummary({ taxResult, compact = false }) {
  if (!taxResult) return null

  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-500">PPN: {formatRupiah(taxResult.ppn.amount)}</span>
        <span className="text-slate-500">{taxResult.pph.type}: {formatRupiah(taxResult.pph.amount)}</span>
        <span className="font-medium text-primary-600">Nett: {formatRupiah(taxResult.netPayment)}</span>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
      {taxResult.summary?.rincian?.map((item, idx) => (
        <div
          key={idx}
          className={`flex justify-between text-sm ${item.isFinal ? 'font-bold text-primary-600 pt-2 border-t border-slate-200' : ''}`}
        >
          <span className={item.isDeduction ? 'text-error-600' : 'text-slate-600'}>
            {item.label}
          </span>
          <span className={item.isDeduction ? 'text-error-600' : ''}>
            {item.isDeduction ? '- ' : ''}{formatRupiah(Math.abs(item.amount))}
          </span>
        </div>
      ))}
    </div>
  )
}

export default TaxCalculator
