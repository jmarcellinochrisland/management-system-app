import AppStatusBar from '@/components/app-status-bar';
import { useAuth, type Team } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';

import {
  EMOJI_CEPAT,
  KUNCI_PENYIMPANAN,
  PESAN_ERROR,
  STATUS_PESAN,
  TIPE_FILE_DIIZINKAN,
  TIPE_LAMPIRAN,
  UKURAN_FILE,
  WARNA,
} from '@/config/konfigurasi';
import {
  muatModeNotifikasiGrup,
  simpanModeNotifikasiGrup,
  type ModeNotifikasiGrup,
} from '@/config/notifikasi';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable // Tambahkan Pressable untuk tombol yang bisa ditekan
  ,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Function to take photo with camera
const ambilFotoDenganKamera = async (): Promise<{ uri: string; name: string } | null> => {
  try {
    // 1. Request camera permission
    const izinHasil = await ImagePicker.requestCameraPermissionsAsync();

    if (!izinHasil.granted) {
      Alert.alert('Izin Ditolak', 'Aplikasi butuh izin untuk mengakses kamera Anda.');
      return null;
    }

    // 2. Open camera untuk ambil gambar
    const hasilKamera = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (hasilKamera.canceled || !hasilKamera.assets || hasilKamera.assets.length === 0) {
      return null;
    }

    const asetGambar = hasilKamera.assets[0];

    // 3. Return URI and file name
    const namaFile = asetGambar.fileName || `foto_${Date.now()}.jpg`;
    return { uri: asetGambar.uri, name: namaFile };
  } catch (error) {
    console.error('Gagal mengambil foto dengan kamera:', error);
    Alert.alert(PESAN_ERROR.GAGAL_MENYIMPAN, 'Terjadi kesalahan saat mengambil foto');
    return null;
  }
};



// Function to pick image from gallery (screenshot, etc.)
const pilihGambarDariGaleri = async (): Promise<{ uri: string; name: string } | null> => {
  try {
    // 1. Minta izin akses galeri
    const izinHasil = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!izinHasil.granted) {
      Alert.alert('Izin Ditolak', 'Aplikasi butuh izin untuk mengakses galeri Anda.');
      return null;
    }

    // 2. Buka picker gambar dari galeri saja (tanpa kamera)
    const hasilPicker = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // Tidak perlu edit, langsung ambil screenshot
      quality: 1, // Kualitas maksimal untuk screenshot
    });

    if (hasilPicker.canceled || !hasilPicker.assets || hasilPicker.assets.length === 0) {
      return null;
    }
    // 3. Kirim notifikasi
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Gambar Dipilih',
        body: 'Gambar telah dipilih dari galeri.',
      },
      trigger: null,
    });

    const asetGambar = hasilPicker.assets[0];

    // 3. Cek tipe file (izinkan semua format gambar umum)
    if (
      asetGambar.mimeType &&
      !asetGambar.mimeType.toLowerCase().startsWith('image/') &&
      !TIPE_FILE_DIIZINKAN.GAMBAR.includes(asetGambar.mimeType.toLowerCase())
    ) {
      Alert.alert(PESAN_ERROR.TIPE_FILE_TIDAK_DIZINKAN, 'Format file tidak didukung. Harap pilih gambar.');
      return null;
    }

    // 4. Kembalikan URI dan nama file gambar
    const namaFile = asetGambar.fileName || `gambar_${Date.now()}.jpg`;
    return { uri: asetGambar.uri, name: namaFile };
  } catch (error) {
    console.error('Gagal memilih gambar dari galeri:', error);
    Alert.alert(PESAN_ERROR.GAGAL_MENYIMPAN, 'Terjadi kesalahan saat memilih gambar');
    return null;
  }
};

// Fungsi memilih berkas / dokumen dari penyimpanan lokal mobile
const pickAndSaveAnyFile = async (): Promise<{ uri: string; name: string; size?: number; mimeType?: string } | null> => {
  try {
    // 1. Buka file manager / dokumen picker di HP user
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*', // Mengizinkan SEMUA jenis file (PDF, Gambar, Doc, Zip, dll)
      copyToCacheDirectory: true,
    });

    // 2. Cek apakah pengguna membatalkan pilihan file
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const file = result.assets[0];

    // 3. Cek batas ukuran dokumen
    if (file.size && file.size > UKURAN_FILE.MAKSIMAL_DOKUMEN) {
      Alert.alert(
        PESAN_ERROR.UKURAN_FILE_TERLALU_BESAR,
        `Ukuran file terlalu besar (maksimal ${UKURAN_FILE.MAKSIMAL_DOKUMEN / (1024 * 1024)}MB).`
      );
      return null;
    }

    // 4. Kembalikan URI dan nama file
    const namaFile = file.name || `dokumen_${Date.now()}`;
    return {
      uri: file.uri,
      name: namaFile,
      size: file.size,
      mimeType: file.mimeType,
    };
  } catch (error) {
    console.error('Gagal memilih file dokumen:', error);
    Alert.alert(PESAN_ERROR.GAGAL_MENYIMPAN, 'Terjadi kesalahan saat memilih berkas dokumen');
    return null;
  }
};

export type ChatMessage = {
  id: string;
  senderName: string;
  senderEmail: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  isAdmin?: boolean;
  status?: 'sent' | 'delivered' | 'read';
  readBy?: string[]; // Array email yang sudah baca
  reaction?: string;
  attachmentType?: string;
  attachmentName?: string;
  attachmentUri?: string; // URI gambar / dokumen
  attachmentSize?: number; // Ukuran file (bytes)
  poll?: {
    question: string;
    options: Array<{
      text: string;
      votes: number;
      voters: string[]; // Array email yang sudah vote
    }>;
  };
};

// Prefix untuk key penyimpanan pesan chat per tim di localStorage (web)
  
const STORAGE_PREFIX = KUNCI_PENYIMPANAN.PESAN_CHAT;

// Helper deteksi MIME Type berkas
const getMimeTypeFromFileName = (fileName?: string): string => {
  if (!fileName) return '*/*';
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'xls':
      return 'application/vnd.ms-excel';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'ppt':
      return 'application/vnd.ms-powerpoint';
    case 'pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'txt':
      return 'text/plain';
    case 'csv':
      return 'text/csv';
    case 'zip':
      return 'application/zip';
    case 'rar':
      return 'application/x-rar-compressed';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return '*/*';
  }
};

// Helper format ukuran file (Bytes -> KB / MB)
const formatUkuranBerkas = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Helper rincian berkas (ekstensi, ikon, dan warna tema WhatsApp)
const getFileDetails = (fileName?: string) => {
  const ext = fileName ? fileName.split('.').pop()?.toUpperCase() || 'FILE' : 'FILE';
  let iconName: keyof typeof Ionicons.glyphMap = 'document-text';
  let badgeColor = '#5F66CD';

  switch (ext.toLowerCase()) {
    case 'pdf':
      iconName = 'document-text';
      badgeColor = '#DC2626'; // Merah khas PDF
      break;
    case 'doc':
    case 'docx':
      iconName = 'document-text';
      badgeColor = '#2563EB'; // Biru khas Word
      break;
    case 'xls':
    case 'xlsx':
    case 'csv':
      iconName = 'stats-chart';
      badgeColor = '#16A34A'; // Hijau khas Excel
      break;
    case 'ppt':
    case 'pptx':
      iconName = 'easel';
      badgeColor = '#EA580C'; // Oranye khas PPT
      break;
    case 'zip':
    case 'rar':
    case '7z':
      iconName = 'archive';
      badgeColor = '#D97706'; // Amber khas arsip
      break;
    default:
      iconName = 'document-attach';
      badgeColor = WARNA.UTAMA;
  }

  return { ext, iconName, badgeColor };
};

