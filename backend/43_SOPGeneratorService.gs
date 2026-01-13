/**
 * 43_SOPGeneratorService.gs
 * Sprint 5: Production & Audit Readiness
 *
 * SOP Generator
 * - Auto-generate SOP PDF documents
 * - Cara membuat paket
 * - Cara generate dokumen
 * - Cara arsip & cetak audit bundle
 * - Cara backup & restore
 */

// ========================================
// SOP GENERATOR SERVICE
// ========================================

const SOPGeneratorService = {

  /**
   * Generate SOP: Cara Membuat Paket Pengadaan
   */
  generateSOPPaket: function() {
    try {
      const config = ConfigService.getConfig();
      const doc = DocumentApp.create('SOP - Pembuatan Paket Pengadaan');
      const body = doc.getBody();

      this.setDocumentStyle(body);

      // Header
      this.addKopSurat(body, config);

      const title = body.appendParagraph('STANDAR OPERASIONAL PROSEDUR');
      title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const subtitle = body.appendParagraph('PEMBUATAN PAKET PENGADAAN BARANG/JASA');
      subtitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph('');

      // 1. Tujuan
      body.appendParagraph('1. TUJUAN').setBold(true);
      body.appendParagraph('Prosedur ini bertujuan untuk memberikan panduan dalam membuat dan mengelola paket pengadaan barang/jasa menggunakan sistem PPK Digital Assistant.');
      body.appendParagraph('');

      // 2. Ruang Lingkup
      body.appendParagraph('2. RUANG LINGKUP').setBold(true);
      body.appendParagraph('SOP ini mencakup:');
      body.appendListItem('Pembuatan paket pengadaan baru');
      body.appendListItem('Pengelolaan workflow paket');
      body.appendListItem('Input data kontrak dan pembayaran');
      body.appendListItem('Monitoring status paket');
      body.appendParagraph('');

      // 3. Prosedur
      body.appendParagraph('3. PROSEDUR').setBold(true);
      body.appendParagraph('');

      body.appendParagraph('3.1 Membuat Paket Baru').setBold(true);
      body.appendListItem('Buka menu "Paket Pengadaan" di sidebar');
      body.appendListItem('Klik tombol "Tambah Paket"');
      body.appendListItem('Isi data paket: Nama Paket, Pagu, Tahun Anggaran, Metode Pengadaan');
      body.appendListItem('Klik "Simpan" untuk menyimpan paket dalam status DRAFT');
      body.appendParagraph('');

      body.appendParagraph('3.2 Memajukan Workflow').setBold(true);
      body.appendListItem('Buka detail paket yang akan dimajukan');
      body.appendListItem('Pastikan semua data untuk tahap berikutnya sudah lengkap');
      body.appendListItem('Klik tombol "Maju ke Tahap Berikutnya"');
      body.appendListItem('Sistem akan melakukan validasi otomatis');
      body.appendListItem('Jika ada warning, perhatikan dan perbaiki jika perlu');
      body.appendParagraph('');

      body.appendParagraph('3.3 Input Data Kontrak').setBold(true);
      body.appendListItem('Majukan paket ke tahap KONTRAK');
      body.appendListItem('Klik tab "Kontrak" pada detail paket');
      body.appendListItem('Isi data: Nomor Kontrak, Tanggal, Nilai Kontrak, Data Penyedia');
      body.appendListItem('Upload dokumen kontrak jika ada');
      body.appendParagraph('');

      body.appendParagraph('3.4 Input Pembayaran').setBold(true);
      body.appendListItem('Buka tab "Pembayaran" pada detail paket');
      body.appendListItem('Klik "Tambah Pembayaran"');
      body.appendListItem('Isi data SPM: Nomor, Tanggal, Nilai');
      body.appendListItem('Sistem akan mengecek apakah total pembayaran <= nilai kontrak');
      body.appendParagraph('');

      // 4. Alur Workflow
      body.appendParagraph('4. ALUR WORKFLOW PAKET').setBold(true);
      body.appendParagraph('DRAFT → PERENCANAAN → HPS → PENGADAAN → KONTRAK → PELAKSANAAN → SERAH TERIMA → PEMBAYARAN → SELESAI');
      body.appendParagraph('');

      // 5. Catatan
      body.appendParagraph('5. CATATAN PENTING').setBold(true);
      body.appendListItem('Paket yang sudah SELESAI tidak dapat diubah');
      body.appendListItem('Gunakan tombol "Kembali ke Tahap Sebelumnya" jika perlu koreksi');
      body.appendListItem('Lakukan simulasi audit sebelum menyelesaikan paket');
      body.appendParagraph('');

      // Footer
      this.addDocumentFooter(body, config, 'SOP-PPK-001');

      doc.saveAndClose();

      return this.saveAndMoveDocument(doc, 'SOP');

    } catch (e) {
      console.error('Error generating SOP Paket:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Generate SOP: Cara Generate Dokumen
   */
  generateSOPDokumen: function() {
    try {
      const config = ConfigService.getConfig();
      const doc = DocumentApp.create('SOP - Generate Dokumen');
      const body = doc.getBody();

      this.setDocumentStyle(body);
      this.addKopSurat(body, config);

      const title = body.appendParagraph('STANDAR OPERASIONAL PROSEDUR');
      title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const subtitle = body.appendParagraph('PEMBUATAN DOKUMEN PENGADAAN');
      subtitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph('');

      // 1. Tujuan
      body.appendParagraph('1. TUJUAN').setBold(true);
      body.appendParagraph('Prosedur ini menjelaskan cara membuat dokumen-dokumen pengadaan menggunakan template otomatis di sistem PPK Digital Assistant.');
      body.appendParagraph('');

      // 2. Jenis Dokumen
      body.appendParagraph('2. JENIS DOKUMEN YANG DAPAT DI-GENERATE').setBold(true);
      body.appendParagraph('');

      body.appendParagraph('A. Dokumen Paket Pengadaan:').setBold(true);
      body.appendListItem('Kerangka Acuan Kerja (KAK)');
      body.appendListItem('Harga Perkiraan Sendiri (HPS)');
      body.appendListItem('Surat Penetapan Penyedia');
      body.appendListItem('Surat Perjanjian Kerja (SPK/Kontrak)');
      body.appendListItem('Surat Perintah Mulai Kerja (SPMK)');
      body.appendListItem('Berita Acara Serah Terima (BAST)');
      body.appendListItem('Berita Acara Pembayaran');
      body.appendListItem('Kuitansi');
      body.appendParagraph('');

      body.appendParagraph('B. Dokumen Perjalanan Dinas:').setBold(true);
      body.appendListItem('Surat Tugas');
      body.appendListItem('SPPD (Surat Perintah Perjalanan Dinas)');
      body.appendListItem('Kuitansi/Bukti Pembayaran Rampung');
      body.appendListItem('Daftar Pengeluaran Riil');
      body.appendParagraph('');

      // 3. Prosedur
      body.appendParagraph('3. PROSEDUR GENERATE DOKUMEN').setBold(true);
      body.appendParagraph('');

      body.appendParagraph('3.1 Untuk Paket Pengadaan:').setBold(true);
      body.appendListItem('Buka detail paket yang akan dibuatkan dokumen');
      body.appendListItem('Klik menu "Dokumen" di halaman detail');
      body.appendListItem('Pilih jenis dokumen yang akan dibuat');
      body.appendListItem('Klik "Preview" untuk melihat hasil');
      body.appendListItem('Klik "Simpan ke Google Drive" untuk menyimpan');
      body.appendListItem('Dokumen akan tersimpan di folder dan tercatat di sistem');
      body.appendParagraph('');

      body.appendParagraph('3.2 Untuk Perjalanan Dinas:').setBold(true);
      body.appendListItem('Buka detail perjalanan dinas');
      body.appendListItem('Pastikan data pelaksana dan biaya sudah lengkap');
      body.appendListItem('Klik menu "Dokumen" atau tombol "Generate Kuitansi"');
      body.appendListItem('Pilih jenis dokumen yang dibutuhkan');
      body.appendListItem('Klik "Simpan ke Google Drive"');
      body.appendParagraph('');

      // 4. Catatan
      body.appendParagraph('4. CATATAN PENTING').setBold(true);
      body.appendListItem('Pastikan semua data sudah lengkap sebelum generate');
      body.appendListItem('Dokumen yang sudah di-generate tersimpan di Google Drive');
      body.appendListItem('Gunakan "Preview Lokal" untuk mengecek sebelum menyimpan');
      body.appendListItem('Dokumen dapat di-generate ulang jika ada perubahan data');
      body.appendParagraph('');

      this.addDocumentFooter(body, config, 'SOP-PPK-002');

      doc.saveAndClose();
      return this.saveAndMoveDocument(doc, 'SOP');

    } catch (e) {
      console.error('Error generating SOP Dokumen:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Generate SOP: Arsip & Audit Bundle
   */
  generateSOPAuditBundle: function() {
    try {
      const config = ConfigService.getConfig();
      const doc = DocumentApp.create('SOP - Arsip dan Audit Bundle');
      const body = doc.getBody();

      this.setDocumentStyle(body);
      this.addKopSurat(body, config);

      const title = body.appendParagraph('STANDAR OPERASIONAL PROSEDUR');
      title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const subtitle = body.appendParagraph('PENGARSIPAN DAN PERSIAPAN AUDIT');
      subtitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph('');

      // 1. Tujuan
      body.appendParagraph('1. TUJUAN').setBold(true);
      body.appendParagraph('Prosedur ini menjelaskan cara mengarsipkan dokumen dan menyiapkan bundle dokumen untuk keperluan audit BPK/APIP.');
      body.appendParagraph('');

      // 2. Pengarsipan
      body.appendParagraph('2. PENGARSIPAN DOKUMEN').setBold(true);
      body.appendParagraph('');

      body.appendParagraph('2.1 Struktur Arsip:').setBold(true);
      body.appendListItem('Semua dokumen tersimpan di Google Drive');
      body.appendListItem('Dokumen dikelompokkan per tahun anggaran');
      body.appendListItem('Setiap paket memiliki folder sendiri');
      body.appendListItem('Dokumen perjalanan dinas tersimpan terpisah');
      body.appendParagraph('');

      body.appendParagraph('2.2 Versi Dokumen:').setBold(true);
      body.appendListItem('Sistem mencatat versi setiap dokumen');
      body.appendListItem('Status dokumen: DRAFT, FINAL, REVISED, VOID');
      body.appendListItem('Dokumen FINAL terkunci dari perubahan');
      body.appendListItem('Riwayat revisi tercatat lengkap');
      body.appendParagraph('');

      // 3. Audit Bundle
      body.appendParagraph('3. MEMBUAT AUDIT BUNDLE').setBold(true);
      body.appendParagraph('');

      body.appendParagraph('3.1 Langkah-langkah:').setBold(true);
      body.appendListItem('Buka menu "Reporting"');
      body.appendListItem('Pilih paket yang akan disiapkan');
      body.appendListItem('Klik "Generate Audit Bundle"');
      body.appendListItem('Sistem akan mengumpulkan semua dokumen terkait');
      body.appendListItem('Download bundle dalam format ZIP');
      body.appendParagraph('');

      body.appendParagraph('3.2 Isi Audit Bundle:').setBold(true);
      body.appendListItem('Semua dokumen pengadaan (KAK, HPS, Kontrak, dll)');
      body.appendListItem('Bukti pembayaran dan kuitansi');
      body.appendListItem('Berita acara');
      body.appendListItem('Lampiran pendukung');
      body.appendListItem('Laporan ringkasan paket');
      body.appendParagraph('');

      // 4. Simulasi Audit
      body.appendParagraph('4. SIMULASI AUDIT').setBold(true);
      body.appendParagraph('');
      body.appendListItem('Gunakan fitur "Simulasi Audit" sebelum audit sesungguhnya');
      body.appendListItem('Sistem akan mengecek kelengkapan dokumen');
      body.appendListItem('Sistem memvalidasi kesesuaian nilai dan tanggal');
      body.appendListItem('Perbaiki temuan sebelum audit');
      body.appendListItem('Cetak Laporan Kesiapan Audit');
      body.appendParagraph('');

      this.addDocumentFooter(body, config, 'SOP-PPK-003');

      doc.saveAndClose();
      return this.saveAndMoveDocument(doc, 'SOP');

    } catch (e) {
      console.error('Error generating SOP Audit Bundle:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Generate SOP: Backup & Restore
   */
  generateSOPBackupRestore: function() {
    try {
      const config = ConfigService.getConfig();
      const doc = DocumentApp.create('SOP - Backup dan Restore Data');
      const body = doc.getBody();

      this.setDocumentStyle(body);
      this.addKopSurat(body, config);

      const title = body.appendParagraph('STANDAR OPERASIONAL PROSEDUR');
      title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
      title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      const subtitle = body.appendParagraph('BACKUP DAN RESTORE DATA');
      subtitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);
      subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

      body.appendParagraph('');

      // 1. Tujuan
      body.appendParagraph('1. TUJUAN').setBold(true);
      body.appendParagraph('Prosedur ini menjelaskan mekanisme backup dan restore data untuk menjaga keamanan dan ketersediaan data sistem PPK Digital Assistant.');
      body.appendParagraph('');

      // 2. Backup Otomatis
      body.appendParagraph('2. BACKUP OTOMATIS').setBold(true);
      body.appendParagraph('');

      body.appendParagraph('2.1 Jadwal Backup:').setBold(true);
      body.appendListItem('Backup harian dilakukan otomatis setiap pukul 02:00 WIB');
      body.appendListItem('Backup penuh (full) dilakukan setiap hari Minggu');
      body.appendListItem('Backup incremental dilakukan di hari lainnya');
      body.appendListItem('Backup disimpan per tahun anggaran');
      body.appendParagraph('');

      body.appendParagraph('2.2 Lokasi Backup:').setBold(true);
      body.appendListItem('Folder: Backup_PPK/TA_[TAHUN]');
      body.appendListItem('Format nama: PPK_Backup_[TIMESTAMP]');
      body.appendListItem('Backup lama dibersihkan otomatis (tersimpan 30 terakhir)');
      body.appendParagraph('');

      // 3. Backup Manual
      body.appendParagraph('3. BACKUP MANUAL').setBold(true);
      body.appendParagraph('');
      body.appendListItem('Buka menu "Pengaturan" atau API /api/backup/create');
      body.appendListItem('Klik "Buat Backup Sekarang"');
      body.appendListItem('Tunggu proses selesai');
      body.appendListItem('Backup akan tersimpan di folder yang sama');
      body.appendParagraph('');

      // 4. Restore
      body.appendParagraph('4. RESTORE DATA').setBold(true);
      body.appendParagraph('');

      body.appendParagraph('4.1 Kapan Perlu Restore:').setBold(true);
      body.appendListItem('Data tidak sengaja terhapus');
      body.appendListItem('Spreadsheet corrupt atau error');
      body.appendListItem('Perlu mengembalikan ke kondisi sebelumnya');
      body.appendParagraph('');

      body.appendParagraph('4.2 Langkah Restore:').setBold(true);
      body.appendListItem('Buka menu "Riwayat Backup"');
      body.appendListItem('Pilih backup yang akan di-restore');
      body.appendListItem('Klik "Verifikasi" untuk mengecek integritas');
      body.appendListItem('Klik "Restore" dan konfirmasi');
      body.appendListItem('Sistem akan mengganti data dengan data backup');
      body.appendParagraph('');

      // 5. Catatan
      body.appendParagraph('5. CATATAN PENTING').setBold(true);
      body.appendListItem('Restore akan MENGGANTI data yang ada saat ini');
      body.appendListItem('Lakukan backup manual sebelum restore sebagai pengaman');
      body.appendListItem('Restore hanya dapat dilakukan oleh administrator');
      body.appendListItem('Hubungi administrator jika ada masalah');
      body.appendParagraph('');

      this.addDocumentFooter(body, config, 'SOP-PPK-004');

      doc.saveAndClose();
      return this.saveAndMoveDocument(doc, 'SOP');

    } catch (e) {
      console.error('Error generating SOP Backup:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Generate all SOPs
   */
  generateAllSOPs: function() {
    const results = [];

    results.push({ name: 'SOP Paket', result: this.generateSOPPaket() });
    results.push({ name: 'SOP Dokumen', result: this.generateSOPDokumen() });
    results.push({ name: 'SOP Audit Bundle', result: this.generateSOPAuditBundle() });
    results.push({ name: 'SOP Backup Restore', result: this.generateSOPBackupRestore() });

    const success = results.filter(r => r.result.success).length;
    const failed = results.filter(r => !r.result.success).length;

    return {
      success: failed === 0,
      data: {
        generated: success,
        failed: failed,
        results: results
      }
    };
  },

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  setDocumentStyle: function(body) {
    body.setPageWidth(595.276);  // A4
    body.setPageHeight(841.89);
    body.setMarginTop(60);
    body.setMarginBottom(50);
    body.setMarginLeft(60);
    body.setMarginRight(60);
  },

  addKopSurat: function(body, config) {
    // Institution header
    if (config.namaInstansi) {
      const instansi = body.appendParagraph(config.namaInstansi);
      instansi.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      instansi.setBold(true);
      instansi.setFontSize(14);
    }

    if (config.namaSatker) {
      const satker = body.appendParagraph(config.namaSatker);
      satker.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      satker.setBold(true);
      satker.setFontSize(12);
    }

    if (config.alamatSatker) {
      const alamat = body.appendParagraph(config.alamatSatker);
      alamat.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
      alamat.setFontSize(10);
    }

    body.appendHorizontalRule();
    body.appendParagraph('');
  },

  addDocumentFooter: function(body, config, docNumber) {
    body.appendParagraph('');
    body.appendHorizontalRule();

    const footer = body.appendParagraph(
      'Dokumen ini diterbitkan oleh ' + (config.namaSatker || 'Satuan Kerja') +
      '\nNomor Dokumen: ' + docNumber +
      '\nTanggal Terbit: ' + formatTanggalIndo(new Date().toISOString())
    );
    footer.setFontSize(9);
    footer.setItalic(true);
  },

  saveAndMoveDocument: function(doc, folderName) {
    const file = DriveApp.getFileById(doc.getId());
    const folder = getOrCreateFolder(folderName);
    file.moveTo(folder);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      success: true,
      data: {
        docId: doc.getId(),
        docUrl: doc.getUrl(),
        docName: doc.getName()
      }
    };
  }
};
