import { z } from 'zod'
import { JENIS_PENGADAAN, METODE_PENGADAAN, SUMBER_DANA, STATUS } from './constants'

// Helper untuk pesan error Bahasa Indonesia
const required = (field) => `${field} wajib diisi`
const minLength = (field, min) => `${field} minimal ${min} karakter`
const maxLength = (field, max) => `${field} maksimal ${max} karakter`
const invalidEmail = 'Format email tidak valid'
const invalidNumber = (field) => `${field} harus berupa angka`
const positiveNumber = (field) => `${field} harus lebih dari 0`

// Schema untuk Paket Pengadaan
export const paketSchema = z.object({
  namaPaket: z.string()
    .min(1, required('Nama Paket'))
    .min(5, minLength('Nama Paket', 5))
    .max(500, maxLength('Nama Paket', 500)),
  jenisPengadaan: z.string()
    .min(1, required('Jenis Pengadaan'))
    .refine(val => JENIS_PENGADAAN.some(j => j.value === val), 'Jenis Pengadaan tidak valid'),
  metodePengadaan: z.string()
    .min(1, required('Metode Pengadaan'))
    .refine(val => METODE_PENGADAAN.some(m => m.value === val), 'Metode Pengadaan tidak valid'),
  sumberDana: z.string()
    .min(1, required('Sumber Dana'))
    .refine(val => SUMBER_DANA.some(s => s.value === val), 'Sumber Dana tidak valid'),
  tahunAnggaran: z.number()
    .int()
    .min(2020, 'Tahun Anggaran minimal 2020')
    .max(2100, 'Tahun Anggaran maksimal 2100'),
  mak: z.string().optional(),
  lokasi: z.string().optional(),
  keterangan: z.string().max(1000, maxLength('Keterangan', 1000)).optional(),
})

// Schema untuk Item Paket
export const itemSchema = z.object({
  namaBarang: z.string()
    .min(1, required('Nama Barang'))
    .max(500, maxLength('Nama Barang', 500)),
  spesifikasi: z.string()
    .max(2000, maxLength('Spesifikasi', 2000))
    .optional(),
  volume: z.number()
    .min(0.01, positiveNumber('Volume')),
  satuan: z.string()
    .min(1, required('Satuan')),
  hargaSatuan: z.number()
    .min(0, invalidNumber('Harga Satuan')),
  ongkirSatuan: z.number()
    .min(0, invalidNumber('Ongkir'))
    .default(0),
  overheadPersen: z.number()
    .min(0, 'Overhead minimal 0%')
    .max(100, 'Overhead maksimal 100%')
    .default(0),
  biayaLain: z.number()
    .min(0, invalidNumber('Biaya Lain'))
    .default(0),
})

// Schema untuk Survey Harga
export const surveySchema = z.object({
  sumber: z.string()
    .min(1, required('Sumber')),
  namaToko: z.string()
    .min(1, required('Nama Toko'))
    .max(200, maxLength('Nama Toko', 200)),
  harga: z.number()
    .min(0, invalidNumber('Harga')),
  ongkirSatuan: z.number()
    .min(0, invalidNumber('Ongkir'))
    .default(0),
  tanggalSurvey: z.string()
    .min(1, required('Tanggal Survey')),
  buktiUrl: z.string()
    .url('URL tidak valid')
    .optional()
    .or(z.literal('')),
  keterangan: z.string()
    .max(500, maxLength('Keterangan', 500))
    .optional(),
})

// Schema untuk Penyedia
export const penyediaSchema = z.object({
  nama: z.string()
    .min(1, required('Nama Penyedia'))
    .max(300, maxLength('Nama Penyedia', 300)),
  alamat: z.string()
    .max(500, maxLength('Alamat', 500))
    .optional(),
  npwp: z.string()
    .regex(/^[\d.,-]*$/, 'Format NPWP tidak valid')
    .optional()
    .or(z.literal('')),
  telepon: z.string()
    .max(20, maxLength('Telepon', 20))
    .optional(),
  email: z.string()
    .email(invalidEmail)
    .optional()
    .or(z.literal('')),
  namaBank: z.string()
    .max(100, maxLength('Nama Bank', 100))
    .optional(),
  noRekening: z.string()
    .max(50, maxLength('No. Rekening', 50))
    .optional(),
  atasNamaRekening: z.string()
    .max(200, maxLength('Atas Nama Rekening', 200))
    .optional(),
  isPKP: z.boolean().default(false),
  kualifikasi: z.string().optional(),
})

// Schema untuk Perjalanan Dinas
export const perjalananDinasSchema = z.object({
  nomorSuratTugas: z.string().optional(),
  tanggalSuratTugas: z.string().optional(),
  tujuanDinas: z.string()
    .min(1, required('Tujuan Dinas'))
    .max(500, maxLength('Tujuan Dinas', 500)),
  kotaTujuan: z.string()
    .min(1, required('Kota Tujuan')),
  tanggalBerangkat: z.string()
    .min(1, required('Tanggal Berangkat')),
  tanggalKembali: z.string()
    .min(1, required('Tanggal Kembali')),
  tingkatBiaya: z.string()
    .min(1, required('Tingkat Biaya')),
  sumberDana: z.string()
    .min(1, required('Sumber Dana')),
  mak: z.string().optional(),
  keterangan: z.string()
    .max(1000, maxLength('Keterangan', 1000))
    .optional(),
})

// Schema untuk Pelaksana Perjalanan Dinas
export const pelaksanaPdSchema = z.object({
  nama: z.string()
    .min(1, required('Nama')),
  nip: z.string().optional(),
  jabatan: z.string()
    .min(1, required('Jabatan')),
  golongan: z.string().optional(),
  tingkatBiaya: z.string()
    .min(1, required('Tingkat Biaya')),
})

// Schema untuk Biaya Perjalanan Dinas
export const biayaPdSchema = z.object({
  jenisBiaya: z.string()
    .min(1, required('Jenis Biaya')),
  keterangan: z.string()
    .max(500, maxLength('Keterangan', 500))
    .optional(),
  jumlah: z.number()
    .min(0, invalidNumber('Jumlah'))
    .default(1),
  satuan: z.string()
    .default('OH'),
  hargaSatuan: z.number()
    .min(0, invalidNumber('Harga Satuan'))
    .default(0),
  total: z.number()
    .min(0, invalidNumber('Total'))
    .default(0),
})

// Schema untuk Upload Lampiran
export const lampiranSchema = z.object({
  filename: z.string()
    .min(1, required('Nama File')),
  kategori: z.string()
    .min(1, required('Kategori')),
})

// Schema untuk Config
export const configSchema = z.object({
  namaSatker: z.string()
    .min(1, required('Nama Satker')),
  namaPPK: z.string()
    .min(1, required('Nama PPK')),
  nipPPK: z.string().optional(),
  namaKPA: z.string().optional(),
  nipKPA: z.string().optional(),
  alamatSatker: z.string().optional(),
})

// Schema untuk Generate Dokumen
export const generateDokumenSchema = z.object({
  jenisDokumen: z.string()
    .min(1, required('Jenis Dokumen')),
  tanggalDokumen: z.string()
    .min(1, required('Tanggal Dokumen')),
})

// Validation helper functions
export function validateSchema(schema, data) {
  try {
    const result = schema.parse(data)
    return { success: true, data: result, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = {}
      error.errors.forEach((err) => {
        const path = err.path.join('.')
        errors[path] = err.message
      })
      return { success: false, data: null, errors }
    }
    throw error
  }
}

export function getFieldError(errors, fieldName) {
  if (!errors) return null
  return errors[fieldName] || null
}