// Helper cek tipe lampiran
const isGambarAttachment = (type?: string) =>
  type === TIPE_LAMPIRAN.GAMBAR || type === 'GAMBAR' || type === 'image';

const isDokumenAttachment = (type?: string) =>
  type === TIPE_LAMPIRAN.DOKUMEN || type === 'DOKUMEN' || type === 'document';

const isTugasAttachment = (type?: string) =>
  type === TIPE_LAMPIRAN.TUGAS || type === 'TUGAS' || type === 'task';

export default function MassageGrupScreen() {
  const insets = useSafeAreaInsets();
  const { user, leaveTeam } = useAuth();
  const params = useLocalSearchParams<{ teamId?: string; companyId?: string; teamName?: string }>();

  // Dapatkan company aktif
  const selectedCompany = user?.companies.find(
    (c) => c.id === (params.companyId || user?.activeCompanyId || user?.companies[0]?.id)
  );

  const daftarTim = selectedCompany?.daftarTimCompany || [];

  // Cari tim yang sesuai dengan param teamId, atau default ke tim pertama yang user ikuti
  const initialTeam =
    daftarTim.find((t) => t.id === params.teamId) ||
    daftarTim.find((t) =>
      t.members.some((m) => m.email.toLowerCase() === (user?.email || '').toLowerCase())
    ) ||
    daftarTim[0];

  const [currentTeam, setCurrentTeam] = useState<Team | undefined>(initialTeam);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNotificationOptions, setShowNotificationOptions] = useState(false);
  const [notificationMode, setNotificationMode] =
    useState<ModeNotifikasiGrup>('Semua pesan');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTeamSwitcher, setShowTeamSwitcher] = useState(false);
  const [selectedMessageForReaction, setSelectedMessageForReaction] = useState<ChatMessage | null>(null);
  const [infoModalTab, setInfoModalTab] = useState<'anggota' | 'media' | 'pengaturan'>('anggota');
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  // State untuk pencarian pesan
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!currentTeam) return;

    void muatModeNotifikasiGrup(currentTeam.id).then(setNotificationMode);
  }, [currentTeam?.id]);

  // Muat pesan dari localStorage (web) atau in-memory state saat tim berubah
  useEffect(() => {
    if (!currentTeam) return;

    if (Platform.OS === 'web') {
      try {
        const stored = window.localStorage?.getItem(`${STORAGE_PREFIX}${currentTeam.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Tambahkan attachmentUri: undefined untuk pesan lama yang tidak punya field ini
            const messagesWithUri = parsed.map((msg: ChatMessage) => ({
              ...msg,
              attachmentUri: msg.attachmentUri || undefined,
            }));
            setMessages(messagesWithUri);
            return;
          }
        }
      } catch {}
    }

    setMessages([]);
  }, [currentTeam?.id]);

  // Simpan pesan ke storage
  const saveMessages = (newMessages: ChatMessage[]) => {
    console.log('Saving messages:', newMessages.map(m => ({ id: m.id, attachmentType: m.attachmentType, attachmentUri: m.attachmentUri })));
    setMessages(newMessages);
    if (currentTeam && Platform.OS === 'web') {
      try {
        window.localStorage?.setItem(
          `${STORAGE_PREFIX}${currentTeam.id}`,
          JSON.stringify(newMessages)
        );
      } catch {}
    }
  };

  const handleMessagePress = (message: ChatMessage) => {
    if (!message.isMe || !user || message.senderEmail.toLowerCase() !== user.email.toLowerCase()) {
      return;
    }

    Alert.alert('Aksi Pesan', 'Apa yang ingin Anda lakukan?', [
      {
        text: 'Edit',
        onPress: () => {
          setEditingMessageId(message.id);
          setInputText(message.text);
        },
      },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Hapus Pesan', 'Pesan ini akan dihapus dari chat.', [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Hapus',
              style: 'destructive',
              onPress: () => {
                saveMessages(messages.filter((item) => item.id !== message.id));
                if (editingMessageId === message.id) {
                  setEditingMessageId(null);
                  setInputText('');
                }
              },
            },
          ]);
        },
      },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const handleEditMessage = () => {
    if (!editingMessageId) {
      handleSendMessage();
      return;
    }

    const updatedText = inputText.trim();
    if (!updatedText) {
      Alert.alert('Pesan Kosong', 'Isi pesan tidak boleh kosong.');
      return;
    }

    saveMessages(
      messages.map((message) =>
        message.id === editingMessageId ? { ...message, text: updatedText } : message
      )
    );
    setInputText('');
    setEditingMessageId(null);
    setShowEmojiPicker(false);
  };

  const handleHapusChat = () => {
    if (!currentTeam) return;

    Alert.alert(
      'Hapus Chat',
      'Semua pesan di chat ini akan dihapus. Anda tetap menjadi anggota grup.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setMessages([]);
            setShowInfoModal(false);

            if (Platform.OS === 'web') {
              try {
                window.localStorage?.removeItem(`${STORAGE_PREFIX}${currentTeam.id}`);
              } catch (error) {
                console.error('Gagal menghapus chat dari penyimpanan:', error);
                Alert.alert('Gagal', 'Chat tidak dapat dihapus. Silakan coba lagi.');
                return;
              }
            }
            Alert.alert('Berhasil', 'Chat berhasil dihapus.');
          },
        },
      ]
    );
  };

  const handleKeluarGrup = () => {
    if (!currentTeam) return;

    Alert.alert(
      'Keluar Grup',
      'Anda akan keluar dari grup ini. Chat akan tetap tersimpan untuk anggota lain.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            setShowInfoModal(false);

            const result = await leaveTeam(
              selectedCompany?.id || params.companyId || '',
              currentTeam.id
            );
            if (!result.success) {
              Alert.alert('Gagal keluar grup', result.error || 'Anda belum keluar dari grup.');
              return;
            }
            router.replace('/dashboard');
          },
        },
      ]
    );
  };

  // Saat user membuka chat, tandai pesan orang lain sebagai sudah dibaca oleh user ini
  useEffect(() => {
    if (!currentTeam || !user) return;

    setMessages((prev) =>
      prev.map((msg) => {
        // Jika pesan bukan dari user ini, tambahkan user ke readBy
        if (msg.senderEmail.toLowerCase() !== user.email.toLowerCase()) {
          const currentReadBy = msg.readBy || [];
          const userEmailLower = user.email.toLowerCase();
          if (!currentReadBy.includes(userEmailLower)) {
            return {
              ...msg,
              readBy: [...currentReadBy, userEmailLower],
            };
          }
        }
        return msg;
      })
    );
  }, [currentTeam?.id, user?.email]);

  // Cek apakah user adalah anggota atau admin dari tim saat ini
  const isMember = currentTeam?.members.some(
    (m) => m.email.toLowerCase() === (user?.email || '').toLowerCase()
  );
  const isAdmin =
    currentTeam?.adminEmail.toLowerCase() === (user?.email || '').toLowerCase() ||
    currentTeam?.members.some(
      (m) => m.email.toLowerCase() === (user?.email || '').toLowerCase() && m.role === 'admin'
    );

  // Helper: Cek apakah pesan sudah dibaca oleh semua anggota (kecuali sender)
  const isMessageReadByAll = (message: ChatMessage) => {
    if (!message.isMe) return false; // Hanya pesan sendiri yang perlu dicek

    const otherMembers = currentTeam?.members.filter(
      (m) => m.email.toLowerCase() !== message.senderEmail.toLowerCase()
    ) || [];

    if (otherMembers.length === 0) return true; // Jika tidak ada member lain, dianggap sudah baca

    const readCount = message.readBy?.length || 0;
    return readCount >= otherMembers.length;
  };

  // Handler kirim pesan teks
  const handleSendMessage = (
    customText?: string,
    attachment?: { type: string; name: string; uri?: string; size?: number }
  ) => {
    const textToSend = customText !== undefined ? customText : inputText;
    if (!textToSend.trim() && !attachment) return;
    if (!currentTeam || !user) return;

    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: user.name,
      senderEmail: user.email,
      text: textToSend.trim(),
      timestamp: timeString,
      isMe: true,
      isAdmin: !!isAdmin,
      status: STATUS_PESAN.TERKIRIM,
      attachmentType: attachment?.type,
      attachmentName: attachment?.name,
      attachmentUri: attachment?.uri,
      attachmentSize: attachment?.size,
    };

    const updated = [...messages, newMsg];
    saveMessages(updated);
    setInputText('');
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

  };

  // Buka atau unduh berkas lampiran (fitur mirip WhatsApp)
  const handleBukaAtauUnduhFile = async (item: ChatMessage) => {
    if (!item.attachmentUri) {
      Alert.alert(
        'Berkas Tidak Ditemukan',
        `Berkas "${item.attachmentName || 'Dokumen'}" belum memiliki URL atau file lokal yang tersimpan.`
      );
      return;
    }

    try {
      setDownloadingId(item.id);

      // 1. Jika di platform Web
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = item.attachmentUri;
        link.download = item.attachmentName || 'dokumen';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      let fileUri = item.attachmentUri;

      // 2. Jika merupakan URL online (http/https), unduh ke cache terlebih dahulu
      if (fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
        const cacheDir = new Directory(Paths.cache);
        const downloadedFile = await File.downloadFileAsync(fileUri, cacheDir, { idempotent: true });
        fileUri = downloadedFile.uri;
      }

      // 3. Periksa ketersediaan modul sharing di perangkat mobile
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Tidak Didukung',
          'Perangkat ini tidak mendukung fitur pembuka / pembagian berkas secara langsung.'
        );
        return;
      }

      const mimeType = getMimeTypeFromFileName(item.attachmentName);

      // 4. Buka dialog native sistem (Buka Dengan aplikasi pembaca / Simpan ke Download)
      await Sharing.shareAsync(fileUri, {
        dialogTitle: `Buka atau Unduh: ${item.attachmentName || 'Berkas'}`,
        mimeType: mimeType,
        UTI: mimeType,
      });
    } catch (error) {
      console.error('Gagal membuka/mengunduh berkas:', error);
      Alert.alert(
        'Gagal Membuka Berkas',
        'Terjadi kendala saat membuka atau mengunduh berkas. Pastikan aplikasi pembaca dokumen terpasang di HP Anda.'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  // Handler klik attachment (berbeda untuk tugas vs dokumen/gambar)
  const handleAttachmentPress = (item: ChatMessage) => {
    if (isTugasAttachment(item.attachmentType)) {
      // Tampilkan pilihan untuk tugas tim
      Alert.alert(
        'Tugas Sprint Tim',
        `Apa yang ingin Anda lakukan dengan tugas "${item.attachmentName || 'Tugas'}"?`,
        [
          {
            text: 'Lihat Detail',
            onPress: () => {
              // TODO: Navigasi ke halaman detail tugas
              Alert.alert('Info', 'Fitur detail tugas akan segera hadir');
            },
          },
          {
            text: 'Mark Selesai',
            onPress: () => {
              // Update status tugas di pesan
              const updated = messages.map((m) => {
                if (m.id === item.id) {
                  return {
                    ...m,
                    text: m.text.replace('• Aktif', '• Selesai').replace('• Aktif', '• Selesai'),
                  };
                }
                return m;
              });
              saveMessages(updated);
              Alert.alert('Berhasil', 'Tugas ditandai sebagai selesai');
            },
          },
          {
            text: 'Batal',
            style: 'cancel',
          },
        ]
      );
    } else {
      // Untuk dokumen dan gambar, gunakan handler existing
      handleBukaAtauUnduhFile(item);
    }
  };

  // Reaksi emoji pada pesan
  const handleAddReaction = (messageId: string, emoji: string) => {
    const updated = messages.map((m) => {
      if (m.id === messageId) {
        return {
          ...m,
          reaction: m.reaction === emoji ? undefined : emoji,
        };
      }
      return m;
    });
    saveMessages(updated);
    setSelectedMessageForReaction(null);
  };

  // Kirim lampiran dokumen / gambar / tugas
  const handleSendAttachment = async (type: string) => {
    setShowAttachmentMenu(false);

    if (type === 'DOKUMEN') {
      const dokumenData = await pickAndSaveAnyFile();
      if (dokumenData) {
        console.log('Dokumen dipilih:', dokumenData);
        const caption = inputText.trim();
        handleSendMessage(caption, {
          type: TIPE_LAMPIRAN.DOKUMEN,
          name: dokumenData.name,
          uri: dokumenData.uri,
          size: dokumenData.size,
        });
      }
    } else if (type === 'GAMBAR') {
      const gambarData = await pilihGambarDariGaleri();
      if (gambarData) {
        console.log('Gambar dipilih:', gambarData);
        const caption = inputText.trim();
        handleSendMessage(caption, {
          type: TIPE_LAMPIRAN.GAMBAR,
          name: gambarData.name,
          uri: gambarData.uri,
        });
      }
    } else if (type === 'KAMERA') {
      const fotoData = await ambilFotoDenganKamera();
      if (fotoData) {
        console.log('Foto diambil:', fotoData);
        const caption = inputText.trim();
        handleSendMessage(caption, {
          type: TIPE_LAMPIRAN.GAMBAR,
          name: fotoData.name,
          uri: fotoData.uri,
        });
      }
    } else if (type === 'TUGAS') {
      handleSendMessage('Status Tiket Tugas Sprint Mingguan Tim', {
        type: TIPE_LAMPIRAN.TUGAS,
        name: 'Tiket_Sprint_Task_#204',
      });
    }
  };

  // Handler untuk membuat polling
  const handleCreatePoll = () => {
    if (!pollQuestion.trim()) {
      Alert.alert('Error', 'Pertanyaan polling tidak boleh kosong');
      return;
    }

    const validOptions = pollOptions.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Minimal 2 opsi polling diperlukan');
      return;
    }

    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: user?.name || 'User',
      senderEmail: user?.email || 'user@company.com',
      text: pollQuestion,
      timestamp: timeString,
      isMe: true,
      isAdmin: !!isAdmin,
      status: STATUS_PESAN.TERKIRIM,
      poll: {
        question: pollQuestion,
        options: validOptions.map(opt => ({
          text: opt,
          votes: 0,
          voters: [],
        })),
      },
    };

    const updated = [...messages, newMsg];
    saveMessages(updated);
    setShowPollModal(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  // Handler untuk vote pada polling
  const handleVotePoll = (messageId: string, optionIndex: number) => {
    if (!user) return;

    const updated = messages.map((m) => {
      if (m.id === messageId && m.poll) {
        const userEmail = user.email.toLowerCase();
        const hasVoted = m.poll.options[optionIndex].voters.includes(userEmail);
        const updatedOptions = m.poll.options.map((opt, idx) => {
          if (idx === optionIndex) {
            // Jika user sudah vote di opsi ini, cancel vote (klik dua kali)
            if (hasVoted) {
              return {
                ...opt,
                votes: Math.max(0, opt.votes - 1),
                voters: opt.voters.filter(v => v !== userEmail),
              };
            }
            // Jika user belum vote di opsi ini, tambahkan vote
            return {
              ...opt,
              votes: opt.votes + 1,
              voters: [...opt.voters, userEmail],
            };
          } else {
            // Hapus vote user dari opsi lain (single choice)
            if (opt.voters.includes(userEmail)) {
              return {
                ...opt,
                votes: Math.max(0, opt.votes - 1),
                voters: opt.voters.filter(v => v !== userEmail),
              };
            }
          }
          return opt;
        });
        // Pastikan tidak ada opsi dengan votes negatif
        const finalOptions = updatedOptions.map(opt => ({
          ...opt,
          votes: Math.max(0, opt.votes),
        }));
        return {
          ...m,
          poll: {
            ...m.poll,
            options: finalOptions,
          },
        };
      }
      return m;
    });

    saveMessages(updated);
  };

  // Warna nama sender acak tapi konsisten per nama
  const getSenderColor = (name: string) => {
    const colors = ['#1F7A8C', '#E54B4B', '#2E7D32', '#6B5B95', '#D97706', '#C026D3', '#0284C7'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Jika tidak ada tim yang tersedia
  if (!currentTeam) {
    return (
      <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right', 'bottom']}>
        <AppStatusBar style="light" />
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.replace('/dashboard')} style={styles.headerIconButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Grup Chat Tim</Text>
        </View>

        <View style={styles.noTeamContainer}>
          <View style={styles.noTeamIconCircle}>
            <Ionicons name="chatbubbles-outline" size={54} color={WARNA.UTAMA} />
          </View>
          <Text style={styles.noTeamTitle}>Belum Ada Grup Tim</Text>
          <Text style={styles.noTeamDesc}>
            Anda belum bergabung ke dalam tim manapun. Buat tim baru atau minta bergabung ke tim yang ada melalui dashboard.
          </Text>
          <TouchableOpacity
            style={styles.backToDashboardBtn}
            onPress={() => router.replace('/dashboard')}>
            <Ionicons name="home-outline" size={18} color="#FFFFFF" />
            <Text style={styles.backToDashboardBtnText}>Kembali ke Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <AppStatusBar style="light" />

      {/* ============================================================ */}
      {/* WHATSAPP GROUP HEADER                                        */}
      {/* ============================================================ */}
      <View style={styles.headerBar}>
        {searchBarVisible ? (
          /* Search Bar di Header (menutupi info grup) */
          <View style={styles.headerSearchContainer}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
            <TextInput
              style={styles.headerSearchInput}
              placeholder="Cari pesan..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setSearchBarVisible(false); setSearchQuery(''); }}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Tombol Kembali & Avatar */}
            <TouchableOpacity
              style={styles.backButtonContainer}
              activeOpacity={0.7}
              onPress={() => router.replace('/dashboard')}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              <View style={styles.headerAvatarCircle}>
                <Ionicons
                  name={(currentTeam.icon as any) || 'people'}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </TouchableOpacity>

            {/* Info Tim & Status Mengetik (Ketuk untuk Info Grup) */}
            <TouchableOpacity
              style={styles.headerTitleContainer}
              activeOpacity={0.8}
              onPress={() => setShowInfoModal(true)}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {currentTeam.name}
                </Text>
                {isAdmin && (
                  <View style={styles.headerAdminBadge}>
                    <Text style={styles.headerAdminBadgeText}>ADMIN</Text>
                  </View>
                )}
              </View>

              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {`${currentTeam.members.length} anggota • ${currentTeam.members
                  .map((m) => m.name.split(' ')[0])
                  .slice(0, 4)
                  .join(', ')}...`}
              </Text>
            </TouchableOpacity>

            {/* Tombol Aksi Header: Panggilan & Menu 3 Titik */}
            <View style={styles.headerActionsCluster}>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => {
                }}>

              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconButton}
                onPress={() => {
                  setInfoModalTab('pengaturan');
                  setShowInfoModal(true);
                }}>
                <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ============================================================ */}
      {/* WHATSAPP CHAT WALLPAPER & PESAN                              */}
      {/* ============================================================ */}
      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        
        {/* Banner Peringatan Enkripsi End-to-End WhatsApp */}
        <View style={styles.encryptionCard}>
          <Ionicons name="lock-closed" size={12} color="#856404" />
          <Text style={styles.encryptionText}>
            Pesan dan panggilan dienkripsi secara end-to-end. Tidak seorang pun di luar grup ini yang dapat membaca koordinasi tim Anda.
          </Text>
        </View>

        {/* Daftar Pesan Chat */}
        <FlatList
          ref={flatListRef}
          // Filter messages berdasarkan searchQuery
          data={searchQuery ? messages.filter(m => 
            m.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
            m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
          ) : messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.messageListContent, { paddingBottom: 20 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            // Tampilan Pesan Sistem
            if (item.senderName === 'Sistem') {
              return (
                <View style={styles.systemBubbleContainer}>
                  <View style={styles.systemBubble}>
                    <Text style={styles.systemBubbleText}>{item.text}</Text>
                  </View>
                </View>
              );
            }

            return (
              <Pressable
                onPress={() => handleMessagePress(item)}
                onLongPress={() => setSelectedMessageForReaction(item)}
                style={[
                  styles.messageBubbleRow,
                  item.isMe ? styles.myMessageRow : styles.otherMessageRow,
                ]}>
                <View
                  style={[
                    styles.messageBubble,
                    item.isMe ? styles.myMessageBubble : styles.otherMessageBubble,
                  ]}>
                  {/* Nama Pengirim (Jika Pesan Orang Lain) */}
                  {!item.isMe && (
                    <View style={styles.senderHeaderRow}>
                      <Text
                        style={[
                          styles.senderNameText,
                          { color: getSenderColor(item.senderName) },
                        ]}>
                        {item.senderName}
                      </Text>
                      {item.isAdmin && (
                        <View style={styles.bubbleAdminTag}>
                          <Text style={styles.bubbleAdminTagText}>Admin</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Lampiran Khusus (Dokumen, Gambar, Tugas) */}
                  {isGambarAttachment(item.attachmentType) ? (
                    <View style={styles.imageAttachmentContainer}>
                      {item.attachmentUri ? (
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() => setPreviewImageUri(item.attachmentUri || null)}>
                          <Image
                            source={{ uri: item.attachmentUri }}
                            style={styles.chatImage}
                            resizeMode="cover"
                            onLoad={() => console.log('Image loaded successfully:', item.attachmentUri)}
                            onError={(e) => console.log('Error loading image:', e.nativeEvent.error, 'URI:', item.attachmentUri)}
                          />
                          {item.attachmentName ? (
                            <Text style={styles.imageFileName} numberOfLines={1}>{item.attachmentName}</Text>
                          ) : null}
                        </TouchableOpacity>
                      ) : (
                        <View style={[styles.chatImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E5E7EB' }]}>
                          <Ionicons name="image" size={40} color="#9CA3AF" />
                          <Text style={styles.imageFileName} numberOfLines={1}>{item.attachmentName || 'Gambar'}</Text>
                        </View>
                      )}
                    </View>
                  ) : item.attachmentType ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleAttachmentPress(item)}
                      style={[
                        styles.attachmentBox,
                        item.isMe ? styles.myAttachmentBox : styles.otherAttachmentBox,
                      ]}>
                      {/* Ikon Berkas Berwarna Sesuai Ekstensi (WhatsApp Style) */}
                      <View
                        style={[
                          styles.attachmentIconBox,
                          {
                            backgroundColor: isDokumenAttachment(item.attachmentType)
                              ? getFileDetails(item.attachmentName).badgeColor
                              : isTugasAttachment(item.attachmentType)
                              ? '#0284C7'
                              : WARNA.UTAMA,
                          },
                        ]}>
                        <Ionicons
                          name={
                            isDokumenAttachment(item.attachmentType)
                              ? getFileDetails(item.attachmentName).iconName
                              : isTugasAttachment(item.attachmentType)
                              ? 'checkbox'
                              : 'attach'
                          }
                          size={22}
                          color="#FFFFFF"
                        />
                      </View>

                      {/* Detail Nama & Tipe/Ukuran Berkas */}
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text style={styles.attachmentFileName} numberOfLines={1}>
                          {item.attachmentName || 'Lampiran Berkas'}
                        </Text>
                        <Text style={styles.attachmentTypeLabel} numberOfLines={1}>
                          {isDokumenAttachment(item.attachmentType)
                            ? `${getFileDetails(item.attachmentName).ext}${
                                item.attachmentSize ? ` • ${formatUkuranBerkas(item.attachmentSize)}` : ''
                              } • Ketuk untuk membuka`
                            : isTugasAttachment(item.attachmentType)
                            ? 'Tugas Sprint Tim • Aktif'
                            : 'Berkas Lampiran'}
                        </Text>
                      </View>

                      {/* Tombol Status Unduh / Buka */}
                      <View style={styles.attachmentActionCircle}>
                        {downloadingId === item.id ? (
                          <ActivityIndicator size="small" color={WARNA.UTAMA} />
                        ) : (
                          <Ionicons
                            name={item.attachmentUri ? 'arrow-down-circle-outline' : 'open-outline'}
                            size={22}
                            color={WARNA.UTAMA}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  {/* Render Polling */}
                  {item.poll ? (
                    <View style={styles.pollContainer}>
                      <Text style={styles.pollQuestion}>{item.poll.question}</Text>
                      {item.poll.options.map((option: { text: string; votes: number; voters: string[] }, optIndex: number) => {
                        const totalVotes = item.poll!.options.reduce((sum: number, opt: { votes: number }) => sum + opt.votes, 0);
                        const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                        const hasVoted = option.voters.includes(user?.email?.toLowerCase() || '');

                        return (
                          <TouchableOpacity
                            key={optIndex}
                            style={[
                              styles.pollOptionBtn,
                              hasVoted && styles.pollOptionVoted,
                            ]}
                            onPress={() => handleVotePoll(item.id, optIndex)}>
                            <View style={styles.pollOptionContent}>
                              <View style={[styles.pollProgressBar, { width: `${percentage}%` }]} />
                              <Text style={styles.pollOptionText}>{option.text}</Text>
                              <Text style={styles.pollVoteCount}>
                                {option.votes} vote{option.votes !== 1 ? 's' : ''}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                      <Text style={styles.pollTotalVotes}>
                        Total {item.poll.options.reduce((sum: number, opt: { votes: number }) => sum + opt.votes, 0)} vote
                      </Text>
                    </View>
                  ) : null}

                  {/* Isi Teks Pesan */}
                  {item.text && item.text !== item.attachmentName && !item.poll ? (
                    <Text style={styles.messageText}>{item.text}</Text>
                  ) : null}

                  {/* Meta Bar: Timestamp & Tanda Centang Dua Biru (WhatsApp Read Receipt) */}
                  <View style={styles.messageMetaRow}>
                    <Text style={styles.timestampText}>{item.timestamp}</Text>
                    {item.isMe && (
                      <Ionicons
                        name="checkmark-done"
                        size={15}
                        color={isMessageReadByAll(item) ? WARNA.BIRU_CENTANG : WARNA.ABU_CENTANG}
                        style={{ marginLeft: 3 }}
                      />
                    )}
                  </View>

                  {/* Badge Reaksi Emoji */}
                  {item.reaction && (
                    <View
                      style={[
                        styles.reactionBadge,
                        item.isMe ? styles.myReactionBadge : styles.otherReactionBadge,
                      ]}>
                      <Text style={styles.reactionBadgeText}>{item.reaction}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
        />

        {/* Modal Reaksi Cepat Emoji */}
        {selectedMessageForReaction && (
          <View style={styles.reactionPickerOverlay}>
            <View style={styles.reactionPickerBar}>
              {EMOJI_CEPAT.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiReactionBtn}
                  onPress={() => handleAddReaction(selectedMessageForReaction.id, emoji)}>
                  <Text style={styles.emojiReactionText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.closeReactionBtn}
                onPress={() => setSelectedMessageForReaction(null)}>
                <Ionicons name="close-circle" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Menu Lampiran Dokumen/Gambar/Tugas */}
        {showAttachmentMenu && (
          <View style={styles.attachmentMenuDrawer}>
            <View style={styles.attachmentGrid}>
              <TouchableOpacity
                style={styles.attachmentItem}
                onPress={() => handleSendAttachment('DOKUMEN')}>
                <View style={[styles.attachmentCircle, { backgroundColor: '#5F66CD' }]}>
                  <Ionicons name="document-text" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentItemLabel}>Dokumen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentItem}
                onPress={() => handleSendAttachment('GAMBAR')}>
                <View style={[styles.attachmentCircle, { backgroundColor: '#AC44CF' }]}>
                  <Ionicons name="images" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentItemLabel}>Galeri Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentItem}
                onPress={() => handleSendAttachment('TUGAS')}>
                <View style={[styles.attachmentCircle, { backgroundColor: WARNA.SEKUNDER }]}>
                  <Ionicons name="checkbox" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentItemLabel}>Tugas Tim</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentItem}
                onPress={() => {
                  setShowAttachmentMenu(false);
                  setShowPollModal(true);
                }}>
                <View style={[styles.attachmentCircle, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="list" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentItemLabel}>Polling</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.attachmentItem}
                onPress={() => {
                  setShowAttachmentMenu(false);
                  handleSendMessage('📍 Lokasi Ruang Kerja Kantor Tim (PT Solusindo)');
                }}>
                <View style={[styles.attachmentCircle, { backgroundColor: '#0F9D58' }]}>
                  <Ionicons name="location" size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.attachmentItemLabel}>Lokasi</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bar Pemilih Emoji Cepat */}
        {showEmojiPicker && (
          <View style={styles.emojiSelectorStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {EMOJI_CEPAT.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiStripBtn}
                  onPress={() => setInputText((prev) => prev + emoji)}>
                  <Text style={styles.emojiStripText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ============================================================ */}
        {/* WHATSAPP BOTTOM INPUT BAR                                    */}
        {/* ============================================================ */}
        <View
          style={[
            styles.inputContainerRow,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}>
          {/* Kapsul Input Teks Putih Berisi Emoji, Text & Klip Lampiran */}
          <View style={styles.inputPillBox}>
            <TouchableOpacity
              style={styles.inputInnerBtn}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}>
              <Ionicons
                name={showEmojiPicker ? 'keypad-outline' : 'happy-outline'}
                size={24}
                color={WARNA.ABU_CENTANG}
              />
            </TouchableOpacity>

            {editingMessageId && (
              <TouchableOpacity
                style={styles.cancelEditButton}
                onPress={() => {
                  setEditingMessageId(null);
                  setInputText('');
                }}>
                <Ionicons name="close-circle" size={20} color={WARNA.UTAMA} />
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.textInput}
              placeholder={editingMessageId ? 'Edit pesan...' : 'Ketik pesan...'}
              placeholderTextColor={WARNA.ABU_CENTANG}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={styles.inputInnerBtn}
              onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}>
              <Ionicons name="attach" size={24} color={WARNA.ABU_CENTANG} />
            </TouchableOpacity>

            {inputText.trim().length === 0 && (
              <TouchableOpacity
                style={styles.inputInnerBtn}
                onPress={() => handleSendAttachment('KAMERA')}>
                <Ionicons name="camera-outline" size={22} color={WARNA.ABU_CENTANG} />
              </TouchableOpacity>
            )}
          </View>

          {/* Tombol Kirim Bundar Hijau WhatsApp / Mic Rekaman Suara */}
          {inputText.trim().length > 0 || editingMessageId ? (
            <TouchableOpacity
              style={styles.sendButtonCircle}
              activeOpacity={0.85}
              onPress={handleEditMessage}>
              <Ionicons
                name={editingMessageId ? 'checkmark' : 'send'}
                size={18}
                color="#FFFFFF"
                style={{ marginLeft: editingMessageId ? 0 : 2 }}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      {/* ============================================================ */}
      {/* MODAL: INFO GRUP WHATSAPP LENGKAP                            */}
      {/* ============================================================ */}
      <Modal
        visible={showInfoModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowInfoModal(false)}>
        <SafeAreaView style={styles.infoModalSafe} edges={['top', 'left', 'right', 'bottom']}>
          <AppStatusBar style="light" />

          {/* Header Info Grup */}
          <View style={styles.infoModalHeader}>
            <TouchableOpacity
              onPress={() => setShowInfoModal(false)}
              style={styles.headerIconButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.infoModalHeaderTitle}>Info Grup Tim</Text>
            <TouchableOpacity
              onPress={() => setShowTeamSwitcher(true)}
              style={styles.headerIconButton}>
              <Ionicons name="swap-horizontal" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.infoModalBody} showsVerticalScrollIndicator={false}>
            {/* Banner Avatar & Nama Tim */}
            <View style={styles.infoHeroSection}>
              <View style={styles.infoLargeAvatar}>
                <Ionicons
                  name={(currentTeam.icon as any) || 'people'}
                  size={56}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.infoGroupName}>{currentTeam.name}</Text>
              <Text style={styles.infoGroupMeta}>
                Grup • {currentTeam.members.length} anggota
              </Text>
            </View>

            {/* Deskripsi Tim */}
            <View style={styles.infoCard}>
              <Text style={styles.infoCardLabel}>Deskripsi Grup Tim</Text>
              <Text style={styles.infoCardDescription}>
                {currentTeam.description || 'Tidak ada deskripsi.'}
              </Text>
              <Text style={styles.infoCardSubLabel}>
                Dibuat oleh {currentTeam.adminName} • {currentTeam.createdAt}
              </Text>
            </View>

            {/* Tab Navigation */}
            <View style={styles.infoTabBar}>
              <TouchableOpacity
                style={[styles.infoTab, infoModalTab === 'anggota' && styles.infoTabActive]}
                onPress={() => setInfoModalTab('anggota')}>
                <Text style={[styles.infoTabText, infoModalTab === 'anggota' && styles.infoTabTextActive]}>
                  Anggota
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.infoTab, infoModalTab === 'media' && styles.infoTabActive]}
                onPress={() => setInfoModalTab('media')}>
                <Text style={[styles.infoTabText, infoModalTab === 'media' && styles.infoTabTextActive]}>
                  Media
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.infoTab, infoModalTab === 'pengaturan' && styles.infoTabActive]}
                onPress={() => setInfoModalTab('pengaturan')}>
                <Text style={[styles.infoTabText, infoModalTab === 'pengaturan' && styles.infoTabTextActive]}>
                  Pengaturan
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content: Anggota */}
            {infoModalTab === 'anggota' && (
              <View style={styles.infoCard}>
                <View style={styles.memberListHeader}>
                  <Text style={styles.infoCardLabel}>
                    {currentTeam.members.length} Anggota
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Tautan Undangan Tim',
                        `Tautan gabung tim: management://join-team/${currentTeam.id}`
                      )
                    }>
                    <Text style={styles.inviteLinkText}>Undang via Tautan</Text>
                  </TouchableOpacity>
                </View>

                {currentTeam.members.map((member) => {
                  const isMemberAdmin =
                    member.role === 'admin' ||
                    member.email.toLowerCase() === currentTeam.adminEmail.toLowerCase();
                  const isCurrent =
                    member.email.toLowerCase() === (user?.email || '').toLowerCase();

                  return (
                    <View key={member.id} style={styles.memberItemRow}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarLetter}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>
                          {member.name} {isCurrent && '(Anda)'}
                        </Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                      </View>
                      {isMemberAdmin && (
                        <View style={styles.adminPill}>
                          <Text style={styles.adminPillText}>Admin Tim</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Tab Content: Media */}
            {infoModalTab === 'media' && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardLabel}>Media & Gambar</Text>
                {messages.filter(m => isGambarAttachment(m.attachmentType) && m.attachmentUri).length > 0 ? (
                  <View style={styles.mediaGrid}>
                    {messages
                      .filter(m => isGambarAttachment(m.attachmentType) && m.attachmentUri)
                      .map((m) => (
                        <TouchableOpacity
                          key={m.id}
                          activeOpacity={0.8}
                          onPress={() => setPreviewImageUri(m.attachmentUri || null)}>
                          <Image
                            source={{ uri: m.attachmentUri }}
                            style={styles.mediaThumbnail}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                  </View>
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Ionicons name="images-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.mediaPlaceholderText}>
                      Belum ada media yang dibagikan
                    </Text>
                    <Text style={styles.mediaPlaceholderSubText}>
                      Foto dan gambar yang dibagikan di grup akan muncul di sini
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Tab Content: Media - Dokumen & Files */}
            {infoModalTab === 'media' && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardLabel}>Dokumen & Files</Text>
                {messages.filter(m => isDokumenAttachment(m.attachmentType) && m.attachmentUri).length > 0 ? (
                  <View style={styles.fileList}>
                    {messages
                      .filter(m => isDokumenAttachment(m.attachmentType) && m.attachmentUri)
                      .map((m) => {
                        const fileDetails = getFileDetails(m.attachmentName);
                        return (
                          <TouchableOpacity
                            key={m.id}
                            activeOpacity={0.8}
                            onPress={() => handleBukaAtauUnduhFile(m)}
                            style={styles.fileItem}>
                            <View style={[styles.fileIconBadge, { backgroundColor: fileDetails.badgeColor }]}>
                              <Ionicons name={fileDetails.iconName} size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.fileInfo}>
                              <Text style={styles.fileName} numberOfLines={1}>
                                {m.attachmentName}
                              </Text>
                              <Text style={styles.fileMeta}>
                                {fileDetails.ext} • {formatUkuranBerkas(m.attachmentSize)}
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.mediaPlaceholderText}>
                      Belum ada dokumen yang dibagikan
                    </Text>
                    <Text style={styles.mediaPlaceholderSubText}>
                      Dokumen dan file yang dibagikan di grup akan muncul di sini
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Tab Content: Media - Tugas Tim */}
            {infoModalTab === 'media' && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardLabel}>Tugas Tim</Text>
                {messages.filter(m => isTugasAttachment(m.attachmentType)).length > 0 ? (
                  <View style={styles.fileList}>
                    {messages
                      .filter(m => isTugasAttachment(m.attachmentType))
                      .map((m) => {
                        const isCompleted = m.text.includes('• Selesai');
                        return (
                          <TouchableOpacity
                            key={m.id}
                            activeOpacity={0.8}
                            onPress={() => handleAttachmentPress(m)}
                            style={styles.fileItem}>
                            <View style={[styles.fileIconBadge, { backgroundColor: isCompleted ? '#10B981' : '#0284C7' }]}>
                              <Ionicons name={isCompleted ? 'checkbox' : 'checkbox-outline'} size={20} color="#FFFFFF" />
                            </View>
                            <View style={styles.fileInfo}>
                              <Text style={styles.fileName} numberOfLines={1}>
                                {m.attachmentName || 'Tugas Tim'}
                              </Text>
                              <Text style={styles.fileMeta}>
                                {isCompleted ? 'Selesai' : 'Aktif'} • {m.senderName}
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Ionicons name="list-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.mediaPlaceholderText}>
                      Belum ada tugas yang dibagikan
                    </Text>
                    <Text style={styles.mediaPlaceholderSubText}>
                      Tugas sprint tim akan muncul di sini
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Tab Content: Pengaturan */}
            {infoModalTab === 'pengaturan' && (
              <View style={styles.infoCard}>
                <Text style={styles.infoCardLabel}>Pengaturan Grup</Text>

                <TouchableOpacity
                  style={styles.settingItemRow}
                  onPress={() => setShowNotificationOptions((current) => !current)}>
                  <View style={styles.settingIconCircle}>
                    <Ionicons name="notifications-outline" size={20} color={WARNA.UTAMA} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingItemTitle}>Notifikasi</Text>
                    <Text style={styles.settingItemDesc}>{notificationMode}</Text>
                  </View>
                  <Ionicons
                    name={showNotificationOptions ? 'chevron-up' : 'chevron-forward'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {showNotificationOptions && (
                  <View style={styles.notificationOptions}>
                    {(['Semua pesan', 'Hanya @sebutan', 'Nonaktifkan'] as const).map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={styles.notificationOption}
                        onPress={() => {
                          setNotificationMode(option);
                          if (currentTeam) {
                            void simpanModeNotifikasiGrup(currentTeam.id, option);
                          }
                          setShowNotificationOptions(false);
                        }}>
                        <View style={styles.notificationOptionCopy}>
                          <Ionicons
                            name={
                              option === 'Semua pesan'
                                ? 'notifications-outline'
                                : option === 'Hanya @sebutan'
                                  ? 'at-outline'
                                  : 'notifications-off-outline'
                            }
                            size={18}
                            color={option === notificationMode ? WARNA.UTAMA : '#64748B'}
                          />
                          <Text
                            style={[
                              styles.notificationOptionText,
                              option === notificationMode && styles.notificationOptionTextActive,
                            ]}>
                            {option}
                          </Text>
                        </View>
                        {option === notificationMode && (
                          <Ionicons name="checkmark" size={19} color={WARNA.UTAMA} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.settingItemRow}
                  onPress={() => {
                    setShowInfoModal(false);
                    setSearchBarVisible(true);
                  }}>
                  <View style={styles.settingIconCircle}>
                    <Ionicons name="search-outline" size={20} color={WARNA.UTAMA} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingItemTitle}>Cari Pesan</Text>
                    <Text style={styles.settingItemDesc}>Cari riwayat percakapan</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingItemRow, styles.dangerSettingRow]}
                  onPress={handleHapusChat}>
                  <View style={[styles.settingIconCircle, styles.dangerSettingIcon]}>
                    <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingItemTitle, styles.dangerSettingText]}>
                      Hapus Chat
                    </Text>
                    <Text style={styles.settingItemDesc}>Hapus semua pesan di chat ini</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.settingItemRow, styles.dangerSettingRow]}
                  onPress={handleKeluarGrup}>
                  <View style={[styles.settingIconCircle, styles.dangerSettingIcon]}>
                    <Ionicons name="exit-outline" size={20} color="#DC2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingItemTitle, styles.dangerSettingText]}>
                      Keluar Grup
                    </Text>
                    <Text style={styles.settingItemDesc}>Keluar dari grup ini</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: BERALIH KE TIM LAIN                                   */}
      {/* ============================================================ */}
      <Modal
        visible={showTeamSwitcher}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTeamSwitcher(false)}>
        <View style={styles.teamSwitcherOverlay}>
          <View style={styles.teamSwitcherCard}>
            <View style={styles.teamSwitcherHeader}>
              <Text style={styles.teamSwitcherTitle}>Pilih Grup Chat Tim</Text>
              <TouchableOpacity onPress={() => setShowTeamSwitcher(false)}>
                <Ionicons name="close" size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {daftarTim.map((team) => {
                const isSelected = team.id === currentTeam.id;
                return (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.teamOptionRow,
                      isSelected && styles.teamOptionRowActive,
                    ]}
                    onPress={() => {
                      setCurrentTeam(team);
                      setShowTeamSwitcher(false);
                      setShowInfoModal(false);
                    }}>
                    <View style={styles.teamOptionIcon}>
                      <Ionicons
                        name={(team.icon as any) || 'people'}
                        size={20}
                        color={isSelected ? WARNA.UTAMA : WARNA.ABU_ABU}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.teamOptionName,
                          isSelected && styles.teamOptionNameActive,
                        ]}>
                        {team.name}
                      </Text>
                      <Text style={styles.teamOptionDesc} numberOfLines={1}>
                        {team.members.length} anggota • {team.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={WARNA.UTAMA} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: PREVIEW FOTO FULL SCREEN                              */}
      {/* ============================================================ */}
      <Modal
        visible={!!previewImageUri}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}>
        <SafeAreaView style={styles.imagePreviewModalSafe} edges={['top', 'left', 'right', 'bottom']}>
          <AppStatusBar style="light" />
          <View style={styles.imagePreviewHeader}>
            <TouchableOpacity
              onPress={() => setPreviewImageUri(null)}
              style={styles.imagePreviewCloseBtn}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                if (!previewImageUri) return;
                try {
                  if (Platform.OS === 'web') {
                    const link = document.createElement('a');
                    link.href = previewImageUri;
                    link.download = `gambar_${Date.now()}.jpg`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return;
                  }
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(previewImageUri, {
                      dialogTitle: 'Simpan atau Bagikan Gambar',
                    });
                  }
                } catch (e) {
                  console.error('Gagal membagikan gambar:', e);
                }
              }}
              style={styles.imagePreviewCloseBtn}>
              <Ionicons name="download-outline" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.imagePreviewBody}>
            {previewImageUri && (
              <Image
                source={{ uri: previewImageUri }}
                style={styles.fullPreviewImage}
                resizeMode="contain"
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: BUAT POLLING                                         */}
      {/* ============================================================ */}
      <Modal
        visible={showPollModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPollModal(false)}>
        <View style={styles.pollModalOverlay}>
          <View style={styles.pollModalContent}>
            <View style={styles.pollModalHeader}>
              <Text style={styles.pollModalTitle}>Buat Polling</Text>
              <TouchableOpacity onPress={() => setShowPollModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pollModalBody}>
              <TextInput
                style={styles.pollQuestionInput}
                placeholder="Tulis pertanyaan polling..."
                value={pollQuestion}
                onChangeText={setPollQuestion}
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.pollOptionsLabel}>Opsi Polling:</Text>
              {pollOptions.map((option, index) => (
                <View key={index} style={styles.pollOptionRow}>
                  <TextInput
                    style={styles.pollOptionInput}
                    placeholder={`Opsi ${index + 1}`}
                    value={option}
                    onChangeText={(text) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = text;
                      setPollOptions(newOptions);
                    }}
                    placeholderTextColor="#9CA3AF"
                  />
                  {pollOptions.length > 2 && (
                    <TouchableOpacity
                      onPress={() => {
                        const newOptions = pollOptions.filter((_, i) => i !== index);
                        setPollOptions(newOptions);
                      }}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {pollOptions.length < 6 && (
                <TouchableOpacity
                  style={styles.addOptionBtn}
                  onPress={() => setPollOptions([...pollOptions, ''])}>
                  <Ionicons name="add-circle" size={20} color={WARNA.UTAMA} />
                  <Text style={styles.addOptionText}>Tambah Opsi</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={styles.pollModalFooter}>
              <TouchableOpacity
                style={styles.pollCancelBtn}
                onPress={() => setShowPollModal(false)}>
                <Text style={styles.pollCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pollCreateBtn}
                onPress={handleCreatePoll}>
                <Text style={styles.pollCreateText}>Buat Polling</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: WARNA.UTAMA, // Hijau WhatsApp Signature
  },
  // Styles untuk search bar di header
  headerSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
    marginHorizontal: 8,
  },
  headerSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#FFFFFF',
  },
  headerBar: {
    height: 58,
    backgroundColor: WARNA.UTAMA,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  headerAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerAdminBadge: {
    backgroundColor: '#25D366',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  headerAdminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: WARNA.UTAMA,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#E0F2F1',
    marginTop: 1,
  },
  headerActionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 4,
  },
  headerIconButton: {
    padding: 6,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#EFEAE2', // WhatsApp Classic Doodle Wallpaper Beige
  },
  encryptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9D7',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  encryptionText: {
    fontSize: 11,
    color: '#54656F',
    textAlign: 'center',
    flex: 1,
    lineHeight: 15,
  },
  messageListContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  systemBubbleContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemBubble: {
    backgroundColor: '#E1F2FB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: '85%',
  },
  systemBubbleText: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    fontWeight: '600',
  },
  messageBubbleRow: {
    marginVertical: 3,
    flexDirection: 'row',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 1.5,
    elevation: 1,
    position: 'relative',
  },
  myMessageBubble: {
    backgroundColor: WARNA.HIJAU_CHAT, // Hijau Pesan WhatsApp Pengguna
    borderTopRightRadius: 2,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF', // Putih Pesan WhatsApp Lawan Bicara
    borderTopLeftRadius: 2,
  },
  senderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  senderNameText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bubbleAdminTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#93C5FD',
  },
  bubbleAdminTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
  },
  messageText: {
    fontSize: 14,
    color: '#111B21',
    lineHeight: 19,
  },
  messageMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timestampText: {
    fontSize: 10,
    color: '#667781',
  },
  reactionBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myReactionBadge: {
    right: 8,
  },
  otherReactionBadge: {
    left: 8,
  },
  reactionBadgeText: {
    fontSize: 12,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    gap: 10,
    borderWidth: 1,
  },
  myAttachmentBox: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C6E7C0',
  },
  otherAttachmentBox: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  imageAttachmentContainer: {
    marginBottom: 4,
  },
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  imageFileName: {
    fontSize: 11,
    color: '#667781',
    marginTop: 4,
    textAlign: 'center',
  },
  attachmentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  attachmentTypeLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  attachmentActionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reactionPickerOverlay: {
    position: 'absolute',
    bottom: 95,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    
  },
  reactionPickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emojiReactionBtn: {
    padding: 4,
  },
  emojiReactionText: {
    fontSize: 22,
  },
  closeReactionBtn: {
    paddingLeft: 6,
  },
  attachmentMenuDrawer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
  },
  attachmentGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attachmentItem: {
    alignItems: 'center',
    gap: 6,
  },
  attachmentCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  emojiSelectorStrip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    transform: [{ translateY: -8 }],
    zIndex: 1,
  },
  emojiStripBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emojiStripText: {
    fontSize: 20,
  },
  inputContainerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 6,
    backgroundColor: '#EFEAE2',
    gap: 6,
  },
  inputPillBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  inputInnerBtn: {
    padding: 6,
  },
  cancelEditButton: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111B21',
    maxHeight: 120,
    paddingHorizontal: 4,
  },
  sendButtonCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: WARNA.SEKUNDER, // Hijau Lingkaran Kirim WhatsApp
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  noTeamContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noTeamIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noTeamTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  noTeamDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  backToDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WARNA.UTAMA,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  backToDashboardBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal Info Grup
  infoModalSafe: {
    flex: 1,
    backgroundColor: WARNA.UTAMA,
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 56,
  },
  infoModalHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoModalBody: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  infoHeroSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoLargeAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  infoGroupName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  infoGroupMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  infoQuickActionsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-around',
    paddingVertical: 14,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoQuickActionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  infoQuickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: WARNA.UTAMA,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 10,
    padding: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: WARNA.UTAMA,
    marginBottom: 6,
  },
  infoCardDescription: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  infoCardSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
  },
  memberListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: WARNA.UTAMA,
  },
  memberItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarLetter: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  memberName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  adminPill: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  dangerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  dangerActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  // Tab Navigation Styles
  infoTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  infoTabActive: {
    borderBottomColor: WARNA.UTAMA,
  },
  infoTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  infoTabTextActive: {
    color: WARNA.UTAMA,
  },
  // Media Placeholder Styles
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  mediaPlaceholderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  mediaPlaceholderSubText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 17,
  },
  // Setting Item Styles
  settingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  settingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  settingItemDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  notificationOptions: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  notificationOption: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  notificationOptionCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  notificationOptionText: {
    color: '#475569',
    fontSize: 13,
  },
  notificationOptionTextActive: {
    color: WARNA.UTAMA,
    fontWeight: '700',
  },
  dangerSettingRow: {
    borderBottomWidth: 0,
  },
  dangerSettingIcon: {
    backgroundColor: '#FEE2E2',
  },
  dangerSettingText: {
    color: '#DC2626',
  },
  // Switcher Modal
  teamSwitcherOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  teamSwitcherCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  teamSwitcherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  teamSwitcherTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  teamOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  teamOptionRowActive: {
    backgroundColor: '#E0F2F1',
    borderWidth: 1,
    borderColor: '#80CBC4',
  },
  teamOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamOptionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  teamOptionNameActive: {
    color: WARNA.UTAMA,
  },
  teamOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  fileList: {
    marginTop: 10,
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  fileIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  fileMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  imagePreviewModalSafe: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imagePreviewHeader: {
    height: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imagePreviewCloseBtn: {
    padding: 8,
  },
  imagePreviewBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fullPreviewImage: {
    width: '100%',
    height: '100%',
  },
  // Polling Styles
  pollContainer: {
    marginTop: 8,
    gap: 8,
  },
  pollQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  pollOptionBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pollOptionVoted: {
    backgroundColor: '#E0F2F1',
    borderColor: WARNA.UTAMA,
  },
  pollOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'relative',
  },
  pollProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 94, 84, 0.15)',
  },
  pollOptionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  pollVoteCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 12,
  },
  pollTotalVotes: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  // Poll Modal Styles
  pollModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pollModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  pollModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pollModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  pollModalBody: {
    padding: 16,
    maxHeight: 400,
  },
  pollQuestionInput: {
    fontSize: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  pollOptionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pollOptionInput: {
    flex: 1,
    fontSize: 14,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
  },
  addOptionText: {
    fontSize: 14,
    color: WARNA.UTAMA,
    fontWeight: '600',
  },
  pollModalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  pollCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  pollCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  pollCreateBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: WARNA.UTAMA,
    alignItems: 'center',
  },
  pollCreateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});