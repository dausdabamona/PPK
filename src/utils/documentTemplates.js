/**
 * Document Templates for PPK-OS
 * Templates for all procurement documents according to Indonesian government regulations
 */

import { formatCurrency, formatDate, formatNumber, terbilang } from './formatters'

// Helper to get current date formatted
const getCurrentDate = () => {
  const now = new Date()
  const options = { day: 'numeric', month: 'long', year: 'numeric' }
  return now.toLocaleDateString('id-ID', options)
}

// Helper to format address
const formatAddress = (penyedia) => {
  if (!penyedia) return '-'
  const parts = [penyedia.alamat, penyedia.kota, penyedia.provinsi].filter(Boolean)
  return parts.join(', ') || '-'
}

/**
 * KAK - Kerangka Acuan Kerja
 */
export const generateKAK = (paket, items = [], settings = {}) => {
  const totalNilai = items.reduce((sum, item) => sum + (item.hargaSatuan * item.volume), 0)

  return {
    title: 'KERANGKA ACUAN KERJA (KAK)',
    subtitle: paket.namaPaket,
    content: `
      <div class="document kak">
        <div class="header">
          <h1>KERANGKA ACUAN KERJA</h1>
          <h2>(KAK / TERM OF REFERENCE)</h2>
        </div>

        <div class="section">
          <h3>1. LATAR BELAKANG</h3>
          <p>${paket.latarBelakang || 'Dalam rangka mendukung pelaksanaan tugas dan fungsi organisasi, diperlukan pengadaan ' + paket.jenisPengadaan?.toLowerCase() + ' berupa ' + paket.namaPaket + '.'}</p>
        </div>

        <div class="section">
          <h3>2. MAKSUD DAN TUJUAN</h3>
          <p><strong>Maksud:</strong> ${paket.maksud || 'Pengadaan ini dimaksudkan untuk memenuhi kebutuhan ' + paket.jenisPengadaan?.toLowerCase() + ' dalam rangka mendukung operasional organisasi.'}</p>
          <p><strong>Tujuan:</strong> ${paket.tujuan || 'Tersedianya ' + paket.jenisPengadaan?.toLowerCase() + ' yang berkualitas dan sesuai dengan kebutuhan organisasi.'}</p>
        </div>

        <div class="section">
          <h3>3. TARGET/SASARAN</h3>
          <p>${paket.sasaran || 'Terpenuhinya kebutuhan ' + paket.jenisPengadaan?.toLowerCase() + ' sesuai spesifikasi teknis yang ditentukan.'}</p>
        </div>

        <div class="section">
          <h3>4. NAMA DAN ORGANISASI PEJABAT PEMBUAT KOMITMEN</h3>
          <table class="info-table">
            <tr>
              <td width="200">Nama PPK</td>
              <td>: ${settings.namaPPK || '................................'}</td>
            </tr>
            <tr>
              <td>NIP</td>
              <td>: ${settings.nipPPK || '................................'}</td>
            </tr>
            <tr>
              <td>Satuan Kerja</td>
              <td>: ${settings.satuanKerja || '................................'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>5. SUMBER DANA DAN PERKIRAAN BIAYA</h3>
          <table class="info-table">
            <tr>
              <td width="200">Sumber Dana</td>
              <td>: ${paket.sumberDana || 'APBN'}</td>
            </tr>
            <tr>
              <td>Tahun Anggaran</td>
              <td>: ${paket.tahunAnggaran || new Date().getFullYear()}</td>
            </tr>
            <tr>
              <td>Pagu Anggaran</td>
              <td>: ${formatCurrency(paket.pagu || 0)}</td>
            </tr>
            <tr>
              <td>Perkiraan Biaya (HPS)</td>
              <td>: ${formatCurrency(totalNilai)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>6. RUANG LINGKUP PEKERJAAN</h3>
          <p>Ruang lingkup pekerjaan meliputi pengadaan ${paket.jenisPengadaan?.toLowerCase()} sebagai berikut:</p>
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Uraian</th>
                <th>Satuan</th>
                <th>Volume</th>
                <th>Harga Satuan</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td>${item.namaItem || item.nama}</td>
                  <td class="center">${item.satuan}</td>
                  <td class="right">${formatNumber(item.volume)}</td>
                  <td class="right">${formatCurrency(item.hargaSatuan)}</td>
                  <td class="right">${formatCurrency(item.hargaSatuan * item.volume)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5" class="right"><strong>TOTAL</strong></td>
                <td class="right"><strong>${formatCurrency(totalNilai)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>7. PRODUK/KELUARAN YANG DIHASILKAN</h3>
          <p>${paket.produkKeluaran || 'Tersedianya ' + paket.jenisPengadaan?.toLowerCase() + ' sesuai dengan spesifikasi yang ditentukan dalam dokumen pengadaan.'}</p>
        </div>

        <div class="section">
          <h3>8. WAKTU PELAKSANAAN</h3>
          <p>Jangka waktu pelaksanaan pekerjaan adalah <strong>${paket.jangkaWaktu || 30} (${terbilang(paket.jangkaWaktu || 30)}) hari kalender</strong> terhitung sejak diterbitkannya Surat Perintah Kerja (SPK).</p>
        </div>

        <div class="section">
          <h3>9. SPESIFIKASI TEKNIS</h3>
          <p>${paket.spesifikasiTeknis || 'Spesifikasi teknis terlampir.'}</p>
        </div>

        <div class="section">
          <h3>10. METODE PENGADAAN</h3>
          <p>Metode pengadaan yang digunakan adalah <strong>${paket.metodePengadaan || 'Pengadaan Langsung'}</strong>.</p>
        </div>

        <div class="signature">
          <p>${settings.tempatTTD || '................................'}, ${getCurrentDate()}</p>
          <p>Pejabat Pembuat Komitmen</p>
          <div class="signature-space"></div>
          <p><strong><u>${settings.namaPPK || '................................'}</u></strong></p>
          <p>NIP. ${settings.nipPPK || '................................'}</p>
        </div>
      </div>
    `
  }
}

