import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ExpoCalendar from 'expo-calendar';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar as DateCalendar } from 'react-native-calendars';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppStatusBar from '@/components/app-status-bar';
import BottomNavbar from '@/components/bottom-navbar';
import { muatTugas, simpanTugas, type StatusTugas, type TugasItem } from '@/config/tugas';
import { useAuth } from '@/context/auth-context';

type MaterialIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const getLinkMetadata = (url: string): { name: string; icon: MaterialIconName; color: string } => {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('drive.google.com') || lowerUrl.includes('docs.google.com')) {
    return { name: 'Google Drive', icon: 'google-drive', color: '#1FA463' };
  }
  if (lowerUrl.includes('figma.com')) return { name: 'Figma', icon: 'vector-square', color: '#F24E1E' };
  if (lowerUrl.includes('github.com')) return { name: 'GitHub', icon: 'github', color: '#181717' };
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return { name: 'YouTube', icon: 'youtube', color: '#FF0000' };
  }
  if (lowerUrl.includes('https://sipadi-teknik.polmed.ac.id/')) {
    return { name: 'SIPADI', icon: 'file-document-outline', color: '#2563EB' };
  }
  if (lowerUrl.includes('https://sipadi.polmed.ac.id/')) {
    return { name: 'SIPADI', icon: 'file-document-outline', color: '#2563EB' };
  }
  if (lowerUrl.includes('whatsapp.com')) return { name: 'WhatsApp', icon: 'whatsapp', color: '#25D366' };
  return { name: 'Link Website', icon: 'link-variant', color: '#2563EB' };
};

