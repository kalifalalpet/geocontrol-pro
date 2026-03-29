import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import {
  initialBudgetCategories, initialExpenses, initialInvoices, initialCashFlow,
  Expense, Invoice
} from '../data/financeData'

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
        <span>Spent: ${spent.toLocaleString()}</span>
        <span>Alloc: ${allocated.toLocaleString()}</span>
      </div>
    </div>
  )
}

export default function FinancialDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'invoices' | 'expenses'>('overview')

  // Core State
  const [budgets] = useState(initialBudgetCategories)
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [cashFlow] = useState(initialCashFlow)

  // Derived Financial KPIs
  const totalBudget = useMemo(() => budgets.reduce((acc, b) => acc + b.allocated, 0), [budgets])
  const totalSpent = useMemo(() => budgets.reduce((acc, b) => acc + b.spent, 0), [budgets])
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(invoices), "Invoices")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses), "Expenses")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(budgets), "Budgets")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cashFlow), "CashFlow")
    XLSX.writeFile(wb, "financial_export.xlsx")
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
              <div className="text-xs text-on-surface-variant mt-2">Planned capital for Qiddiya</div>
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
        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20 animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container flex justify-between items-center">
            <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Accounts Receivable Pipeline</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Client / Node</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 font-mono text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-surface-container-high transition-colors group">
                    <td className="px-6 py-4 font-bold text-xs">{inv.id}</td>
                    <td className="px-6 py-4 text-primary font-bold">{inv.clientOrSection}</td>
                    <td className="px-6 py-4 text-on-surface-variant font-mono">{inv.date}</td>
                    <td className={`px-6 py-4 font-mono ${inv.status === 'Overdue' ? 'text-error font-bold' : 'text-on-surface-variant'}`}>{inv.dueDate}</td>
                    <td className="px-6 py-4 font-bold font-mono text-right">{formatCurrency(inv.amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider 
                        ${inv.status === 'Paid' ? 'bg-tertiary/20 text-tertiary' : 
                          inv.status === 'Submitted' ? 'bg-secondary/20 text-secondary' : 
                          inv.status === 'Overdue' ? 'bg-error/20 text-error' : 
                          'bg-outline-variant/20 text-on-surface-variant'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20 animate-in slide-in-from-bottom-4 duration-300">
           <div className="p-4 border-b border-outline-variant/20 bg-surface-container">
            <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Operational Expense Ledger</h2>
            <p className="text-[10px] text-on-surface-variant mt-1">Daily inputs automatically reduce the allocated cost center budgets.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                <tr>
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
                    <tr key={e.id} className="hover:bg-surface-container-high transition-colors group">
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
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider 
                            ${e.status === 'Paid' ? 'bg-tertiary/20 text-tertiary' : 
                              e.status === 'Approved' ? 'bg-secondary/20 text-secondary' : 
                              'bg-primary/20 text-primary'}`}>
                            {e.status}
                          </span>
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
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
