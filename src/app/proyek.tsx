import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import * as Calendar from 'expo-calendar';
import { Calendar as DeviceCalendar } from 'react-native-calendars';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppStatusBar from '@/components/app-status-bar';
import BottomNavbar from '@/components/bottom-navbar';
import { muatTugas, type TugasItem } from '@/config/tugas';

type AgendaItem = {
  name: string;
  time: string;
  notes: string;
  date: string;
  
};

export default function JadwalScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Record<string, AgendaItem[]>>({});
  const [calendarId, setCalendarId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<TugasItem[]>([]);

  const muatJadwalDariHP = useCallback(async (calId: string) => {
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2);

    const events = await Calendar.listEvents([calId], startDate, endDate);
    const formattedItems: Record<string, AgendaItem[]> = {};

    events.forEach((event) => {
      const dateKey = new Date(event.startDate).toISOString().split('T')[0];
      formattedItems[dateKey] ||= [];
      formattedItems[dateKey].push({
        name: event.title,
        date: dateKey,
        time: new Date(event.startDate).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        notes: event.notes || 'Tidak ada catatan',
      });
    });

    setItems(formattedItems);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const siapkanKalender = async () => {
      try {
        const { status } = await Calendar.requestCalendarPermissions();
        if (status !== 'granted') return;

        const calendars = await Calendar.getCalendars(Calendar.EntityTypes.EVENT);
        const primaryCalendar = calendars.find((cal) => cal.allowsModifications) || calendars[0];
        if (primaryCalendar) {
          setCalendarId(primaryCalendar.id);
          await muatJadwalDariHP(primaryCalendar.id);
        }
      } catch (error) {
        console.error('Gagal memuat kalender:', error);
      }
    };

    void siapkanKalender();
  }, [muatJadwalDariHP]);

  useEffect(() => {
    void muatTugas().then((loadedTasks) => {
      setTasks(loadedTasks);
      setItems((currentItems) => {
        const nextItems = { ...currentItems };
        loadedTasks.forEach((task) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(task.deadline)) return;
          nextItems[task.deadline] ||= [];
          const alreadyListed = nextItems[task.deadline].some(
            (item) => item.name === `Deadline: ${task.nama}`
          );
          if (!alreadyListed) {
            nextItems[task.deadline].push({
              name: `Deadline: ${task.nama}`,
              date: task.deadline,
              time: '09.00',
              notes: `${task.namaTim} • ${task.deskripsi}`,
            });
          }
        });
        return nextItems;
      });
    });
  }, []);

  const tambahJadwal = async () => {
    if (!calendarId) {
      Alert.alert('Izin Ditolak', 'Akses kalender diperlukan.');
      return;
    }

    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 1);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 1);

    try {
      const calendar = await Calendar.ExpoCalendar.get(calendarId);
      await calendar.createEvent({
        title: 'Meeting Proyek React Native',
        startDate,
        endDate,
        timeZone: 'Asia/Jakarta',
        location: 'Google Meet',
        notes: 'Membahas integrasi kalender otomatis.',
        alarms: [{ relativeOffset: -15 }],
      });
      Alert.alert('Berhasil', 'Jadwal tersimpan di kalender HP!');
      await muatJadwalDariHP(calendarId);
    } catch (error) {
      Alert.alert('Gagal', error instanceof Error ? error.message : 'Jadwal gagal disimpan.');
    }
  };

  const selectedItems = useMemo(() => items[selectedDate] || [], [items, selectedDate]);
  const markedDates = useMemo(
    () =>
      Object.keys(items).reduce<Record<string, { marked: boolean }>>((result, date) => {
        result[date] = { marked: true };
        return result;
      }, {}),
    [items]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppStatusBar style="dark" />
      <View style={[styles.content, { paddingBottom: insets.bottom + 72 }]}>
        <Button title="+ Tambah Jadwal Sekarang" onPress={tambahJadwal} />
        <DeviceCalendar
          current={selectedDate}
          markedDates={{
            ...markedDates,
            [selectedDate]: {
              ...(markedDates[selectedDate] || {}),
              selected: true,
              selectedColor: '#2563EB',
            },
          }}
          onDayPress={(day) => setSelectedDate(day.dateString)}
        />
        <FlatList
          data={selectedItems}
          keyExtractor={(item) => `${item.name}-${item.time}`}
          contentContainerStyle={selectedItems.length === 0 ? styles.emptyList : styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text>{item.time} - {item.notes}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text>Belum ada jadwal di tanggal ini.</Text>
            </View>
          }
        />
        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tugas Tim</Text>
          {tasks.length === 0 ? (
            <Text style={styles.noTasks}>Belum ada tugas yang dikonfigurasi.</Text>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskCardHeader}>
                  <Text style={styles.taskName}>{task.nama}</Text>
                  <Text style={[styles.taskStatus, task.status === 'selesai' && styles.taskDone]}>
                    {task.status === 'selesai' ? 'Selesai' : 'Proses'}
                  </Text>
                </View>
                <Text style={styles.taskDescription}>{task.deskripsi}</Text>
                <Text style={styles.taskMeta}>{task.namaTim} • Deadline: {task.deadline}</Text>
                {(task.attachmentUrls?.length || task.attachmentUrl) ? (
                  <Text style={styles.taskLink} numberOfLines={1}>
                    {task.attachmentUrls?.length || 1} attachment
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </View>
      <BottomNavbar activeRoute="proyek" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flex: 1, paddingTop: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginRight: 10,
    marginTop: 17,
    padding: 15,
  },
  list: { paddingBottom: 16 },
  emptyList: { flexGrow: 1 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingTop: 50 },
  tasksSection: { marginTop: 20 },
  sectionTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  noTasks: { color: '#94A3B8', fontSize: 13, paddingVertical: 12 },
  taskCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 12, borderWidth: 1, marginBottom: 10, padding: 14 },
  taskCardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  taskName: { color: '#1E293B', flex: 1, fontSize: 14, fontWeight: '700' },
  taskStatus: { color: '#D97706', fontSize: 11, fontWeight: '700' },
  taskDone: { color: '#059669' },
  taskDescription: { color: '#475569', fontSize: 13, marginTop: 5 },
  taskMeta: { color: '#64748B', fontSize: 11, marginTop: 7 },
  taskLink: { color: '#2563EB', fontSize: 11, marginTop: 5 },
});
