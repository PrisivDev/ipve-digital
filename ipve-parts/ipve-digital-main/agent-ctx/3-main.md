---
Task ID: 3
Agent: Main Agent
Task: Implement Parents Management (API + UI)

Work Log:
- Analyzed existing parents-section.tsx which used 100% mock data
- Examined project patterns: hooks (useProspects.ts), API routes, db client, Prisma schema
- Created /src/app/api/parents/route.ts:
  - GET: Queries all students with non-null parentPhone, groups by phone number in-memory, deduplicates, maps to parent objects with children list
  - PUT: Updates parentName/parentEmail/emergencyContact across ALL students sharing the same parentPhone
  - Search filtering and pagination done in-memory after grouping
- Created /src/hooks/useParents.ts:
  - useParents(filters): GET query with search, page, limit params
  - useUpdateParent(): PUT mutation with query invalidation
  - Proper r.ok check on all fetch calls
  - TypeScript interfaces exported: Parent, ParentChild, ParentsFilters, ParentsResponse, UpdateParentPayload
- Rewrote /src/components/ipve/crm/parents-section.tsx:
  - Removed ALL mock data
  - Real data fetching via useParents hook with 300ms debounced search
  - Card grid layout (1 col / 2 cols md / 3 cols xl)
  - Each card: avatar with IPVE-themed initials, parent name, phone, email, emergency contact, children count badge, children list with filiere + status badges
  - Edit button on each card opens ParentEditDialog
  - ParentEditDialog: edit form for parentName, parentPhone (disabled), parentEmail, emergencyContact, shows list of associated children
  - Key-based dialog remount for clean form initialization (avoids React Compiler lint errors)
  - Loading skeleton state (6 cards)
  - Empty state with icon
  - Full pagination controls (first/prev/pages/next/last)
  - Used IPVE color theme (#8B1C2D) for primary actions and avatar
  - All text in French
  - Resolved lint errors: replaced useEffect+setState with key-based remount pattern, direct page reset in callback

Lint Results:
- No new errors introduced (0 errors from parents-section.tsx)
- Pre-existing 3 errors in other files (DocumentEditorDialog, api-loader, StudentEditDialog)
- Pre-existing 6 warnings (react-hooks/incompatible-library from React Hook Form)

Stage Summary:
- 3 files created/modified: 1 new API route, 1 new hook, 1 rewritten component
- Parents section now uses real backend data instead of mock data
- Parents are deduplicated by phone number across student records
- Parent edits update all children sharing the same parent phone
- Consistent with project patterns (json utility, useQuery/useMutation, shadcn/ui)
