import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import { KONFIGURASI_NOTIFIKASI } from './konfigurasi';

export type ModeNotifikasiGrup = 'Semua pesan' | 'Hanya @sebutan' | 'Nonaktifkan';

const modeNotifikasiNative = new Map<string, ModeNotifikasiGrup>();
const KUNCI_MODE_NOTIFIKASI = '@management_sistem_mode_notifikasi_';

export async function muatModeNotifikasiGrup(teamId: string): Promise<ModeNotifikasiGrup> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(`${KUNCI_MODE_NOTIFIKASI}${teamId}`);
    if (
      stored === 'Semua pesan' ||
      stored === 'Hanya @sebutan' ||
      stored === 'Nonaktifkan'
    ) {
      return stored;
    }
  }

  return modeNotifikasiNative.get(teamId) || 'Semua pesan';
}

export async function simpanModeNotifikasiGrup(
  teamId: string,
  mode: ModeNotifikasiGrup
): Promise<void> {
  modeNotifikasiNative.set(teamId, mode);
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(`${KUNCI_MODE_NOTIFIKASI}${teamId}`, mode);
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: KONFIGURASI_NOTIFIKASI.SUARA_NOTIFIKASI !== null,
    shouldSetBadge: false,
    shouldShowBanner: KONFIGURASI_NOTIFIKASI.TAMPILKAN_NOTIFIKASI,
    shouldShowList: KONFIGURASI_NOTIFIKASI.TAMPILKAN_NOTIFIKASI,
  }),
});

export async function siapkanNotifikasiChat(): Promise<boolean> {
  if (!KONFIGURASI_NOTIFIKASI.AKTIF) {
    return false;
  }

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Browser ini tidak mendukung notifikasi desktop.');
      return false;
    }

    const status =
      window.Notification.permission === 'granted'
        ? 'granted'
        : await window.Notification.requestPermission();

    if (status !== 'granted') {
      console.warn('Izin notifikasi browser tidak diberikan.');
      return false;
    }

    return true;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(KONFIGURASI_NOTIFIKASI.CHANNEL_ID, {
        name: KONFIGURASI_NOTIFIKASI.NAMA_CHANNEL,
        importance: AndroidImportance.HIGH,
        sound: KONFIGURASI_NOTIFIKASI.SUARA_NOTIFIKASI,
        vibrationPattern: KONFIGURASI_NOTIFIKASI.GETAR ? [0, 250, 250, 250] : [0],
        enableVibrate: KONFIGURASI_NOTIFIKASI.GETAR,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    const { status } =
      existingStatus === 'granted'
        ? { status: existingStatus }
        : await Notifications.requestPermissionsAsync();

    if (status !== 'granted') {
      console.warn('Izin notifikasi chat tidak diberikan.');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Gagal menyiapkan notifikasi chat:', error);
    return false;
  }
}

export async function kirimNotifikasiChat({
  namaPengirim,
  pesan,
  teamId,
  mode = 'Semua pesan',
}: {
  namaPengirim: string;
  pesan: string;
  teamId: string;
  mode?: ModeNotifikasiGrup;
}): Promise<void> {
  if (
    !KONFIGURASI_NOTIFIKASI.AKTIF ||
    mode === 'Nonaktifkan' ||
    (mode === 'Hanya @sebutan' && !pesan.includes('@'))
  ) {
    return;
  }

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (window.Notification.permission === 'granted') {
      const notification = new window.Notification(
        `${KONFIGURASI_NOTIFIKASI.JUDUL_CHAT} dari ${namaPengirim}`,
        {
          body: pesan || 'Mengirim lampiran',
          tag: `chat-${teamId}`,
        }
      );
      notification.onclick = () => notification.close();
    }
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${KONFIGURASI_NOTIFIKASI.JUDUL_CHAT} dari ${namaPengirim}`,
        body: pesan || 'Mengirim lampiran',
        sound: KONFIGURASI_NOTIFIKASI.SUARA_NOTIFIKASI,
        data: { teamId },
      },
      trigger:
        Platform.OS === 'android'
          ? { channelId: KONFIGURASI_NOTIFIKASI.CHANNEL_ID }
          : null,
    });
  } catch (error) {
    console.error('Gagal mengirim notifikasi chat:', error);
  }
}