/**
 * HPS - Harga Perkiraan Sendiri
 */
export const generateHPS = (paket, items = [], surveyData = [], settings = {}) => {
  const itemsWithSurvey = items.map(item => {
    const surveys = surveyData.filter(s => s.itemId === item.id)
    const avgPrice = surveys.length > 0
      ? surveys.reduce((sum, s) => sum + s.harga, 0) / surveys.length
      : item.hargaSatuan
    return {
      ...item,
      surveys,
      hargaRataRata: avgPrice,
      total: avgPrice * item.volume
    }
  })

  const subtotal = itemsWithSurvey.reduce((sum, item) => sum + item.total, 0)
  const ppn = subtotal * 0.11
  const total = subtotal + ppn

  return {
    title: 'HARGA PERKIRAAN SENDIRI (HPS)',
    subtitle: paket.namaPaket,
    content: `
      <div class="document hps">
        <div class="header">
          <h1>HARGA PERKIRAAN SENDIRI (HPS)</h1>
          <h2>Nomor: ${paket.nomorHPS || '....../HPS/....../.....'}</h2>
        </div>

        <div class="section">
          <table class="info-table">
            <tr>
              <td width="180">Nama Paket</td>
              <td>: ${paket.namaPaket}</td>
            </tr>
            <tr>
              <td>Jenis Pengadaan</td>
              <td>: ${paket.jenisPengadaan}</td>
            </tr>
            <tr>
              <td>Tahun Anggaran</td>
              <td>: ${paket.tahunAnggaran || new Date().getFullYear()}</td>
            </tr>
            <tr>
              <td>Sumber Dana</td>
              <td>: ${paket.sumberDana || 'APBN'}</td>
            </tr>
            <tr>
              <td>Pagu Anggaran</td>
              <td>: ${formatCurrency(paket.pagu || 0)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>A. RINCIAN HPS</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th rowspan="2">No</th>
                <th rowspan="2">Uraian Barang/Jasa</th>
                <th rowspan="2">Spesifikasi</th>
                <th rowspan="2">Satuan</th>
                <th rowspan="2">Volume</th>
                <th colspan="2">Harga Survey</th>
                <th rowspan="2">Harga HPS</th>
                <th rowspan="2">Jumlah</th>
              </tr>
              <tr>
                <th>Sumber</th>
                <th>Harga</th>
              </tr>
            </thead>
            <tbody>
              ${itemsWithSurvey.map((item, idx) => {
                const rowspan = Math.max(1, item.surveys.length)
                return `
                  <tr>
                    <td class="center" rowspan="${rowspan}">${idx + 1}</td>
                    <td rowspan="${rowspan}">${item.namaItem || item.nama}</td>
                    <td rowspan="${rowspan}">${item.spesifikasi || '-'}</td>
                    <td class="center" rowspan="${rowspan}">${item.satuan}</td>
                    <td class="right" rowspan="${rowspan}">${formatNumber(item.volume)}</td>
                    <td>${item.surveys[0]?.namaToko || '-'}</td>
                    <td class="right">${item.surveys[0] ? formatCurrency(item.surveys[0].harga) : '-'}</td>
                    <td class="right" rowspan="${rowspan}">${formatCurrency(item.hargaRataRata)}</td>
                    <td class="right" rowspan="${rowspan}">${formatCurrency(item.total)}</td>
                  </tr>
                  ${item.surveys.slice(1).map(survey => `
                    <tr>
                      <td>${survey.namaToko}</td>
                      <td class="right">${formatCurrency(survey.harga)}</td>
                    </tr>
                  `).join('')}
                `
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="8" class="right"><strong>Subtotal</strong></td>
                <td class="right"><strong>${formatCurrency(subtotal)}</strong></td>
              </tr>
              <tr>
                <td colspan="8" class="right"><strong>PPN 11%</strong></td>
                <td class="right"><strong>${formatCurrency(ppn)}</strong></td>
              </tr>
              <tr class="total-row">
                <td colspan="8" class="right"><strong>TOTAL HPS</strong></td>
                <td class="right"><strong>${formatCurrency(total)}</strong></td>
              </tr>
            </tfoot>
          </table>
          <p class="terbilang">Terbilang: <em>${terbilang(Math.round(total))} rupiah</em></p>
        </div>

        <div class="section">
          <h3>B. DASAR PENYUSUNAN HPS</h3>
          <ol>
            <li>Survey harga pasar yang dilakukan pada ${formatDate(new Date())}</li>
            <li>Harga kontrak sebelumnya (jika ada)</li>
            <li>Daftar harga standar yang ditetapkan instansi terkait</li>
          </ol>
        </div>

        <div class="signature">
          <p>${settings.tempatTTD || '................................'}, ${getCurrentDate()}</p>
          <p>Pejabat Pembuat Komitmen</p>
          <div class="signature-space"></div>
          <p><strong><u>${settings.namaPPK || '................................'}</u></strong></p>
          <p>NIP. ${settings.nipPPK || '................................'}</p>
        </div>
      </div>
    `
  }
}

