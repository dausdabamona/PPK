/**
 * Tax Calculation Utilities for PPK-OS
 * Based on Indonesian tax regulations for government procurement
 */

import { PPN_RATE, PPH_RATES, BATAS_PENGADAAN_LANGSUNG, METODE_PENGADAAN } from './constants'

// ===== TAX CALCULATION FUNCTIONS =====

/**
 * Calculate PPN (Pajak Pertambahan Nilai) - 11%
 * @param {number} amount - Base amount (DPP)
 * @param {boolean} inclusive - Whether the amount already includes PPN
 * @returns {object} { dpp, ppn, total }
 */
export function calculatePPN(amount, inclusive = false) {
  const value = Number(amount) || 0

  if (inclusive) {
    // Amount includes PPN, extract DPP
    const dpp = Math.round(value / (1 + PPN_RATE))
    const ppn = value - dpp
    return { dpp, ppn, total: value }
  } else {
    // Amount is DPP, calculate PPN
    const ppn = Math.round(value * PPN_RATE)
    return { dpp: value, ppn, total: value + ppn }
  }
}

/**
 * Calculate PPh 21 - 2.5% (for honorarium/jasa orang pribadi)
 * Applied to honorarium, upah, and similar payments to individuals
 * @param {number} amount - Gross amount
 * @param {boolean} hasNPWP - Whether recipient has NPWP
 * @returns {object} { gross, pph, net, rate }
 */
export function calculatePPh21(amount, hasNPWP = true) {
  const gross = Number(amount) || 0
  const rate = hasNPWP ? PPH_RATES.PPH_21 : PPH_RATES.PPH_21 * 1.2 // 20% higher if no NPWP
  const pph = Math.round(gross * rate)

  return {
    gross,
    pph,
    net: gross - pph,
    rate,
    ratePercent: rate * 100
  }
}

/**
 * Calculate PPh 22 - 1.5% (for goods procurement)
 * Applied to goods purchased by government entities
 * @param {number} amount - Purchase amount (excluding PPN)
 * @param {boolean} hasNPWP - Whether vendor has NPWP
 * @returns {object} { dpp, pph, rate }
 */
export function calculatePPh22(amount, hasNPWP = true) {
  const dpp = Number(amount) || 0
  const rate = hasNPWP ? PPH_RATES.PPH_22 : PPH_RATES.PPH_22 * 2 // Double if no NPWP
  const pph = Math.round(dpp * rate)

  return {
    dpp,
    pph,
    rate,
    ratePercent: rate * 100
  }
}

/**
 * Calculate PPh 23 - 2% (for services)
 * Applied to services provided by entities/companies
 * @param {number} amount - Service amount (excluding PPN)
 * @param {boolean} hasNPWP - Whether vendor has NPWP
 * @returns {object} { dpp, pph, rate }
 */
export function calculatePPh23(amount, hasNPWP = true) {
  const dpp = Number(amount) || 0
  const rate = hasNPWP ? PPH_RATES.PPH_23 : PPH_RATES.PPH_23 * 2 // Double if no NPWP
  const pph = Math.round(dpp * rate)

  return {
    dpp,
    pph,
    rate,
    ratePercent: rate * 100
  }
}

/**
 * Calculate PPh Final - 0.5% (for UMKM with turnover < 4.8B/year)
 * PP 23/2018 -> PP 55/2022
 * @param {number} amount - Transaction amount
 * @returns {object} { dpp, pph, rate }
 */
export function calculatePPhFinal(amount) {
  const dpp = Number(amount) || 0
  const rate = 0.005 // 0.5%
  const pph = Math.round(dpp * rate)

  return {
    dpp,
    pph,
    rate,
    ratePercent: rate * 100
  }
}

// ===== COMPREHENSIVE TAX CALCULATION =====

/**
 * Calculate all applicable taxes for a procurement
 * @param {object} params
 * @param {number} params.amount - Base amount
 * @param {string} params.jenisPengadaan - Type: Barang, Jasa, Konsultan, Konstruksi
 * @param {boolean} params.isPKP - Whether vendor is PKP (PPN taxable)
 * @param {boolean} params.hasNPWP - Whether vendor has NPWP
 * @param {boolean} params.isUMKM - Whether vendor is UMKM
 * @param {boolean} params.ppnInclusive - Whether amount includes PPN
 * @returns {object} Complete tax breakdown
 */
