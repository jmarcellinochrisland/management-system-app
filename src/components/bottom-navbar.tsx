import { Ionicons } from '@expo/vector-icons';
import { Href, router } from 'expo-router';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type NavRoute = 'dashboard' | 'notifikasi' | 'tugas' | 'proyek' | 'profil';

type BottomNavbarProps = {
  activeRoute?: NavRoute;
  children?: React.ReactNode;
};

type NavItemConfig = {
  key: NavRoute;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
  path: Href;
};

// ==============================================================
// KONFIGURASI DAFTAR RUTE & MENU NAVBAR DENGAN ICON IONICONS
// ==============================================================
export const NAV_CONFIG: NavItemConfig[] = [
  { key: 'dashboard', label: 'Beranda', iconActive: 'home', iconInactive: 'home-outline', path: '/dashboard' },
  // { key: 'notifikasi', label: 'Notifikasi', iconActive: 'notifications', iconInactive: 'notifications-outline', path: '/notifikasi' },
  { key: 'notifikasi', label: 'Notifikasi', iconActive: 'notifications', iconInactive: 'notifications-outline', path: '/notifikasi' as Href },
  { key: 'tugas', label: 'Tugas', iconActive: 'checkbox', iconInactive: 'checkbox-outline', path: '/tugas' },
  { key: 'proyek', label: 'Jadwal', iconActive: 'calendar', iconInactive: 'calendar-outline', path: '/proyek' },
  { key: 'profil', label: 'Pengaturan', iconActive: 'settings', iconInactive: 'settings-outline', path: '/profil' },
];

export function BottomNavbar({ activeRoute = 'dashboard', children }: BottomNavbarProps) {
  const insets = useSafeAreaInsets();

  const navigateTo = (path: Href, key: NavRoute) => {
    if (activeRoute !== key) {
      router.replace(path);
    }
  };

  return (
    <View
      style={[
        styles.bottomNavbar,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + Math.max(insets.bottom, 8),
        },
      ]}>
      {NAV_CONFIG.map((item, index) => {
        const isActive = activeRoute === item.key && (item.key !== 'notifikasi' || index === 1);
        const iconName = isActive ? item.iconActive : item.iconInactive;
        const color = isActive ? '#2563EB' : '#64748B';

        return (
          <TouchableOpacity
            key={`${item.key}-${index}`}
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => navigateTo(item.path, item.key)}>
            <View style={[styles.navIconContainer, isActive && styles.navIconContainerActive]}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -3px 8px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconContainer: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  navIconContainerActive: {
    backgroundColor: '#EFF6FF',
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748B',
  },
  navLabelActive: {
    color: '#539DF3',
    fontWeight: '700',
  },
});

export default BottomNavbar;
