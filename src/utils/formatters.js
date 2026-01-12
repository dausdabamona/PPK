import { format, parseISO, isValid } from 'date-fns'
import { id } from 'date-fns/locale'

/**
 * Format angka ke format Rupiah
 */
export function formatRupiah(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? 'Rp 0' : '0'
  }

  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))

  if (showSymbol) {
    return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`
  }
  return amount < 0 ? `-${formatted}` : formatted
}

/**
 * Parse string Rupiah ke angka
 */
export function parseRupiah(value) {
  if (typeof value === 'number') return value
  if (!value) return 0

  const cleaned = value.toString().replace(/[^\d-]/g, '')
  return parseInt(cleaned, 10) || 0
}

/**
 * Format angka dengan separator ribuan
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0'
  }

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatTanggal(date, formatStr = 'd MMMM yyyy') {
  if (!date) return '-'

  let dateObj = date
  if (typeof date === 'string') {
    dateObj = parseISO(date)
  }

  if (!isValid(dateObj)) return '-'

  return format(dateObj, formatStr, { locale: id })
}

/**
 * Format tanggal pendek
 */
export function formatTanggalPendek(date) {
  return formatTanggal(date, 'd MMM yyyy')
}

/**
 * Format tanggal dengan waktu
 */
export function formatTanggalWaktu(date) {
  return formatTanggal(date, 'd MMMM yyyy HH:mm')
}

/**
 * Format tanggal untuk input
 */
export function formatTanggalInput(date) {
  if (!date) return ''

  let dateObj = date
  if (typeof date === 'string') {
    dateObj = parseISO(date)
  }

  if (!isValid(dateObj)) return ''

  return format(dateObj, 'yyyy-MM-dd')
}

/**
 * Konversi angka ke terbilang dalam Bahasa Indonesia
 */
export function terbilang(n) {
  if (n === 0) return 'nol'
  if (n < 0) return 'minus ' + terbilang(-n)

  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

  if (n < 12) {
    return satuan[n]
  } else if (n < 20) {
    return satuan[n - 10] + ' belas'
  } else if (n < 100) {
    return satuan[Math.floor(n / 10)] + ' puluh' + (n % 10 > 0 ? ' ' + satuan[n % 10] : '')
  } else if (n < 200) {
    return 'seratus' + (n % 100 > 0 ? ' ' + terbilang(n % 100) : '')
  } else if (n < 1000) {
    return satuan[Math.floor(n / 100)] + ' ratus' + (n % 100 > 0 ? ' ' + terbilang(n % 100) : '')
  } else if (n < 2000) {
    return 'seribu' + (n % 1000 > 0 ? ' ' + terbilang(n % 1000) : '')
  } else if (n < 1000000) {
    return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 > 0 ? ' ' + terbilang(n % 1000) : '')
  } else if (n < 1000000000) {
    return terbilang(Math.floor(n / 1000000)) + ' juta' + (n % 1000000 > 0 ? ' ' + terbilang(n % 1000000) : '')
  } else if (n < 1000000000000) {
    return terbilang(Math.floor(n / 1000000000)) + ' miliar' + (n % 1000000000 > 0 ? ' ' + terbilang(n % 1000000000) : '')
  } else {
    return terbilang(Math.floor(n / 1000000000000)) + ' triliun' + (n % 1000000000000 > 0 ? ' ' + terbilang(n % 1000000000000) : '')
  }
}

/**
 * Format terbilang dengan kapitalisasi
 */
export function formatTerbilang(amount) {
  if (!amount || amount === 0) return 'Nol rupiah'

  const text = terbilang(Math.abs(Math.floor(amount)))
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1)

  return `${capitalized} rupiah`
}

/**
 * Format persentase
 */
export function formatPersen(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }

  return `${formatNumber(value * 100, decimals)}%`
}

/**
 * Truncate text dengan ellipsis
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text

  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Format nomor telepon Indonesia
 */
export function formatTelepon(phone) {
  if (!phone) return '-'

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('62')) {
    return '+62 ' + cleaned.slice(2).replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3')
  } else if (cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
  }

  return phone
}

/**
 * Format NPWP
 */
export function formatNPWP(npwp) {
  if (!npwp) return '-'

  const cleaned = npwp.replace(/\D/g, '')
  if (cleaned.length !== 15) return npwp

  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})/, '$1.$2.$3.$4-$5.$6')
}

/**
 * Format ukuran file
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Generate initials dari nama
 */
export function getInitials(name) {
  if (!name) return ''

  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }

  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * Slugify text
 */
export function slugify(text) {
  if (!text) return ''

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
