import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/auth/rbac.service';
import type { SystemRole } from '@/lib/auth/rbac.service';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { json } from '@/lib/json';

// French labels for modules
const MODULE_LABELS: Record<string, string> = {
  students: 'Étudiants',
  payments: 'Paiements',
  grades: 'Notes',
  accounting: 'Comptabilité',
  hr: 'Ressources Humaines',
  payroll: 'Paie',
  reports: 'Rapports',
  settings: 'Paramètres',
  users: 'Utilisateurs',
  schedule: 'Emploi du temps',
  attendance: 'Présences',
  documents: 'Documents',
  notifications: 'Notifications',
  crm: 'CRM',
};

// French labels for roles
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  ACCOUNTANT: 'Comptable',
  CASHIER: 'Caissier',
  SECRETARY: 'Secrétaire',
  TEACHER: 'Enseignant',
  STUDENT: 'Étudiant',
};

// GET /api/settings/security/permissions — Full RBAC permission matrix
export async function GET(request: NextRequest) {
  const auth = await verifySettingsAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // Also get the DB-based roles and their permission counts
    const roles = await db.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            rolePermissions: true,
            users: true,
          },
        },
      },
    });

    // Get DB-based module permission counts per role
    const dbPermissionsByRole = await db.rolePermission.groupBy({
      by: ['roleId'],
      where: {},
      _count: {
        permissionId: true,
      },
    });

    const dbPermCountMap = new Map(
      dbPermissionsByRole.map((r) => [r.roleId, r._count.permissionId]),
    );

    // Get module-level counts from DB
    const dbModulePermissions = await db.permission.groupBy({
      by: ['module'],
      _count: {
        id: true,
      },
    });

    const dbModuleCounts = new Map(
      dbModulePermissions.map((m) => [m.module, m._count.id]),
    );

    // Build in-memory permission matrix (source of truth from rbac.service)
    const modules = new Set<string>();
    for (const [, entry] of PERMISSIONS) {
      modules.add(entry.module);
    }

    // For each module, compute permission count per role
    const matrix: Array<{
      module: string;
      label: string;
      dbCount: number;
      roles: Record<string, { count: number; total: number }>;
    }> = [];

    for (const mod of modules) {
      const modulePerms: string[] = [];
      for (const [key, entry] of PERMISSIONS) {
        if (entry.module === mod) modulePerms.push(key);
      }

      const roleCounts: Record<string, { count: number; total: number }> = {};

      for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
        const count = permKeys.filter((k) => modulePerms.includes(k)).length;
        roleCounts[roleName] = { count, total: modulePerms.length };
      }

      // Find the matching DB module enum
      const firstPerm = modulePerms[0];
      const permEntry = PERMISSIONS.get(firstPerm);
      const dbModule = permEntry?.dbModule;
      const dbCount = dbModule ? (dbModuleCounts.get(dbModule) || 0) : 0;

      matrix.push({
        module: mod,
        label: MODULE_LABELS[mod] || mod,
        dbCount,
        roles: roleCounts,
      });
    }

    // Total counts
    const totalPermissions = PERMISSIONS.size;
    const rolesCount = roles.length;
    const modulesCount = modules.size;

    return json({
      success: true,
      data: {
        matrix,
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          label: ROLE_LABELS[r.name] || r.name,
          description: r.description,
          dbPermissionCount: dbPermCountMap.get(r.id) || 0,
          memoryPermissionCount: ROLE_PERMISSIONS[r.name as SystemRole]?.length || 0,
          userCount: r._count.users,
        })),
        summary: {
          totalPermissions,
          rolesCount,
          modulesCount,
        },
      },
    });
  } catch (error) {
    console.error('[SETTINGS] GET permissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement de la matrice des permissions' },
      { status: 500 },
    );
  }
}
