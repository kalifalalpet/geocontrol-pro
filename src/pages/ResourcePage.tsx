import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Personnel, Asset } from '../data/resourceData'
import { useResource } from '../context/ResourceContext'
import { allSitePoints } from '../data/sampleData'

export default function ResourcePage() {
  const { 
    personnels, assets, updatePersonnel, updateAsset, 
    addPersonnel, addAsset, deletePersonnel, deleteAsset,
    bulkDeletePersonnel, bulkDeleteAssets 
  } = useResource()

  const [activeTab, setActiveTab] = useState<'dash' | 'personnel' | 'assets'>('dash')

  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
  const [editPersonForm, setEditPersonForm] = useState<Partial<Personnel>>({})

  const [editingAssetId, setEditingAssetId] = useState<string | null>(null)
  const [editAssetForm, setEditAssetForm] = useState<Partial<Asset>>({})

  // Selections
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<Set<string>>(new Set())
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set())

  // Modals & New Item Forms
  const [isAddPersonnelModalOpen, setIsAddPersonnelModalOpen] = useState(false)
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false)
  
  const [newPersonnelForm, setNewPersonnelForm] = useState<Partial<Personnel>>({
    designation: 'Helper',
    responsibility: 'Helper',
    name: '',
    id: '',
    location: 'Jeddah',
    shift: 'Day',
    joinedYear: 2025
  })
  
  const [newAssetForm, setNewAssetForm] = useState<Partial<Asset>>({
    assetType: 'Drilling Rig',
    assetId: '',
    modelNumber: '',
    manufacturedYear: 2025,
    calibrationStatus: 'Active',
    calibrationPeriodDays: 180,
    conditionRemark: 'Working well'
  })

  const togglePersonnelSelection = (id: string) => {
    const next = new Set(selectedPersonnelIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedPersonnelIds(next)
  }

  const toggleAssetSelection = (id: string) => {
    const next = new Set(selectedAssetIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedAssetIds(next)
  }

  const handleAddPersonnel = () => {
    if (!newPersonnelForm.name || !newPersonnelForm.id) return
    const newP: Personnel = {
      slNo: personnels.length + 1,
      name: newPersonnelForm.name || '',
      id: newPersonnelForm.id || '',
      designation: newPersonnelForm.designation || 'Helper',
      responsibility: newPersonnelForm.responsibility || 'Helper',
      location: newPersonnelForm.location || 'Jeddah',
      shift: newPersonnelForm.shift || 'Day',
      joinedYear: newPersonnelForm.joinedYear || 2025
    }
    addPersonnel(newP)
    setIsAddPersonnelModalOpen(false)
    setNewPersonnelForm({ designation: 'Helper', responsibility: 'Helper', name: '', id: '', location: 'Jeddah', shift: 'Day', joinedYear: 2025 })
  }

  const handleAddAsset = () => {
    if (!newAssetForm.assetId) return
    const newA: Asset = {
      slNo: assets.length + 1,
      assetType: newAssetForm.assetType || 'Drilling Rig',
      assetId: newAssetForm.assetId || '',
      modelNumber: newAssetForm.modelNumber || '',
      manufacturedYear: newAssetForm.manufacturedYear || 2025,
      calibrationStatus: newAssetForm.calibrationStatus || 'Active',
      calibratedDate: newAssetForm.calibratedDate || null,
      calibrationPeriodDays: newAssetForm.calibrationPeriodDays || null,
      calibrationDueDate: newAssetForm.calibrationDueDate || null,
      conditionRemark: newAssetForm.conditionRemark || 'Working well',
      currentPosition: 'Idle'
    }
    addAsset(newA)
    setIsAddAssetModalOpen(false)
    setNewAssetForm({ assetType: 'Drilling Rig', assetId: '', modelNumber: '', manufacturedYear: 2025, calibrationStatus: 'Active', calibrationPeriodDays: 180, conditionRemark: 'Working well' })
  }

  // Compute stats
  const activePersonnel = useMemo(() => personnels.filter(p => p.shift !== 'Leave').length, [personnels])
  const onLeavePersonnel = useMemo(() => personnels.filter(p => p.shift === 'Leave').length, [personnels])
  const activeAssets = useMemo(() => assets.filter(a => a.calibrationStatus === 'Active').length, [assets])

  const checkCalibrationStatus = (dueDate: string | null) => {
    if (!dueDate) return { status: 'unknown', text: 'No Date' }
    const due = new Date(dueDate)
    const now = new Date('2026-03-30') // Simulation date relative to the dummy data
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24))
    if (diffDays <= 0) return { status: 'expired', text: 'EXPIRED' }
    if (diffDays <= 30) return { status: 'warning', text: `Due in ${diffDays}d` }
    return { status: 'ok', text: 'Valid' }
  }

  // Handlers
  const handleExport = () => {
    const wb = XLSX.utils.book_new()
    
    // Determine which tab we are exporting from if selective
    let exportP = personnels
    if (selectedPersonnelIds.size > 0 && activeTab === 'personnel') {
      exportP = personnels.filter(p => selectedPersonnelIds.has(p.id))
    }
    
    let exportA = assets
    if (selectedAssetIds.size > 0 && activeTab === 'assets') {
      exportA = assets.filter(a => selectedAssetIds.has(a.assetId))
    }

    const perWs = XLSX.utils.json_to_sheet(exportP)
    const assetWs = XLSX.utils.json_to_sheet(exportA)
    XLSX.utils.book_append_sheet(wb, perWs, "Personels")
    XLSX.utils.book_append_sheet(wb, assetWs, "Assets")
    XLSX.writeFile(wb, "ACTS_GEO_Resource_Master_Ledger.xlsx")
  }

  const handleEditPerson = (p: Personnel) => {
    setEditingPersonId(p.id)
    setEditPersonForm(p)
  }

  const handleSavePerson = () => {
    if (!editingPersonId) return
    updatePersonnel(editingPersonId, editPersonForm)
    setEditingPersonId(null)
  }

  const handleDeletePerson = (id: string) => {
    if (confirm("Are you sure you want to remove this personnel from the roster?")) {
      deletePersonnel(id)
      setSelectedPersonnelIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleBulkDeletePersonnel = () => {
    if (confirm(`Remove ${selectedPersonnelIds.size} selected personnel?`)) {
      bulkDeletePersonnel(selectedPersonnelIds)
      setSelectedPersonnelIds(new Set())
    }
  }

  const handleDeleteAsset = (id: string) => {
    if (confirm("Are you sure you want to remove this asset from the fleet ledger?")) {
      deleteAsset(id)
      setSelectedAssetIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleBulkDeleteAssets = () => {
    if (confirm(`Remove ${selectedAssetIds.size} selected assets?`)) {
      bulkDeleteAssets(selectedAssetIds)
      setSelectedAssetIds(new Set())
    }
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
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
          
          {/* Personnel Toolbar */}
          <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
            <div className="flex gap-4">
              <button 
                onClick={() => setIsAddPersonnelModalOpen(true)}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-base">person_add</span> Add New Personnel
              </button>
              {selectedPersonnelIds.size > 0 && (
                <button 
                  onClick={handleExport}
                  className="bg-surface-container-highest text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-outline-variant/20 hover:bg-surface-bright transition-all"
                >
                  <span className="material-symbols-outlined text-base">download_for_offline</span> Export Selected ({selectedPersonnelIds.size})
                </button>
              )}
              {selectedPersonnelIds.size > 0 && (
                <button 
                  onClick={handleBulkDeletePersonnel}
                  className="bg-error/10 text-error px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-error/20 hover:bg-error/20 transition-all"
                >
                  <span className="material-symbols-outlined text-base">delete_sweep</span> Delete Selected ({selectedPersonnelIds.size})
                </button>
              )}
            </div>
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
              {personnels.length} Personnels in Roster
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20">
            <div className="p-4 border-b border-outline-variant/20 bg-surface-container">
              <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Master Project Roster</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input type="checkbox" className="rounded" checked={selectedPersonnelIds.size === personnels.length} onChange={() => {
                        if (selectedPersonnelIds.size === personnels.length) setSelectedPersonnelIds(new Set())
                        else setSelectedPersonnelIds(new Set(personnels.map(p => p.id)))
                      }} />
                    </th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Designation</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Shift</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {personnels.map(p => (
                    <tr key={p.id} className={`hover:bg-surface-container-high transition-colors group ${selectedPersonnelIds.has(p.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded" checked={selectedPersonnelIds.has(p.id)} onChange={() => togglePersonnelSelection(p.id)} />
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold">{p.id}</td>
                      <td className="px-6 py-4">
                        {editingPersonId === p.id ? (
                          <input 
                            type="text" 
                            className="bg-surface-container-highest border border-primary/20 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary w-full"
                            value={editPersonForm.name || ''}
                            onChange={e => setEditPersonForm({...editPersonForm, name: e.target.value})}
                          />
                        ) : (
                          <span className="font-bold text-primary">{p.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         {editingPersonId === p.id ? (
                          <input 
                            type="text" 
                            className="bg-surface-container-highest border border-primary/20 rounded px-2 py-1 text-sm focus:outline-none w-full"
                            value={editPersonForm.designation || ''}
                            onChange={e => setEditPersonForm({...editPersonForm, designation: e.target.value})}
                          />
                        ) : (
                          <span className="text-xs font-bold uppercase text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded">{p.designation}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                         {editingPersonId === p.id ? (
                          <input 
                            type="text" 
                            className="bg-surface-container-highest border border-primary/20 rounded px-2 py-1 text-sm focus:outline-none w-full"
                            value={editPersonForm.location || ''}
                            onChange={e => setEditPersonForm({...editPersonForm, location: e.target.value})}
                          />
                        ) : (
                          <span className="text-xs bg-surface-container-highest px-2 py-1 rounded inline-block">{p.location}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingPersonId === p.id ? (
                          <select 
                            className="bg-surface-container-highest border border-primary/20 rounded px-2 py-1 text-xs focus:outline-none w-full"
                            value={editPersonForm.shift || ''}
                            onChange={e => setEditPersonForm({...editPersonForm, shift: e.target.value})}
                          >
                            <option value="Day">Day</option>
                            <option value="Night">Night</option>
                            <option value="Leave">Leave</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider 
                            ${p.shift === 'Leave' ? 'bg-error/20 text-error' : 
                              p.shift === 'Night' ? 'bg-secondary/20 text-secondary' : 
                              'bg-tertiary/20 text-tertiary'}`}>
                            {p.shift}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {editingPersonId === p.id ? (
                            <button onClick={handleSavePerson} className="text-secondary font-bold text-xs uppercase hover:underline">Save</button>
                          ) : (
                            <>
                              <button onClick={() => handleEditPerson(p)} className="text-primary font-bold text-xs uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                              <button onClick={() => handleDeletePerson(p.id)} className="text-error font-bold text-xs uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Assets Tab */}
      {activeTab === 'assets' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
           {/* Asset Toolbar */}
           <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
            <div className="flex gap-4">
              <button 
                onClick={() => setIsAddAssetModalOpen(true)}
                className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-base">precision_manufacturing</span> Add New Asset
              </button>
              {selectedAssetIds.size > 0 && (
                <button 
                  onClick={handleExport}
                  className="bg-surface-container-highest text-primary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-outline-variant/20 hover:bg-surface-bright transition-all"
                >
                  <span className="material-symbols-outlined text-base">download_for_offline</span> Export Selected ({selectedAssetIds.size})
                </button>
              )}
              {selectedAssetIds.size > 0 && (
                <button 
                  onClick={handleBulkDeleteAssets}
                  className="bg-error/10 text-error px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-error/20 hover:bg-error/20 transition-all"
                >
                  <span className="material-symbols-outlined text-base">delete_sweep</span> Delete Selected ({selectedAssetIds.size})
                </button>
              )}
            </div>
            <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
              {assets.length} Active Project Assets
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/20">
            <div className="p-4 border-b border-outline-variant/20 bg-surface-container">
              <h2 className="font-bold text-sm uppercase tracking-widest text-primary">Fleet & Equipment Ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-surface-container-high/50 text-[10px] uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <input type="checkbox" className="rounded" checked={selectedAssetIds.size === assets.length} onChange={() => {
                        if (selectedAssetIds.size === assets.length) setSelectedAssetIds(new Set())
                        else setSelectedAssetIds(new Set(assets.map(a => a.assetId)))
                      }} />
                    </th>
                    <th className="px-6 py-4">Asset ID</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Position</th>
                    <th className="px-6 py-4">Calibration Due</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-sm">
                  {assets.map(a => {
                    const stat = checkCalibrationStatus(a.calibrationDueDate)
                    return (
                      <tr key={a.assetId} className={`hover:bg-surface-container-high transition-colors group ${selectedAssetIds.has(a.assetId) ? 'bg-primary/5' : ''}`}>
                        <td className="px-6 py-4">
                          <input type="checkbox" className="rounded" checked={selectedAssetIds.has(a.assetId)} onChange={() => toggleAssetSelection(a.assetId)} />
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold">{a.assetId}</td>
                        <td className="px-6 py-4">
                           {editingAssetId === a.assetId ? (
                            <input 
                              type="text" 
                              className="bg-surface-container-highest border border-primary/20 rounded px-2 py-1 text-sm focus:outline-none w-full"
                              value={editAssetForm.assetType || ''}
                              onChange={e => setEditAssetForm({...editAssetForm, assetType: e.target.value})}
                            />
                          ) : (
                            <span className="font-bold text-primary">{a.assetType}</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                           {editingAssetId === a.assetId ? (
                            <input 
                              type="text" 
                              className="bg-surface-container-highest border border-primary/20 rounded px-2 py-1 text-sm focus:outline-none w-full"
                              value={editAssetForm.modelNumber || ''}
                              onChange={e => setEditAssetForm({...editAssetForm, modelNumber: e.target.value})}
                            />
                          ) : (
                            <span className="text-xs font-mono">{a.modelNumber}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {editingAssetId === a.assetId ? (
                             <select 
                              className="bg-surface-container-highest border border-primary/20 rounded px-2 py-1 text-xs focus:outline-none w-full"
                              value={editAssetForm.calibrationStatus || ''}
                              onChange={e => setEditAssetForm({...editAssetForm, calibrationStatus: e.target.value})}
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="N/A">N/A</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider 
                              ${stat.status === 'ok' ? 'bg-tertiary/20 text-tertiary' : 
                                stat.status === 'expired' ? 'bg-error/20 text-error' : 
                                'bg-secondary/20 text-secondary'}`}>
                              {stat.text}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                           {editingAssetId === a.assetId ? (
                            <div className="relative group/search">
                              <select 
                                className="bg-surface-container-highest border border-primary/20 rounded px-2 py-1 text-xs focus:outline-none w-full"
                                value={editAssetForm.currentPosition || 'Idle'}
                                onChange={e => setEditAssetForm({...editAssetForm, currentPosition: e.target.value})}
                              >
                                <option value="Idle">Idle (Offline)</option>
                                <optgroup label="Project Points">
                                  {allSitePoints.map(p => (
                                    <option key={p.id} value={p.id}>{p.id} - {p.section}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${a.currentPosition === 'Idle' ? 'bg-outline-variant' : 'bg-secondary animate-pulse'}`}></span>
                              <span className={`font-mono text-xs ${a.currentPosition === 'Idle' ? 'text-on-surface-variant' : 'text-secondary font-bold'}`}>
                                {a.currentPosition || 'Idle'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                           {editingAssetId === a.assetId ? (
                            <input 
                              type="date" 
                              className="bg-surface-container-highest border border-primary/20 rounded px-2 py-1 text-xs focus:outline-none w-full"
                              value={editAssetForm.calibrationDueDate || ''}
                              onChange={e => setEditAssetForm({...editAssetForm, calibrationDueDate: e.target.value})}
                            />
                          ) : (
                            <span className="font-mono text-xs text-on-surface-variant">{a.calibrationDueDate || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {editingAssetId === a.assetId ? (
                              <button onClick={() => {
                                updateAsset(a.assetId, editAssetForm)
                                setEditingAssetId(null)
                              }} className="text-secondary font-bold text-xs uppercase hover:underline">Save</button>
                            ) : (
                              <>
                                <button onClick={() => { setEditingAssetId(a.assetId); setEditAssetForm(a); }} className="text-primary font-bold text-xs uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                                <button onClick={() => handleDeleteAsset(a.assetId)} className="text-error font-bold text-xs uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddPersonnelModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-container-low w-full max-w-lg rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col scale-in duration-300">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container">
              <div>
                <h2 className="text-xl font-headline font-bold text-primary">Onboard Personnel</h2>
                <p className="text-xs text-on-surface-variant">Add new staff to the project roster.</p>
              </div>
              <button onClick={() => setIsAddPersonnelModalOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                 <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Full Name</label>
                  <input type="text" value={newPersonnelForm.name} onChange={e => setNewPersonnelForm({...newPersonnelForm, name: e.target.value})} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none shadow-inner" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Staff ID</label>
                  <input type="text" value={newPersonnelForm.id} onChange={e => setNewPersonnelForm({...newPersonnelForm, id: e.target.value})} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none shadow-inner" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Designation</label>
                  <input type="text" value={newPersonnelForm.designation} onChange={e => setNewPersonnelForm({...newPersonnelForm, designation: e.target.value})} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none shadow-inner" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Location</label>
                  <input type="text" value={newPersonnelForm.location} onChange={e => setNewPersonnelForm({...newPersonnelForm, location: e.target.value})} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none shadow-inner" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container flex justify-end gap-3">
              <button onClick={() => setIsAddPersonnelModalOpen(false)} className="px-6 py-2 rounded-xl text-xs font-bold uppercase border border-outline-variant/30 hover:bg-surface-container-highest">Cancel</button>
              <button disabled={!newPersonnelForm.name || !newPersonnelForm.id} onClick={handleAddPersonnel} className="px-8 py-2 rounded-xl text-xs font-bold uppercase bg-primary text-on-primary shadow-xl">Complete Hire</button>
            </div>
          </div>
        </div>
      )}

      {isAddAssetModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-surface-container-low w-full max-w-lg rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col scale-in duration-300">
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container">
              <div>
                <h2 className="text-xl font-headline font-bold text-secondary">Register New Asset</h2>
                <p className="text-xs text-on-surface-variant">Add new equipment to the project fleet.</p>
              </div>
              <button onClick={() => setIsAddAssetModalOpen(false)} className="text-on-surface-variant hover:text-secondary transition-colors">
                 <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Asset ID</label>
                  <input type="text" value={newAssetForm.assetId} onChange={e => setNewAssetForm({...newAssetForm, assetId: e.target.value})} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none shadow-inner" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Type</label>
                  <input type="text" value={newAssetForm.assetType} onChange={e => setNewAssetForm({...newAssetForm, assetType: e.target.value})} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none shadow-inner" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-2 tracking-widest">Calibration Due Date</label>
                <input type="date" value={newAssetForm.calibrationDueDate || ''} onChange={e => setNewAssetForm({...newAssetForm, calibrationDueDate: e.target.value})} className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:outline-none shadow-inner" />
              </div>
            </div>
            <div className="p-6 border-t border-outline-variant/20 bg-surface-container flex justify-end gap-3">
              <button onClick={() => setIsAddAssetModalOpen(false)} className="px-6 py-2 rounded-xl text-xs font-bold uppercase border border-outline-variant/30 hover:bg-surface-container-highest">Cancel</button>
              <button disabled={!newAssetForm.assetId} onClick={handleAddAsset} className="px-8 py-2 rounded-xl text-xs font-bold uppercase bg-secondary text-on-secondary shadow-xl">Register Asset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
