/**
 * IPVE Digital — Employee Service
 * Employee CRUD with auto-generated employee numbers.
 * Server-side only module.
 */

import { db } from '@/lib/db';
import type { ContractType, Department } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  hireDate: string;
  contractType: ContractType;
  department?: Department;
  position?: string;
  baseSalary: number;
  transportAllowance?: number;
  housingAllowance?: number;
  bankName?: string;
  bankAccount?: string;
  cnpsNumber?: string;
  taxId?: string;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string | null;
  hireDate?: string;
  contractType?: ContractType;
  department?: Department;
  position?: string;
  baseSalary?: number;
  transportAllowance?: number | null;
  housingAllowance?: number | null;
  bankName?: string | null;
  bankAccount?: string | null;
  cnpsNumber?: string | null;
  taxId?: string | null;
}

export interface EmployeeFilters {
  search?: string;
  department?: Department;
  status?: 'active' | 'inactive';
  page?: number;
  limit?: number;
}

export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: Department;
  position: string | null;
  contractType: ContractType;
  baseSalary: number;
  isActive: boolean;
  hireDate: string;
  terminationDate: string | null;
  userId: string | null;
  userEmail: string | null;
}

export interface EmployeeDetail extends EmployeeListItem {
  dateOfBirth: string | null;
  transportAllowance: number;
  housingAllowance: number;
  bankName: string | null;
  bankAccount: string | null;
  cnpsNumber: string | null;
  taxId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEmployees {
  data: EmployeeListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDecimal(value: number | { toNumber: () => number }): number {
  if (typeof value === 'number') return value;
  return value.toNumber();
}

function formatEmployeeListItem(emp: {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: Department;
  position: string | null;
  contractType: ContractType;
  baseSalary: number | { toNumber: () => number };
  isActive: boolean;
  hireDate: Date;
  terminationDate: Date | null;
  user?: { id: string; email: string } | null;
}): EmployeeListItem {
  return {
    id: emp.id,
    employeeNumber: emp.employeeNumber,
    firstName: emp.firstName,
    lastName: emp.lastName,
    department: emp.department,
    position: emp.position,
    contractType: emp.contractType,
    baseSalary: toDecimal(emp.baseSalary),
    isActive: emp.isActive,
    hireDate: emp.hireDate.toISOString(),
    terminationDate: emp.terminationDate?.toISOString() ?? null,
    userId: emp.user?.id ?? null,
    userEmail: emp.user?.email ?? null,
  };
}

function formatEmployeeDetail(emp: {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date | null;
  hireDate: Date;
  contractType: ContractType;
  department: Department;
  position: string | null;
  baseSalary: number | { toNumber: () => number };
  transportAllowance: number | { toNumber: () => number } | null;
  housingAllowance: number | { toNumber: () => number } | null;
  bankName: string | null;
  bankAccount: string | null;
  cnpsNumber: string | null;
  taxId: string | null;
  isActive: boolean;
  terminationDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { id: string; email: string } | null;
}): EmployeeDetail {
  return {
    id: emp.id,
    employeeNumber: emp.employeeNumber,
    firstName: emp.firstName,
    lastName: emp.lastName,
    department: emp.department,
    position: emp.position,
    contractType: emp.contractType,
    baseSalary: toDecimal(emp.baseSalary),
    isActive: emp.isActive,
    hireDate: emp.hireDate.toISOString(),
    terminationDate: emp.terminationDate?.toISOString() ?? null,
    userId: emp.user?.id ?? null,
    userEmail: emp.user?.email ?? null,
    dateOfBirth: emp.dateOfBirth?.toISOString() ?? null,
    transportAllowance: emp.transportAllowance ? toDecimal(emp.transportAllowance) : 0,
    housingAllowance: emp.housingAllowance ? toDecimal(emp.housingAllowance) : 0,
    bankName: emp.bankName,
    bankAccount: emp.bankAccount,
    cnpsNumber: emp.cnpsNumber,
    taxId: emp.taxId,
    createdAt: emp.createdAt.toISOString(),
    updatedAt: emp.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Employee Service
// ---------------------------------------------------------------------------

export const employeeService = {
  /**
   * List employees with pagination, search, department and status filters.
   */
  async getAll(filters: EmployeeFilters): Promise<PaginatedEmployees> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 25;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters.search) {
      const term = filters.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { employeeNumber: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.status === 'active') {
      where.isActive = true;
    } else if (filters.status === 'inactive') {
      where.isActive = false;
    }

    // Sequential queries to avoid Supabase connection pool exhaustion
    const employees = await db.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
    const total = await db.employee.count({ where });

    return {
      data: employees.map(formatEmployeeListItem),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a single employee by ID.
   */
  async getById(id: string): Promise<EmployeeDetail> {
    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    if (!employee) {
      throw new Error('Employé non trouvé');
    }

    return formatEmployeeDetail(employee);
  },

  /**
   * Create a new employee with auto-generated employeeNumber EMP-YYYY-XXXXX.
   */
  async create(data: CreateEmployeeDto): Promise<EmployeeDetail> {
    // Generate employee number
    const year = new Date().getFullYear();
    const prefix = `EMP-${year}-`;
    const lastEmployee = await db.employee.findFirst({
      where: { employeeNumber: { startsWith: prefix } },
      orderBy: { employeeNumber: 'desc' },
      select: { employeeNumber: true },
    });
    const lastNum = lastEmployee
      ? parseInt(lastEmployee.employeeNumber.split('-').pop()!, 10)
      : 0;
    const nextNum = lastNum + 1;
    const employeeNumber = `${prefix}${String(nextNum).padStart(5, '0')}`;

    const employee = await db.employee.create({
      data: {
        employeeNumber,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        hireDate: new Date(data.hireDate),
        contractType: data.contractType,
        department: data.department ?? 'ACADEMIQUE',
        position: data.position?.trim() ?? undefined,
        baseSalary: data.baseSalary,
        transportAllowance: data.transportAllowance ?? null,
        housingAllowance: data.housingAllowance ?? null,
        bankName: data.bankName?.trim() ?? undefined,
        bankAccount: data.bankAccount?.trim() ?? undefined,
        cnpsNumber: data.cnpsNumber?.trim() ?? undefined,
        taxId: data.taxId?.trim() ?? undefined,
        isActive: true,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    return formatEmployeeDetail(employee);
  },

  /**
   * Update an existing employee (all fields except employeeNumber).
   */
  async update(id: string, data: UpdateEmployeeDto): Promise<EmployeeDetail> {
    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Employé non trouvé');
    }

    const updateData: Record<string, unknown> = {};

    if (data.firstName !== undefined) updateData.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updateData.lastName = data.lastName.trim();
    if (data.dateOfBirth !== undefined) {
      updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (data.hireDate !== undefined) updateData.hireDate = new Date(data.hireDate);
    if (data.contractType !== undefined) updateData.contractType = data.contractType;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.position !== undefined) updateData.position = data.position?.trim() ?? null;
    if (data.baseSalary !== undefined) updateData.baseSalary = data.baseSalary;
    if (data.transportAllowance !== undefined) updateData.transportAllowance = data.transportAllowance;
    if (data.housingAllowance !== undefined) updateData.housingAllowance = data.housingAllowance;
    if (data.bankName !== undefined) updateData.bankName = data.bankName;
    if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount;
    if (data.cnpsNumber !== undefined) updateData.cnpsNumber = data.cnpsNumber;
    if (data.taxId !== undefined) updateData.taxId = data.taxId;

    const employee = await db.employee.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    return formatEmployeeDetail(employee);
  },

  /**
   * Soft delete: set isActive=false and terminationDate=today.
   */
  async remove(id: string): Promise<void> {
    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Employé non trouvé');
    }

    if (!existing.isActive) {
      throw new Error('Cet employé est déjà désactivé');
    }

    await db.employee.update({
      where: { id },
      data: {
        isActive: false,
        terminationDate: new Date(),
      },
    });
  },
};

export default employeeService;
