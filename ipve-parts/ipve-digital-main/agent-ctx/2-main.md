# Task 2 — Employees (Administration) UI Section

## Summary
Implemented the complete Employees section for the CRM module, including data table, filters, pagination, create/edit form dialog, and hook layer.

## Files Created
1. **`/src/hooks/useEmployees.ts`** — React Query hooks:
   - `useEmployees(filters)` — GET /api/employees with pagination, search, department/status filters, staleTime 2min
   - `useEmployee(id)` — GET /api/employees/[id]
   - `useCreateEmployee()` — POST /api/employees
   - `useUpdateEmployee()` — PUT /api/employees/[id]
   - `useDeactivateEmployee()` — DELETE /api/employees/[id] (soft delete)
   - All hooks include `r.ok` error handling and query invalidation

2. **`/src/components/ipve/crm/employees-section.tsx`** — Full UI component:
   - Data table with 8 columns: N° Employé, Nom, Département, Poste, Contrat, Salaire, Statut, Actions
   - Search bar with 300ms debounce
   - Department filter dropdown (Direction, Académique, Financier, Administratif, Informatique)
   - Status filter (Tous, Actif, Inactif)
   - Pagination controls with page size selector (25/50/100)
   - "Nouvel employé" button → opens create dialog
   - Edit button per row → opens pre-filled edit dialog
   - Activate/Deactivate toggle per row (X for deactivate)
   - Loading skeleton state (8 rows)
   - Empty state with Briefcase icon
   - `EmployeeFormDialog` inline component:
     - Multi-section form: Personal Info → Contract Info → Bank Info
     - Uses react-hook-form + zodResolver with zod validation
     - trigger() + getValues() pattern (not handleSubmit wrapper)
     - Enter key blocked in form inputs
     - IPVE primary color: bg-[#8B1C2D] for primary buttons
     - Separate defaults, reset on close, pre-fill from API on edit
     - Loading skeleton state while fetching employee data for edit

## Files Modified
1. **`/src/store/app-store.ts`** — Added 'employees' to CrmSection type
2. **`/src/components/ipve/views/crm-view.tsx`** — Added EmployeesSection tab with Briefcase icon

## Patterns Followed
- Matches existing students-section.tsx and admissions-section.tsx patterns
- All text in French
- Uses shadcn/ui components (Table, Dialog, Select, Badge, Skeleton, etc.)
- toast from 'sonner' for notifications
- Consistent pagination, filtering, and loading state handling
