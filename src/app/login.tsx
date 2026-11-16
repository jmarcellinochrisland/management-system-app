import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { loginWithGoogle } = useAuth();

  // State dialog Google Sign-In
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleName, setGoogleName] = useState('Alex Nugraha');
  const [googleEmail, setGoogleEmail] = useState('alex.nugraha@gmail.com');
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Submit Google Login
  const handleProceedGoogleLogin = async () => {
    setIsLoggingIn(true);
    await loginWithGoogle(googleName, googleEmail, isDeveloper);
    setIsLoggingIn(false);
    setShowGoogleModal(false);
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.contentWrapper}>
        {/* Ilustrasi Utama */}
        <View style={styles.imageWrapper}>
          <Image 
            source={require('../../assets/images/tabIcons/Started/time-management/amico.png')} 
            style={styles.localImage}
            resizeMode="contain"
          />
        </View>

        {/* Bagian Teks & Branding */}
        <View style={styles.textContainer}>
          <Text style={styles.pembuka}>WELCOME TO</Text>
          <Text style={styles.title}>Management System</Text>
          <View style={styles.subtitleWrapper}>
            <Text style={styles.subtitle}>
              When You Are Confused About{'\n'}Managing Your Task, Come To Us
            </Text>
          </View>
        </View>

        {/* Tombol Utama Login Google */}
        <View style={styles.buttonContainer}>
          <Pressable 
            style={({ pressed }) => [
              styles.googleButton, 
              pressed && styles.googleButtonPressed
            ]} 
            onPress={() => setShowGoogleModal(true)}>
            <View style={styles.googleIconBadge}>
              <Image 
                source={{ uri: 'https://www.google.com/favicon.ico' }} 
                style={styles.googleIconImage}
              />
            </View>
            <Text style={styles.googleButtonText}>Login melalui Google</Text>
          </Pressable>
          <Text style={styles.footerNote}>Autentikasi akun Google Anda</Text>
        </View>
      </View>

      <Text style={styles.versionText}>v {packageJson.version}</Text>

      {/* MODAL GOOGLE ACCOUNT SELECTOR / INTEGRATION */}
      <Modal
        visible={showGoogleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoogleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Google Header */}
            <View style={styles.modalHeader}>
              <Image 
                source={{ uri: 'https://www.google.com/favicon.ico' }} 
                style={styles.googleIconLarge}
              />
              <Text style={styles.modalTitle}>Masuk dengan Google</Text>
              <Text style={styles.modalSubtitle}>
                Masukkan profil Google Anda untuk melanjutkan ke aplikasi
              </Text>
            </View>

            {/* Input Nama & Email Akun Google */}
            <View style={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Lengkap Akun Google</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.inputField}
                  placeholder="Masukkan nama akun Anda..."
                  placeholderTextColor="#94A3B8"
                  value={googleName}
                  onChangeText={setGoogleName}
                />
              </View>

              <Text style={styles.inputLabel}>Email Google</Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.inputField}
                  placeholder="nama.anda@gmail.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={googleEmail}
                  onChangeText={setGoogleEmail}
                />
              </View>

              {/* Tipe Akun: User Biasa vs Developer */}
              <Text style={styles.inputLabel}>Peran Akun</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.typeSelectorBtn,
                    !isDeveloper && styles.typeSelectorBtnActive,
                  ]}
                  onPress={() => setIsDeveloper(false)}>
                  <Ionicons
                    name="person"
                    size={16}
                    color={!isDeveloper ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.typeSelectorText,
                      !isDeveloper && styles.typeSelectorTextActive,
                    ]}>
                    User (1 Company)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeSelectorBtn,
                    isDeveloper && styles.typeSelectorBtnActive,
                  ]}
                  onPress={() => setIsDeveloper(true)}>
                  <Ionicons
                    name="code-slash"
                    size={16}
                    color={isDeveloper ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.typeSelectorText,
                      isDeveloper && styles.typeSelectorTextActive,
                    ]}>
                    Developer (Multi-Company)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tombol Lanjutkan */}
              <TouchableOpacity
                style={[styles.modalSubmitBtn, isLoggingIn && styles.btnDisabled]}
                disabled={isLoggingIn}
                onPress={handleProceedGoogleLogin}>
                <Text style={styles.modalSubmitText}>
                  {isLoggingIn ? 'Memproses Masuk...' : `Lanjutkan sebagai ${googleName || 'User'}`}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowGoogleModal(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const packageJson = require('../../package.json');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localImage: {
    width: 220,
    height: 220,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pembuka: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B7BE5',
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleWrapper: {
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  googleButtonPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    transform: [{ scale: 0.99 }],
  },
  googleIconBadge: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconImage: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  footerNote: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 12,
    fontWeight: '500',
  },
  versionText: {
    position: 'absolute',
    bottom: 24,
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },

  /* MODAL GOOGLE STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  googleIconLarge: {
    width: 36,
    height: 36,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  modalForm: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    gap: 10,
    backgroundColor: '#F8FAFC',
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeSelectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
  },
  typeSelectorBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  typeSelectorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  typeSelectorTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginTop: 10,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
