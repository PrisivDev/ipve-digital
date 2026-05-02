
---
Task ID: 1
Agent: Main Agent
Task: Rebuild Settings section with comprehensive management for ALL modules

Work Log:
- Read existing codebase: worklog.md, settings-view.tsx, security-settings.tsx, general-settings.tsx, users-management.tsx
- Read Prisma schema to understand all models (Filiere, Level, Class, Subject, AcademicYear, Period, ExpenseCategory, Supplier, Notification, InstitutionSettings)
- Read auth helpers (settings-auth.ts), JSON serializer (json.ts), and app store types

- Updated Prisma schema:
  - Period: added `weight` (Float) and `sortOrder` (Int) fields
  - ExpenseCategory: added `description`, `budgetLimit`, `isActive` fields
  - Supplier: added `contactPerson`, `rib`, `isActive` fields
  - InstitutionSettings: added `defaultPaymentMethod`, `latePenaltyPercent`, `gracePeriodDays` fields
  - Generated Prisma client

- Created 20 API routes (all using verifySettingsAdmin + json + sequential DB queries):
  Academic: filieres (list/create), filieres/[id] (get/put/delete), levels (list/create), levels/[id] (get/put/delete), classes (list/create), classes/[id] (get/put/delete), subjects (list/create), subjects/[id] (get/put/delete), academic-years (list/create), academic-years/[id] (get/put/delete)
  Financial: expense-categories (list/create), expense-categories/[id] (get/put/delete), suppliers (list/create), suppliers/[id] (get/put/delete), config (get/put)
  Communications: notifications (list/delete bulk), notifications/[id] (put toggle/delete)
  System: system/info (get stats), system/export (get data export)

- Created 12 settings components:
  Academic (5): filieres-settings, niveaux-settings, classes-settings, matieres-settings, annees-scolaires-settings (with period management)
  Financial (3): config-paiements-settings, categories-depenses-settings, fournisseurs-settings
  Communication (1): notifications-settings (paginated, filterable, bulk actions)
  System (2): apparence-settings (localStorage, theme/color/sidebar/language), donnees-settings (system stats, data export)
  Wrappers (3): roles-permissions-settings, securite-settings, audit-settings (thin wrappers around SecuritySettings with defaultTab prop)

- Modified SecuritySettings to accept `defaultTab` prop

- Completely rewrote settings-view.tsx with:
  - LEFT sidebar (w-56, sticky) with grouped accordion navigation
  - 6 navigation groups: Overview, Institution, Académique, Financier, Utilisateurs & Sécurité, Communications, Système
  - Accordion-style collapsible groups (one open at a time)
  - Active item highlighting with #8B1C2D color
  - Overview dashboard with grid cards and quick access buttons
  - Renders correct component for each SettingsSection value

- All components use: shadcn/ui, French text, responsive design (desktop table + mobile cards), search/filter, CRUD dialogs, toast feedback, loading skeletons, status badges
- All API routes use: verifySettingsAdmin auth, json serializer, sequential DB queries, audit logging

Stage Summary:
- 35+ files created/modified
- 20 API routes for full CRUD operations across all settings modules
- 12 new settings management components
- Settings view with grouped sidebar navigation
- Zero new lint errors (all 9 remaining are pre-existing)
- Prisma schema extended with 8 new fields
