import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import AppStatusBar from '@/components/app-status-bar';
import BottomNavbar from '@/components/bottom-navbar';

export default function ProfilScreen() {
  const { user, logout, toggleDeveloperMode } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <AppStatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}>
        
        {/* Header Profil */}
        <View style={styles.header}>
          <Text style={styles.title}>Profil Pengguna 👤</Text>
          <Text style={styles.subtitle}>Informasi dan pengaturan akun Anda</Text>
        </View>

        {/* Kartu Profil */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>

          {/* Role Badge */}
          <View style={[styles.roleBadge, user?.isDeveloper ? styles.devBadge : styles.userBadge]}>
            <Ionicons
              name={user?.isDeveloper ? 'code-slash' : 'person'}
              size={13}
              color={user?.isDeveloper ? '#7C3AED' : '#2563EB'}
            />
            <Text style={[styles.roleBadgeText, user?.isDeveloper ? styles.devBadgeText : styles.userBadgeText]}>
              {user?.isDeveloper ? 'Developer (Multi-Company)' : 'User Biasa (Maks. 1 Perusahaan)'}
            </Text>
          </View>
        </View>

        {/* Status Perusahaan Saat Ini */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Status Ruang Kerja</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Jumlah Perusahaan Tergabung</Text>
            <Text style={styles.infoValue}>{user?.companies.length || 0} Perusahaan</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Batas Bergabung</Text>
            <Text style={styles.infoValue}>
              {user?.isDeveloper ? 'Tanpa Batas (Developer)' : 'Maksimal 1 Perusahaan'}
            </Text>
          </View>
        </View>

        {/* Switcher Mode Pengembang (Developer) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Hak Akses & Pengembang</Text>
          <View style={styles.devToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.devToggleTitle}>Mode Developer</Text>
              <Text style={styles.devToggleDesc}>
                {user?.isDeveloper
                  ? 'Aktif: Anda dapat membuat & bergabung ke banyak perusahaan.'
                  : 'Nonaktif: Anda dibatasi hanya dapat bergabung ke 1 perusahaan.'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.togglePillBtn,
                user?.isDeveloper ? styles.togglePillBtnActive : styles.togglePillBtnInactive,
              ]}
              onPress={toggleDeveloperMode}>
              <Text
                style={[
                  styles.togglePillText,
                  user?.isDeveloper ? styles.togglePillTextActive : styles.togglePillTextInactive,
                ]}>
                {user?.isDeveloper ? 'NONAKTIFKAN' : 'AKTIFKAN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Pengaturan */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>🔔 Notifikasi</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>🔒 Keamanan Akun</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuLabel}>ℹ️ Tentang Aplikasi</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Tombol Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout dari Akun</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Navbar Bawah */}
      <BottomNavbar activeRoute="profil" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  devBadge: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  userBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  devBadgeText: {
    color: '#7C3AED',
  },
  userBadgeText: {
    color: '#2563EB',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  devToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  devToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  devToggleDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  togglePillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  togglePillBtnActive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  togglePillBtnInactive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  togglePillTextActive: {
    color: '#DC2626',
  },
  togglePillTextInactive: {
    color: '#2563EB',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  menuArrow: {
    fontSize: 20,
    color: '#94A3B8',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
