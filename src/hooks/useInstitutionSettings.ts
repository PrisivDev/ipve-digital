'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-fetch';

// ─── Types ─────────────────────────────────────────────────

interface InstitutionSettingsData {
  id?: string;
  schoolName?: string;
  shortName?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  academicYear?: string;
  [key: string]: unknown;
}

// ─── Hook ──────────────────────────────────────────────────

export function useInstitutionSettings() {
  return useQuery<InstitutionSettingsData>({
    queryKey: ['institution-settings'],
    queryFn: async () => {
      const res = await apiFetch('/api/settings/institution');
      if (!res.ok) {
        // Return defaults on auth failure or not found
        return {
          schoolName: "Institut Polytechnique Vase d'Élites",
          shortName: 'IPVE',
          logoUrl: 'https://ik.imagekit.io/damts929ip/IPVE/Logo.png',
          address: 'Abidjan, Côte d\'Ivoire',
          website: 'www.ipve.edu.ci',
          academicYear: '2025-2026',
        };
      }
      const json = await res.json();
      return json.data ?? json;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
