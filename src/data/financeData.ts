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

export interface Invoice {
  id: string
  date: string
  dueDate: string
  clientOrSection: string
  amount: number
  status: 'Draft' | 'Submitted' | 'Paid' | 'Overdue'
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
  { id: 'INV-2025-001', date: '2025-07-01', dueDate: '2025-08-01', clientOrSection: 'Section 1 Moblization', amount: 125000, status: 'Paid' },
  { id: 'INV-2025-002', date: '2025-08-15', dueDate: '2025-09-15', clientOrSection: 'Section 1 Core Drilling', amount: 280000, status: 'Paid' },
  { id: 'INV-2025-003', date: '2025-09-10', dueDate: '2025-10-10', clientOrSection: 'Section 2 CPT Testing', amount: 95000, status: 'Submitted' },
  { id: 'INV-2025-004', date: '2025-08-20', dueDate: '2025-09-20', clientOrSection: 'Section 3B Soil Reports', amount: 45000, status: 'Overdue' },
  { id: 'INV-2025-005', date: '2025-10-05', dueDate: '2025-11-05', clientOrSection: 'Section 3A Phase 1', amount: 110000, status: 'Draft' },
]

export const initialExpenses: Expense[] = [
  { id: 'EXP-1001', date: '2025-09-02', description: 'Diesel Supply - 5000L', categoryId: 'cat-5', amount: 6500, status: 'Paid' },
  { id: 'EXP-1002', date: '2025-09-05', description: 'Bentonite 200 bags', categoryId: 'cat-3', amount: 4200, status: 'Paid' },
  { id: 'EXP-1003', date: '2025-09-15', description: 'Rig DR-001 Maintenance', categoryId: 'cat-1', amount: 15000, status: 'Approved' },
  { id: 'EXP-1004', date: '2025-09-28', description: 'September Payroll', categoryId: 'cat-2', amount: 42000, status: 'Paid' },
  { id: 'EXP-1005', date: '2025-09-30', description: 'Third-party Lab Testing', categoryId: 'cat-4', amount: 8500, status: 'Pending' },
]

export const initialCashFlow: CashFlowPoint[] = [
  { month: 'May', revenue: 0, expenses: 120000 },
  { month: 'Jun', revenue: 50000, expenses: 95000 },
  { month: 'Jul', revenue: 150000, expenses: 85000 },
  { month: 'Aug', revenue: 320000, expenses: 140000 },
  { month: 'Sep', revenue: 210000, expenses: 165000 },
  { month: 'Oct', revenue: 180000, expenses: 90000 }, // Projected
]