/**
 * SPK - Surat Perintah Kerja
 */
export const generateSPK = (paket, kontrak = {}, penyedia = {}, items = [], settings = {}) => {
  const totalNilai = kontrak.nilaiKontrak || items.reduce((sum, item) => sum + (item.hargaSatuan * item.volume), 0)

  return {
    title: 'SURAT PERINTAH KERJA (SPK)',
    subtitle: paket.namaPaket,
    content: `
      <div class="document spk">
        <div class="header">
          <h1>SURAT PERINTAH KERJA</h1>
          <h2>Nomor: ${kontrak.nomorKontrak || '....../SPK/....../.....'}</h2>
        </div>

        <div class="section">
          <p>Pada hari ini ${getCurrentDate()}, yang bertanda tangan di bawah ini:</p>

          <table class="info-table">
            <tr>
              <td colspan="3"><strong>I. PIHAK KESATU (PEMBERI KERJA)</strong></td>
            </tr>
            <tr>
              <td width="30"></td>
              <td width="150">Nama</td>
              <td>: ${settings.namaPPK || '................................'}</td>
            </tr>
            <tr>
              <td></td>
              <td>Jabatan</td>
              <td>: Pejabat Pembuat Komitmen</td>
            </tr>
            <tr>
              <td></td>
              <td>Alamat</td>
              <td>: ${settings.alamatKantor || '................................'}</td>
            </tr>
          </table>

          <p>selanjutnya disebut <strong>PIHAK KESATU</strong></p>

          <table class="info-table">
            <tr>
              <td colspan="3"><strong>II. PIHAK KEDUA (PENYEDIA)</strong></td>
            </tr>
            <tr>
              <td width="30"></td>
              <td width="150">Nama Penyedia</td>
              <td>: ${penyedia.nama || '................................'}</td>
            </tr>
            <tr>
              <td></td>
              <td>Direktur/Pemilik</td>
              <td>: ${penyedia.direktur || '................................'}</td>
            </tr>
            <tr>
              <td></td>
              <td>NPWP</td>
              <td>: ${penyedia.npwp || '................................'}</td>
            </tr>
            <tr>
              <td></td>
              <td>Alamat</td>
              <td>: ${formatAddress(penyedia)}</td>
            </tr>
            <tr>
              <td></td>
              <td>No. Telepon</td>
              <td>: ${penyedia.telepon || '................................'}</td>
            </tr>
          </table>

          <p>selanjutnya disebut <strong>PIHAK KEDUA</strong></p>
        </div>

        <div class="section">
          <p>Kedua belah pihak sepakat untuk mengikatkan diri dalam Surat Perintah Kerja pengadaan ${paket.jenisPengadaan?.toLowerCase()} dengan ketentuan sebagai berikut:</p>
        </div>

        <div class="section">
          <h3>PASAL 1 - LINGKUP PEKERJAAN</h3>
          <table class="info-table">
            <tr>
              <td width="150">Nama Paket</td>
              <td>: ${paket.namaPaket}</td>
            </tr>
            <tr>
              <td>Jenis Pengadaan</td>
              <td>: ${paket.jenisPengadaan}</td>
            </tr>
          </table>
          <p>Rincian pekerjaan sebagaimana tercantum dalam lampiran yang merupakan bagian tidak terpisahkan dari SPK ini.</p>
        </div>

        <div class="section">
          <h3>PASAL 2 - NILAI SPK</h3>
          <p>Nilai SPK adalah sebesar <strong>${formatCurrency(totalNilai)}</strong> (${terbilang(Math.round(totalNilai))} rupiah) sudah termasuk PPN.</p>
        </div>

        <div class="section">
          <h3>PASAL 3 - JANGKA WAKTU PELAKSANAAN</h3>
          <p>Jangka waktu pelaksanaan pekerjaan adalah <strong>${kontrak.jangkaWaktu || paket.jangkaWaktu || 30} (${terbilang(kontrak.jangkaWaktu || paket.jangkaWaktu || 30)}) hari kalender</strong> terhitung sejak SPK ini ditandatangani.</p>
        </div>

        <div class="section">
          <h3>PASAL 4 - PEMBAYARAN</h3>
          <p>Pembayaran dilakukan setelah pekerjaan selesai 100% dan diterima dengan baik, dibuktikan dengan Berita Acara Serah Terima (BAST).</p>
        </div>

        <div class="section">
          <h3>PASAL 5 - DENDA KETERLAMBATAN</h3>
          <p>Apabila PIHAK KEDUA terlambat menyelesaikan pekerjaan, maka akan dikenakan denda keterlambatan sebesar 1/1000 (satu per seribu) dari nilai SPK untuk setiap hari keterlambatan, maksimal 5% dari nilai SPK.</p>
        </div>

        <div class="section">
          <h3>PASAL 6 - PENUTUP</h3>
          <p>Surat Perintah Kerja ini dibuat rangkap 2 (dua), masing-masing bermaterai cukup dan mempunyai kekuatan hukum yang sama.</p>
        </div>

        <div class="dual-signature">
          <div class="signature-left">
            <p><strong>PIHAK KESATU</strong></p>
            <p>Pejabat Pembuat Komitmen</p>
            <div class="signature-space"></div>
            <p><strong><u>${settings.namaPPK || '................................'}</u></strong></p>
            <p>NIP. ${settings.nipPPK || '................................'}</p>
          </div>
          <div class="signature-right">
            <p><strong>PIHAK KEDUA</strong></p>
            <p>${penyedia.nama || '................................'}</p>
            <div class="signature-space"></div>
            <p><strong><u>${penyedia.direktur || '................................'}</u></strong></p>
            <p>Direktur</p>
          </div>
        </div>
      </div>
    `
  }
}