export default function TugasScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TugasItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [teamId, setTeamId] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskSequence] = useState(() => Date.now());

  const company = user?.companies.find(
    (item) => item.id === (user.activeCompanyId || user.companies[0]?.id)
  );
  const teams = useMemo(() => company?.daftarTimCompany || [], [company]);

  useEffect(() => {
    void muatTugas().then(setTasks);
  }, []);

  const toggleTask = async (id: string) => {
    const updated: TugasItem[] = tasks.map((task) => {
      if (task.id !== id) return task;
      const status: StatusTugas = task.status === 'selesai' ? 'proses' : 'selesai';
      return { ...task, status };
    });
    setTasks(updated);
    await simpanTugas(updated);
  };

  const bukaAttachment = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Link tidak dapat dibuka', 'Periksa kembali alamat attachment tersebut.');
    }
  };

  const simpanAttachment = () => {
    const url = attachmentUrl.trim();
    if (!url) return;
    setAttachmentUrls((current) => [...current, url]);
    setAttachmentUrl('');
    setShowAttachmentInput(false);
  };

  const hapusAttachment = (index: number) => {
    setAttachmentUrls((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const resetForm = () => {
    setNama('');
    setDeskripsi('');
    setDeadline('');
    setShowDeadlinePicker(false);
    setAttachmentUrl('');
    setAttachmentUrls([]);
    setShowAttachmentInput(false);
    setTeamId(teams[0]?.id || '');
    setEditingTaskId(null);
  };

  const bukaModalTambah = () => {
    resetForm();
    setTeamId(teams[0]?.id || '');
    setShowModal(true);
  };

  const bukaModalEdit = (task: TugasItem) => {
    setEditingTaskId(task.id);
    setNama(task.nama);
    setDeskripsi(task.deskripsi);
    setDeadline(task.deadline);
    setTeamId(task.teamId);
    setAttachmentUrls(task.attachmentUrls?.length ? task.attachmentUrls : task.attachmentUrl ? [task.attachmentUrl] : []);
    setAttachmentUrl('');
    setShowAttachmentInput(false);
    setShowModal(true);
  };

  const tambahTugas = async () => {
    const team = teams.find((item) => item.id === (teamId || teams[0]?.id));
    const existingTask = editingTaskId ? tasks.find((task) => task.id === editingTaskId) : undefined;
    if (!nama.trim() || !deskripsi.trim() || !deadline.trim() || !team) {
      Alert.alert('Data belum lengkap', 'Isi nama, deskripsi, deadline, dan pilih tim.');
      return;
    }
    if (editingTaskId && !existingTask) {
      Alert.alert('Tugas tidak ditemukan', 'Tugas tersebut sudah tidak tersedia.');
      return;
    }

    const attachments = attachmentUrl.trim()
      ? [...attachmentUrls, attachmentUrl.trim()]
      : attachmentUrls;
    let tugasBaru: TugasItem;
    if (editingTaskId) {
      if (!existingTask) return;
      tugasBaru = {
          ...existingTask,
          nama: nama.trim(),
          deskripsi: deskripsi.trim(),
          deadline: deadline.trim(),
          teamId: team.id,
          namaTim: team.name,
          attachmentUrls: attachments,
        };
    } else {
      tugasBaru = {
        id: `task-${taskSequence}-${tasks.length + 1}`,
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        tanggalDibuat: new Date().toISOString(),
        deadline: deadline.trim(),
        teamId: team.id,
        namaTim: team.name,
        dibuatOlehEmail: user?.email,
        dibuatOlehNama: user?.name,
        attachmentUrls: attachments,
        status: 'proses',
      };
    }

    let kalenderTersambung = false;
    if (!editingTaskId && Platform.OS !== 'web') {
      try {
        const { status } = await ExpoCalendar.requestCalendarPermissions();
        if (status !== 'granted') {
          throw new Error('Izin kalender belum diberikan.');
        }
        const calendars = await ExpoCalendar.getCalendars(ExpoCalendar.EntityTypes.EVENT);
        const writableCalendar = calendars.find((calendar) => calendar.allowsModifications);
        if (!writableCalendar) throw new Error('Tidak ada kalender yang bisa ditulis.');

        const eventDate = new Date(`${deadline}T09:00:00`);
        const eventEndDate = new Date(`${deadline}T10:00:00`);
        const calendar = await ExpoCalendar.ExpoCalendar.get(writableCalendar.id);
        await calendar.createEvent({
          title: `Deadline: ${tugasBaru.nama}`,
          startDate: eventDate,
          endDate: eventEndDate,
          timeZone: 'Asia/Jakarta',
          notes: `${tugasBaru.deskripsi}\nTim: ${tugasBaru.namaTim}`,
          alarms: [{ relativeOffset: -60 }],
        });
        kalenderTersambung = true;
      } catch (error) {
        console.warn('Deadline belum tersambung ke kalender HP:', error);
      }
    }

    const updated = editingTaskId
      ? tasks.map((task) => (task.id === editingTaskId ? tugasBaru : task))
      : [tugasBaru, ...tasks];
    setTasks(updated);
    await simpanTugas(updated);
    resetForm();
    setShowModal(false);
    Alert.alert(
      editingTaskId ? 'Tugas diperbarui' : 'Tugas dibuat',
      editingTaskId
        ? 'Perubahan tugas berhasil disimpan.'
        : kalenderTersambung
          ? 'Deadline tersimpan di tugas dan kalender HP.'
          : 'Deadline tersimpan di kalender proyek. Kalender HP belum tersambung.'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppStatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Daftar Tugas</Text>
          <Text style={styles.subtitle}>Atur pekerjaan dan kolaborasi tim</Text>
        </View>

        <View style={styles.list}>
          {tasks.map((task) => {
            const selesai = task.status === 'selesai';
            const dibuatOlehUser = task.dibuatOlehEmail === user?.email;
            const taskAttachments = task.attachmentUrls?.length
              ? task.attachmentUrls
              : task.attachmentUrl
                ? [task.attachmentUrl]
                : [];
            return (
              <View
                key={task.id}
                style={[styles.taskCard, selesai && styles.taskCardDone]}>
                <View style={[styles.checkbox, selesai && styles.checkboxDone]}>
                  {selesai && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, selesai && styles.taskTitleDone]}>
                    {task.nama}
                  </Text>
                  <Text style={styles.description}>{task.deskripsi}</Text>
                  <Text style={styles.meta}>{task.namaTim} • Deadline: {task.deadline}</Text>
                  {taskAttachments.length > 0 && (
                    <View style={styles.attachmentList}>
                      {taskAttachments.map((url, index) => {
                        const metadata = getLinkMetadata(url);
                        return (
                          <Pressable
                            key={`${url}-${index}`}
                            style={styles.attachmentBadge}
                            onPress={() => void bukaAttachment(url)}>
                            <MaterialCommunityIcons name={metadata.icon} size={16} color={metadata.color} />
                            <Text style={[styles.attachment, { color: metadata.color }]} numberOfLines={1}>
                              {metadata.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                  <View style={styles.taskActions}>
                    {dibuatOlehUser && (
                      <Pressable style={styles.secondaryAction} onPress={() => bukaModalEdit(task)}>
                        <Ionicons name="create-outline" size={15} color="#2563EB" />
                        <Text style={styles.secondaryActionText}>Edit tugas</Text>
                      </Pressable>
                    )}
                    <Pressable style={styles.primaryAction} onPress={() => void toggleTask(task.id)}>
                      <Ionicons
                        name={selesai ? 'refresh-outline' : 'checkmark-circle-outline'}
                        size={15}
                        color="#FFFFFF"
                      />
                      <Text style={styles.primaryActionText}>{selesai ? 'Buka lagi' : 'Selesaikan tugas'}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
          {tasks.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="checkbox-outline" size={46} color="#CBD5E1" />
              <Text style={styles.emptyText}>Belum ada tugas</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable style={[styles.fab, { bottom: insets.bottom + 76 }]} onPress={bukaModalTambah}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </Pressable>
      <BottomNavbar activeRoute="tugas" />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>{editingTaskId ? 'EDIT TUGAS' : 'TUGAS BARU'}</Text>
                <Text style={styles.modalTitle}>{editingTaskId ? 'Edit tugas' : 'Tambah tugas'}</Text>
              </View>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nama tugas</Text>
              <View style={styles.inputRow}>
                <Ionicons name="create-outline" size={19} color="#64748B" />
                <TextInput
                  style={styles.inputText}
                  placeholder="Contoh: Rancang halaman dashboard"
                  placeholderTextColor="#94A3B8"
                  value={nama}
                  onChangeText={setNama}
                />
              </View>
              <Text style={styles.fieldLabel}>Deskripsi</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Jelaskan hasil yang perlu diselesaikan"
                placeholderTextColor="#94A3B8"
                value={deskripsi}
                onChangeText={setDeskripsi}
                multiline
              />
              <Text style={styles.fieldLabel}>Deadline</Text>
              <Pressable style={styles.datePickerButton} onPress={() => setShowDeadlinePicker(true)}>
                <Ionicons name="calendar-outline" size={19} color="#2563EB" />
                <Text style={[styles.datePickerText, !deadline && styles.datePickerPlaceholder]}>
                  {deadline || 'Pilih tanggal deadline'}
                </Text>
                <Ionicons name="chevron-down" size={17} color="#64748B" />
              </Pressable>
              <Text style={styles.fieldLabel}>Pilih tim</Text>
              <View style={styles.teamOptions}>
                {teams.map((team) => (
                  <Pressable
                    key={team.id}
                    style={[styles.teamOption, teamId === team.id && styles.teamOptionActive]}
                    onPress={() => setTeamId(team.id)}>
                    <Text style={[styles.teamOptionText, teamId === team.id && styles.teamOptionTextActive]}>
                      {team.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Attachment</Text>
              {attachmentUrls.map((url, index) => (
                <Pressable key={`${url}-${index}`} style={styles.savedAttachment} onPress={() => void bukaAttachment(url)}>
                  <MaterialCommunityIcons
                    name={getLinkMetadata(url).icon}
                    size={17}
                    color={getLinkMetadata(url).color}
                  />
                  <View style={styles.savedAttachmentCopy}>
                    <Text style={[styles.savedAttachmentName, { color: getLinkMetadata(url).color }]}>
                      {getLinkMetadata(url).name}
                    </Text>
                    <Text style={styles.savedAttachmentText} numberOfLines={1}>{url}</Text>
                  </View>
                  <Pressable onPress={(event) => {
                    event.stopPropagation();
                    hapusAttachment(index);
                  }}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </Pressable>
                </Pressable>
              ))}
              {!showAttachmentInput ? (
                <Pressable style={styles.addAttachment} onPress={() => setShowAttachmentInput(true)}>
                  <View style={styles.attachmentIcon}>
                    <Ionicons name="attach-outline" size={20} color="#2563EB" />
                  </View>
                  <View style={styles.attachmentCopy}>
                    <Text style={styles.addAttachmentTitle}>
                      {attachmentUrls.length ? 'Tambah attachment lagi' : 'Tambah attachment'}
                    </Text>
                    <Text style={styles.addAttachmentHint}>Google Drive, GitHub, atau link file lain</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </Pressable>
              ) : (
                <View style={styles.attachmentInputCard}>
                  <View style={styles.attachmentInputHeader}>
                    <Ionicons name="attach-outline" size={18} color="#2563EB" />
                    <Text style={styles.attachmentInputTitle}>Link attachment</Text>
                    <Pressable onPress={() => {
                      setAttachmentUrl('');
                      setShowAttachmentInput(false);
                    }}>
                      <Ionicons name="close-circle" size={19} color="#94A3B8" />
                    </Pressable>
                  </View>
                  <TextInput
                    style={styles.attachmentInput}
                    placeholder="Tempel link Google Drive atau file"
                    placeholderTextColor="#94A3B8"
                    value={attachmentUrl}
                    onChangeText={setAttachmentUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                  {attachmentUrl.trim() ? (
                    <View style={styles.attachmentPreview}>
                      <MaterialCommunityIcons
                        name={getLinkMetadata(attachmentUrl).icon}
                        size={18}
                        color={getLinkMetadata(attachmentUrl).color}
                      />
                      <Text style={[styles.attachmentPreviewText, { color: getLinkMetadata(attachmentUrl).color }]}>
                        {getLinkMetadata(attachmentUrl).name}
                      </Text>
                    </View>
                  ) : null}
                  <Pressable style={styles.addLinkButton} onPress={simpanAttachment}>
                    <Text style={styles.addLinkButtonText}>Tambahkan attachment</Text>
                  </Pressable>
                </View>
              )}
              <TouchableOpacity style={styles.saveButton} onPress={() => void tambahTugas()}>
                <Text style={styles.saveButtonText}>{editingTaskId ? 'Simpan perubahan' : 'Buat tugas'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDeadlinePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeadlinePicker(false)}>
        <Pressable style={styles.dateModalOverlay} onPress={() => setShowDeadlinePicker(false)}>
          <Pressable style={styles.dateModalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dateModalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>DEADLINE</Text>
                <Text style={styles.dateModalTitle}>Pilih tanggal</Text>
              </View>
              <Pressable onPress={() => setShowDeadlinePicker(false)}>
                <Ionicons name="close" size={23} color="#64748B" />
              </Pressable>
            </View>
            <DateCalendar
              minDate={new Date().toISOString().split('T')[0]}
              onDayPress={(day) => {
                setDeadline(day.dateString);
                setShowDeadlinePicker(false);
              }}
              markedDates={deadline ? { [deadline]: { selected: true, selectedColor: '#2563EB' } } : undefined}
              theme={{
                todayTextColor: '#2563EB',
                arrowColor: '#2563EB',
                textDayFontWeight: '600',
                textMonthFontWeight: '800',
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 18, paddingTop: 22 },
  header: { marginBottom: 22 },
  title: { color: '#0F172A', fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 4 },
  list: { gap: 12 },
  taskCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 16 },
  taskCardDone: { backgroundColor: '#F8FAFC', opacity: 0.8 },
  checkbox: { alignItems: 'center', borderColor: '#CBD5E1', borderRadius: 7, borderWidth: 2, height: 24, justifyContent: 'center', width: 24 },
  checkboxDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  taskInfo: { flex: 1, gap: 5 },
  taskTitle: { color: '#1E293B', fontSize: 16, fontWeight: '700' },
  taskTitleDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
  description: { color: '#475569', fontSize: 13 },
  meta: { color: '#64748B', fontSize: 11 },
  attachmentList: { gap: 5, marginTop: 2 },
  attachmentBadge: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 4 },
  attachment: { color: '#2563EB', flex: 1, fontSize: 11, fontWeight: '600' },
  taskActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 7 },
  secondaryAction: { alignItems: 'center', borderColor: '#BFDBFE', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 4, paddingHorizontal: 9, paddingVertical: 7 },
  secondaryActionText: { color: '#2563EB', fontSize: 11, fontWeight: '700' },
  primaryAction: { alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 8, flexDirection: 'row', gap: 4, paddingHorizontal: 9, paddingVertical: 7 },
  primaryActionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#94A3B8', marginTop: 10 },
  fab: { alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 30, elevation: 6, height: 60, justifyContent: 'center', position: 'absolute', right: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, width: 60 },
  modalOverlay: { backgroundColor: 'rgba(15, 23, 42, 0.45)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', padding: 22 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  modalEyebrow: { color: '#2563EB', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 3 },
  modalTitle: { color: '#0F172A', fontSize: 23, fontWeight: '800', letterSpacing: -0.3 },
  input: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 12, borderWidth: 1, color: '#0F172A', marginBottom: 15, paddingHorizontal: 14, paddingVertical: 13 },
  inputRow: { alignItems: 'center', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 9, marginBottom: 15, paddingHorizontal: 13 },
  inputText: { color: '#0F172A', flex: 1, paddingVertical: 13 },
  datePickerButton: { alignItems: 'center', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 15, paddingHorizontal: 13, paddingVertical: 13 },
  datePickerText: { color: '#0F172A', flex: 1, fontSize: 14 },
  datePickerPlaceholder: { color: '#94A3B8' },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  fieldLabel: { color: '#334155', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  teamOptions: { gap: 8, marginBottom: 12 },
  teamOption: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 11, borderWidth: 1, padding: 12 },
  teamOptionActive: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  teamOptionText: { color: '#64748B', fontSize: 13 },
  teamOptionTextActive: { color: '#2563EB', fontWeight: '700' },
  addAttachment: { alignItems: 'center', backgroundColor: '#F8FAFC', borderColor: '#DBEAFE', borderRadius: 14, borderWidth: 1, flexDirection: 'row', marginBottom: 18, padding: 12 },
  attachmentIcon: { alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 10, height: 40, justifyContent: 'center', width: 40 },
  attachmentCopy: { flex: 1, marginLeft: 11 },
  addAttachmentTitle: { color: '#1E3A8A', fontSize: 13, fontWeight: '800' },
  addAttachmentHint: { color: '#64748B', fontSize: 11, marginTop: 3 },
  attachmentInputCard: { backgroundColor: '#F8FAFC', borderColor: '#BFDBFE', borderRadius: 14, borderWidth: 1, marginBottom: 18, padding: 12 },
  attachmentInputHeader: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 8 },
  attachmentInputTitle: { color: '#1E3A8A', flex: 1, fontSize: 13, fontWeight: '800' },
  attachmentInput: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 10, borderWidth: 1, color: '#0F172A', paddingHorizontal: 12, paddingVertical: 11 },
  attachmentPreview: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 9 },
  attachmentPreviewText: { fontSize: 12, fontWeight: '800' },
  savedAttachment: { alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 11, flexDirection: 'row', gap: 8, marginBottom: 8, paddingHorizontal: 11, paddingVertical: 10 },
  savedAttachmentCopy: { flex: 1, gap: 2 },
  savedAttachmentName: { fontSize: 12, fontWeight: '800' },
  savedAttachmentText: { color: '#1E3A8A', flex: 1, fontSize: 12 },
  addLinkButton: { alignItems: 'center', backgroundColor: '#DBEAFE', borderRadius: 9, marginTop: 9, padding: 11 },
  addLinkButtonText: { color: '#1D4ED8', fontSize: 12, fontWeight: '800' },
  dateModalOverlay: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.45)', flex: 1, justifyContent: 'center', padding: 20 },
  dateModalCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, width: '100%' },
  dateModalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateModalTitle: { color: '#0F172A', fontSize: 20, fontWeight: '800' },
  saveButton: { alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 13, marginTop: 4, padding: 15 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '800' },
});