export function calculateProcurementTaxes({
  amount,
  jenisPengadaan,
  isPKP = true,
  hasNPWP = true,
  isUMKM = false,
  ppnInclusive = false,
}) {
  const baseAmount = Number(amount) || 0

  // Calculate PPN if vendor is PKP
  const ppnResult = isPKP ? calculatePPN(baseAmount, ppnInclusive) : { dpp: baseAmount, ppn: 0, total: baseAmount }
  const dpp = ppnResult.dpp

  // Determine PPh type based on jenis pengadaan
  let pphResult = { dpp: 0, pph: 0, rate: 0, ratePercent: 0 }
  let pphType = ''

  if (isUMKM) {
    // UMKM uses PPh Final 0.5%
    pphResult = calculatePPhFinal(dpp)
    pphType = 'PPh Final (UMKM)'
  } else if (jenisPengadaan === 'Barang') {
    // Goods: PPh 22
    pphResult = calculatePPh22(dpp, hasNPWP)
    pphType = 'PPh 22'
  } else if (jenisPengadaan === 'Jasa' || jenisPengadaan === 'Konsultan') {
    // Services: PPh 23
    pphResult = calculatePPh23(dpp, hasNPWP)
    pphType = 'PPh 23'
  } else if (jenisPengadaan === 'Konstruksi') {
    // Construction: PPh 23 (or special construction tax, simplified here)
    pphResult = calculatePPh23(dpp, hasNPWP)
    pphType = 'PPh 23'
  }

  // Calculate net payment (what vendor receives)
  const totalPPh = pphResult.pph
  const netPayment = ppnResult.total - totalPPh

  return {
    dpp: dpp,
    ppn: {
      rate: isPKP ? PPN_RATE : 0,
      ratePercent: isPKP ? PPN_RATE * 100 : 0,
      amount: ppnResult.ppn,
    },
    pph: {
      type: pphType,
      rate: pphResult.rate,
      ratePercent: pphResult.ratePercent,
      amount: totalPPh,
    },
    totalTax: ppnResult.ppn + totalPPh,
    grossPayment: ppnResult.total,
    netPayment: netPayment,
    summary: {
      dpp: dpp,
      ppn: ppnResult.ppn,
      ppnDitanggung: ppnResult.ppn, // PPN usually borne by government
      pph: totalPPh,
      pphDipotong: totalPPh, // PPh withheld from payment
      dibayarKePenyedia: netPayment,
    }
  }
}

// ===== PROCUREMENT METHOD VALIDATION =====

/**
 * Get recommended procurement method based on value and type
 * Based on Perpres 16/2018 and amendments
 * @param {number} nilai - HPS value
 * @param {string} jenisPengadaan - Type of procurement
 * @returns {object} { methods, warning, isValid }
 */
export function getRecommendedMethod(nilai, jenisPengadaan) {
  const value = Number(nilai) || 0
  const limit = BATAS_PENGADAAN_LANGSUNG[jenisPengadaan] || 200000000

  const result = {
    methods: [],
    warning: null,
    isValid: true,
    limit,
    jenisPengadaan,
  }

  if (value <= 0) {
    result.warning = 'Nilai HPS harus lebih dari 0'
    result.isValid = false
    return result
  }

  // E-Purchasing always available for goods in e-catalog
  if (jenisPengadaan === 'Barang') {
    result.methods.push({
      value: 'E-Purchasing',
      label: 'E-Purchasing',
      note: 'Prioritas jika tersedia di e-katalog',
      priority: 1,
    })
  }

  if (value <= limit) {
    // Pengadaan Langsung
    result.methods.push({
      value: 'Pengadaan Langsung',
      label: 'Pengadaan Langsung',
      note: `Untuk nilai ≤ ${formatCurrency(limit)}`,
      priority: 2,
    })
  }

  if (value <= 200000000 && jenisPengadaan !== 'Konsultan') {
    // Penunjukan Langsung for special cases
    result.methods.push({
      value: 'Penunjukan Langsung',
      label: 'Penunjukan Langsung',
      note: 'Untuk kondisi khusus sesuai Perpres',
      priority: 3,
    })
  }

  if (value > limit) {
    if (jenisPengadaan === 'Konsultan') {
      result.methods.push({
        value: 'Seleksi',
        label: 'Seleksi',
        note: `Wajib untuk nilai > ${formatCurrency(limit)}`,
        priority: 2,
      })
    } else {
      result.methods.push({
        value: 'Tender',
        label: 'Tender',
        note: `Wajib untuk nilai > ${formatCurrency(limit)}`,
        priority: 2,
      })

      if (jenisPengadaan === 'Barang' || jenisPengadaan === 'Jasa') {
        result.methods.push({
          value: 'Tender Cepat',
          label: 'Tender Cepat',
          note: 'Untuk spesifikasi umum, kriteria jelas',
          priority: 3,
        })
      }
    }
  }

  // Sort by priority
  result.methods.sort((a, b) => a.priority - b.priority)

  return result
}

