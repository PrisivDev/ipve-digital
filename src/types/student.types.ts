// Student status enum matching Prisma
export type StudentStatus = 'ENROLLED' | 'ACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'TRANSFERRED' | 'DROPPED';
export type Gender = 'MALE' | 'FEMALE';
export type PaymentStatusLabel = 'up_to_date' | 'partial' | 'overdue';

// DTOs
export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;
  nationality?: string;
  address?: string;
  photoUrl?: string;
  enrollmentDate?: string;
  filiereId?: string;
  levelId?: string;
  classId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  scholarship?: boolean;
  scholarshipPct?: number;
  email?: string; // If provided, creates a User account
}

export type UpdateStudentDto = Partial<CreateStudentDto>;

export interface StudentFilters {
  search?: string;
  filiereId?: string;
  levelId?: string;
  classId?: string;
  status?: StudentStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentStatusBadge {
  label: string;
  status: PaymentStatusLabel;
  totalDue: number;
  totalPaid: number;
  remaining: number;
}

export interface FinancialSummary {
  studentId: string;
  totalDue: number;
  totalPaid: number;
  remaining: number;
  tranches: {
    trancheId: string;
    trancheNumber: number;
    name: string;
    amount: number;
    dueDate: string | null;
    paidAmount: number;
    status: 'paid' | 'partial' | 'unpaid';
    payments: {
      id: string;
      amount: number;
      date: string;
      method: string;
    }[];
  }[];
}

export interface GradeEntry {
  id: string;
  subjectName: string;
  evaluationType: string;
  score: number;
  maxScore: number;
  coefficient: number;
  periodName: string;
  isValidated: boolean;
}

export interface GradeSummary {
  studentId: string;
  academicYearId?: string;
  periodId?: string;
  grades: GradeEntry[];
  overallAverage: number | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  subjectName: string;
  status: string;
  justification?: string;
}

export interface AttendanceSummary {
  studentId: string;
  totalSessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number; // percentage
  records: AttendanceRecord[];
}

export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; field: string; message: string }[];
}

// The full student type returned from API (with relations)
export interface StudentListItem {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string | null;
  photoUrl: string | null;
  status: StudentStatus;
  enrollmentDate: string | null;
  filiereName: string | null;
  filiereCode: string | null;
  levelName: string | null;
  className: string | null;
  parentName: string | null;
  parentPhone: string | null;
  paymentStatus: PaymentStatusBadge | null;
}

export interface StudentDetail {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: Gender;
  nationality: string;
  address: string | null;
  photoUrl: string | null;
  enrollmentDate: string | null;
  status: StudentStatus;
  filiereId: string | null;
  levelId: string | null;
  classId: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  emergencyContact: string | null;
  medicalNotes: string | null;
  scholarship: boolean;
  scholarshipPct: number | null;
  userId: string | null;
  userEmail: string | null;
  filiereName: string | null;
  filiereCode: string | null;
  levelName: string | null;
  className: string | null;
  createdAt: string;
  updatedAt: string;
}
