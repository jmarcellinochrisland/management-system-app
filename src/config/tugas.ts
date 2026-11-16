export type StatusTugas = 'proses' | 'selesai';

export type TugasItem = {
  id: string;
  nama: string;
  deskripsi: string;
  tanggalDibuat: string;
  deadline: string;
  teamId: string;
  namaTim: string;
  dibuatOlehEmail?: string;
  dibuatOlehNama?: string;
  attachmentUrls?: string[];
  /** Kept for compatibility with tasks saved before multiple attachments were supported. */
  attachmentUrl?: string;
  status: StatusTugas;
};

const STORAGE_KEY = '@management_sistem_tugas_v1';
let tugasNative: TugasItem[] = [];

export async function muatTugas(): Promise<TugasItem[]> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TugasItem[];
        return parsed.map((task) => ({
          ...task,
          attachmentUrls: task.attachmentUrls?.length
            ? task.attachmentUrls
            : task.attachmentUrl
              ? [task.attachmentUrl]
              : [],
        }));
      }
    } catch (error) {
      console.error('Gagal memuat tugas:', error);
    }
  }
  return tugasNative;
}

export async function simpanTugas(tugas: TugasItem[]): Promise<void> {
  tugasNative = tugas;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tugas));
    } catch (error) {
      console.error('Gagal menyimpan tugas:', error);
    }
  }
}
