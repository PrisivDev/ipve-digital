-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
DO $$ BEGIN CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'TEACHER', 'ACCOUNTANT', 'CASHIER', 'SECRETARY', 'PARENT', 'STUDENT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "PermissionModule" AS ENUM ('CRM', 'ERP', 'LMS', 'SETTINGS', 'REPORTS'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'VALIDATE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "ProspectSource" AS ENUM ('WEBSITE', 'RECOMMENDATION', 'SOCIAL_MEDIA', 'FACEBOOK', 'WHATSAPP', 'WALK_IN', 'EVENT', 'ADVERTISEMENT', 'PARTNER', 'OTHER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "ProspectStatus" AS ENUM ('NOUVEAU', 'CONTACTE', 'INTERESSE', 'DOSSIER_RECU', 'ADMIS', 'CONVERTI', 'ABANDONNE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "StudentStatus" AS ENUM ('ENROLLED', 'ACTIVE', 'SUSPENDED', 'GRADUATED', 'TRANSFERRED', 'DROPPED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "EvaluationType" AS ENUM ('DEVOIR', 'COMPOSITION', 'TP', 'EXAMEN', 'PROJET', 'PARTICIPATION'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'SUSPENDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'MTN_MOMO', 'ORANGE_MONEY', 'WAVE', 'BANK_TRANSFER', 'CHEQUE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "JournalType" AS ENUM ('SALES', 'PURCHASES', 'BANK', 'CASH', 'OD', 'GENERAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "ReferenceType" AS ENUM ('PAYMENT', 'EXPENSE', 'PAYROLL', 'ADJUSTMENT', 'INVOICE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "NormalBalance" AS ENUM ('DEBIT', 'CREDIT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "ContractType" AS ENUM ('CDI', 'CDD', 'INTERIM', 'FREELANCE', 'STAGE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "Department" AS ENUM ('DIRECTION', 'ACADEMIQUE', 'FINANCIER', 'ADMINISTRATIF', 'INFORMATIQUE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PENDING_VALIDATION', 'VALIDATED', 'PAID', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "SyncOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED', 'CONFLICT', 'FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'PAYMENT_REMINDER', 'GRADE_PUBLISHED', 'ABSENCE_ALERT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "AdmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'ENROLLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateEnum
DO $$ BEGIN CREATE TYPE "StudentCardStatus" AS ENUM ('ACTIVE', 'LOST', 'EXPIRED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "totp_secret" TEXT,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_verified_at" TIMESTAMP(3),
    "sync_version" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL,
    "module" "PermissionModule" NOT NULL,
    "action" "PermissionAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prospects" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "source" "ProspectSource" NOT NULL DEFAULT 'OTHER',
    "status" "ProspectStatus" NOT NULL DEFAULT 'NOUVEAU',
    "filiere_interest" TEXT,
    "level_interest" TEXT,
    "notes" TEXT,
    "assignedTo" TEXT,
    "converted_at" TIMESTAMP(3),
    "converted_student_id" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "nationality" TEXT NOT NULL DEFAULT 'Ivoirienne',
    "address" TEXT,
    "parent_name" TEXT,
    "parent_phone" TEXT,
    "parent_email" TEXT,
    "last_contact_at" TIMESTAMP(3),
    "sync_version" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "prospect_interactions" (
    "id" TEXT NOT NULL,
    "prospect_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'NOTE',
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "direction" TEXT DEFAULT 'OUTGOING',
    "conducted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "students" (
    "id" TEXT NOT NULL,
    "student_number" TEXT NOT NULL,
    "user_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "nationality" TEXT NOT NULL DEFAULT 'Ivoirienne',
    "address" TEXT,
    "photo_url" TEXT,
    "enrollment_date" TIMESTAMP(3),
    "status" "StudentStatus" NOT NULL DEFAULT 'ENROLLED',
    "filiere_id" TEXT,
    "level_id" TEXT,
    "class_id" TEXT,
    "parent_name" TEXT,
    "parent_phone" TEXT,
    "parent_email" TEXT,
    "emergency_contact" TEXT,
    "medical_notes" TEXT,
    "scholarship" BOOLEAN NOT NULL DEFAULT false,
    "scholarship_pct" DOUBLE PRECISION,
    "sync_version" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "filieres" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "duration_years" INTEGER NOT NULL DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filiere_id" TEXT NOT NULL,
    "year_number" INTEGER NOT NULL,
    "tuition_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "academic_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "room" TEXT,
    "academic_year_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "class_subjects" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT,
    "coefficient" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "hours_per_week" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "periods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "grades" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "evaluation_type" "EvaluationType" NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "max_score" DECIMAL(65,30) NOT NULL DEFAULT 20,
    "coefficient" DECIMAL(65,30) NOT NULL DEFAULT 1,
    "entered_by" TEXT,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "validated_by" TEXT,
    "comments" TEXT,
    "sync_version" BIGINT NOT NULL DEFAULT 0,
    "created_offline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "attendance" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "justification" TEXT,
    "recorded_by" TEXT,
    "sync_version" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "schedules" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT,
    "room" TEXT,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "academic_year_id" TEXT NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_plan_tranches" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "tranche_number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "due_date" TIMESTAMP(3),
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_plan_tranches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "payment_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "tranche_id" TEXT NOT NULL,
    "amount_paid" DECIMAL(65,30) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "reference_number" TEXT,
    "received_by" TEXT,
    "notes" TEXT,
    "receipt_url" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "sync_version" BIGINT NOT NULL DEFAULT 0,
    "created_offline" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "expense_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "budget_limit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "contact_person" TEXT,
    "rib" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "expenses" (
    "id" TEXT NOT NULL,
    "expense_number" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "supplier_id" TEXT,
    "invoice_number" TEXT,
    "invoice_url" TEXT,
    "payment_method" "PaymentMethod" NOT NULL,
    "approved_by" TEXT,
    "entered_by" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "sync_version" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
    "id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "account_class" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "normal_balance" "NormalBalance" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chart_of_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "journal_entries" (
    "id" TEXT NOT NULL,
    "entry_number" TEXT NOT NULL,
    "entry_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "journal_type" "JournalType" NOT NULL,
    "reference_type" "ReferenceType",
    "reference_id" TEXT,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "validated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "journal_entry_lines" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,
    "line_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "employees" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "employee_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "hire_date" TIMESTAMP(3) NOT NULL,
    "contract_type" "ContractType" NOT NULL,
    "department" "Department" NOT NULL DEFAULT 'ACADEMIQUE',
    "position" TEXT,
    "base_salary" DECIMAL(65,30) NOT NULL,
    "transport_allowance" DECIMAL(65,30),
    "housing_allowance" DECIMAL(65,30),
    "bank_name" TEXT,
    "bank_account" TEXT,
    "cnps_number" TEXT,
    "tax_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "termination_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payroll_runs" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "total_gross" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_net" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_employer_charges" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "validated_by" TEXT,
    "payment_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "payslips" (
    "id" TEXT NOT NULL,
    "payroll_run_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "base_salary" DECIMAL(65,30) NOT NULL,
    "transport_allowance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "housing_allowance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "other_bonuses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "gross_salary" DECIMAL(65,30) NOT NULL,
    "cnps_employee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "its_tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cmu_employee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_deductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(65,30) NOT NULL,
    "cnps_employer" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "accident_work" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_professional" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "fpc" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_employer_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "sync_log" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "user_id" TEXT,
    "operation" "SyncOperation" NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "sync_version" BIGINT NOT NULL,
    "synced_at" TIMESTAMP(3),
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "conflict_resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" TEXT,
    "old_values" TEXT,
    "new_values" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "admissions" (
    "id" TEXT NOT NULL,
    "admission_number" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "nationality" TEXT NOT NULL DEFAULT 'Ivoirienne',
    "address" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "parent_name" TEXT,
    "parent_phone" TEXT,
    "parent_email" TEXT,
    "filiere_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "previous_school" TEXT,
    "previous_diploma" TEXT,
    "notes" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "decision_note" TEXT,
    "enrolled_student_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "student_cards" (
    "id" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" "StudentCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "print_count" INTEGER NOT NULL DEFAULT 0,
    "last_printed_at" TIMESTAMP(3),
    "revoked_reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "institution_settings" (
    "id" TEXT NOT NULL,
    "school_name" TEXT NOT NULL DEFAULT 'Institut Polytechnique Vase d''Élites',
    "short_name" TEXT NOT NULL DEFAULT 'IPVE',
    "motto" TEXT DEFAULT 'Scientia Nobis Lumen',
    "address" TEXT DEFAULT 'Abidjan, Côte d''Ivoire',
    "phone" TEXT,
    "email" TEXT DEFAULT 'infos@pve.edu.ci',
    "website" TEXT DEFAULT 'www.ipve.edu.ci',
    "logo_url" TEXT,
    "academic_year" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "locale" TEXT NOT NULL DEFAULT 'fr-FR',
    "password_min_length" INTEGER NOT NULL DEFAULT 8,
    "password_require_uppercase" BOOLEAN NOT NULL DEFAULT true,
    "password_require_numbers" BOOLEAN NOT NULL DEFAULT true,
    "password_require_special" BOOLEAN NOT NULL DEFAULT false,
    "session_timeout_minutes" INTEGER NOT NULL DEFAULT 480,
    "max_login_attempts" INTEGER NOT NULL DEFAULT 5,
    "two_factor_enforced" BOOLEAN NOT NULL DEFAULT false,
    "default_payment_method" TEXT DEFAULT 'CASH',
    "late_penalty_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grace_period_days" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institution_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_module_action_resource_key" ON "permissions"("module", "action", "resource");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "prospects_converted_student_id_key" ON "prospects"("converted_student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prospects_status_idx" ON "prospects"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prospects_source_idx" ON "prospects"("source");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prospects_assignedTo_idx" ON "prospects"("assignedTo");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prospects_phone_idx" ON "prospects"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prospects_last_contact_at_idx" ON "prospects"("last_contact_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prospect_interactions_prospect_id_idx" ON "prospect_interactions"("prospect_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "prospect_interactions_type_idx" ON "prospect_interactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "students_student_number_key" ON "students"("student_number");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "students_student_number_idx" ON "students"("student_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "students_status_idx" ON "students"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "students_filiere_id_idx" ON "students"("filiere_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "students_level_id_idx" ON "students"("level_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "students_class_id_idx" ON "students"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "students_last_name_first_name_idx" ON "students"("last_name", "first_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "students_user_id_idx" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "filieres_code_key" ON "filieres"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "filieres_code_idx" ON "filieres"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "filieres_is_active_idx" ON "filieres"("is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "levels_filiere_id_idx" ON "levels"("filiere_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "levels_filiere_id_year_number_key" ON "levels"("filiere_id", "year_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "academic_years_is_current_idx" ON "academic_years"("is_current");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "classes_level_id_idx" ON "classes"("level_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "classes_academic_year_id_idx" ON "classes"("academic_year_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subjects_code_idx" ON "subjects"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subjects_is_active_idx" ON "subjects"("is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "class_subjects_class_id_idx" ON "class_subjects"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "class_subjects_subject_id_idx" ON "class_subjects"("subject_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "class_subjects_teacher_id_idx" ON "class_subjects"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "class_subjects_class_id_subject_id_key" ON "class_subjects"("class_id", "subject_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "periods_academic_year_id_idx" ON "periods"("academic_year_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "periods_is_current_idx" ON "periods"("is_current");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "grades_student_id_idx" ON "grades"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "grades_class_id_idx" ON "grades"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "grades_period_id_idx" ON "grades"("period_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "grades_evaluation_type_idx" ON "grades"("evaluation_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "grades_is_validated_idx" ON "grades"("is_validated");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "grades_student_id_period_id_idx" ON "grades"("student_id", "period_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_student_id_idx" ON "attendance"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_class_id_idx" ON "attendance"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_status_idx" ON "attendance"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "attendance_student_id_date_idx" ON "attendance"("student_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "attendance_student_id_class_id_subject_id_date_key" ON "attendance"("student_id", "class_id", "subject_id", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "schedules_class_id_idx" ON "schedules"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "schedules_teacher_id_idx" ON "schedules"("teacher_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "schedules_day_of_week_idx" ON "schedules"("day_of_week");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_plans_level_id_idx" ON "payment_plans"("level_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_plans_academic_year_id_idx" ON "payment_plans"("academic_year_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_plans_level_id_academic_year_id_is_active_idx" ON "payment_plans"("level_id", "academic_year_id", "is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_plan_tranches_plan_id_idx" ON "payment_plan_tranches"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payment_plan_tranches_plan_id_tranche_number_key" ON "payment_plan_tranches"("plan_id", "tranche_number");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payments_payment_number_key" ON "payments"("payment_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_student_id_idx" ON "payments"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_payment_method_idx" ON "payments"("payment_method");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_student_id_tranche_id_idx" ON "payments"("student_id", "tranche_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payments_tranche_id_status_idx" ON "payments"("tranche_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expense_categories_parent_id_idx" ON "expense_categories"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "expenses_expense_number_key" ON "expenses"("expense_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expenses_category_id_idx" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "chart_of_accounts_account_number_key" ON "chart_of_accounts"("account_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chart_of_accounts_account_number_idx" ON "chart_of_accounts"("account_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chart_of_accounts_account_class_idx" ON "chart_of_accounts"("account_class");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chart_of_accounts_account_type_idx" ON "chart_of_accounts"("account_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chart_of_accounts_is_active_idx" ON "chart_of_accounts"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "journal_entries_entry_number_key" ON "journal_entries"("entry_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "journal_entries_entry_date_idx" ON "journal_entries"("entry_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "journal_entries_journal_type_idx" ON "journal_entries"("journal_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "journal_entries_reference_type_reference_id_idx" ON "journal_entries"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "journal_entries_is_validated_idx" ON "journal_entries"("is_validated");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "journal_entry_lines_entry_id_idx" ON "journal_entry_lines"("entry_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "journal_entry_lines_account_id_idx" ON "journal_entry_lines"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "employees_employee_number_key" ON "employees"("employee_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "employees_employee_number_idx" ON "employees"("employee_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "employees_department_idx" ON "employees"("department");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "employees_is_active_idx" ON "employees"("is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payroll_runs_status_idx" ON "payroll_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payroll_runs_month_year_key" ON "payroll_runs"("month", "year");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payslips_employee_id_idx" ON "payslips"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "payslips_payroll_run_id_employee_id_key" ON "payslips"("payroll_run_id", "employee_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_log_device_id_idx" ON "sync_log"("device_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_log_user_id_idx" ON "sync_log"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_log_table_name_record_id_idx" ON "sync_log"("table_name", "record_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_log_status_idx" ON "sync_log"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_log_resource_resource_id_idx" ON "audit_log"("resource", "resource_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "admissions_admission_number_key" ON "admissions"("admission_number");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "admissions_enrolled_student_id_key" ON "admissions"("enrolled_student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "admissions_status_idx" ON "admissions"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "admissions_filiere_id_idx" ON "admissions"("filiere_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "admissions_level_id_idx" ON "admissions"("level_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "admissions_phone_idx" ON "admissions"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "admissions_created_at_idx" ON "admissions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "student_cards_card_number_key" ON "student_cards"("card_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "student_cards_student_id_idx" ON "student_cards"("student_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "student_cards_status_idx" ON "student_cards"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "student_cards_card_number_idx" ON "student_cards"("card_number");

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "prospects" ADD CONSTRAINT "prospects_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "prospects" ADD CONSTRAINT "prospects_converted_student_id_fkey" FOREIGN KEY ("converted_student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "prospect_interactions" ADD CONSTRAINT "prospect_interactions_prospect_id_fkey" FOREIGN KEY ("prospect_id") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "prospect_interactions" ADD CONSTRAINT "prospect_interactions_conducted_by_fkey" FOREIGN KEY ("conducted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "students" ADD CONSTRAINT "students_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "students" ADD CONSTRAINT "students_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "levels" ADD CONSTRAINT "levels_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "classes" ADD CONSTRAINT "classes_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "periods" ADD CONSTRAINT "periods_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "grades" ADD CONSTRAINT "grades_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "class_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "grades" ADD CONSTRAINT "grades_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "grades" ADD CONSTRAINT "grades_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "grades" ADD CONSTRAINT "grades_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "grades" ADD CONSTRAINT "grades_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "attendance" ADD CONSTRAINT "attendance_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "class_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "schedules" ADD CONSTRAINT "schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "schedules" ADD CONSTRAINT "schedules_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "class_subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "schedules" ADD CONSTRAINT "schedules_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "schedules" ADD CONSTRAINT "schedules_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "payment_plan_tranches" ADD CONSTRAINT "payment_plan_tranches_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "payment_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "payments" ADD CONSTRAINT "payments_tranche_id_fkey" FOREIGN KEY ("tranche_id") REFERENCES "payment_plan_tranches"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "expense_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "expenses" ADD CONSTRAINT "expenses_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "journal_entry_lines" ADD CONSTRAINT "journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_fkey" FOREIGN KEY ("payroll_run_id") REFERENCES "payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "sync_log" ADD CONSTRAINT "sync_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "admissions" ADD CONSTRAINT "admissions_filiere_id_fkey" FOREIGN KEY ("filiere_id") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "admissions" ADD CONSTRAINT "admissions_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "admissions" ADD CONSTRAINT "admissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "admissions" ADD CONSTRAINT "admissions_enrolled_student_id_fkey" FOREIGN KEY ("enrolled_student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AddForeignKey
DO $$ BEGIN ALTER TABLE "student_cards" ADD CONSTRAINT "student_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