/**
 * SPPBJ - Surat Penetapan Pemenang Barang/Jasa
 */
export const generateSPPBJ = (paket, penyedia = {}, settings = {}) => {
  return {
    title: 'SURAT PENETAPAN PEMENANG',
    subtitle: paket.namaPaket,
    content: `
      <div class="document sppbj">
        <div class="header">
          <h1>SURAT PENETAPAN PENYEDIA BARANG/JASA</h1>
          <h2>Nomor: ${paket.nomorSPPBJ || '....../SPPBJ/....../.....'}</h2>
        </div>

        <div class="section">
          <p>Sehubungan dengan pelaksanaan pengadaan ${paket.jenisPengadaan?.toLowerCase()} untuk paket pekerjaan:</p>

          <table class="info-table">
            <tr>
              <td width="180">Nama Paket</td>
              <td>: ${paket.namaPaket}</td>
            </tr>
            <tr>
              <td>Jenis Pengadaan</td>
              <td>: ${paket.jenisPengadaan}</td>
            </tr>
            <tr>
              <td>Metode Pengadaan</td>
              <td>: ${paket.metodePengadaan}</td>
            </tr>
            <tr>
              <td>Sumber Dana</td>
              <td>: ${paket.sumberDana || 'APBN'}</td>
            </tr>
            <tr>
              <td>Tahun Anggaran</td>
              <td>: ${paket.tahunAnggaran || new Date().getFullYear()}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <p>Dengan ini kami menetapkan:</p>

          <table class="info-table bordered">
            <tr>
              <td width="180">Nama Penyedia</td>
              <td>: ${penyedia.nama || '................................'}</td>
            </tr>
            <tr>
              <td>Direktur/Pemilik</td>
              <td>: ${penyedia.direktur || '................................'}</td>
            </tr>
            <tr>
              <td>NPWP</td>
              <td>: ${penyedia.npwp || '................................'}</td>
            </tr>
            <tr>
              <td>Alamat</td>
              <td>: ${formatAddress(penyedia)}</td>
            </tr>
            <tr>
              <td>Nilai Penawaran</td>
              <td>: ${formatCurrency(penyedia.nilaiPenawaran || paket.nilaiKontrak || 0)}</td>
            </tr>
          </table>

          <p>sebagai <strong>Penyedia Barang/Jasa</strong> untuk paket pekerjaan tersebut di atas.</p>
        </div>

        <div class="section">
          <p>Demikian Surat Penetapan Penyedia Barang/Jasa ini dibuat untuk digunakan sebagaimana mestinya.</p>
        </div>

        <div class="signature">
          <p>${settings.tempatTTD || '................................'}, ${getCurrentDate()}</p>
          <p>Pejabat Pembuat Komitmen</p>
          <div class="signature-space"></div>
          <p><strong><u>${settings.namaPPK || '................................'}</u></strong></p>
          <p>NIP. ${settings.nipPPK || '................................'}</p>
        </div>
      </div>
    `
  }
}

/**
 * BA Negosiasi - Berita Acara Negosiasi
 */
