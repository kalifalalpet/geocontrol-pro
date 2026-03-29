import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { initialPersonnels, initialAssets, Personnel, Asset } from '../data/resourceData'

export default function ResourcePage() {
  const [activeTab, setActiveTab] = useState<'dash' | 'personnel' | 'assets'>('dash')

  // State
  const [personnels, setPersonnels] = useState<Personnel[]>(initialPersonnels)
  const [assets, setAssets] = useState<Asset[]>(initialAssets)

  // Editing States
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
  const [editPersonForm, setEditPersonForm] = useState<Partial<Personnel>>({})

  // Compute stats
  const activePersonnel = useMemo(() => personnels.filter(p => p.shift !== 'Leave').length, [personnels])
  const onLeavePersonnel = useMemo(() => personnels.filter(p => p.shift === 'Leave').length, [personnels])
  const activeAssets = useMemo(() => assets.filter(a => a.calibrationStatus === 'Active').length, [assets])

  const checkCalibrationStatus = (dueDate: string | null) => {
    if (!dueDate) return { status: 'unknown', text: 'No Date' }
    const due = new Date(dueDate)
    const now = new Date('2025-10-01') // Simulation date relative to the dummy data
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24))
    if (diffDays <= 0) return { status: 'expired', text: 'EXPIRED' }
    if (diffDays <= 30) return { status: 'warning', text: `Due in ${diffDays}d` }
    return { status: 'ok', text: 'Valid' }
  }

  // Handlers
  const handleExport = () => {
    const wb = XLSX.utils.book_new()
    const perWs = XLSX.utils.json_to_sheet(personnels)
    const assetWs = XLSX.utils.json_to_sheet(assets)
    XLSX.utils.book_append_sheet(wb, perWs, "Personels")
    XLSX.utils.book_append_sheet(wb, assetWs, "Assets")
    XLSX.writeFile(wb, "updated_resources.xlsx")
  }

  const handleEditPerson = (p: Personnel) => {
    setEditingPersonId(p.id)
    setEditPersonForm(p)
  }

  const handleSavePerson = () => {
    if (!editingPersonId) return
    setPersonnels(prev => prev.map(p => p.id === editingPersonId ? { ...p, ...editPersonForm } as Personnel : p))
    setEditingPersonId(null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-surface text-on-surface">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary tracking-tight">Resource ERP Console</h1>
          <p className="text-on-surface-variant text-sm mt-1">Live Tracking, Fleet Calibration, and Rosters</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-secondary text-secondary-contrast text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Updates to Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-outline-variant/20 overflow-x-auto custom-scrollbar pb-2">
        <button 
          onClick={() => setActiveTab('dash')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-widest rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'dash' ? 'bg-surface-container-high border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
        >
          Overview Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('personnel')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-widest rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'personnel' ? 'bg-surface-container-high border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
        >
          Personnel Roster
          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px]">{personnels.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('assets')}
          className={`px-6 py-3 font-bold text-sm uppercase tracking-widest rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'assets' ? 'bg-surface-container-high border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
        >
          Asset & Fleet Tracking
          <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[10px]">{assets.length}</span>
        </button>
      </div>

      {/* Tab Contents */}
      
      {/* 1. Dashboard Tab */}
      {activeTab === 'dash' && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/20 flex flex-col justify-between h-32">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Active Personnel</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-headline font-bold text-primary">{activePersonnel}</span>
                <span className="material-symbols-outlined text-primary/30 text-4xl">engineering</span>
              </div>
            </div>
            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/20 flex flex-col justify-between h-32">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">On Leave</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-headline font-bold text-error">{onLeavePersonnel}</span>
                <span className="material-symbols-outlined text-error/30 text-4xl">beach_access</span>
              </div>
            </div>
            <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/20 flex flex-col justify-between h-32">
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">Active Assets</span>
              <div className="flex items-end justify-between">
                <span className="text-4xl font-headline font-bold text-secondary">{activeAssets}</span>
                <span className="material-symbols-outlined text-secondary/30 text-4xl">precision_manufacturing</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
              <h3 className="text-lg font-bold font-headline text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span> 
                Assets Needing Action
              </h3>
              <div className="space-y-3">
                {assets.map(a => {
                  const stat = checkCalibrationStatus(a.calibrationDueDate)
                  if (stat.status === 'ok') return null
                  return (
                    <div key={a.assetId} className="flex justify-between items-center p-3 bg-surface-container rounded-lg border-l-4 border-error">
                      <div>
                        <p className="font-bold text-sm">{a.assetId} - {a.assetType}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase">{a.conditionRemark}</p>
                      </div>
                      <span className="bg-error/20 text-error px-2 py-1 rounded text-xs font-bold">{stat.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
              <h3 className="text-lg font-bold font-headline text-primary mb-4">Location Distribution</h3>
              <div className="space-y-2">
                {Array.from(new Set(personnels.map(p => p.location))).map(loc => {
                  const count = personnels.filter(p => p.location === loc).length
                  const pct = Math.round((count / personnels.length) * 100)
                  return (
                    <div key={loc} className="p-3 bg-surface-container rounded-lg">
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span>{loc}</span>
                        <span>{count} pax</span>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Personnel Tab */}
      {activeTab === 'personnel' && (
        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container flex justify-between items-center">
            <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Team Management Database</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Designation</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Shift Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {personnels.map(p => (
                  <tr key={p.id} className="hover:bg-surface-container-high transition-colors group">
                    <td className="px-6 py-3 font-mono text-xs">{p.id}</td>
                    <td className="px-6 py-3 font-bold">{p.name}</td>
                    <td className="px-6 py-3 text-on-surface-variant">{p.designation}</td>
                    
                    {/* Editable Location */}
                    <td className="px-6 py-3">
                      {editingPersonId === p.id ? (
                        <input 
                          type="text" 
                          className="w-full bg-surface-container-highest border border-primary/50 rounded px-2 py-1 text-sm focus:outline-none"
                          value={editPersonForm.location || ''}
                          onChange={e => setEditPersonForm({...editPersonForm, location: e.target.value})}
                        />
                      ) : (
                        <span className="px-2 py-1 bg-surface-container-highest rounded-md text-xs">{p.location}</span>
                      )}
                    </td>

                    {/* Editable Shift */}
                    <td className="px-6 py-3">
                      {editingPersonId === p.id ? (
                        <select 
                          className="w-full bg-surface-container-highest border border-primary/50 rounded px-2 py-1 text-sm focus:outline-none"
                          value={editPersonForm.shift || ''}
                          onChange={e => setEditPersonForm({...editPersonForm, shift: e.target.value})}
                        >
                          <option value="Day">Day</option>
                          <option value="Night">Night</option>
                          <option value="Leave">Leave</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.shift === 'Leave' ? 'bg-error/20 text-error' : p.shift === 'Night' ? 'bg-secondary/20 text-secondary' : 'bg-tertiary/20 text-tertiary'}`}>
                          {p.shift}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-3 text-right">
                      {editingPersonId === p.id ? (
                        <button onClick={handleSavePerson} className="text-secondary font-bold text-xs uppercase hover:underline">Save</button>
                      ) : (
                        <button onClick={() => handleEditPerson(p)} className="text-primary font-bold text-xs uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Assets Tab */}
      {activeTab === 'assets' && (
        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-4 border-b border-outline-variant/20 bg-surface-container flex justify-between items-center">
            <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Fleet & Equipment Repository</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Asset ID</th>
                  <th className="px-6 py-4">Type & Model</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Calibration End</th>
                  <th className="px-6 py-4">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-sm">
                {assets.map(a => {
                  const stat = checkCalibrationStatus(a.calibrationDueDate)
                  return (
                    <tr key={a.assetId} className="hover:bg-surface-container-high transition-colors group">
                      <td className="px-6 py-3 font-mono font-bold text-xs text-primary">{a.assetId}</td>
                      <td className="px-6 py-3">
                        <div className="font-bold">{a.assetType}</div>
                        <div className="text-[10px] text-on-surface-variant">{a.modelNumber}</div>
                      </td>
                      <td className="px-6 py-3">
                         <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${a.calibrationStatus === 'Active' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' : 'bg-outline/10 text-outline border-outline/20'}`}>
                          {a.calibrationStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs">{a.calibrationDueDate || 'N/A'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${stat.status === 'ok' ? 'text-tertiary' : stat.status === 'warning' ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>
                          {stat.text}
                        </span>
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
