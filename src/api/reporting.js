import { get, post } from './client'

/**
 * Get Paket Summary Report per tahun
 */
export async function getPaketSummary(tahun) {
  return get('/api/reporting/paket-summary', { tahun })
}

/**
 * Get Contract vs Payment Analysis
 */
export async function getContractVsPayment(tahun) {
  return get('/api/reporting/contract-payment', { tahun })
}

/**
 * Get Perjalanan Dinas Summary
 */
export async function getPDSummary(tahun) {
  return get('/api/reporting/pd-summary', { tahun })
}

/**
 * Get Compliance Dashboard
 */
export async function getComplianceDashboard(tahun) {
  return get('/api/reporting/compliance-dashboard', { tahun })
}

/**
 * Generate Audit Bundle for a Paket
 */
export async function generateAuditBundle(paketId) {
  return get(`/api/reporting/audit-bundle/${paketId}`)
}

/**
 * Export Report to Spreadsheet
 */
export async function exportReport(reportType, options = {}) {
  return post('/api/reporting/export', { reportType, ...options })
}

export default {
  getPaketSummary,
  getContractVsPayment,
  getPDSummary,
  getComplianceDashboard,
  generateAuditBundle,
  exportReport,
}