export const generateBANegosiasi = (paket, penyedia = {}, items = [], settings = {}) => {
  const nilaiPenawaran = penyedia.nilaiPenawaran || items.reduce((sum, item) => sum + (item.hargaSatuan * item.volume), 0)
  const nilaiNegosiasi = penyedia.nilaiNegosiasi || nilaiPenawaran * 0.95

  return {
    title: 'BERITA ACARA NEGOSIASI',
    subtitle: paket.namaPaket,
    content: `
      <div class="document ba-nego">
        <div class="header">
          <h1>BERITA ACARA NEGOSIASI TEKNIS DAN HARGA</h1>
          <h2>Nomor: ${paket.nomorBANego || '....../BA-NEGO/....../.....'}</h2>
        </div>

        <div class="section">
          <p>Pada hari ini ${getCurrentDate()}, telah dilaksanakan negosiasi teknis dan harga untuk paket pengadaan:</p>

          <table class="info-table">
            <tr>
              <td width="180">Nama Paket</td>
              <td>: ${paket.namaPaket}</td>
            </tr>
            <tr>
              <td>Jenis Pengadaan</td>
              <td>: ${paket.jenisPengadaan}</td>
            </tr>
            <tr>
              <td>HPS</td>
              <td>: ${formatCurrency(paket.nilaiHPS || paket.pagu || 0)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <p>Hadir dalam negosiasi:</p>
          <p><strong>Pihak Pemerintah:</strong></p>
          <ol>
            <li>${settings.namaPPK || '................................'} (PPK)</li>
            <li>${settings.namaPejabat2 || '................................'}</li>
          </ol>

          <p><strong>Pihak Penyedia:</strong></p>
          <p>${penyedia.nama || '................................'}</p>
          <p>Diwakili oleh: ${penyedia.direktur || '................................'}</p>
        </div>

        <div class="section">
          <h3>HASIL NEGOSIASI</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Uraian</th>
                <th>Nilai (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>HPS</td>
                <td class="right">${formatCurrency(paket.nilaiHPS || paket.pagu || 0)}</td>
              </tr>
              <tr>
                <td>Penawaran Awal</td>
                <td class="right">${formatCurrency(nilaiPenawaran)}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Hasil Negosiasi</strong></td>
                <td class="right"><strong>${formatCurrency(nilaiNegosiasi)}</strong></td>
              </tr>
            </tbody>
          </table>
          <p class="terbilang">Terbilang: <em>${terbilang(Math.round(nilaiNegosiasi))} rupiah</em></p>
        </div>

        <div class="section">
          <h3>KESIMPULAN</h3>
          <p>Berdasarkan hasil negosiasi teknis dan harga, disepakati bahwa ${penyedia.nama || '................................'} dapat melaksanakan pekerjaan sesuai dengan spesifikasi teknis yang dipersyaratkan dengan nilai sebesar ${formatCurrency(nilaiNegosiasi)}.</p>
        </div>

        <div class="section">
          <p>Demikian Berita Acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya.</p>
        </div>

        <div class="dual-signature">
          <div class="signature-left">
            <p><strong>Pejabat Pembuat Komitmen</strong></p>
            <div class="signature-space"></div>
            <p><strong><u>${settings.namaPPK || '................................'}</u></strong></p>
            <p>NIP. ${settings.nipPPK || '................................'}</p>
          </div>
          <div class="signature-right">
            <p><strong>Penyedia</strong></p>
            <div class="signature-space"></div>
            <p><strong><u>${penyedia.direktur || '................................'}</u></strong></p>
            <p>${penyedia.nama || '................................'}</p>
          </div>
        </div>
      </div>
    `
  }
}

/**
 * BAST - Berita Acara Serah Terima
 */
export const generateBAST = (paket, kontrak = {}, penyedia = {}, serahTerima = {}, settings = {}) => {
  const nilaiKontrak = kontrak.nilaiKontrak || paket.nilaiKontrak || 0

  return {
    title: 'BERITA ACARA SERAH TERIMA',
    subtitle: paket.namaPaket,
    content: `
      <div class="document bast">
        <div class="header">
          <h1>BERITA ACARA SERAH TERIMA ${serahTerima.jenis === 'FHO' ? 'AKHIR' : 'SEMENTARA'}</h1>
          <h2>Nomor: ${serahTerima.nomor || '....../BAST/....../.....'}</h2>
        </div>

        <div class="section">
          <p>Pada hari ini ${getCurrentDate()}, kami yang bertanda tangan di bawah ini:</p>

          <table class="info-table">
            <tr>
              <td width="30">1.</td>
              <td width="150">Nama</td>
              <td>: ${settings.namaPPK || '................................'}</td>
            </tr>
            <tr>
              <td></td>
              <td>Jabatan</td>
              <td>: Pejabat Pembuat Komitmen</td>
            </tr>
            <tr>
              <td></td>
              <td>Alamat</td>
              <td>: ${settings.alamatKantor || '................................'}</td>
            </tr>
          </table>

          <p>selanjutnya disebut <strong>PIHAK KESATU</strong></p>

          <table class="info-table">
            <tr>
              <td width="30">2.</td>
              <td width="150">Nama</td>
              <td>: ${penyedia.direktur || '................................'}</td>
            </tr>
            <tr>
              <td></td>
              <td>Jabatan</td>
              <td>: Direktur ${penyedia.nama || '................................'}</td>
            </tr>
            <tr>
              <td></td>
              <td>Alamat</td>
              <td>: ${formatAddress(penyedia)}</td>
            </tr>
          </table>

          <p>selanjutnya disebut <strong>PIHAK KEDUA</strong></p>
        </div>

        <div class="section">
          <p>Berdasarkan Surat Perintah Kerja Nomor ${kontrak.nomorKontrak || '................................'} tanggal ${formatDate(kontrak.tanggalKontrak)}, dengan ini menyatakan bahwa:</p>

          <table class="info-table bordered">
            <tr>
              <td width="180">Nama Paket</td>
              <td>: ${paket.namaPaket}</td>
            </tr>
            <tr>
              <td>Nilai Kontrak</td>
              <td>: ${formatCurrency(nilaiKontrak)}</td>
            </tr>
            <tr>
              <td>Jangka Waktu</td>
              <td>: ${kontrak.jangkaWaktu || paket.jangkaWaktu || 30} hari kalender</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <p>Telah diserahkan oleh <strong>PIHAK KEDUA</strong> dan diterima oleh <strong>PIHAK KESATU</strong> dengan kondisi ${serahTerima.kondisi || 'baik dan sesuai dengan spesifikasi yang dipersyaratkan'}.</p>

          ${serahTerima.catatan ? `<p><strong>Catatan:</strong> ${serahTerima.catatan}</p>` : ''}
        </div>

        <div class="section">
          <p>Demikian Berita Acara Serah Terima ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
        </div>

        <div class="dual-signature">
          <div class="signature-left">
            <p><strong>PIHAK KESATU</strong></p>
            <p>Yang Menerima</p>
            <div class="signature-space"></div>
            <p><strong><u>${settings.namaPPK || '................................'}</u></strong></p>
            <p>NIP. ${settings.nipPPK || '................................'}</p>
          </div>
          <div class="signature-right">
            <p><strong>PIHAK KEDUA</strong></p>
            <p>Yang Menyerahkan</p>
            <div class="signature-space"></div>
            <p><strong><u>${penyedia.direktur || '................................'}</u></strong></p>
            <p>Direktur</p>
          </div>
        </div>
      </div>
    `
  }
}

