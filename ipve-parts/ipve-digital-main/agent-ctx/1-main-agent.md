---
Task ID: 1
Agent: Main Agent
Task: Implement Teachers CRUD (API + UI)

Work Log:
- Read existing files: worklog.md, API route, teachers-section.tsx, prisma schema, auth helpers, existing hooks patterns
- Enhanced GET /api/teachers with search (?search=xxx) and status (?status=active|inactive) query params
- Added POST /api/teachers to create a teacher (User with TEACHER role + optional Employee profile)
  - Uses verifySettingsAdmin for auth
  - Creates User with hashed default password "Enseignant@2025"
  - Creates Employee profile when contractType is provided
  - Sequential queries to avoid Supabase connection pool exhaustion
- Created /src/hooks/useTeachers.ts with useTeachers(filters) and useCreateTeacher()
  - Follows existing hook patterns (useStudents, useProspects)
  - Proper r.ok error handling on all fetch calls
- Rewrote /src/components/ipve/crm/teachers-section.tsx:
  - Removed ALL mock data
  - Uses useTeachers() hook with search + status filter
  - Added "Nouveau" button with bg-[#8B1C2D] primary color
  - Added TeacherFormDialog with all required fields (firstName, lastName, email, phone, contractType, department, position, baseSalary, hireDate)
  - Cards show: name, email, phone, subjects from classSubjects, contract type, salary, hire date
  - Loading skeleton state with 6 placeholder cards
  - Empty state with BookOpen icon
  - Error state
  - Uses shadcn/ui: Dialog, Select, Badge, Skeleton, Label, etc.
  - All text in French
  - Toast notifications for success/error

Stage Summary:
- 3 files modified/created:
  - /src/app/api/teachers/route.ts (enhanced: GET with filters + POST create)
  - /src/hooks/useTeachers.ts (new: useTeachers + useCreateTeacher)
  - /src/components/ipve/crm/teachers-section.tsx (rewritten: no mock data, real API)
- Lint passed with no new errors (pre-existing errors in other files unchanged)
- Follows existing codebase patterns (sequential queries, json helper, auth helper)
