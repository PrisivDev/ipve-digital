'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { LoginPage } from '@/components/auth/LoginPage';
import { Sidebar, MobileSidebar } from '@/components/ipve/sidebar';
import { Header } from '@/components/ipve/header';
import { DashboardView } from '@/components/ipve/views/dashboard-view';
import { CrmView } from '@/components/ipve/views/crm-view';
import { ErpView } from '@/components/ipve/views/erp-view';
import { LmsView } from '@/components/ipve/views/lms-view';
import { SettingsView } from '@/components/ipve/views/settings-view';
import { ProfileView } from '@/components/ipve/views/profile-view';
import { useAppStore } from '@/store/app-store';

// Guard against browser extensions injecting attributes during SSR hydration
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Use requestAnimationFrame to avoid setState-in-effect warning
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return mounted;
}

function ModuleView() {
  const activeModule = useAppStore((s) => s.activeModule);

  switch (activeModule) {
    case 'dashboard':
      return <DashboardView />;
    case 'crm':
      return <CrmView />;
    case 'erp':
      return <ErpView />;
    case 'lms':
      return <LmsView />;
    case 'settings':
      return <SettingsView />;
    case 'profile':
      return <ProfileView />;
    default:
      return <DashboardView />;
  }
}

function AppShell() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <ModuleView />
        </main>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setCurrentUser = useAppStore((s) => useAppStore.getState().setCurrentUser);

  // Sync auth user to app store
  const userId = user?.id;
  const firstName = user?.firstName;
  const lastName = user?.lastName;
  const email = user?.email;
  const roleName = user?.roleName;

  if (isAuthenticated && user && userId) {
    setCurrentUser({
      id: userId,
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      email: email ?? '',
      roleName: roleName ?? '',
      avatar: user.avatarUrl ?? undefined,
    });
  }

  return <AppShell />;
}

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const mounted = useMounted();

  // Check for existing session on mount — non-blocking
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Avoid hydration mismatch from browser extensions (bis_size attributes)
  if (!mounted) {
    return null;
  }

  // Immediately show login if not authenticated — no spinner blocking
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}