/**
 * BA Pemeriksaan - Berita Acara Pemeriksaan
 */
export const generateBAPemeriksaan = (paket, kontrak = {}, penyedia = {}, pemeriksaan = {}, items = [], settings = {}) => {
  return {
    title: 'BERITA ACARA PEMERIKSAAN',
    subtitle: paket.namaPaket,
    content: `
      <div class="document ba-pemeriksaan">
        <div class="header">
          <h1>BERITA ACARA PEMERIKSAAN HASIL PEKERJAAN</h1>
          <h2>Nomor: ${pemeriksaan.nomor || '....../BAPP/....../.....'}</h2>
        </div>

        <div class="section">
          <p>Pada hari ini ${getCurrentDate()}, Tim Pemeriksa Hasil Pekerjaan yang ditetapkan berdasarkan ${settings.dasarSK || 'Surat Keputusan'} telah melakukan pemeriksaan atas hasil pekerjaan:</p>

          <table class="info-table">
            <tr>
              <td width="180">Nama Paket</td>
              <td>: ${paket.namaPaket}</td>
            </tr>
            <tr>
              <td>Nomor SPK</td>
              <td>: ${kontrak.nomorKontrak || '................................'}</td>
            </tr>
            <tr>
              <td>Tanggal SPK</td>
              <td>: ${formatDate(kontrak.tanggalKontrak)}</td>
            </tr>
            <tr>
              <td>Penyedia</td>
              <td>: ${penyedia.nama || '................................'}</td>
            </tr>
            <tr>
              <td>Nilai Kontrak</td>
              <td>: ${formatCurrency(kontrak.nilaiKontrak || 0)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>HASIL PEMERIKSAAN</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Uraian Pekerjaan</th>
                <th>Volume Kontrak</th>
                <th>Volume Terpasang</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, idx) => `
                <tr>
                  <td class="center">${idx + 1}</td>
                  <td>${item.namaItem || item.nama}</td>
                  <td class="center">${formatNumber(item.volume)} ${item.satuan}</td>
                  <td class="center">${formatNumber(item.volumeTerpasang || item.volume)} ${item.satuan}</td>
                  <td>${item.keterangan || 'Sesuai'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>KESIMPULAN</h3>
          <p>Berdasarkan hasil pemeriksaan, Tim Pemeriksa menyimpulkan bahwa pekerjaan telah dilaksanakan dengan <strong>${pemeriksaan.kesimpulan || 'baik dan sesuai dengan spesifikasi yang dipersyaratkan dalam kontrak'}</strong>.</p>

          ${pemeriksaan.catatan ? `<p><strong>Catatan/Rekomendasi:</strong> ${pemeriksaan.catatan}</p>` : ''}
        </div>

        <div class="section">
          <p>Demikian Berita Acara Pemeriksaan ini dibuat dengan sebenarnya.</p>
        </div>

        <div class="triple-signature">
          <div class="signature-item">
            <p><strong>Ketua Tim Pemeriksa</strong></p>
            <div class="signature-space"></div>
            <p><strong><u>${settings.ketuaTim || '........................'}</u></strong></p>
            <p>NIP. ${settings.nipKetuaTim || '........................'}</p>
          </div>
          <div class="signature-item">
            <p><strong>Anggota</strong></p>
            <div class="signature-space"></div>
            <p><strong><u>${settings.anggota1 || '........................'}</u></strong></p>
            <p>NIP. ${settings.nipAnggota1 || '........................'}</p>
          </div>
          <div class="signature-item">
            <p><strong>Anggota</strong></p>
            <div class="signature-space"></div>
            <p><strong><u>${settings.anggota2 || '........................'}</u></strong></p>
            <p>NIP. ${settings.nipAnggota2 || '........................'}</p>
          </div>
        </div>

        <div class="signature" style="margin-top: 40px;">
          <p>Mengetahui,</p>
          <p>Pejabat Pembuat Komitmen</p>
          <div class="signature-space"></div>
          <p><strong><u>${settings.namaPPK || '................................'}</u></strong></p>
          <p>NIP. ${settings.nipPPK || '................................'}</p>
        </div>
      </div>
    `
  }
}

/**
 * Kuitansi - Bukti Pembayaran
 */
export const generateKuitansi = (paket, pembayaran = {}, penyedia = {}, settings = {}) => {
  const nilaiPembayaran = pembayaran.nilaiGross || pembayaran.nilai || 0
  const nilaiPajak = pembayaran.totalPajak || 0
  const nilaiNetto = nilaiPembayaran - nilaiPajak

  return {
    title: 'KUITANSI PEMBAYARAN',
    subtitle: paket.namaPaket,
    content: `
      <div class="document kuitansi">
        <div class="header">
          <h1>KUITANSI</h1>
          <h2>Nomor: ${pembayaran.nomor || '....../KWT/....../.....'}</h2>
        </div>

        <div class="section kuitansi-body">
          <table class="info-table">
            <tr>
              <td width="200">Sudah Terima Dari</td>
              <td>: ${settings.satuanKerja || '................................'}</td>
            </tr>
            <tr>
              <td>Uang Sebesar</td>
              <td>: <div class="amount-box">${terbilang(Math.round(nilaiNetto))} rupiah</div></td>
            </tr>
            <tr>
              <td>Untuk Pembayaran</td>
              <td>: ${pembayaran.keterangan || `Pembayaran ${paket.jenisPengadaan?.toLowerCase()} ${paket.namaPaket}`}</td>
            </tr>
          </table>

          <table class="info-table" style="margin-top: 20px;">
            <tr>
              <td width="200">Nilai Tagihan</td>
              <td>: ${formatCurrency(nilaiPembayaran)}</td>
            </tr>
            ${pembayaran.pph21 ? `
            <tr>
              <td>PPh 21 (2.5%)</td>
              <td>: ${formatCurrency(pembayaran.pph21)}</td>
            </tr>
            ` : ''}
            ${pembayaran.pph22 ? `
            <tr>
              <td>PPh 22 (1.5%)</td>
              <td>: ${formatCurrency(pembayaran.pph22)}</td>
            </tr>
            ` : ''}
            ${pembayaran.pph23 ? `
            <tr>
              <td>PPh 23 (2%)</td>
              <td>: ${formatCurrency(pembayaran.pph23)}</td>
            </tr>
            ` : ''}
            ${pembayaran.pphFinal ? `
            <tr>
              <td>PPh Final (0.5%)</td>
              <td>: ${formatCurrency(pembayaran.pphFinal)}</td>
            </tr>
            ` : ''}
            <tr>
              <td><strong>Jumlah Diterima</strong></td>
              <td>: <strong>${formatCurrency(nilaiNetto)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="dual-signature" style="margin-top: 40px;">
          <div class="signature-left">
            <p>${settings.tempatTTD || '................................'}, ${getCurrentDate()}</p>
            <p>Yang Menerima,</p>
            <div class="signature-space">
              <p style="text-align: center; padding-top: 30px;">Materai<br/>Rp 10.000</p>
            </div>
            <p><strong><u>${penyedia.direktur || '................................'}</u></strong></p>
            <p>${penyedia.nama || '................................'}</p>
          </div>
          <div class="signature-right">
            <p>&nbsp;</p>
            <p>Setuju Dibayar,</p>
            <p>Pejabat Pembuat Komitmen</p>
            <div class="signature-space"></div>
            <p><strong><u>${settings.namaPPK || '................................'}</u></strong></p>
            <p>NIP. ${settings.nipPPK || '................................'}</p>
          </div>
        </div>

        <div class="signature" style="margin-top: 30px;">
          <p>Lunas Dibayar Tanggal: ................................</p>
          <p>Bendahara Pengeluaran</p>
          <div class="signature-space"></div>
          <p><strong><u>${settings.namaBendahara || '................................'}</u></strong></p>
          <p>NIP. ${settings.nipBendahara || '................................'}</p>
        </div>
      </div>
    `
  }
}

/**
 * SPMK - Surat Perintah Mulai Kerja
 */
export const generateSPMK = (paket, kontrak = {}, penyedia = {}, settings = {}) => {
  return {
    title: 'SURAT PERINTAH MULAI KERJA',
    subtitle: paket.namaPaket,
    content: `
      <div class="document spmk">
        <div class="header">
          <h1>SURAT PERINTAH MULAI KERJA</h1>
          <h2>Nomor: ${kontrak.nomorSPMK || '....../SPMK/....../.....'}</h2>
        </div>

        <div class="section">
          <p>Berdasarkan Surat Perintah Kerja Nomor ${kontrak.nomorKontrak || '................................'} tanggal ${formatDate(kontrak.tanggalKontrak)}, dengan ini memerintahkan kepada:</p>

          <table class="info-table bordered">
            <tr>
              <td width="180">Nama Penyedia</td>
              <td>: ${penyedia.nama || '................................'}</td>
            </tr>
            <tr>
              <td>Direktur</td>
              <td>: ${penyedia.direktur || '................................'}</td>
            </tr>
            <tr>
              <td>Alamat</td>
              <td>: ${formatAddress(penyedia)}</td>
            </tr>
            <tr>
              <td>NPWP</td>
              <td>: ${penyedia.npwp || '................................'}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <p>Untuk segera memulai pelaksanaan pekerjaan:</p>

          <table class="info-table">
            <tr>
              <td width="180">Nama Paket</td>
              <td>: ${paket.namaPaket}</td>
            </tr>
            <tr>
              <td>Jenis Pengadaan</td>
              <td>: ${paket.jenisPengadaan}</td>
            </tr>
            <tr>
              <td>Nilai Kontrak</td>
              <td>: ${formatCurrency(kontrak.nilaiKontrak || 0)}</td>
            </tr>
            <tr>
              <td>Jangka Waktu</td>
              <td>: ${kontrak.jangkaWaktu || paket.jangkaWaktu || 30} hari kalender</td>
            </tr>
            <tr>
              <td>Tanggal Mulai</td>
              <td>: ${formatDate(kontrak.tanggalMulai || new Date())}</td>
            </tr>
            <tr>
              <td>Tanggal Selesai</td>
              <td>: ${formatDate(kontrak.tanggalSelesai)}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <p>Pekerjaan harus diselesaikan sesuai dengan spesifikasi teknis dan waktu yang telah ditentukan dalam SPK.</p>
        </div>

        <div class="section">
          <p>Demikian Surat Perintah Mulai Kerja ini dikeluarkan untuk dilaksanakan dengan penuh tanggung jawab.</p>
        </div>

        <div class="signature">
          <p>${settings.tempatTTD || '................................'}, ${getCurrentDate()}</p>
          <p>Pejabat Pembuat Komitmen</p>
          <div class="signature-space"></div>
          <p><strong><u>${settings.namaPPK || '................................'}</u></strong></p>
          <p>NIP. ${settings.nipPPK || '................................'}</p>
        </div>
      </div>
    `
  }
}

/**
 * Document CSS Styles
 */
export const getDocumentStyles = () => `
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      background: #fff;
    }

    .document {
      max-width: 21cm;
      margin: 0 auto;
      padding: 1cm;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
    }

    .header h1 {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .header h2 {
      font-size: 12pt;
      font-weight: normal;
    }

    .section {
      margin-bottom: 20px;
    }

    .section h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .section p {
      text-align: justify;
      margin-bottom: 10px;
    }

    .section ol, .section ul {
      margin-left: 20px;
      margin-bottom: 10px;
    }

    .section li {
      margin-bottom: 5px;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }

    .info-table td {
      padding: 5px 0;
      vertical-align: top;
    }

    .info-table.bordered td {
      border: 1px solid #000;
      padding: 8px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    .data-table th,
    .data-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }

    .data-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }

    .data-table .center {
      text-align: center;
    }

    .data-table .right {
      text-align: right;
    }

    .data-table .total-row {
      background-color: #f5f5f5;
      font-weight: bold;
    }

    .data-table tfoot td {
      font-weight: bold;
    }

    .terbilang {
      font-style: italic;
      margin-top: 10px;
    }

    .signature {
      margin-top: 50px;
      text-align: center;
      width: 250px;
      margin-left: auto;
    }

    .signature p {
      text-align: center;
      margin-bottom: 5px;
    }

    .signature-space {
      height: 80px;
    }

    .dual-signature {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
    }

    .dual-signature .signature-left,
    .dual-signature .signature-right {
      width: 45%;
      text-align: center;
    }

    .dual-signature p {
      text-align: center;
      margin-bottom: 5px;
    }

    .triple-signature {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
    }

    .triple-signature .signature-item {
      width: 30%;
      text-align: center;
    }

    .triple-signature p {
      text-align: center;
      margin-bottom: 5px;
    }

    .amount-box {
      border: 1px solid #000;
      padding: 10px;
      font-weight: bold;
      text-transform: capitalize;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .document {
        padding: 0;
      }

      .no-print {
        display: none !important;
      }
    }
  </style>
`

/**
 * Export all document generators
 */
export const DOCUMENT_GENERATORS = {
  kak: generateKAK,
  hps: generateHPS,
  spk: generateSPK,
  sppbj: generateSPPBJ,
  ba_nego: generateBANegosiasi,
  bast: generateBAST,
  ba_pemeriksaan: generateBAPemeriksaan,
  kuitansi: generateKuitansi,
  spmk: generateSPMK,
}

/**
 * Get documents required for current workflow stage
 */
export const getRequiredDocuments = (status) => {
  const documentsByStage = {
    PERENCANAAN: ['kak', 'hps'],
    PERSIAPAN: ['kak', 'hps'],
    PEMILIHAN: ['ba_nego', 'sppbj'],
    KONTRAK: ['sppbj', 'spk', 'spmk'],
    PELAKSANAAN: ['spk', 'spmk'],
    SERAH_TERIMA: ['ba_pemeriksaan', 'bast'],
    PEMBAYARAN: ['kuitansi'],
    SELESAI: ['bast', 'kuitansi'],
  }

  return documentsByStage[status] || []
}
