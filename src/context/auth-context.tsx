import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Platform } from 'react-native';

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
};

export type JoinRequest = {
  id: string;
  userName: string;
  userEmail: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type Team = {
  id: string;
  name: string;
  description: string;
  adminEmail: string;
  adminName: string;
  members: TeamMember[];
  pendingRequests: JoinRequest[];
  icon?: string;
  createdAt: string;
};

export type TeamProject = {
  id: string;
  teamId: string;
  teamName: string;
  title: string;
  deadline: string;
  progress: number;
  status: 'planning' | 'in_progress' | 'completed';
};

export type Company = {
  id: string;
  name: string;
  code: string;
  role: string;
  category: string;
  membersCount: number;
  onlineCount: number;
  activeTasks: number;
  activeProjects: number;
  joinedAt: string;
  isPrimary?: boolean;
  themeColor: string;
  logoIcon: string;
  // Field data tim & proyek
  timCompany?: Team[];
  daftarTimCompany?: Team[];
  daftarProjectTim?: TeamProject[];
};

export type User = {
  name: string;
  email: string;
  avatarUrl?: string;
  isNewUser: boolean;
  isDeveloper: boolean;
  companies: Company[];
  activeCompanyId?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, isDeveloper?: boolean) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (name: string, email: string, isDeveloper?: boolean, avatarUrl?: string) => Promise<{ success: boolean }>;
  register: (name: string, email: string, password: string, isDeveloper?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  joinCompany: (companyCode: string) => Promise<{ success: boolean; error?: string; company?: Company }>;
  createCompany: (companyName: string, category: string) => Promise<{ success: boolean; error?: string; company?: Company }>;
  leaveCompany: (companyId: string) => Promise<{ success: boolean; error?: string }>;
  setActiveCompany: (companyId: string) => void;
  toggleDeveloperMode: () => void;
  // Aksi Tim
  createTeam: (companyId: string, teamName: string, description: string) => Promise<{ success: boolean; error?: string; team?: Team }>;
  leaveTeam: (companyId: string, teamId: string) => Promise<{ success: boolean; error?: string }>;
  requestJoinTeam: (companyId: string, teamId: string) => Promise<{ success: boolean; error?: string }>;
  respondJoinRequest: (companyId: string, teamId: string, requestId: string, action: 'approve' | 'reject') => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'management_app_auth_user_v4';

const INITIAL_DEMO_TEAMS_1: Team[] = [
  {
    id: 'team-dev-1',
    name: 'Core Frontend & Mobile Squad',
    description: 'Pengembangan aplikasi mobile React Native, Android & iOS.',
    adminEmail: 'budi.santoso@digital.com',
    adminName: 'Budi Santoso',
    members: [
      {
        id: 'mem-1',
        name: 'Budi Santoso',
        email: 'budi.santoso@digital.com',
        role: 'admin',
        joinedAt: '12 Jan 2024',
      },
      {
        id: 'mem-2',
        name: 'Siti Rahma',
        email: 'siti.rahma@digital.com',
        role: 'member',
        joinedAt: '15 Jan 2024',
      },
    ],
    pendingRequests: [],
    icon: 'phone-portrait-outline',
    createdAt: '12 Jan 2024',
  },
  {
    id: 'team-dev-2',
    name: 'Backend & Cloud DevOps',
    description: 'Microservices, REST API, Database PostgreSQL, dan Kubernetes.',
    adminEmail: 'hendra.gunawan@digital.com',
    adminName: 'Hendra Gunawan',
    members: [
      {
        id: 'mem-3',
        name: 'Hendra Gunawan',
        email: 'hendra.gunawan@digital.com',
        role: 'admin',
        joinedAt: '14 Jan 2024',
      },
      {
        id: 'mem-4',
        name: 'Rian Pratama',
        email: 'rian@digital.com',
        role: 'member',
        joinedAt: '20 Jan 2024',
      },
    ],
    pendingRequests: [],
    icon: 'server-outline',
    createdAt: '14 Jan 2024',
  },
];

const INITIAL_DEMO_PROJECTS_1: TeamProject[] = [
  {
    id: 'proj-1',
    teamId: 'team-dev-1',
    teamName: 'Core Frontend & Mobile Squad',
    title: 'Migrasi UI Expo SDK 58 & Dark Mode',
    deadline: '28 Nov 2026',
    progress: 75,
    status: 'in_progress',
  },
  {
    id: 'proj-2',
    teamId: 'team-dev-2',
    teamName: 'Backend & Cloud DevOps',
    title: 'Optimalisasi Response API & Redis Cache',
    deadline: '10 Des 2026',
    progress: 40,
    status: 'in_progress',
  },
];

export const DEMO_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'PT Digital Solusindo',
    code: 'SOLUSI-01',
    role: 'Lead PM & Architect',
    category: 'Software & Cloud Ops',
    membersCount: 28,
    onlineCount: 14,
    activeTasks: 19,
    activeProjects: 4,
    joinedAt: '12 Jan 2024',
    isPrimary: true,
    themeColor: '#2563EB',
    logoIcon: 'cube-outline',
    daftarTimCompany: INITIAL_DEMO_TEAMS_1,
    timCompany: [],
    daftarProjectTim: INITIAL_DEMO_PROJECTS_1,
  },
  {
    id: 'comp-2',
    name: 'CV Kreatif Mandiri',
    code: 'KREATIF-88',
    role: 'Principal Designer',
    category: 'Brand & Product Design',
    membersCount: 12,
    onlineCount: 6,
    activeTasks: 7,
    activeProjects: 2,
    joinedAt: '05 Mar 2024',
    themeColor: '#7C3AED',
    logoIcon: 'color-palette-outline',
    daftarTimCompany: [
      {
        id: 'team-kreatif-1',
        name: 'Brand Identity & Visual System',
        description: 'Pembuatan design system, typography, dan visual assets.',
        adminEmail: 'maya.lestari@kreatif.com',
        adminName: 'Maya Lestari',
        members: [
          {
            id: 'mem-k1',
            name: 'Maya Lestari',
            email: 'maya.lestari@kreatif.com',
            role: 'admin',
            joinedAt: '05 Mar 2024',
          },
        ],
        pendingRequests: [],
        icon: 'color-palette-outline',
        createdAt: '05 Mar 2024',
      },
    ],
    timCompany: [],
    daftarProjectTim: [
      {
        id: 'proj-k1',
        teamId: 'team-kreatif-1',
        teamName: 'Brand Identity & Visual System',
        title: 'Revamp Logo & Visual Guidelines 2026',
        deadline: '15 Des 2026',
        progress: 60,
        status: 'in_progress',
      },
    ],
  },
  {
    id: 'comp-3',
    name: 'PT Global Niaga Logistik',
    code: 'LOGIS-99',
    role: 'Operations Specialist',
    category: 'Fleet & Supply Chain',
    membersCount: 45,
    onlineCount: 21,
    activeTasks: 32,
    activeProjects: 8,
    joinedAt: '20 Mei 2024',
    themeColor: '#059669',
    logoIcon: 'navigate-circle-outline',
    daftarTimCompany: [],
    timCompany: [],
    daftarProjectTim: [],
  },
];

