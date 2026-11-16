import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppStatusBar from '@/components/app-status-bar';
import BottomNavbar from '@/components/bottom-navbar';

type NotificationType = 'tim' | 'tugas';
type FilterType = 'semua' | NotificationType;

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

export default function NotifikasiScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>('semua');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const filteredNotifications = useMemo(
    () =>
      filter === 'semua'
        ? notifications
        : notifications.filter((notification) => notification.type === filter),
    [filter, notifications]
  );

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const markAsRead = (id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false }))
    );
  };

  const openNotification = (notification: NotificationItem) => {
    markAsRead(notification.id);
    router.push(notification.type === 'tugas' ? '/tugas' : '/dashboard');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppStatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 88 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Notifikasi</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0
                ? `${unreadCount} notifikasi belum dibaca`
                : 'Semua notifikasi sudah dibaca'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead} style={styles.readAllButton}>
              <Text style={styles.readAllText}>Tandai dibaca</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.filterRow}>
          {([
            ['semua', 'Semua'],
            ['tim', 'Tim'],
            ['tugas', 'Tugas'],
          ] as const).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              style={[styles.filterButton, filter === value && styles.filterButtonActive]}>
              <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.list}>
          {filteredNotifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => openNotification(notification)}
              style={[styles.notificationCard, notification.unread && styles.unreadCard]}>
              <View style={[styles.iconBox, { backgroundColor: `${notification.color}18` }]}>
                <Ionicons name={notification.icon} size={22} color={notification.color} />
              </View>
              <View style={styles.notificationBody}>
                <View style={styles.notificationTitleRow}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {notification.unread && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.description}>{notification.description}</Text>
                <Text style={styles.time}>{notification.time}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          ))}
        </View>

        {filteredNotifications.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Belum ada notifikasi</Text>
            <Text style={styles.emptyDescription}>
              Notifikasi anggota tim dan tugas baru akan muncul di sini.
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomNavbar activeRoute="notifikasi" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: { color: '#0F172A', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 5 },
  readAllButton: { paddingTop: 6 },
  readAllText: { color: '#2563EB', fontSize: 12, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  filterButtonActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#FFFFFF' },
  list: { gap: 12 },
  notificationCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 15,
  },
  unreadCard: { borderColor: '#BFDBFE', backgroundColor: '#F8FBFF' },
  iconBox: {
    alignItems: 'center',
    borderRadius: 13,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  notificationBody: { flex: 1 },
  notificationTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  notificationTitle: { color: '#1E293B', flex: 1, fontSize: 14, fontWeight: '700' },
  unreadDot: { backgroundColor: '#2563EB', borderRadius: 5, height: 9, width: 9 },
  description: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 4 },
  time: { color: '#94A3B8', fontSize: 11, marginTop: 7 },
  emptyState: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 80 },
  emptyTitle: { color: '#334155', fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptyDescription: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: 'center',
  },
});