/**
 * Validate if selected method is appropriate for value
 * @param {string} metode - Selected method
 * @param {number} nilai - HPS value
 * @param {string} jenisPengadaan - Type of procurement
 * @returns {object} { isValid, warning, suggestion }
 */
export function validateProcurementMethod(metode, nilai, jenisPengadaan) {
  const value = Number(nilai) || 0
  const limit = BATAS_PENGADAAN_LANGSUNG[jenisPengadaan] || 200000000

  const result = {
    isValid: true,
    warning: null,
    suggestion: null,
  }

  // Check if method matches value range
  if (metode === 'Pengadaan Langsung' && value > limit) {
    result.isValid = false
    result.warning = `Pengadaan Langsung tidak diperbolehkan untuk nilai > ${formatCurrency(limit)}`
    result.suggestion = jenisPengadaan === 'Konsultan' ? 'Seleksi' : 'Tender'
  }

  if ((metode === 'Tender' || metode === 'Tender Cepat') && value <= limit) {
    result.warning = `Untuk nilai ≤ ${formatCurrency(limit)}, disarankan menggunakan Pengadaan Langsung`
    result.suggestion = 'Pengadaan Langsung'
    // Still valid, just not efficient
  }

  if (metode === 'Seleksi' && jenisPengadaan !== 'Konsultan') {
    result.isValid = false
    result.warning = 'Seleksi hanya untuk pengadaan Jasa Konsultansi'
    result.suggestion = 'Tender'
  }

  if (metode === 'Seleksi' && value <= limit && jenisPengadaan === 'Konsultan') {
    result.warning = 'Untuk nilai kecil, dapat menggunakan Pengadaan Langsung'
    result.suggestion = 'Pengadaan Langsung'
  }

  return result
}

// ===== HELPER FUNCTIONS =====

/**
 * Format currency for display
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Calculate payment breakdown with taxes
 * @param {number} kontrakValue - Contract value
 * @param {object} taxParams - Tax parameters
 * @returns {object} Payment breakdown
 */
export function calculatePaymentBreakdown(kontrakValue, taxParams) {
  const taxes = calculateProcurementTaxes({
    amount: kontrakValue,
    ...taxParams,
  })

  return {
    nilaiKontrak: kontrakValue,
    ...taxes,
    rincian: [
      { label: 'Nilai Kontrak (DPP)', amount: taxes.dpp },
      { label: `PPN ${taxes.ppn.ratePercent}%`, amount: taxes.ppn.amount },
      { label: 'Nilai Bruto', amount: taxes.grossPayment },
      { label: `${taxes.pph.type} ${taxes.pph.ratePercent}%`, amount: -taxes.pph.amount, isDeduction: true },
      { label: 'Dibayar ke Penyedia', amount: taxes.netPayment, isFinal: true },
    ]
  }
}

/**
 * Tax summary for document generation
 */
export function generateTaxSummary(taxResult) {
  const lines = []

  lines.push(`DPP (Dasar Pengenaan Pajak): ${formatCurrency(taxResult.dpp)}`)

  if (taxResult.ppn.amount > 0) {
    lines.push(`PPN ${taxResult.ppn.ratePercent}%: ${formatCurrency(taxResult.ppn.amount)}`)
  }

  if (taxResult.pph.amount > 0) {
    lines.push(`${taxResult.pph.type} ${taxResult.pph.ratePercent}%: ${formatCurrency(taxResult.pph.amount)}`)
  }

  lines.push(`Total Pajak: ${formatCurrency(taxResult.totalTax)}`)
  lines.push(`Nilai Bruto: ${formatCurrency(taxResult.grossPayment)}`)
  lines.push(`Dibayar ke Penyedia: ${formatCurrency(taxResult.netPayment)}`)

  return lines.join('\n')
}

export default {
  calculatePPN,
  calculatePPh21,
  calculatePPh22,
  calculatePPh23,
  calculatePPhFinal,
  calculateProcurementTaxes,
  getRecommendedMethod,
  validateProcurementMethod,
  calculatePaymentBreakdown,
  generateTaxSummary,
}
