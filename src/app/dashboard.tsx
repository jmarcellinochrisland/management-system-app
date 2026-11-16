import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AppStatusBar from '@/components/app-status-bar';
import { useAuth, DEMO_COMPANIES, type Company, type Team } from '@/context/auth-context';
import BottomNavbar from '@/components/bottom-navbar';

export default function Dashboard() {
  const {
    user,
    joinCompany,
    createCompany,
    leaveCompany,
    setActiveCompany,
    toggleDeveloperMode,
    createTeam,
    requestJoinTeam,
    respondJoinRequest,
  } = useAuth();
  const insets = useSafeAreaInsets();

  // State pembuatan / gabung perusahaan
  const [accessMode, setAccessMode] = useState<'invite' | 'create'>('invite');
  const [companyCode, setCompanyCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [categoryName, setCategoryName] = useState('Teknologi & Digital');
  const [showQuickJoinDrawer, setShowQuickJoinDrawer] = useState(false);

  // State pembuatan tim baru (seperti grup WA)
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Status feedback interaktif
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bagian setelah Memilih Company
  const selectedCompany = user?.companies.find(
    (c) => c.id === (user?.activeCompanyId || user?.companies[0]?.id)
  );
  const selectedCompanyId = selectedCompany?.id;
  const showSelectedCompany = !!selectedCompanyId;
  const TimCompany = selectedCompany?.timCompany;
  const DaftarTimCompany = selectedCompany?.daftarTimCompany;
  const daftarProjectTim = selectedCompany?.daftarProjectTim;

  // Handler gabung perusahaan
  const handleJoin = async (overrideCode?: string) => {
    const code = (overrideCode || companyCode).trim();
    if (!code) {
      setErrorMessage('Harap masukkan kode undangan perusahaan.');
      return;
    }

    if (!user?.isDeveloper && (user?.companies.length || 0) >= 1) {
      setErrorMessage('User hanya bisa 1 kali join ke company kecuali developer.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await joinCompany(code);
    setIsSubmitting(false);

    if (result.success && result.company) {
      setSuccessToast(`Selamat bergabung di "${result.company.name}"!`);
      setCompanyCode('');
      setShowQuickJoinDrawer(false);
      setTimeout(() => setSuccessToast(null), 3500);
    } else {
      setErrorMessage(result.error || 'Gagal bergabung ke perusahaan.');
    }
  };

  // Handler buat ruang kerja perusahaan baru
  const handleCreate = async () => {
    if (!companyName.trim()) {
      setErrorMessage('Nama organisasi / perusahaan tidak boleh kosong.');
      return;
    }

    if (!user?.isDeveloper && (user?.companies.length || 0) >= 1) {
      setErrorMessage('User hanya bisa 1 kali membuat company kecuali developer.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await createCompany(companyName, categoryName);
    setIsSubmitting(false);

    if (result.success && result.company) {
      setSuccessToast(`Organisasi "${result.company.name}" berhasil dibuat!`);
      setCompanyName('');
      setShowQuickJoinDrawer(false);
      setTimeout(() => setSuccessToast(null), 3500);
    } else {
      setErrorMessage(result.error || 'Terjadi kesalahan saat membuat organisasi.');
    }
  };

  // Handler buat tim baru di dalam company (Pembuat otomatis menjadi Admin tim)
  const handleCreateTeamSubmit = async () => {
    if (!newTeamName.trim()) {
      setErrorMessage('Nama tim tidak boleh kosong.');
      return;
    }

    if (!selectedCompanyId) {
      setErrorMessage('Silakan pilih atau buat perusahaan terlebih dahulu.');
      return;
    }

    setErrorMessage(null);
    setIsCreatingTeam(true);

    const result = await createTeam(selectedCompanyId, newTeamName, newTeamDescription);
    setIsCreatingTeam(false);

    if (result.success && result.team) {
      const createdTeam = result.team;
      setSuccessToast(`Tim "${createdTeam.name}" berhasil dibuat! Anda sekarang adalah Admin tim.`);
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateTeamModal(false);
      setTimeout(() => setSuccessToast(null), 3500);

      // Tawarkan langsung membuka WhatsApp group chat untuk tim yang baru dibuat
      Alert.alert(
        'Tim Berhasil Dibuat! 🎉',
        `Tim "${createdTeam.name}" siap digunakan. Masuk ke ruang chat grup WhatsApp tim sekarang?`,
        [
          { text: 'Nanti', style: 'cancel' },
          {
            text: 'Buka Chat Tim',
            onPress: () => JoinMassageTim(createdTeam),
          },
        ]
      );
    } else {
      setErrorMessage(result.error || 'Gagal membuat tim baru.');
    }
  };

  // Handler minta gabung ke tim yang ada (Menunggu persetujuan admin)
  const handleRequestJoinTeam = async (teamId: string, teamName: string) => {
    if (!selectedCompanyId) return;

    setErrorMessage(null);
    const result = await requestJoinTeam(selectedCompanyId, teamId);

    if (result.success) {
      setSuccessToast(`Permintaan bergabung ke tim "${teamName}" telah dikirim ke Admin tim.`);
      setTimeout(() => setSuccessToast(null), 3500);
    } else {
      setErrorMessage(result.error || 'Gagal mengirim permintaan bergabung.');
    }
  };

  // Handler persetujuan admin tim (Setujui / Tolak)
  const handleRespondRequest = async (
    teamId: string,
    requestId: string,
    action: 'approve' | 'reject',
    userName: string
  ) => {
    if (!selectedCompanyId) return;

    setErrorMessage(null);
    const result = await respondJoinRequest(selectedCompanyId, teamId, requestId, action);

    if (result.success) {
      if (action === 'approve') {
        setSuccessToast(`${userName} telah disetujui bergabung ke dalam tim!`);
      } else {
        setSuccessToast(`Permintaan ${userName} telah ditolak.`);
      }
      setTimeout(() => setSuccessToast(null), 3500);
    } else {
      setErrorMessage(result.error || 'Gagal memproses permintaan.');
    }
  };

  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web') {
      try {
        navigator.clipboard?.writeText(text);
      } catch {}
    }
    Alert.alert('Kode Disalin', `Kode "${text}" disalin ke papan klip.`);
  };

  // Masuk kedalam Massage grup tim sesuai tim yang dibuat seperti WhatsApp
  const JoinMassageTim = (team?: Team | null) => {
    // 1. Tentukan tim yang akan dimasuki
    let targetTeam = team;
    if (!targetTeam) {
      // Jika tidak ada tim yang dipassing langsung, cari tim di mana user sudah terdaftar
      const joinedTeam = (DaftarTimCompany || []).find((t) => {
        const isAdmin =
          t.adminEmail.toLowerCase() === (user?.email || '').toLowerCase() ||
          t.members.some(
            (m) => m.email.toLowerCase() === (user?.email || '').toLowerCase() && m.role === 'admin'
          );
        const isMember = t.members.some(
          (m) => m.email.toLowerCase() === (user?.email || '').toLowerCase()
        );
        return isAdmin || isMember;
      });

      if (joinedTeam) {
        targetTeam = joinedTeam;
      } else if (DaftarTimCompany && DaftarTimCompany.length > 0) {
        targetTeam = DaftarTimCompany[0];
      }
    }

    // Jika belum ada tim sama sekali di perusahaan
    if (!targetTeam) {
      Alert.alert(
        'Belum Ada Tim',
        'Belum ada tim yang tersedia di perusahaan ini. Silakan buat tim baru terlebih dahulu.',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Buat Tim Sekarang',
            onPress: () => setShowCreateTeamModal(true),
          },
        ]
      );
      return;
    }

    // 2. Cek apakah user adalah anggota atau admin tim
    const isMember = targetTeam.members.some(
      (m) => m.email.toLowerCase() === (user?.email || '').toLowerCase()
    );
    const isAdmin =
      targetTeam.adminEmail.toLowerCase() === (user?.email || '').toLowerCase() ||
      targetTeam.members.some(
        (m) => m.email.toLowerCase() === (user?.email || '').toLowerCase() && m.role === 'admin'
      );

    // Jika bukan anggota dan bukan admin
    if (!isMember && !isAdmin) {
      Alert.alert(
        'Akses Dibatasi',
        `Anda belum terdaftar sebagai anggota tim "${targetTeam.name}". Silakan ajukan permintaan bergabung ke Admin tim terlebih dahulu untuk membuka grup chat WhatsApp ini.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Minta Gabung Tim',
            onPress: () => handleRequestJoinTeam(targetTeam!.id, targetTeam!.name),
          },
        ]
      );
      return;
    }

    // 3. Masuk ke halaman massagegrup sesuai tim yang dibuat seperti WhatsApp
    router.push({
      pathname: '/massagegrup',
      params: {
        teamId: targetTeam.id,
        teamName: targetTeam.name,
        companyId: selectedCompanyId || '',
      },
    });
  };
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* STATUS BAR */}
      <AppStatusBar style="dark" />

      {/* ============================================================ */}
      {/* HEADER: COMMAND DECK & USER PROFILE                          */}
      {/* ============================================================ */}
      <View style={styles.commandHeader}>
        <View style={styles.brandRow}>
          <View style={styles.brandCluster}>
            <View style={styles.brandEmblem}>
              <Ionicons name="hardware-chip-outline" size={18} color="#2563EB" />
            </View>
            <View>
              <View style={styles.titleWithLiveRow}>
                <Text style={styles.brandTitle}>MANAGEMENT</Text>
                <View style={styles.systemBadge}>
                  <Text style={styles.systemBadgeText}>GATEWAY</Text>
                </View>
              </View>
              <Text style={styles.brandSubtitle}>Central Organization Portal</Text>
            </View>
          </View>

          {/* User Profile Pill & Developer Toggle */}
          <TouchableOpacity
            style={styles.profileBadge}
            activeOpacity={0.8}
            onPress={toggleDeveloperMode}>
            <View
              style={[
                styles.roleDot,
                { backgroundColor: user?.isDeveloper ? '#7C3AED' : '#10B981' },
              ]}
            />
            <Text style={styles.profileBadgeName} numberOfLines={1}>
              {user?.name?.split(' ')[0] || 'User'}
            </Text>
            <View
              style={[
                styles.roleMiniTag,
                user?.isDeveloper ? styles.roleMiniTagDev : styles.roleMiniTagUser,
              ]}>
              <Text
                style={[
                  styles.roleMiniTagText,
                  user?.isDeveloper ? styles.roleMiniTagTextDev : styles.roleMiniTagTextUser,
                ]}>
                {user?.isDeveloper ? 'DEV' : 'USER'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Batas Perusahaan */}
        <View style={styles.membershipBanner}>
          <Ionicons
            name={user?.isDeveloper ? 'shield-checkmark' : 'information-circle'}
            size={14}
            color={user?.isDeveloper ? '#7C3AED' : '#2563EB'}
          />
          <Text style={styles.membershipBannerText}>
            {user?.isDeveloper
              ? 'Mode Developer: Bebas bergabung & mengelola banyak perusahaan.'
              : 'Akun User: Cuma bisa 1 kali join ke company.'}
          </Text>
        </View>
      </View>

      {/* ============================================================ */}
      {/* SCROLLABLE VIEWPORT CONTENT                                  */}
      {/* ============================================================ */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: insets.bottom + 85 },
        ]}
        showsVerticalScrollIndicator={false}>
        
        {/* TOAST NOTIFIKASI */}
        {successToast && (
          <View style={styles.toastSuccess}>
            <View style={styles.toastSuccessIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            </View>
            <Text style={styles.toastSuccessText}>{successToast}</Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.toastError}>
            <View style={styles.toastErrorIcon}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
            </View>
            <Text style={styles.toastErrorText}>{errorMessage}</Text>
          </View>
        )}

        {/* ============================================================ */}
        {/* KONDISI 1: BELUM MEMILIH / MEMBUAT COMPANY                   */}
        {/* ============================================================ */}
        {!showSelectedCompany ? (
          <View style={styles.newAccountFlow}>
            <View style={styles.passportCard}>
              <View style={styles.passportBadge}>
                <Ionicons name="sparkles" size={13} color="#2563EB" />
                <Text style={styles.passportBadgeText}>SETUP RUANG KERJA</Text>
              </View>

              <Text style={styles.passportTitle}>Masuk ke Ruang Kerja</Text>
              <Text style={styles.passportDesc}>
                Akun Anda belum memiliki ruang kerja aktif. Silakan buat perusahaan baru atau gabung menggunakan kode undangan resmi tim Anda.
              </Text>

              {/* DUAL ACCESS CONTROLS */}
              <View style={styles.segmentedSelector}>
                <TouchableOpacity
                  style={[
                    styles.selectorTab,
                    accessMode === 'invite' && styles.selectorTabSelected,
                  ]}
                  onPress={() => {
                    setAccessMode('invite');
                    setErrorMessage(null);
                  }}>
                  <Ionicons
                    name="key-outline"
                    size={16}
                    color={accessMode === 'invite' ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.selectorTabText,
                      accessMode === 'invite' && styles.selectorTabTextSelected,
                    ]}>
                    Klaim Undangan Tim
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.selectorTab,
                    accessMode === 'create' && styles.selectorTabSelected,
                  ]}
                  onPress={() => {
                    setAccessMode('create');
                    setErrorMessage(null);
                  }}>
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color={accessMode === 'create' ? '#2563EB' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.selectorTabText,
                      accessMode === 'create' && styles.selectorTabTextSelected,
                    ]}>
                    Bangun Entitas Baru
                  </Text>
                </TouchableOpacity>
              </View>

              {/* FORM TAB 1: KODE UNDANGAN */}
              {accessMode === 'invite' ? (
                <View style={styles.inviteSection}>
                  <Text style={styles.fieldLabel}>KODE AKSES RESMI</Text>
                  <View style={styles.codeKeyBox}>
                    <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
                    <TextInput
                      style={styles.codeKeyInput}
                      placeholder="CTH: SOLUSI-01"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="characters"
                      value={companyCode}
                      onChangeText={setCompanyCode}
                    />
                    {companyCode.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setCompanyCode('')}
                        style={styles.clearBtn}>
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Rekomendasi Kode Demo Cepat */}
                  <View style={styles.presetBox}>
                    <Text style={styles.presetLabel}>Kode Referensi Tim Tersedia:</Text>
                    <View style={styles.presetGrid}>
                      {DEMO_COMPANIES.map((demo) => (
                        <TouchableOpacity
                          key={demo.id}
                          style={styles.presetPill}
                          onPress={() => setCompanyCode(demo.code)}>
                          <Text style={styles.presetCode}>{demo.code}</Text>
                          <Text style={styles.presetName} numberOfLines={1}>
                            {demo.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, isSubmitting && styles.btnLoading]}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                    onPress={() => handleJoin()}>
                    <Text style={styles.primaryActionText}>
                      {isSubmitting ? 'Memverifikasi...' : 'Buka Akses Ruang Kerja'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                /* FORM TAB 2: BUAT ENTITAS BARU */
                <View style={styles.createSection}>
                  <Text style={styles.fieldLabel}>NAMA PERUSAHAAN / ORGANISASI</Text>
                  <View style={styles.modernInputWrapper}>
                    <Ionicons name="business" size={18} color="#64748B" />
                    <TextInput
                      style={styles.modernInput}
                      placeholder="Misal: PT Teknologi Maju Bersama"
                      placeholderTextColor="#94A3B8"
                      value={companyName}
                      onChangeText={setCompanyName}
                    />
                  </View>

                  <Text style={styles.fieldLabel}>SEKTOR / INDUSTRI</Text>
                  <View style={styles.categoryChipsGrid}>
                    {[
                      'Teknologi & Digital',
                      'Pendidikan & Pelatihan',
                      'Kelas & Workshop',
                      'Logistik & Operasional',
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.catPill,
                          categoryName === cat && styles.catPillSelected,
                        ]}
                        onPress={() => setCategoryName(cat)}>
                        <Text
                          style={[
                            styles.catPillText,
                            categoryName === cat && styles.catPillTextSelected,
                          ]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryActionBtn, isSubmitting && styles.btnLoading]}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                    onPress={handleCreate}>
                    <Text style={styles.primaryActionText}>
                      {isSubmitting ? 'Mendaftarkan...' : 'Inisialisasi Organisasi Baru'}
                    </Text>
                    <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* ============================================================ */
          /* KONDISI 2: MEMUNCULKAN COMPANY YANG DIPILIH                  */
          /* ============================================================ */
          <View style={styles.selectedCompanyFlow}>
            {/* HERO KARTU COMPANY YANG DIPILIH */}
            <View style={styles.activeCompanyCard}>
              <View
                style={[
                  styles.activeCompanyAccent,
                  { backgroundColor: selectedCompany?.themeColor || '#2563EB' },
                ]}
              />

              <View style={styles.activeCardContent}>
                {/* Header Company Terpilih */}
                <View style={styles.activeHeaderRow}>
                  <View
                    style={[
                      styles.activeMonogram,
                      { backgroundColor: `${selectedCompany?.themeColor || '#2563EB'}15` },
                    ]}>
                    <Ionicons
                      name={(selectedCompany?.logoIcon as any) || 'business'}
                      size={28}
                      color={selectedCompany?.themeColor || '#2563EB'}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.activePillGroup}>
                      <View style={styles.activeStatusBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.activeStatusBadgeText}>PERUSAHAAN TERPILIH</Text>
                      </View>
                      <Text style={styles.activeCategoryText}>{selectedCompany?.category}</Text>
                    </View>
                    <Text style={styles.activeCompanyName}>{selectedCompany?.name}</Text>
                  </View>
                </View>

                {/* Peran Pengguna & Kode Perusahaan */}
                <View style={styles.activeMetaRow}>
                  <View style={styles.activeRolePill}>
                    <Ionicons name="shield-checkmark" size={13} color="#1E293B" />
                    <Text style={styles.activeRoleText}>{selectedCompany?.role}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.activeCodePill}
                    activeOpacity={0.7}
                    onPress={() => copyToClipboard(selectedCompany?.code || '')}>
                    <Text style={styles.activeCodeText}>{selectedCompany?.code}</Text>
                    <Ionicons name="copy-outline" size={12} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* METRIK MATRIX RUANG KERJA TERPILIH */}
                <View style={styles.metricsBox}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricVal}>{selectedCompany?.activeTasks ?? 0}</Text>
                    <Text style={styles.metricLabel}>Tugas Aktif</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={styles.metricVal}>{daftarProjectTim?.length ?? selectedCompany?.activeProjects ?? 1}</Text>
                    <Text style={styles.metricLabel}>Proyek Tim</Text>
                  </View>

                  <View style={styles.metricDivider} />

                  <View style={styles.metricItem}>
                    <Text style={[styles.metricVal, { color: '#059669' }]}>
                      👥 {DaftarTimCompany?.length ?? 0}
                    </Text>
                    <Text style={styles.metricLabel}>Tim Divisi</Text>
                  </View>
                </View>

                {/* SHORTCUT AKSI CEPAT */}
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={[styles.actionGridBtn, { backgroundColor: '#EFF6FF' }]}
                    onPress={() => router.push('/proyek')}>
                    <Ionicons name="folder-open" size={18} color="#2563EB" />
                    <Text style={[styles.actionGridText, { color: '#2563EB' }]}>
                      Proyek Tim
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionGridBtn, { backgroundColor: '#F0FDF4' }]}
                    onPress={() => router.push('/tugas')}>
                    <Ionicons name="checkbox" size={18} color="#059669" />
                    <Text style={[styles.actionGridText, { color: '#059669' }]}>
                      Tugas
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionGridBtn, { backgroundColor: '#FAF5FF' }]}
                    onPress={() => setShowCreateTeamModal(true)}>
                    <Ionicons name="add-circle" size={18} color="#7C3AED" />
                    <Text style={[styles.actionGridText, { color: '#7C3AED' }]}>
                      + Buat Tim
                    </Text>

                  </TouchableOpacity>
                </View>
                {/* Tombol keluar company */}
                <View style={styles.exitCompanyRow}>
                  <TouchableOpacity
                    style={styles.exitCompanyBtn}
                    onPress={() => {
                      Alert.alert(
                        'Keluar dari Perusahaan',
                        `Apakah Anda yakin ingin keluar dari perusahaan "${selectedCompany?.name}"?`,
                        [
                          { text: 'Batal', style: 'cancel' },
                          {
                            text: 'Keluar',
                            style: 'destructive',
                            onPress: async () => {
                              if (!selectedCompanyId) return;

                              const result = await leaveCompany(selectedCompanyId);
                              if (result.success) {
                                setSuccessToast('Anda telah keluar dari perusahaan.');
                              } else {
                                setErrorMessage(result.error || 'Gagal keluar dari perusahaan.');
                              }
                            },
                          },
                        ]
                      );
                    }}>
                    <Ionicons name="log-out-outline" size={18} color="#DC2626" />
                    <Text style={styles.exitCompanyText}>Keluar dari Perusahaan</Text>
                  </TouchableOpacity>
                </View> 
              </View>
            </View>

            {/* ============================================================ */}
            {/* SEKSI: DAFTAR TIM PERUSAHAAN (DaftarTimCompany)              */}
            {/* ============================================================ */}
            <View style={styles.teamsSectionContainer}>
              {/* Header Judul & Badge Jumlah Tim */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleCluster}>
                  <Ionicons name="people" size={18} color="#2563EB" />
                  <Text style={styles.sectionTitle}>Daftar Tim Perusahaan</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {DaftarTimCompany?.length || 0} Tim
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionSubtitle}>
                Pilih dan minta bergabung ke tim divisi. Permintaan memerlukan persetujuan Admin tim. Ketika Anda membuat tim baru, Anda otomatis menjadi Admin tim.
              </Text>

              {/* Tombol Buat Tim Baru & Shortcut Masuk Chat WhatsApp Tim */}
              <View style={styles.teamHeaderActionRow}>
                <TouchableOpacity
                  style={styles.createTeamBtnWide}
                  activeOpacity={0.85}
                  onPress={() => setShowCreateTeamModal(true)}>
                  <Ionicons name="add-circle" size={18} color="black" />
                  <Text style={styles.createTeamBtnWideText}>
                    Buat Tim Baru
                  </Text>
                </TouchableOpacity>

              </View>

              {/* LIST DAFTAR TIM */}
              {(!DaftarTimCompany || DaftarTimCompany.length === 0) ? (
                <View style={styles.emptyTeamCard}>
                  <Ionicons name="people-circle-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyTeamTitle}>Belum Ada Tim di Perusahaan Ini</Text>
                  <Text style={styles.emptyTeamDesc}>
                    Buat tim pertama Anda sekarang. Anda akan menjadi Admin tim ini dan dapat mengelola anggota tim.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={() => setShowCreateTeamModal(true)}>
                    <Ionicons name="add" size={16} color="black" />
                    <Text style={styles.emptyActionText}>Inisialisasi Tim Baru</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.teamsListGrid}>
                  {DaftarTimCompany.map((team) => {
                    const isAdmin =
                      team.adminEmail.toLowerCase() === (user?.email || '').toLowerCase() ||
                      team.members.some(
                        (m) => m.email.toLowerCase() === (user?.email || '').toLowerCase() && m.role === 'admin'
                      );

                    const isMember = team.members.some(
                      (m) => m.email.toLowerCase() === (user?.email || '').toLowerCase()
                    );

                    const hasPendingRequest = (team.pendingRequests || []).some(
                      (r) => r.userEmail.toLowerCase() === (user?.email || '').toLowerCase() && r.status === 'pending'
                    );

                    const pendingCount = (team.pendingRequests || []).length;

                    return (
                      <View key={team.id} style={styles.teamCard}>
                        {/* Team Card Header (Ketuk untuk masuk chat tim) */}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => JoinMassageTim(team)}
                          style={styles.teamCardHeader}>
                          <View style={styles.teamIconBox}>
                            <Ionicons
                              name={(team.icon as any) || 'people-outline'}
                              size={20}
                              color="#2563EB"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={styles.teamNameRow}>
                              <Text style={styles.teamName} numberOfLines={1}>
                                {team.name}
                              </Text>
                              {isAdmin && (
                                <View style={styles.adminBadge}>
                                  <Text style={styles.adminBadgeText}>👑 ADMIN TIM</Text>
                                </View>
                              )}
                              {isMember && !isAdmin && (
                                <View style={styles.memberBadge}>
                                  <Text style={styles.memberBadgeText}>✓ ANGGOTA</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.teamDescription}>{team.description}</Text>
                          </View>
                          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#075E54" />
                        </TouchableOpacity>

                        {/* Team Info Meta */}
                        <View style={styles.teamMetaBar}>
                          <View style={styles.teamMetaItem}>
                            <Ionicons name="shield-outline" size={13} color="#64748B" />
                            <Text style={styles.teamMetaText}>
                              Admin: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{team.adminName}</Text>
                            </Text>
                          </View>

                          <View style={styles.teamMetaItem}>
                            <Ionicons name="people-outline" size={13} color="#64748B" />
                            <Text style={styles.teamMetaText}>
                              {team.members.length} Anggota
                            </Text>
                          </View>
                        </View>

                        {/* ========================================== */}
                        {/* PANEL PERSETUJUAN KHUSUS ADMIN TIM        */}
                        {/* ========================================== */}
                        {isAdmin && pendingCount > 0 && (
                          <View style={styles.adminApprovalBox}>
                            <View style={styles.approvalHeaderRow}>
                              <Ionicons name="notifications" size={14} color="#D97706" />
                              <Text style={styles.approvalHeaderText}>
                                {pendingCount} Permintaan Bergabung Menunggu Persetujuan Anda:
                              </Text>
                            </View>

                            <View style={styles.requestsList}>
                              {team.pendingRequests.map((req) => (
                                <View key={req.id} style={styles.requestItemRow}>
                                  <View style={styles.requestUserCluster}>
                                    <View style={styles.requestAvatarCircle}>
                                      <Text style={styles.requestAvatarText}>
                                        {req.userName.charAt(0).toUpperCase()}
                                      </Text>
                                    </View>
                                    <View>
                                      <Text style={styles.requestUserName}>{req.userName}</Text>
                                      <Text style={styles.requestUserEmail}>{req.userEmail}</Text>
                                    </View>
                                  </View>

                                  {/* Tombol Setujui / Tolak */}
                                  <View style={styles.approvalActionsRow}>
                                    <TouchableOpacity
                                      style={styles.approveBtn}
                                      onPress={() =>
                                        handleRespondRequest(team.id, req.id, 'approve', req.userName)
                                      }>
                                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                      <Text style={styles.approveBtnText}>Setujui</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                      style={styles.rejectBtn}
                                      onPress={() =>
                                        handleRespondRequest(team.id, req.id, 'reject', req.userName)
                                      }>
                                      <Ionicons name="close" size={14} color="#DC2626" />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        {/* ACTION BUTTON (JIKA ANGGOTA / ADMIN -> MASUK CHAT GRUP TIM WHATSAPP) */}
                        {isMember ? (
                          <View style={styles.teamCardFooter}>
                            <TouchableOpacity
                              style={styles.openChatBtn}
                              activeOpacity={0.85}
                              onPress={() => JoinMassageTim(team)}>
                              <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
                              <Text style={styles.openChatBtnText}>
                                Buka Chat Tim 
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.teamCardFooter}>
                            {hasPendingRequest ? (
                              <View style={styles.pendingWaitingPill}>
                                <Ionicons name="time-outline" size={15} color="#D97706" />
                                <Text style={styles.pendingWaitingText}>
                                  Menunggu Persetujuan Admin Tim
                                </Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.requestJoinBtn}
                                activeOpacity={0.85}
                                onPress={() => handleRequestJoinTeam(team.id, team.name)}>
                                <Ionicons name="enter-outline" size={16} color="#2563EB" />
                                <Text style={styles.requestJoinText}>
                                  Minta Gabung ke Tim Ini
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ============================================================ */}
            {/* SEKSI: PROYEK TIM (daftarProjectTim)                         */}
            {/* ============================================================ */}
            {daftarProjectTim && daftarProjectTim.length > 0 && (
              <View style={styles.projectsSectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleCluster}>
                    <Ionicons name="folder-open" size={18} color="#059669" />
                    <Text style={styles.sectionTitle}>Daftar Proyek Tim</Text>
                    <View style={[styles.countBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                      <Text style={[styles.countBadgeText, { color: '#059669' }]}>
                        {daftarProjectTim.length} Proyek
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.projectsGrid}>
                  {daftarProjectTim.map((project) => (
                    <View key={project.id} style={styles.projectCard}>
                      <View style={styles.projectHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.projectTeamBadge}>{project.teamName}</Text>
                          <Text style={styles.projectTitle}>{project.title}</Text>
                        </View>
                        <Text style={styles.projectDeadline}>📅 {project.deadline}</Text>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.progressRow}>
                        <Text style={styles.progressLabel}>Progres Tim</Text>
                        <Text style={styles.progressPercent}>{project.progress}%</Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${project.progress}%`,
                              backgroundColor: project.progress > 60 ? '#059669' : '#2563EB',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ============================================================ */}
            {/* SEKSI KHUSUS DEVELOPER ATAU USER BIASA                       */}
            {/* ============================================================ */}
            {user?.isDeveloper ? (
              <View style={styles.devSectionCard}>
                <View style={styles.devSectionHeader}>
                  <View style={styles.devTag}>
                    <Ionicons name="code-slash" size={14} color="#7C3AED" />
                    <Text style={styles.devTagText}>KONTROL MULTI-COMPANY (DEVELOPER)</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.quickAddBtn}
                    onPress={() => setShowQuickJoinDrawer(!showQuickJoinDrawer)}>
                    <Ionicons
                      name={showQuickJoinDrawer ? 'close' : 'add'}
                      size={16}
                      color="#7C3AED"
                    />
                    <Text style={styles.quickAddBtnText}>
                      {showQuickJoinDrawer ? 'Tutup' : 'Tambah / Join Lain'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Form Tambah Company Khusus Developer */}
                {showQuickJoinDrawer && (
                  <View style={styles.drawerCard}>
                    <Text style={styles.drawerTitle}>Gabung ke Perusahaan Tambahan</Text>
                    <View style={styles.drawerInputRow}>
                      <TextInput
                        style={styles.drawerInput}
                        placeholder="Kode Perusahaan (cth: KREATIF-88)"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                        value={companyCode}
                        onChangeText={setCompanyCode}
                      />
                      <TouchableOpacity
                        style={styles.drawerSubmitBtn}
                        onPress={() => handleJoin()}>
                        <Text style={styles.drawerSubmitText}>Gabung</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Daftar Perusahaan yang Diikuti Developer */}
                {(user.companies.length || 0) > 1 && (
                  <View style={styles.companySwitcherBox}>
                    <Text style={styles.switcherTitle}>
                      Ganti Ruang Kerja ({user.companies.length} Terdaftar):
                    </Text>
                    <View style={styles.switcherList}>
                      {user.companies.map((comp) => {
                        const isCurrent = comp.id === selectedCompanyId;
                        return (
                          <TouchableOpacity
                            key={comp.id}
                            style={[
                              styles.switcherItem,
                              isCurrent && styles.switcherItemActive,
                            ]}
                            onPress={() => setActiveCompany(comp.id)}>
                            <View
                              style={[
                                styles.switcherDot,
                                { backgroundColor: comp.themeColor || '#2563EB' },
                              ]}
                            />
                            <Text
                              style={[
                                styles.switcherName,
                                isCurrent && styles.switcherNameActive,
                              ]}
                              numberOfLines={1}>
                              {comp.name}
                            </Text>
                            {isCurrent && (
                              <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* KETERANGAN BATASAN USER BIASA (1 KALI JOIN) */
              <View style={styles.regularUserNotice}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.regularUserNoticeTitle}>Status Keanggotaan Terkunci</Text>
                  <Text style={styles.regularUserNoticeText}>
                    Anda terdaftar sebagai User biasa (maksimal 1 perusahaan). Hubungi developer atau ubah peran ke Developer jika membutuhkan akses multi-organisasi.
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ============================================================ */}
      {/* MODAL: BUAT TIM BARU (SEPERTI GRUP WHATSAPP)                 */}
      {/* ============================================================ */}
      <Modal
        visible={showCreateTeamModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateTeamModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeaderCluster}>
              <View style={styles.modalIconBox}>
                <Ionicons name="people" size={24} color="#2563EB" />
              </View>
              <Text style={styles.modalSheetTitle}>Buat Tim Baru</Text>
              <Text style={styles.modalSheetSubtitle}>
                Bentuk tim divisi di dalam perusahaan "{selectedCompany?.name}"
              </Text>
            </View>

            {/* CALLOUT INFO ADMIN WHATSAPP STYLE */}
            <View style={styles.waAdminTipBox}>
              <Ionicons name="ribbon" size={20} color="#7C3AED" />
              <View style={{ flex: 1 }}>
                <Text style={styles.waAdminTipTitle}>Admin Tim Otomatis (Grup WA Style)</Text>
                <Text style={styles.waAdminTipText}>
                  Sebagai pembuat tim, Anda akan otomatis menjadi <Text style={{ fontWeight: '800' }}>Admin Tim</Text>. Anda berwenang menyetujui atau menolak anggota lain yang ingin bergabung ke tim ini.
                </Text>
              </View>
            </View>

            {/* FORM INPUT TIM */}
            <View style={styles.teamForm}>
              <Text style={styles.formFieldLabel}>NAMA TIM / DIVISI</Text>
              <View style={styles.formInputWrapper}>
                <Ionicons name="people-outline" size={18} color="#64748B" />
                <TextInput
                  style={styles.formInputField}
                  placeholder="Misal: Divisi Mobile Developer"
                  placeholderTextColor="#94A3B8"
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                />
              </View>

              <Text style={styles.formFieldLabel}>DESKRIPSI TUGAS & FOKUS TIM</Text>
              <View style={[styles.formInputWrapper, { height: 72, alignItems: 'flex-start', paddingTop: 10 }]}>
                <TextInput
                  style={[styles.formInputField, { height: '100%', textAlignVertical: 'top' }]}
                  placeholder="Jelaskan ruang lingkup dan tanggung jawab tim ini..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={newTeamDescription}
                  onChangeText={setNewTeamDescription}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitCreateTeamBtn, isCreatingTeam && styles.btnLoading]}
                disabled={isCreatingTeam}
                activeOpacity={0.85}
                onPress={handleCreateTeamSubmit}>
                <Text style={styles.submitCreateTeamText}>
                  {isCreatingTeam ? 'Membuat Tim...' : 'Buat Tim & Jadi Admin'}
                </Text>
                <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setShowCreateTeamModal(false)}>
                <Text style={styles.cancelModalText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NAVBAR BAWAH */}
      <BottomNavbar activeRoute="dashboard" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },

  /* COMMAND HEADER */
  commandHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandEmblem: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  titleWithLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1.2,
  },
  systemBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  systemBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  profileBadgeName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    maxWidth: 80,
  },
  roleMiniTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleMiniTagUser: {
    backgroundColor: '#EFF6FF',
  },
  roleMiniTagDev: {
    backgroundColor: '#F5F3FF',
  },
  roleMiniTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  roleMiniTagTextUser: {
    color: '#2563EB',
  },
  roleMiniTagTextDev: {
    color: '#7C3AED',
  },
  membershipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  membershipBannerText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },

  /* SCROLL CONTENT */
  scrollBody: {
    padding: 16,
  },
  toastSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  toastSuccessIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastSuccessText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  toastError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  toastErrorIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastErrorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },

  /* NEW ACCOUNT & SETUP RUANG KERJA FLOW */
  newAccountFlow: {
    gap: 16,
  },
  passportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  passportBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  passportBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.8,
  },
  passportTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  passportDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 18,
  },
  segmentedSelector: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  selectorTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  selectorTabSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  selectorTabTextSelected: {
    color: '#2563EB',
    fontWeight: '700',
  },
  inviteSection: {
    gap: 12,
  },
  createSection: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  codeKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 12,
  },
  codeKeyInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  clearBtn: {
    padding: 4,
  },
  presetBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  presetGrid: {
    gap: 6,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  presetCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  presetName: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    maxWidth: 160,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 48,
    gap: 8,
    marginTop: 4,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnLoading: {
    opacity: 0.7,
  },
  modernInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  modernInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  catPillText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  catPillTextSelected: {
    color: '#2563EB',
    fontWeight: '700',
  },

  /* SELECTED COMPANY DASHBOARD STYLES */
  selectedCompanyFlow: {
    gap: 18,
  },
  activeCompanyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    overflow: 'hidden',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  activeCompanyAccent: {
    height: 6,
    width: '100%',
  },
  activeCardContent: {
    padding: 18,
    gap: 14,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  activeMonogram: {
    width: 54,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeStatusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  activeCategoryText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  activeCompanyName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  activeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeRoleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  activeCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metricsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionGridBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  actionGridText: {
    fontSize: 11,
    fontWeight: '700',
  },
  exitCompanyRow: {
    marginTop: 10,
  },
  exitCompanyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 10,
  },
  exitCompanyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },

  /* TEAMS SECTION STYLES */
  teamsSectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'black',
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  teamHeaderActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  createTeamBtnWide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: 'black',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  createTeamBtnWideText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'black',
  },
  quickChatHeaderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E0F2F1',
    borderWidth: 1.5,
    borderColor: '#075E54',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  quickChatHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#075E54',
  },
  emptyTeamCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'black',
    gap: 8,
  },
  emptyTeamTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyTeamDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
    borderColor: 'black',
    borderWidth: 1,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'black',
  },
  teamsListGrid: {
    gap: 12,
  },
  teamCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'black',
    padding: 14,
    gap: 10,
  },
  teamCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  teamIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
  teamNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 2,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  adminBadge: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
  },
  memberBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  teamDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  teamMetaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'black',
  },
  teamMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  teamMetaText: {
    fontSize: 11,
    color: '#64748B',
  },
  adminApprovalBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  approvalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approvalHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  requestsList: {
    gap: 6,
  },
  requestItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'black',
    padding: 8,
    borderRadius: 8,
  },
  requestUserCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  requestAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  requestUserName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  requestUserEmail: {
    fontSize: 10,
    color: '#64748B',
  },
  approvalActionsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamCardFooter: {
    marginTop: 2,
  },
  pendingWaitingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: 'black',
    paddingVertical: 8,
    borderRadius: 8,
  },
  pendingWaitingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  requestJoinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: 'black',
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestJoinText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  openChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#075E54', // WhatsApp Emerald Green
    borderWidth: 1,
    borderColor: 'black',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  openChatBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  /* PROJECTS SECTION */
  projectsSectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'black',
    gap: 12,
  },
  projectsGrid: {
    gap: 10,
  },
  projectCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'black',
    padding: 12,
    gap: 8,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  projectTeamBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  projectTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  projectDeadline: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* DEVELOPER MULTI-COMPANY SECTION */
  devSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  devSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  devTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
  },
  quickAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickAddBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  drawerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 8,
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  drawerInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  drawerInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#0F172A',
  },
  drawerSubmitBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 8,
  },
  drawerSubmitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  companySwitcherBox: {
    gap: 8,
  },
  switcherTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  switcherList: {
    gap: 6,
  },
  switcherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  switcherItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  switcherDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  switcherName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  switcherNameActive: {
    fontWeight: '700',
    color: '#1E293B',
  },

  /* REGULAR USER NOTICE */
  regularUserNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    borderRadius: 14,
  },
  regularUserNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  regularUserNoticeText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },

  /* MODAL BUAT TIM */
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
    gap: 14,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalHeaderCluster: {
    alignItems: 'center',
    gap: 4,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  waAdminTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 12,
    borderRadius: 12,
  },
  waAdminTipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6D28D9',
    marginBottom: 2,
  },
  waAdminTipText: {
    fontSize: 11,
    color: '#5B21B6',
    lineHeight: 16,
  },
  teamForm: {
    gap: 10,
  },
  formFieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  formInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  formInputField: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  submitCreateTeamBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 48,
    gap: 8,
    marginTop: 8,
  },
  submitCreateTeamText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelModalBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelModalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
