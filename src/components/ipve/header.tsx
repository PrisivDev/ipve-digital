'use client';

import { Bell, Menu, CalendarDays, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/stores/auth.store';
import { ApiLoader } from '@/components/ipve/api-loader';
import Image from 'next/image';
import { LogOut, User, Settings } from 'lucide-react';
import { useMemo } from 'react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatDateFr(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function Header() {
  const { toggleSidebar, activeModule } = useAppStore();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigateTo = useAppStore((s) => s.navigateTo);

  const greeting = useMemo(() => getGreeting(), []);
  const dateStr = useMemo(() => formatDateFr(), []);

  const moduleLabels: Record<string, string> = {
    dashboard: 'Tableau de bord',
    crm: 'CRM - Gestion des contacts',
    erp: 'ERP - Gestion financière',
    lms: 'LMS - Gestion académique',
    settings: 'Paramètres',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-card/80 backdrop-blur-md px-4 sm:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Menu</span>
      </Button>

      {/* Module title (mobile) */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="h-7 w-7 rounded-md overflow-hidden">
          <Image
            src="/logo-ipve.png"
            alt="IPVE"
            width={28}
            height={28}
            className="object-contain"
          />
        </div>
        <h1 className="text-base font-semibold text-foreground">
          {moduleLabels[activeModule] || 'IPVE'}
        </h1>
      </div>

      {/* Greeting + Date */}
      <div className="hidden sm:flex flex-1 max-w-lg items-center gap-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#1B4F72]/[0.06] to-[#8B1C2D]/[0.04] border border-border/40 px-4 py-2">
          <Sun className="h-4.5 w-4.5 text-[#D4A843] shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground leading-tight">
              {greeting}, {authUser?.firstName}
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight capitalize flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {dateStr}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Right section — bell + api loader + profile */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-[18px] w-[18px] text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-card">
            4
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* API Latency Monitor */}
        <ApiLoader />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative flex items-center gap-2 px-1.5 sm:gap-2 sm:px-2 h-9 rounded-lg hover:bg-muted">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  {authUser?.avatarUrl && (
                    <AvatarImage src={authUser.avatarUrl} alt={authUser.firstName} />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {authUser?.firstName?.[0]}{authUser?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">
                  {authUser?.firstName} {authUser?.lastName}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {authUser?.roleName}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{authUser?.firstName} {authUser?.lastName}</span>
                <span className="text-xs text-muted-foreground font-normal">{authUser?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigateTo('settings', 'profile')}>
              <User className="mr-2 h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigateTo('settings', 'profile')}>
              <Settings className="mr-2 h-4 w-4" />
              Préférences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
