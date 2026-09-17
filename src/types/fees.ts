// ─── Enums ─────────────────────────────────────────────────────────────────

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'POS' | 'ONLINE';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'NOT_PAID' | 'WAIVED';

// ─── Fee structure ──────────────────────────────────────────────────────────

export interface FeeStructure {
  id:         string;
  schoolId:   string;
  classId:    string | null;
  termId:     string;
  name:       string;
  amount:     number;
  isOptional: boolean;
  status:     PaymentStatus;
  class:      { level: string } | null;
  term:       { period: string };
}

export interface CreateFeeStructureBody {
  classId?:   string;
  termId:     string;
  name:       string;
  amount:     number;
  isOptional?: boolean;
}

// ─── Fee balance ────────────────────────────────────────────────────────────

export interface FeeBalance {
  id:            string;
  studentId:     string;
  feeStructureId: string;
  amountDue:     number;
  amountPaid:    number;
  feeStructure:  { name: string; amount: number; isOptional: boolean };
}

// ─── Fee payment ────────────────────────────────────────────────────────────

export interface FeePayment {
  id:            string;
  studentId:     string;
  termId:        string;
  feeStructureId: string | null;
  receiptNumber: string;
  amount:        number;
  paymentDate:   string;
  paymentMethod: PaymentMethod;
  recordedById:  string | null;
  note:          string | null;
  status:        PaymentStatus;
  student:       { firstName: string; lastName: string; studentNumber: string };
  term:          { period: string };
}

export interface RecordPaymentBody {
  studentId:      string;
  termId:         string;
  feeStructureId?: string;
  amount:         number;
  paymentDate:    string;       // ISO date string from the form
  paymentMethod:  PaymentMethod;
  note?:          string;
}

// ─── Student fee statement ──────────────────────────────────────────────────

export interface StudentFeeStatement {
  balances:    FeeBalance[];
  payments:    FeePayment[];
  totalDue:    number;
  totalPaid:   number;
  outstanding: number;
}

// ─── Class fee overview ─────────────────────────────────────────────────────

export interface ClassFeeOverviewRow {
  studentId:     string;
  name:          string;
  studentNumber: string;
  totalDue:      number;
  totalPaid:     number;
  outstanding:   number;
  isCleared:     boolean;
}

// ─── Assign fee to class ────────────────────────────────────────────────────

export interface AssignFeeToClassBody {
  classId:       string;
  academicYearId: string;
}

// ─── Dashboard summary ──────────────────────────────────────────────────────

export interface BursarDashboardSummary {
  totalCollected:  number;
  totalOutstanding: number;
  totalStudents:   number;
  totalDue: number;
  clearedCount:    number;
  pendingCount:    number;
  recentPayments:  Array<{
    id:            string;
    receiptNumber: string;
    amount:        number;
    paymentDate:   string;
    paymentMethod: PaymentMethod;
    student:       { firstName: string; lastName: string; studentNumber: string };
    term:          { period: string };
  }>;
  classBreakdown: Array<{
    classId:   string;
    level:     string;
    collected: number;
    outstanding: number;
    total:     number;
  }>;
}