// Akun default saat pertama kali masuk: Langsung Akun Baru
export const DEFAULT_USER: User = {
  name: 'Alex Nugraha',
  email: 'alex.nugraha@gmail.com',
  isNewUser: true,
  isDeveloper: false,
  companies: [],
  activeCompanyId: undefined,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const savedUser = window.localStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
        }
      } catch {
        // Abaikan error parsing storage
      }
    }
  }, []);

  const saveUserToState = (updatedUser: User | null) => {
    setUser(updatedUser);
    if (Platform.OS === 'web') {
      try {
        if (updatedUser) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {}
    }
  };

  // Login via Google
  const loginWithGoogle = async (
    name: string,
    email: string,
    isDeveloper: boolean = false,
    avatarUrl?: string
  ) => {
    const formattedName = name.trim() || email.split('@')[0];
    const googleUser: User = {
      name: formattedName,
      email: email.trim(),
      avatarUrl,
      isNewUser: true,
      isDeveloper: isDeveloper || email.toLowerCase().includes('dev'),
      companies: [],
      activeCompanyId: undefined,
    };

    saveUserToState(googleUser);
    return { success: true };
  };

  const login = async (email: string, password: string, isDeveloper: boolean = false) => {
    if (!email || !password) {
      return { success: false, error: 'Email dan password harus diisi.' };
    }

    if (!email.includes('@')) {
      return { success: false, error: 'Format email tidak valid.' };
    }

    const cleanName = email.split('@')[0];
    const targetUser: User = {
      name: cleanName,
      email,
      isNewUser: true,
      isDeveloper: isDeveloper || email.toLowerCase().includes('dev'),
      companies: [],
      activeCompanyId: undefined,
    };

    saveUserToState(targetUser);
    return { success: true };
  };

  const register = async (name: string, email: string, password: string, isDeveloper: boolean = false) => {
    if (!name || !email || !password) {
      return { success: false, error: 'Semua kolom wajib diisi.' };
    }

    if (!email.includes('@')) {
      return { success: false, error: 'Format email tidak valid.' };
    }

    const registeredUser: User = {
      name: name.trim(),
      email,
      isNewUser: true,
      isDeveloper,
      companies: [],
      activeCompanyId: undefined,
    };

    saveUserToState(registeredUser);
    return { success: true };
  };

  const joinCompany = async (companyCode: string) => {
    const cleanCode = companyCode.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, error: 'Kode perusahaan wajib diisi.' };
    }

    if (!user) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    // Aturan: User biasa cuma bisa 1 kali join ke company, KECUALI Developer
    if (!user.isDeveloper && user.companies.length >= 1) {
      return {
        success: false,
        error: 'User biasa hanya dapat bergabung ke 1 perusahaan. Hanya akun Developer yang dapat bergabung ke banyak perusahaan.',
      };
    }

    const alreadyJoined = user.companies.some((c) => c.code.toUpperCase() === cleanCode);
    if (alreadyJoined) {
      return { success: false, error: 'Anda sudah tergabung di perusahaan ini.' };
    }

    const existing = DEMO_COMPANIES.find((c) => c.code.toUpperCase() === cleanCode);
    const newJoinedCompany: Company = existing
      ? { 
          ...existing, 
          id: `comp-joined-${Date.now()}`, 
          role: 'Team Specialist', 
          joinedAt: 'Hari ini',
          onlineCount: existing.onlineCount + 1,
          daftarTimCompany: existing.daftarTimCompany ? [...existing.daftarTimCompany] : [],
          timCompany: [],
          daftarProjectTim: existing.daftarProjectTim ? [...existing.daftarProjectTim] : [],
        }
      : {
          id: `comp-custom-${Date.now()}`,
          name: `PT ${cleanCode.replace(/[^A-Z]/g, '') || 'Sinergi'} Enterprise`,
          code: cleanCode,
          role: 'Team Specialist',
          category: 'Enterprise & Operations',
          membersCount: 16,
          onlineCount: 8,
          activeTasks: 12,
          activeProjects: 3,
          joinedAt: 'Hari ini',
          themeColor: '#0284C7',
          logoIcon: 'briefcase-outline',
          daftarTimCompany: [],
          timCompany: [],
          daftarProjectTim: [],
        };

    const updatedUser: User = {
      ...user,
      isNewUser: false,
      companies: [newJoinedCompany, ...user.companies],
      activeCompanyId: newJoinedCompany.id,
    };

    saveUserToState(updatedUser);
    return { success: true, company: newJoinedCompany };
  };

  const createCompany = async (companyName: string, category: string) => {
    if (!companyName.trim()) {
      return { success: false, error: 'Nama perusahaan wajib diisi.' };
    }

    if (!user) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    // Aturan: User biasa cuma bisa 1 kali join/buat company, KECUALI Developer
    if (!user.isDeveloper && user.companies.length >= 1) {
      return {
        success: false,
        error: 'User biasa hanya dapat membuat 1 perusahaan. Hanya akun Developer yang dapat mengelola multi-perusahaan.',
      };
    }

    const prefix = companyName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'CORP';
    const generatedCode = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const palette = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626'];
    const randomColor = palette[Math.floor(Math.random() * palette.length)];

    const newCompany: Company = {
      id: `comp-created-${Date.now()}`,
      name: companyName.trim(),
      code: generatedCode,
      role: 'Founder / Managing Director',
      category: category.trim() || 'Software & Tech Venture',
      membersCount: 1,
      onlineCount: 1,
      activeTasks: 0,
      activeProjects: 1,
      joinedAt: 'Baru saja',
      isPrimary: true,
      themeColor: randomColor,
      logoIcon: 'business-outline',
      daftarTimCompany: [],
      timCompany: [],
      daftarProjectTim: [],
    };

    const updatedUser: User = {
      ...user,
      isNewUser: false,
      companies: [newCompany, ...user.companies],
      activeCompanyId: newCompany.id,
    };

    saveUserToState(updatedUser);
    return { success: true, company: newCompany };
  };

  const setActiveCompany = (companyId: string) => {
    if (user) {
      saveUserToState({
        ...user,
        activeCompanyId: companyId,
      });
    }
  };

  const leaveCompany = async (companyId: string) => {
    if (!user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    const companyExists = user.companies.some((company) => company.id === companyId);
    if (!companyExists) {
      return { success: false, error: 'Perusahaan tidak ditemukan.' };
    }

    const remainingCompanies = user.companies.filter((company) => company.id !== companyId);
    saveUserToState({
      ...user,
      companies: remainingCompanies,
      activeCompanyId: remainingCompanies[0]?.id,
    });

    return { success: true };
  };

  const toggleDeveloperMode = () => {
    if (user) {
      saveUserToState({
        ...user,
        isDeveloper: !user.isDeveloper,
      });
    }
  };

  // ==========================================
  // MANAJEMEN TIM DALAM COMPANY (SEPERTI GRUP WA)
  // ==========================================

  // Membuat Tim baru di dalam Company: Pembuat otomatis menjadi ADMIN tim
  const createTeam = async (companyId: string, teamName: string, description: string) => {
    if (!teamName.trim()) {
      return { success: false, error: 'Nama tim tidak boleh kosong.' };
    }

    if (!user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    const targetCompany = user.companies.find((c) => c.id === companyId);
    if (!targetCompany) {
      return { success: false, error: 'Perusahaan tidak ditemukan.' };
    }

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamName.trim(),
      description: description.trim() || 'Ruang kolaborasi dan koordinasi tim terstruktur.',
      adminEmail: user.email,
      adminName: user.name,
      members: [
        {
          id: `member-${Date.now()}`,
          name: user.name,
          email: user.email,
          role: 'admin', // Pembuat menjadi ADMIN seperti grup WhatsApp
          joinedAt: 'Hari ini',
        },
      ],
      pendingRequests: [],
      icon: 'people-outline',
      createdAt: 'Hari ini',
    };

    const starterProject: TeamProject = {
      id: `proj-${Date.now()}`,
      teamId: newTeam.id,
      teamName: newTeam.name,
      title: `Inisialisasi Project ${newTeam.name}`,
      deadline: '30 Hari ke depan',
      progress: 15,
      status: 'planning',
    };

    const updatedCompanies = user.companies.map((c) => {
      if (c.id === companyId) {
        const currentDaftarTim = c.daftarTimCompany || [];
        const currentTim = c.timCompany || [];
        const currentProjects = c.daftarProjectTim || [];

        return {
          ...c,
          daftarTimCompany: [newTeam, ...currentDaftarTim],
          timCompany: [newTeam, ...currentTim],
          daftarProjectTim: [starterProject, ...currentProjects],
        };
      }
      return c;
    });

    saveUserToState({
      ...user,
      companies: updatedCompanies,
    });

    return { success: true, team: newTeam };
  };

  const leaveTeam = async (companyId: string, teamId: string) => {
    if (!user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    const targetCompany = user.companies.find((company) => company.id === companyId);
    if (!targetCompany) {
      return { success: false, error: 'Perusahaan tidak ditemukan.' };
    }

    const currentTeams = targetCompany.daftarTimCompany || [];
    const targetTeam = currentTeams.find((team) => team.id === teamId);
    if (!targetTeam) {
      return { success: false, error: 'Tim tidak ditemukan.' };
    }

    const userEmail = user.email.toLowerCase();
    const updatedTeam = {
      ...targetTeam,
      members: targetTeam.members.filter((member) => member.email.toLowerCase() !== userEmail),
    };
    const updatedTeams = currentTeams.map((team) => (team.id === teamId ? updatedTeam : team));
    const updatedTimCompany = (targetCompany.timCompany || []).map((team) =>
      team.id === teamId ? updatedTeam : team
    );

    const updatedCompanies = user.companies.map((company) =>
      company.id === companyId
        ? { ...company, daftarTimCompany: updatedTeams, timCompany: updatedTimCompany }
        : company
    );

    saveUserToState({ ...user, companies: updatedCompanies });
    return { success: true };
  };

  // Mengajukan permintaan bergabung ke Tim yang ada (Menunggu Persetujuan Admin)
  const requestJoinTeam = async (companyId: string, teamId: string) => {
    if (!user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    const targetCompany = user.companies.find((c) => c.id === companyId);
    if (!targetCompany) {
      return { success: false, error: 'Perusahaan tidak ditemukan.' };
    }

    const currentTeams = targetCompany.daftarTimCompany || [];
    const targetTeam = currentTeams.find((t) => t.id === teamId);
    if (!targetTeam) {
      return { success: false, error: 'Tim tidak ditemukan.' };
    }

    // Cek apakah sudah menjadi anggota
    const isMember = targetTeam.members.some((m) => m.email.toLowerCase() === user.email.toLowerCase());
    if (isMember) {
      return { success: false, error: 'Anda sudah menjadi anggota di tim ini.' };
    }

    // Cek apakah sudah pernah mengirim request
    const hasRequested = (targetTeam.pendingRequests || []).some(
      (r) => r.userEmail.toLowerCase() === user.email.toLowerCase() && r.status === 'pending'
    );
    if (hasRequested) {
      return { success: false, error: 'Permintaan Anda sudah dikirim dan sedang menunggu persetujuan Admin tim.' };
    }

    const newRequest: JoinRequest = {
      id: `req-${Date.now()}`,
      userName: user.name,
      userEmail: user.email,
      requestedAt: 'Baru saja',
      status: 'pending',
    };

    const updatedTeams = currentTeams.map((team) => {
      if (team.id === teamId) {
        return {
          ...team,
          pendingRequests: [...(team.pendingRequests || []), newRequest],
        };
      }
      return team;
    });

    const updatedCompanies = user.companies.map((c) => {
      if (c.id === companyId) {
        return {
          ...c,
          daftarTimCompany: updatedTeams,
        };
      }
      return c;
    });

    saveUserToState({
      ...user,
      companies: updatedCompanies,
    });

    return { success: true };
  };

  // Menyetujui atau Menolak Permintaan Bergabung (Hanya Admin Tim yang berhak)
  const respondJoinRequest = async (
    companyId: string,
    teamId: string,
    requestId: string,
    action: 'approve' | 'reject'
  ) => {
    if (!user) {
      return { success: false, error: 'Pengguna belum terautentikasi.' };
    }

    const targetCompany = user.companies.find((c) => c.id === companyId);
    if (!targetCompany) {
      return { success: false, error: 'Perusahaan tidak ditemukan.' };
    }

    const currentTeams = targetCompany.daftarTimCompany || [];
    const targetTeam = currentTeams.find((t) => t.id === teamId);
    if (!targetTeam) {
      return { success: false, error: 'Tim tidak ditemukan.' };
    }

    // Validasi hak admin
    const isAdmin =
      targetTeam.adminEmail.toLowerCase() === user.email.toLowerCase() ||
      targetTeam.members.some(
        (m) => m.email.toLowerCase() === user.email.toLowerCase() && m.role === 'admin'
      );

    if (!isAdmin) {
      return { success: false, error: 'Hanya Admin tim yang memiliki hak untuk menyetujui permintaan anggota.' };
    }

    const request = (targetTeam.pendingRequests || []).find((r) => r.id === requestId);
    if (!request) {
      return { success: false, error: 'Permintaan tidak ditemukan.' };
    }

    const updatedRequests = (targetTeam.pendingRequests || []).filter((r) => r.id !== requestId);

    let updatedMembers = [...targetTeam.members];
    if (action === 'approve') {
      updatedMembers.push({
        id: `member-${Date.now()}`,
        name: request.userName,
        email: request.userEmail,
        role: 'member',
        joinedAt: 'Hari ini',
      });
    }

    const updatedTeams = currentTeams.map((team) => {
      if (team.id === teamId) {
        return {
          ...team,
          members: updatedMembers,
          pendingRequests: updatedRequests,
        };
      }
      return team;
    });

    // Perbarui timCompany jika user yang login ikut bergabung
    const isCurrentUserApproved =
      action === 'approve' && request.userEmail.toLowerCase() === user.email.toLowerCase();

    const updatedCompanies = user.companies.map((c) => {
      if (c.id === companyId) {
        const approvedTeam = updatedTeams.find((t) => t.id === teamId);
        let updatedTimCompany = c.timCompany || [];
        if (isCurrentUserApproved && approvedTeam) {
          const alreadyInTimCompany = updatedTimCompany.some((t) => t.id === teamId);
          if (!alreadyInTimCompany) {
            updatedTimCompany = [approvedTeam, ...updatedTimCompany];
          }
        }

        return {
          ...c,
          daftarTimCompany: updatedTeams,
          timCompany: updatedTimCompany,
        };
      }
      return c;
    });

    saveUserToState({
      ...user,
      companies: updatedCompanies,
    });

    return { success: true };
  };

  const logout = () => {
    saveUserToState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        register,
        logout,
        joinCompany,
        createCompany,
        leaveCompany,
        setActiveCompany,
        toggleDeveloperMode,
        createTeam,
        leaveTeam,
        requestJoinTeam,
        respondJoinRequest,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
