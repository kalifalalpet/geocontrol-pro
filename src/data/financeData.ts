// Dummy data for Financial ERP Dashboard

export interface BudgetCategory {
  id: string
  name: string
  allocated: number
  spent: number
  color: string
}

export interface Expense {
  id: string
  date: string
  description: string
  categoryId: string
  amount: number
  status: 'Paid' | 'Pending' | 'Approved'
}

export interface InvoiceItem {
  desc: string
  qty: number
  rate: number
  total: number
}

export interface Invoice {
  id: string
  date: string
  dueDate: string
  clientOrSection: string
  amount: number
  status: 'Draft' | 'Submitted' | 'Paid' | 'Overdue'
  items?: InvoiceItem[]
  subtotal?: number
  tax?: number
}

export const BOQ_RATES = {
  BH_DRILLING: 450, // per meter
  CPT_TEST: 3500,   // per test
  PLT_TEST: 6500,   // per test
  VAT_RATE: 0.15    // 15% VAT
}

export interface CashFlowPoint {
  month: string
  revenue: number
  expenses: number
}

// Data Sets

export const initialBudgetCategories: BudgetCategory[] = [
  { id: 'cat-1', name: 'Fleet & Rig Operations', allocated: 450000, spent: 280000, color: '#ffb95f' },
  { id: 'cat-2', name: 'Labor & Management', allocated: 320000, spent: 150000, color: '#4edea3' },
  { id: 'cat-3', name: 'Consumables & Materials', allocated: 150000, spent: 135000, color: '#ff5449' },
  { id: 'cat-4', name: 'Subcontractors / 3rd Party', allocated: 200000, spent: 45000, color: '#8b5cf6' },
  { id: 'cat-5', name: 'Logistics & Fuel', allocated: 100000, spent: 85000, color: '#0ea5e9' },
]

export const initialInvoices: Invoice[] = [
  { id: 'INV-2026-001', date: '2026-03-22', dueDate: '2026-04-22', clientOrSection: 'Section 1 Moblization', amount: 125000, status: 'Paid' },
  { id: 'INV-2026-002', date: '2026-03-25', dueDate: '2026-04-25', clientOrSection: 'Section 1 Core Drilling', amount: 280000, status: 'Paid' },
  { id: 'INV-2026-003', date: '2026-03-28', dueDate: '2026-04-28', clientOrSection: 'Section 2 CPT Testing', amount: 95000, status: 'Submitted' },
  { id: 'INV-2026-004', date: '2026-03-30', dueDate: '2026-04-30', clientOrSection: 'Section 3B Soil Reports', amount: 45000, status: 'Overdue' },
  { id: 'INV-2026-005', date: '2026-04-05', dueDate: '2026-05-05', clientOrSection: 'Section 3A Phase 1', amount: 110000, status: 'Draft' },
]

export const initialExpenses: Expense[] = [
  { id: 'EXP-2001', date: '2026-03-22', description: 'Diesel Supply - 5000L', categoryId: 'cat-5', amount: 6500, status: 'Paid' },
  { id: 'EXP-2002', date: '2026-03-24', description: 'Bentonite 200 bags', categoryId: 'cat-3', amount: 4200, status: 'Paid' },
  { id: 'EXP-2003', date: '2026-03-26', description: 'Rig DR-001 Maintenance', categoryId: 'cat-1', amount: 15000, status: 'Approved' },
  { id: 'EXP-2004', date: '2026-03-28', description: 'March Payroll', categoryId: 'cat-2', amount: 42000, status: 'Paid' },
  { id: 'EXP-2005', date: '2026-03-30', description: 'Third-party Lab Testing', categoryId: 'cat-4', amount: 8500, status: 'Pending' },
]

export const initialCashFlow: CashFlowPoint[] = [
  { month: 'Jan 2026', revenue: 0, expenses: 20000 },
  { month: 'Feb 2026', revenue: 0, expenses: 45000 },
  { month: 'Mar 2026', revenue: 500000, expenses: 120000 },
  { month: 'Apr 2026', revenue: 420000, expenses: 140000 },
  { month: 'May 2026', revenue: 380000, expenses: 165000 },
  { month: 'Jun 2026', revenue: 450000, expenses: 90000 }, 
]
