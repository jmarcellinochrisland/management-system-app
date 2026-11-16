// Konfigurasi Warna
export const WARNA = {
  UTAMA: '#075E54',
  SEKUNDER: '#00A884',
  BAHAYA: '#DC2626',
  PERINGATAN: '#F59E0B',
  SUKSES: '#10B981',
  INFO: '#3B82F6',
  ABU_ABU: '#64748B',
  PUTIH: '#FFFFFF',
  HITAM: '#000000',
  HIJAU_CHAT: '#D9FDD3',
  BIRU_CENTANG: '#34B7F1',
  ABU_CENTANG: '#8696A0',
};

// Kunci Storage
export const KUNCI_PENYIMPANAN = {
  PESAN_CHAT: '@management_sistem_pesan_chat_v1',
  DATA_PENGGUNA: '@management_sistem_data_pengguna',
  PENGATURAN: '@management_sistem_pengaturan',
  DATA_TIM: '@management_sistem_data_tim',
};

// Emoji Cepat
export const EMOJI_CEPAT = ['👍', '❤️', '🔥', '🚀', '✅', '🙏', '💻', '🎯', '😂', '👏'];

// Tipe Lampiran
export const TIPE_LAMPIRAN = {
  DOKUMEN: 'document',
  GAMBAR: 'image',
  KAMERA: 'camera',
  TUGAS: 'task',
  LOKASI: 'location',
  SUARA: 'voice',
} as const;

// Status Pesan
export const STATUS_PESAN = {
  TERKIRIM: 'sent',
  DITERIMA: 'delivered',
  DIBACA: 'read',
} as const;

// Role Anggota
export const ROLE_ANGGOTA = {
  ADMIN: 'admin',
  ANGGOTA: 'member',
} as const;

// Prefix Storage
export const PREFIX_PENYIMPANAN = '@management_sistem_';

// Ukuran File
export const UKURAN_FILE = {
  MAKSIMAL_GAMBAR: 20 * 1024 * 1024, // 20MB
  MAKSIMAL_DOKUMEN: 50 * 1024 * 1024, // 50MB
  MAKSIMAL_VIDEO: 10000 * 1024 * 1024, // 10000MB
};

// Tipe File yang Diperbolehkan
export const TIPE_FILE_DIIZINKAN = {
  GAMBAR: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif', 'image/jpg'], // Semua format gambar umum
  DOKUMEN: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  VIDEO: ['video/mp4', 'video/quicktime', 'video/webm'],
};

// Pesan Error
export const PESAN_ERROR = {
  UKURAN_FILE_TERLALU_BESAR: 'Ukuran file terlalu besar',
  TIPE_FILE_TIDAK_DIZINKAN: 'Tipe file tidak diperbolehkan',
  GAGAL_MENGUNGGAH: 'Gagal mengunggah file',
  GAGAL_MENYIMPAN: 'Gagal menyimpan file',
  KONEKSI_TERPUTUS: 'Koneksi terputus',
};

// Konfigurasi Notifikasi diatas
export const KONFIGURASI_NOTIFIKASI = {
  AKTIF: true,
  CHANNEL_ID: 'notifikasi-chat',
  NAMA_CHANNEL: 'Notifikasi Chat',
  JUDUL_CHAT: 'Pesan baru',
  SUARA_NOTIFIKASI: 'default', // Bisa diganti dengan path ke file suara notifikasi
  GETAR: true,
  TAMPILKAN_NOTIFIKASI: true,
  DURASI_TAMPILAN_DETIK: 1,
};