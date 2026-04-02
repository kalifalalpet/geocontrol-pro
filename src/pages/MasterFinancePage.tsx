import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useProjects } from '../context/ProjectContext'

export default function MasterFinancePage() {
  const { treasury, addTransaction, updateTransaction, deleteTransaction } = useFinance()
  const { projects } = useProjects()
  
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState(0)
  const [depositNote, setDepositNote] = useState('')

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>(null)

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(treasury.transactions.map(tx => tx.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.size} selected transactions?`)) return
    selectedIds.forEach(id => deleteTransaction(id))
    setSelectedIds(new Set())
  }

  const handleExport = () => {
    const data = treasury.transactions.filter(tx => selectedIds.has(tx.id))
    const csv = 'Date,Description,Type,Amount (SAR)\n' + 
      data.map(tx => `${tx.date},${tx.description},${tx.type},${tx.amount}`).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `finance_transactions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: depositAmount,
      type: 'deposit',
      description: depositNote || 'Central Fund Deposit'
    })
    setShowDepositModal(false)
    setDepositAmount(0)
    setDepositNote('')
  }

  const formatSAR = (val: number) => {
    return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-background custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-white tracking-tight">Financial Treasury</h2>
          <p className="text-on-primary-container/60 text-sm mt-1 uppercase tracking-widest font-bold">Master liquidity and project fund control</p>
        </div>

        <button 
          onClick={() => setShowDepositModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-tertiary text-on-tertiary text-xs font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg shadow-tertiary/20"
        >
          <span className="material-symbols-outlined text-sm">payments</span>
          Inject Capital
        </button>
      </div>

      {/* Main Treasure Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 glass-panel bg-gradient-to-br from-primary/10 to-transparent p-10 rounded-[2rem] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-1000"></div>
          
          <p className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4">Total Reserve Balance</p>
          <h1 className="text-6xl font-headline font-black text-white mb-8 tracking-tighter">
            {formatSAR(treasury.totalBalanceSAR)}
          </h1>

          <div className="grid grid-cols-2 gap-12 mt-12 pt-12 border-t border-white/5">
            <div>
              <p className="text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest mb-2">Allocated to Projects</p>
              <p className="text-2xl font-bold text-secondary">{formatSAR(treasury.allocatedSAR)}</p>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-secondary" style={{ width: `${(treasury.allocatedSAR / treasury.totalBalanceSAR) * 100}%` }}></div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest mb-2">Available for Expansion</p>
              <p className="text-2xl font-bold text-tertiary">{formatSAR(treasury.availableSAR)}</p>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-tertiary" style={{ width: `${(treasury.availableSAR / treasury.totalBalanceSAR) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-10 rounded-[2rem] border border-white/10 flex flex-col justify-center bg-surface-container/50">
          <p className="text-xs font-bold text-on-primary-container/40 uppercase tracking-[0.2em] mb-6">Allocation Distribution</p>
          <div className="space-y-6">
            {projects.slice(0, 4).map(p => (
              <div key={p.id} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-white">{p.name}</span>
                  <span className="text-primary">{((p.budgetSAR / treasury.allocatedSAR) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(p.budgetSAR / treasury.allocatedSAR) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {projects.length === 0 && <p className="text-xs italic text-on-primary-container/30">No active projects yet.</p>}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-6 flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Global Transaction Ledger</h3>
            
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest border-l border-white/10 pl-6">{selectedIds.size} Selected</span>
                <button 
                  onClick={handleExport}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold text-white uppercase tracking-widest transition-colors"
                >
                  Export CSV
                </button>
                <button 
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-error/10 hover:bg-error/20 border border-error/20 rounded text-[10px] font-bold text-error uppercase tracking-widest transition-colors"
                >
                  Delete
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="text-on-primary-container/40 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
          </div>
          <button onClick={() => {
            const csv = 'Date,Description,Type,Amount (SAR)\n' + 
              treasury.transactions.map(tx => `${tx.date},${tx.description},${tx.type},${tx.amount}`).join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `all_transactions.csv`
            link.click()
          }} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">Download Full Report</button>
        </div>

        <div className="glass-panel border border-white/10 rounded-2xl flex-1 flex flex-col overflow-hidden bg-surface-container/30">
          <div className="overflow-y-auto flex-1 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 580px)', minHeight: '300px' }}>
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-surface-container-high border-b border-white/5 shadow-md">
                <tr>
                  <th className="px-6 py-5 w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={treasury.transactions.length > 0 && selectedIds.size === treasury.transactions.length}
                      className="w-4 h-4 rounded border-white/10 bg-black/20 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest">Description</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest text-right">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
              {treasury.transactions.map(tx => (
                <tr key={tx.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.has(tx.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-6 py-5 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                      className="w-4 h-4 rounded border-white/10 bg-black/20 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-8 py-5 text-xs text-on-primary-container/60 font-mono">{tx.date}</td>
                  <td className="px-8 py-5">
                    {editingId === tx.id ? (
                      <input 
                        className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary w-full"
                        value={editForm?.description || ''}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      />
                    ) : (
                      <div className="flex flex-col">
                         <span className="text-sm font-bold text-white">{tx.description}</span>
                         {tx.targetProjectId && (
                           <span className="text-[9px] text-primary uppercase font-bold tracking-widest mt-0.5">Project: {tx.targetProjectId}</span>
                         )}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest ${
                      tx.type === 'deposit' ? 'bg-tertiary/10 text-tertiary' :
                      tx.type === 'allocation' ? 'bg-secondary/10 text-secondary' :
                      'bg-error/10 text-error'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-8 py-5 text-sm font-black text-right ${tx.type === 'deposit' ? 'text-tertiary' : 'text-white'}`}>
                    {editingId === tx.id ? (
                      <input 
                        type="number"
                        className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary w-24 text-right"
                        value={editForm?.amount || 0}
                        onChange={e => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                      />
                    ) : (
                      <>
                        {tx.type === 'deposit' ? '+' : '-'}{formatSAR(tx.amount)}
                      </>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right w-24">
                     {editingId === tx.id ? (
                       <div className="flex items-center justify-end gap-2">
                         <button onClick={() => { updateTransaction(tx.id, editForm); setEditingId(null) }} className="text-tertiary hover:scale-110 transition-transform">
                           <span className="material-symbols-outlined text-sm">check</span>
                         </button>
                         <button onClick={() => setEditingId(null)} className="text-error hover:scale-110 transition-transform">
                           <span className="material-symbols-outlined text-sm">close</span>
                         </button>
                       </div>
                     ) : (
                       <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingId(tx.id); setEditForm({ ...tx }) }} className="text-on-primary-container/40 hover:text-primary transition-colors">
                           <span className="material-symbols-outlined text-sm">edit</span>
                         </button>
                         <button onClick={() => { if(confirm('Revert transaction?')) deleteTransaction(tx.id) }} className="text-on-primary-container/40 hover:text-error transition-colors">
                           <span className="material-symbols-outlined text-sm">delete</span>
                         </button>
                       </div>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowDepositModal(false)}></div>
          <div className="relative glass-panel bg-surface-container w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-headline font-bold text-white mb-6">Inject Capital Reserve</h3>
            <form onSubmit={handleDeposit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1.5 ml-1">Amount (SAR)</label>
                <input type="number" required
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-tertiary focus:outline-none"
                  value={depositAmount}
                  onChange={e => setDepositAmount(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1.5 ml-1">Transaction Note</label>
                <input required
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-tertiary focus:outline-none"
                  placeholder="e.g. Q1 Fund Injection"
                  value={depositNote}
                  onChange={e => setDepositNote(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowDepositModal(false)} className="text-xs font-bold text-on-primary-container/60 uppercase">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-tertiary text-on-tertiary text-xs font-bold uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg shadow-tertiary/20 transition-all">Submit Deposit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
