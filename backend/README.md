# PPK Backend - Google Apps Script

Backend untuk aplikasi PPK (Pejabat Pembuat Komitmen) menggunakan Google Apps Script.

## Struktur File

| File | Deskripsi |
|------|-----------|
| `00_Config.gs` | Konfigurasi global dan konstanta (status, jenis pengadaan, dll) |
| `01_Database.gs` | Utilitas database, helper CRUD, formatting |
| `02_Router.gs` | Routing API dan penanganan request (doGet, doPost) |
| `03_PaketService.gs` | Service untuk Paket Pengadaan |
| `04_ItemService.gs` | Service untuk Item/Barang dalam Paket |
| `05_SurveyService.gs` | Service untuk Survey Harga |
| `06_PenyediaService.gs` | Service untuk Penyedia/Vendor |
| `08_HPSService.gs` | Service untuk Perhitungan HPS |
| `10_PerjalananDinasService.gs` | Service untuk Perjalanan Dinas (lengkap dengan document generation) |
| `10_WorkflowEngine.gs` | Service Workflow untuk Paket |
| `14_NumberingEngine.gs` | Service Penomoran Dokumen Otomatis |
| `99_setup.gs` | Setup awal, menu, dan fungsi utilitas |

## Cara Deploy

### 1. Buat Project Baru di Google Apps Script

1. Buka [Google Apps Script](https://script.google.com)
2. Klik **New Project**
3. Beri nama project: "PPK Backend"

### 2. Tambahkan File

Untuk setiap file `.gs` di folder ini:
1. Klik **+** di samping "Files"
2. Pilih **Script**
3. Beri nama sesuai (tanpa `.gs`)
4. Copy-paste isi file

**Urutan file penting!** Pastikan urutan sama seperti nama file (00, 01, 02, dst).

### 3. Hubungkan dengan Spreadsheet

1. Buat Google Spreadsheet baru
2. Copy ID spreadsheet dari URL: `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
3. Di Apps Script, buka **Project Settings** (gear icon)
4. Scroll ke **Script Properties**
5. Tambahkan:
   - Property: `SPREADSHEET_ID`
   - Value: [paste ID spreadsheet]

### 4. Jalankan Setup Awal

1. Pilih fungsi `initialSetup` dari dropdown
2. Klik **Run**
3. Berikan izin yang diperlukan
4. Sheets akan dibuat otomatis di spreadsheet

### 5. Deploy sebagai Web App

1. Klik **Deploy** > **New deployment**
2. Pilih type: **Web app**
3. Konfigurasi:
   - Description: "PPK API v1"
   - Execute as: **Me**
   - Who has access: **Anyone** (atau sesuaikan)
4. Klik **Deploy**
5. Copy **Web app URL**

### 6. Konfigurasi Frontend

Update file `.env` di frontend:
```
VITE_API_URL=https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
```

## API Endpoints

### Perjalanan Dinas

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/perjalanan-dinas` | List semua PD |
| POST | `/perjalanan-dinas` | Buat PD baru |
| GET | `/perjalanan-dinas/:id` | Detail PD |
| POST | `/perjalanan-dinas/:id` | Update PD |
| DELETE | `/perjalanan-dinas/:id` | Hapus PD |
| GET | `/perjalanan-dinas/:id/pelaksana` | List pelaksana |
| POST | `/perjalanan-dinas/:id/pelaksana` | Tambah pelaksana |
| GET | `/perjalanan-dinas/:id/biaya` | List biaya |
| POST | `/perjalanan-dinas/:id/biaya` | Tambah biaya |
| POST | `/perjalanan-dinas/:id/dokumen/generate` | Generate dokumen |
| GET | `/perjalanan-dinas/:id/workflow` | Status workflow |
| POST | `/perjalanan-dinas/:id/workflow/next` | Advance workflow |

### Paket Pengadaan

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/paket` | List semua paket |
| POST | `/paket` | Buat paket baru |
| GET | `/paket/:id` | Detail paket |
| POST | `/paket/:id` | Update paket |
| DELETE | `/paket/:id` | Hapus paket |
| GET | `/paket/:id/items` | List items |
| POST | `/paket/:id/items` | Tambah item |
| GET | `/paket/:id/hps` | Hitung HPS |
| POST | `/paket/:id/kontrak` | Update kontrak |
| POST | `/paket/:id/pembayaran` | Tambah pembayaran |

### Items & Survey

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/items/:id` | Update item |
| DELETE | `/items/:id` | Hapus item |
| GET | `/items/:id/surveys` | List survey |
| POST | `/items/:id/surveys` | Tambah survey |
| DELETE | `/items/:id/surveys/:surveyId` | Hapus survey |

### Penyedia

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/penyedia` | List penyedia |
| POST | `/penyedia` | Buat penyedia |
| GET | `/penyedia/:id` | Detail penyedia |
| POST | `/penyedia/:id` | Update penyedia |

### Config & Numbering

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/config` | Get konfigurasi |
| POST | `/config` | Update konfigurasi |
| GET | `/numbering` | Get patterns |
| POST | `/numbering/generate/:type` | Generate nomor |

## Dokumen yang Dapat Di-generate

### Perjalanan Dinas
- **SPPD** - Surat Perintah Perjalanan Dinas
- **Surat Tugas** - Surat Tugas/Surat PD Dalam Kota
- **Kuitansi Rampung** - Rincian Biaya Perjalanan Dinas
- **Daftar Pengeluaran Riil** - Daftar pengeluaran tanpa bukti

### Paket Pengadaan
- **HPS** - Harga Perkiraan Sendiri

## Perbaikan Bug

### Nomor Surat Tugas Tidak Tersimpan

**Masalah**: Field `nomorST` dan `tanggalST` tidak tersimpan saat update.

**Solusi**: Di `10_PerjalananDinasService.gs`, field sudah ditambahkan ke `allowedFields`:

```javascript
const allowedFields = [
  'nomorST', 'tanggalST', 'nomorSPPD', 'tanggalSPPD',  // FIXED
  'tempatBerangkat', 'tujuan', 'kotaTujuan', ...
];
```

## Lisensi

MIT License
