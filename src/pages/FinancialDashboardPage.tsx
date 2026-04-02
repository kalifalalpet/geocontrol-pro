import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import {
  initialBudgetCategories, initialExpenses, initialInvoices, initialCashFlow,
  Expense, Invoice, BOQ_RATES, InvoiceItem
} from '../data/financeData'
import { allSitePoints } from '../data/sampleData'
import { useProjects } from '../context/ProjectContext'

// Helper component for SVG Gauge
function BurnGauge({ spent, allocated, color, name }: { spent: number, allocated: number, color: string, name: string }) {
  const pct = Math.min((spent / allocated) * 100, 100)
  return (
    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20">
      <div className="flex justify-between items-end mb-2">
        <span className="text-sm font-bold">{name}</span>
        <span className="text-xs text-on-surface-variant">{Math.round(pct)}% Burned</span>
      </div>
      <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }}></div>
      </div>
      <div className="flex justify-between text-[10px] font-mono text-on-surface-variant">
        <span>Spent: SAR {spent.toLocaleString()}</span>
        <span>Alloc: SAR {allocated.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function FinancialDashboardPage() {
  const { activeProject } = useProjects()
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'invoices' | 'expenses'>('overview')

  // Core State
  const [budgets] = useState(initialBudgetCategories)
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [cashFlow] = useState(initialCashFlow)

  // Invoice Management States
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set())
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [invoiceDateStart, setInvoiceDateStart] = useState('2026-03-01')
  const [invoiceDateEnd, setInvoiceDateEnd] = useState('2026-03-31')
  const [newInvoiceTitle, setNewInvoiceTitle] = useState('Monthly Project Progress')

  // Expense Management States
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set())
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [newExpForm, setNewExpForm] = useState<Partial<Expense>>({
    date: new Date().toISOString().split('T')[0],
    status: 'Paid',
    categoryId: 'cat-1',
    description: '',
    amount: 0
  })

  const toggleInvoiceSelection = (id: string) => {
    const next = new Set(selectedInvoiceIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedInvoiceIds(next)
  }

  const toggleExpenseSelection = (id: string) => {
    const next = new Set(selectedExpenseIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedExpenseIds(next)
  }

  const handleStatusChange = (id: string, newStatus: Invoice['status']) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv))
  }

  const saveExpense = () => {
    if (!newExpForm.description || !newExpForm.amount) return
    const newEx: Expense = {
      id: `EXP-${(expenses.length + 1001).toString()}`,
      date: newExpForm.date || '',
      description: newExpForm.description || '',
      categoryId: newExpForm.categoryId || 'cat-1',
      amount: newExpForm.amount || 0,
      status: newExpForm.status || 'Paid'
    }
    setExpenses([newEx, ...expenses])
    setIsExpenseModalOpen(false)
    setNewExpForm({ date: new Date().toISOString().split('T')[0], status: 'Paid', categoryId: 'cat-1', description: '', amount: 0 })
  }

  const previewItems = useMemo(() => {
    const start = new Date(invoiceDateStart)
    const end = new Date(invoiceDateEnd)
    
    const points = allSitePoints.filter(p => {
      if (p.status !== 'completed' || !p.completionDate) return false
      const d = new Date(p.completionDate)
      return d >= start && d <= end
    })

    const items: InvoiceItem[] = []
    
    // Group by type
    const bhs = points.filter(p => p.type === 'BH')
    const cpts = points.filter(p => p.type === 'CPT')
    const plts = points.filter(p => p.type === 'PLT')

    if (bhs.length > 0) {
      const totalMeters = bhs.reduce((acc, p) => acc + (p.actualDepth || p.targetDepth), 0)
      items.push({
        desc: `Core Drilling & Borehole Construction (${bhs.length} Locations)`,
        qty: totalMeters,
        rate: BOQ_RATES.BH_DRILLING,
        total: totalMeters * BOQ_RATES.BH_DRILLING
      })
    }

    if (cpts.length > 0) {
      items.push({
        desc: `Standard Piezocone Penetration Tests (CPTu)`,
        qty: cpts.length,
        rate: BOQ_RATES.CPT_TEST,
        total: cpts.length * BOQ_RATES.CPT_TEST
      })
    }

    if (plts.length > 0) {
      items.push({
        desc: `Plate Load Testing (Incremental Loading)`,
        qty: plts.length,
        rate: BOQ_RATES.PLT_TEST,
        total: plts.length * BOQ_RATES.PLT_TEST
      })
    }

    const subtotal = items.reduce((acc, it) => acc + it.total, 0)
    const tax = subtotal * BOQ_RATES.VAT_RATE
    const total = subtotal + tax

    return { items, subtotal, tax, total }
  }, [invoiceDateStart, invoiceDateEnd])

  const saveInvoice = () => {
    const newInv: Invoice = {
      id: `INV-2025-${(invoices.length + 1).toString().padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clientOrSection: newInvoiceTitle,
      amount: previewItems.total,
      status: 'Draft',
      items: previewItems.items,
      subtotal: previewItems.subtotal,
      tax: previewItems.tax
    }
    setInvoices([newInv, ...invoices])
    setIsInvoiceModalOpen(false)
  }

  // Derived Financial KPIs
  const totalBudget = useMemo(() => activeProject?.budgetSAR || budgets.reduce((acc, b) => acc + b.allocated, 0), [activeProject, budgets])
  const totalSpent = useMemo(() => activeProject?.spentSAR || budgets.reduce((acc, b) => acc + b.spent, 0), [activeProject, budgets])
  const budgetUtilization = Math.round((totalSpent / totalBudget) * 100)

  const totalBilled = useMemo(() => invoices.reduce((acc, inv) => acc + inv.amount, 0), [invoices])
  const totalCollected = useMemo(() => invoices.filter(i => i.status === 'Paid').reduce((acc, inv) => acc + inv.amount, 0), [invoices])
  
  // Dynamic Pie Data for Budget distribution
  const pieData = budgets.map(b => ({ name: b.name, value: b.allocated, color: b.color }))

  // Inline Editing States for Expenses
  const [editingExpId, setEditingExpId] = useState<string | null>(null)
  const [editExpForm, setEditExpForm] = useState<Partial<Expense>>({})

  const handleExport = () => {
    const wb = XLSX.utils.book_new()
    
    // 1. Export Invoices
    const exportInvoices = selectedInvoiceIds.size > 0 
      ? invoices.filter(i => selectedInvoiceIds.has(i.id)) 
      : invoices
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportInvoices), "Invoices_Summary")
    
    const detailRows: any[] = []
    exportInvoices.forEach(inv => {
      inv.items?.forEach(it => {
        detailRows.push({ 'Invoice #': inv.id, 'Date': inv.date, 'Item': it.desc, 'Qty': it.qty, 'Rate': it.rate, 'Total': it.total })
      })
    })
    if (detailRows.length > 0) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), "Invoices_Detailed")

    // 2. Export Expenses
    const exportExpenses = selectedExpenseIds.size > 0 
      ? expenses.filter(e => selectedExpenseIds.has(e.id)) 
      : expenses
    
    const expenseRows = exportExpenses.map(e => ({
      ...e,
      Category: budgets.find(b => b.id === e.categoryId)?.name || 'Unknown'
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseRows), "Expenses")
    
    // 3. Other Data
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budgets), "Budgets")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cashFlow), "CashFlow")
    
    XLSX.writeFile(wb, "ACTS_GEO_Financial_Deep_Ledger.xlsx")
  }

  // Cost Center breakdown format
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-surface text-on-surface">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary tracking-tight">Financial ERP Console</h1>
          <p className="text-on-surface-variant text-sm mt-1">Project Economics: Master Budget, Invoicing, and Expense Ledgers</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-primary text-on-primary text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">payments</span>
            Export Ledgers
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 mb-8 border-b border-outline-variant/20 overflow-x-auto custom-scrollbar pb-2">
        {['overview', 'budget', 'invoices', 'expenses'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 font-bold text-sm uppercase tracking-widest rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-surface-container-high border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
          >
            {tab === 'overview' ? 'Executive Summary' : tab === 'budget' ? 'Fund Allocation' : tab === 'invoices' ? 'A/R Pipeline' : 'Expense Book'}
          </button>
        ))}
      </div>

      {/* 1. Executive Summary Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Master Budget</span>
              <div className="text-3xl font-headline font-bold text-primary mt-2">{formatCurrency(totalBudget)}</div>
              <div className="text-xs text-on-surface-variant mt-2">Planned capital for {activeProject?.name || 'Project'}</div>
            </div>
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Total Spent</span>
              <div className="flex items-baseline gap-2 mt-2">
                <div className="text-3xl font-headline font-bold text-error">{formatCurrency(totalSpent)}</div>
                <div className="text-xs font-bold bg-error/20 text-error px-2 py-0.5 rounded">{budgetUtilization}% Burn</div>
              </div>
              <div className="text-xs text-on-surface-variant mt-2">Actual drawn funds</div>
            </div>
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Pipeline Billed</span>
              <div className="text-3xl font-headline font-bold text-secondary mt-2">{formatCurrency(totalBilled)}</div>
              <div className="text-xs text-on-surface-variant mt-2">Generated through invoicing</div>
            </div>
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Actual Collected</span>
              <div className="flex items-baseline gap-2 mt-2">
                <div className="text-3xl font-headline font-bold text-tertiary">{formatCurrency(totalCollected)}</div>
              </div>
              <div className="text-xs text-on-surface-variant mt-2">Cash received (A/R Paid)</div>
            </div>
          </div>

          {/* Cash Flow Chart */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 h-96">
            <h3 className="text-lg font-bold font-headline text-primary mb-6">Cumulative Cash Flow & Revenue</h3>
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart data={cashFlow} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.2} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(val) => `SAR ${val/1000}k`} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface-container-highest)', border: '1px solid var(--color-outline-variant)', borderRadius: '8px', color: 'var(--color-on-surface)' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Legend iconType="circle" />
                <Bar dataKey="expenses" name="Actual Expenses" fill="var(--color-error)" radius={[4,4,0,0]} barSize={40} opacity={0.8} />
                <Line type="monotone" dataKey="revenue" name="Recognized Revenue" stroke="var(--color-secondary)" strokeWidth={4} dot={{ r: 6, fill: 'var(--color-secondary)' }} activeDot={{ r: 8 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2. Fund Allocation Tab */}
      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
            <h3 className="text-lg font-bold font-headline text-primary mb-6">Master Budget Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} contentStyle={{ backgroundColor: 'var(--color-surface-container-highest)', borderColor: 'var(--color-outline-variant)', borderRadius: '8px' }} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
            <h3 className="text-lg font-bold font-headline text-primary mb-6">Category Burn Rate</h3>
            <div className="space-y-4">
              {budgets.map(b => (
                <BurnGauge key={b.id} name={b.name} spent={b.spent} allocated={b.allocated} color={b.color} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Invoicing Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Action Toolbar */}
          <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
            <div className="flex gap-4">
              <button 
                onClick={() => setIsInvoiceModalOpen(true)}
                className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add_circle</span> Create New Invoice
              </button>
              {selectedInvoiceIds.size > 0 && (
                <button 
                  onClick={handleExport}
                  className="bg-surface-container-highest text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-outline-variant/20 hover:bg-surface-bright transition-all"
                >
                  <span className="material-symbols-outlined text-base">download</span> Export Selected ({selectedInvoiceIds.size})
                </button>
              )}
            </div>
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
              {invoices.length} Registered Invoices
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20">
            <div className="p-4 border-b border-outline-variant/20 bg-surface-container flex justify-between items-center">
              <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Accounts Receivable Pipeline</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input type="checkbox" className="rounded" checked={selectedInvoiceIds.size === invoices.length} onChange={() => {
                        if (selectedInvoiceIds.size === invoices.length) setSelectedInvoiceIds(new Set())
                        else setSelectedInvoiceIds(new Set(invoices.map(i => i.id)))
                      }} />
                    </th>
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Client / Node</th>
                    <th className="px-6 py-4">Issue Date</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 font-mono text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Draft Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {invoices.map(inv => (
                    <tr key={inv.id} className={`hover:bg-surface-container-high transition-colors group ${selectedInvoiceIds.has(inv.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded" checked={selectedInvoiceIds.has(inv.id)} onChange={() => toggleInvoiceSelection(inv.id)} />
                      </td>
                      <td className="px-6 py-4 font-bold text-xs">{inv.id}</td>
                      <td className="px-6 py-4 text-primary font-bold">{inv.clientOrSection}</td>
                      <td className="px-6 py-4 text-on-surface-variant font-mono">{inv.date}</td>
                      <td className={`px-6 py-4 font-mono ${inv.status === 'Overdue' ? 'text-error font-bold' : 'text-on-surface-variant'}`}>{inv.dueDate}</td>
                      <td className="px-6 py-4 font-bold font-mono text-right">{formatCurrency(inv.amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <select 
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value as any)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border-none outline-none cursor-pointer transition-colors
                            ${inv.status === 'Paid' ? 'bg-tertiary/20 text-tertiary' : 
                              inv.status === 'Submitted' ? 'bg-secondary/20 text-secondary' : 
                              inv.status === 'Overdue' ? 'bg-error/20 text-error' : 
                              'bg-outline-variant/20 text-on-surface-variant'}`}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Paid">Paid</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                         {inv.items && inv.items.length > 0 && (
                           <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter bg-surface-container-highest px-2 py-1 rounded">
                             {inv.items.length} Items Attached
                           </span>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {selectedInvoiceIds.size > 0 && (
                  <tfoot className="bg-surface-container-high/30 border-t-2 border-primary/20">
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-primary text-right">Selected Total:</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-primary underline decoration-double underline-offset-4">
                        {formatCurrency(invoices.filter(i => selectedInvoiceIds.has(i.id)).reduce((acc, i) => acc + i.amount, 0))}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Generation Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-low w-full max-w-4xl rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-headline font-bold text-primary">Automated Invoice Generator</h2>
                <p className="text-xs text-on-surface-variant">Scanning portal activity to verify completed work orders.</p>
              </div>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2">Invoice Title / Section</label>
                  <input 
                    type="text" 
                    value={newInvoiceTitle}
                    onChange={e => setNewInvoiceTitle(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2">Date From</label>
                  <input 
                    type="date" 
                    value={invoiceDateStart}
                    onChange={e => setInvoiceDateStart(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2">Date To</label>
                  <input 
                    type="date" 
                    value={invoiceDateEnd}
                    onChange={e => setInvoiceDateEnd(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="bg-surface-container-highest/20 rounded-xl border border-outline-variant/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-high/50 text-[10px] uppercase font-bold text-on-surface-variant">
                    <tr>
                      <th className="p-4">Service Description</th>
                      <th className="p-4 text-center">Unit / Qty</th>
                      <th className="p-4 text-right">Rate</th>
                      <th className="p-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-xs">
                    {previewItems.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-4 font-bold text-on-surface">{it.desc}</td>
                        <td className="p-4 text-center font-mono">{it.qty.toFixed(1)} {it.desc.includes('Drilling') ? 'm' : 'ea'}</td>
                        <td className="p-4 text-right font-mono">{formatCurrency(it.rate)}</td>
                        <td className="p-4 text-right font-mono font-bold text-primary">{formatCurrency(it.total)}</td>
                      </tr>
                    ))}
                    {previewItems.items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-on-surface-variant lowercase">No completed activities found for the selected period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-64 space-y-2 border-t border-outline-variant/20 pt-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Subtotal:</span>
                    <span className="font-mono font-bold">{formatCurrency(previewItems.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-secondary">
                    <span className="font-bold">VAT (15%):</span>
                    <span className="font-mono font-bold">{formatCurrency(previewItems.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-headline font-bold text-primary pt-2 border-t border-primary/20">
                    <span>Total Payable:</span>
                    <span>{formatCurrency(previewItems.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant/20 bg-surface-container-high flex justify-between items-center">
              <div className="flex items-center gap-2 text-[10px] text-secondary font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">verified</span> Verified by Master Portal Ledger
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-6 py-2 rounded-lg text-xs font-bold uppercase border border-outline-variant/30 hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={previewItems.items.length === 0}
                  onClick={saveInvoice}
                  className={`px-8 py-2 rounded-lg text-xs font-bold uppercase shadow-lg transition-all active:scale-95 ${previewItems.items.length === 0 ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed' : 'bg-primary text-on-primary hover:brightness-110'}`}
                >
                  Confirm & Save Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Expenses Tab */}
      {/* 4. Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Action Toolbar */}
          <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
            <div className="flex gap-4">
              <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add_box</span> Add New Expense
              </button>
              {selectedExpenseIds.size > 0 && (
                <button 
                  onClick={handleExport}
                  className="bg-surface-container-highest text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-outline-variant/20 hover:bg-surface-bright transition-all"
                >
                  <span className="material-symbols-outlined text-base">sim_card_download</span> Export Selected ({selectedExpenseIds.size})
                </button>
              )}
            </div>
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
              Total Recorded Lines: {expenses.length}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20">
             <div className="p-4 border-b border-outline-variant/20 bg-surface-container">
              <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Operational Expense Ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input type="checkbox" className="rounded" checked={selectedExpenseIds.size === expenses.length} onChange={() => {
                        if (selectedExpenseIds.size === expenses.length) setSelectedExpenseIds(new Set())
                        else setSelectedExpenseIds(new Set(expenses.map(e => e.id)))
                      }} />
                    </th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Fund Category</th>
                    <th className="px-6 py-4 text-center">State</th>
                    <th className="px-6 py-4 text-right font-mono">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {expenses.map(e => {
                    const cat = budgets.find(b => b.id === e.categoryId)
                    return (
                      <tr key={e.id} className={`hover:bg-surface-container-high transition-colors group ${selectedExpenseIds.has(e.id) ? 'bg-primary/5' : ''}`}>
                        <td className="px-6 py-3">
                          <input type="checkbox" className="rounded" checked={selectedExpenseIds.has(e.id)} onChange={() => toggleExpenseSelection(e.id)} />
                        </td>
                        <td className="px-6 py-3 font-mono text-xs text-on-surface-variant">{e.id}</td>
                        <td className="px-6 py-3 text-xs">{e.date}</td>
                        
                        {/* Editable Description */}
                        <td className="px-6 py-3">
                          {editingExpId === e.id ? (
                             <input 
                               type="text" 
                               className="w-full bg-surface-container-highest border border-primary/50 rounded px-2 py-1 text-sm focus:outline-none"
                               value={editExpForm.description || ''}
                               onChange={ev => setEditExpForm({...editExpForm, description: ev.target.value})}
                             />
                          ) : (
                            <span className="font-bold">{e.description}</span>
                          )}
                        </td>

                        {/* Readonly category link */}
                        <td className="px-6 py-3 font-bold text-xs" style={{ color: cat?.color }}>{cat?.name}</td>

                        {/* Editable Status */}
                        <td className="px-6 py-3 text-center">
                          {editingExpId === e.id ? (
                            <select 
                              className="bg-surface-container-highest border border-primary/50 rounded px-2 py-1 text-xs focus:outline-none"
                              value={editExpForm.status || ''}
                              onChange={ev => setEditExpForm({...editExpForm, status: ev.target.value as any})}
                            >
                              <option value="Paid">Paid</option>
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                            </select>
                          ) : (
                            <select 
                              value={e.status}
                              onChange={(ev) => {
                                const nextStatus = ev.target.value as any
                                setExpenses(prev => prev.map(ex => ex.id === e.id ? { ...ex, status: nextStatus } : ex))
                              }}
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border-none outline-none cursor-pointer transition-colors
                                ${e.status === 'Paid' ? 'bg-tertiary/20 text-tertiary' : 
                                  e.status === 'Approved' ? 'bg-secondary/20 text-secondary' : 
                                  'bg-primary/20 text-primary'}`}
                            >
                              <option value="Paid">Paid</option>
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                            </select>
                          )}
                        </td>

                        {/* Editable Amount */}
                        <td className="px-6 py-3 text-right">
                          {editingExpId === e.id ? (
                            <input 
                              type="number" 
                              className="w-24 bg-surface-container-highest border border-primary/50 rounded px-2 py-1 text-sm focus:outline-none text-right font-mono"
                              value={editExpForm.amount || 0}
                              onChange={ev => setEditExpForm({...editExpForm, amount: parseFloat(ev.target.value)})}
                            />
                          ) : (
                            <span className="font-mono font-bold text-error">-{formatCurrency(e.amount)}</span>
                          )}
                        </td>

                        <td className="px-6 py-3 text-right">
                          {editingExpId === e.id ? (
                            <button 
                              onClick={() => {
                                setExpenses(prev => prev.map(exp => exp.id === editingExpId ? { ...exp, ...editExpForm } as Expense : exp))
                                setEditingExpId(null)
                              }} 
                              className="text-secondary font-bold text-xs uppercase hover:underline"
                            >
                              Save
                            </button>
                          ) : (
                            <button 
                              onClick={() => { setEditingExpId(e.id); setEditExpForm(e); }} 
                              className="text-primary font-bold text-xs uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {selectedExpenseIds.size > 0 && (
                  <tfoot className="bg-surface-container-high/30 border-t-2 border-error/20">
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-error text-right">Selected Total:</td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-error underline decoration-double underline-offset-4">
                        -{formatCurrency(expenses.filter(e => selectedExpenseIds.has(e.id)).reduce((acc, e) => acc + e.amount, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-container-low w-full max-w-lg rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col scale-in duration-300">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container">
              <div>
                <h2 className="text-xl font-headline font-bold text-primary">New Expense Entry</h2>
                <p className="text-xs text-on-surface-variant">Log project costs against allocated budgets.</p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Entry Date</label>
                  <input 
                    type="date" 
                    value={newExpForm.date}
                    onChange={e => setNewExpForm({...newExpForm, date: e.target.value})}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Fund Category</label>
                  <select 
                    value={newExpForm.categoryId}
                    onChange={e => setNewExpForm({...newExpForm, categoryId: e.target.value})}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all shadow-inner"
                  >
                    {budgets.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Description</label>
                <textarea 
                  placeholder="e.g., Diesel Supply for Rig DR-001..."
                  value={newExpForm.description}
                  onChange={e => setNewExpForm({...newExpForm, description: e.target.value})}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary h-24 transition-all shadow-inner resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Amount (SAR)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={newExpForm.amount || ''}
                    onChange={e => setNewExpForm({...newExpForm, amount: parseFloat(e.target.value)})}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-mono font-bold text-error focus:outline-none focus:border-error transition-all shadow-inner"
                  />
                </div>
                <div>
                   <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Status</label>
                   <select 
                    value={newExpForm.status}
                    onChange={e => setNewExpForm({...newExpForm, status: e.target.value as any})}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all shadow-inner"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-outline-variant/20 bg-surface-container flex justify-end gap-3">
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-outline-variant/30 hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={!newExpForm.description || !newExpForm.amount}
                onClick={saveExpense}
                className={`px-8 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl transition-all active:scale-95 ${(!newExpForm.description || !newExpForm.amount) ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed' : 'bg-primary text-on-primary hover:brightness-110'}`}
              >
                Save to Ledger
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
