import { useState } from 'react'
import { useResource } from '../context/ResourceContext'
import { useProjects } from '../context/ProjectContext'
import { Personnel, Asset } from '../data/resourceData'

export default function MasterResourcePage() {
  const { personnels, assets, addPersonnel, addAsset, deletePersonnel, deleteAsset, updatePersonnel, updateAsset, bulkDeletePersonnel, bulkDeleteAssets } = useResource()
  const { projects } = useProjects()
  const [activeTab, setActiveTab] = useState<'personnel' | 'assets'>('personnel')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Selection State (Isolated per tab)
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<Set<string>>(new Set())
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set())
  
  const selectedIds = activeTab === 'personnel' ? selectedPersonnelIds : selectedAssetIds
  const setSelectedIds = (next: Set<string>) => {
    if (activeTab === 'personnel') setSelectedPersonnelIds(next)
    else setSelectedAssetIds(next)
  }
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newResource, setNewResource] = useState<any>({})

  const getProjectName = (id: string) => {
    return projects.find(p => p.teamIds.includes(id) || p.assetIds.includes(id))?.name || 'Unassigned'
  }

  const filteredPersonnel = personnels.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAssets = assets.filter(a => 
    a.assetId.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.assetType.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const ids = activeTab === 'personnel' ? filteredPersonnel.map(p => p.id) : filteredAssets.map(a => a.assetId)
      setSelectedIds(new Set(ids))
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.size} items?`)) return
    if (activeTab === 'personnel') bulkDeletePersonnel(selectedIds)
    else bulkDeleteAssets(selectedIds)
    setSelectedIds(new Set())
  }

  const handleExport = () => {
    const data = activeTab === 'personnel' 
      ? personnels.filter(p => selectedIds.has(p.id)) 
      : assets.filter(a => selectedIds.has(a.assetId))
    
    const csv = activeTab === 'personnel'
      ? 'ID,Name,Designation,Project\n' + (data as Personnel[]).map(p => `${p.id},${p.name},${p.designation},${getProjectName(p.id)}`).join('\n')
      : 'AssetID,Type,Model,Status,Project\n' + (data as Asset[]).map(a => `${a.assetId},${a.assetType},${a.modelNumber},${a.calibrationStatus},${getProjectName(a.assetId)}`).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `exported_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const startEdit = (item: any) => {
    setEditingId(activeTab === 'personnel' ? item.id : item.assetId)
    setEditForm({ ...item })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const saveEdit = () => {
    if (activeTab === 'personnel') {
      updatePersonnel(editingId!, editForm)
    } else {
      updateAsset(editingId!, editForm)
    }
    cancelEdit()
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'personnel') {
      addPersonnel(newResource)
    } else {
      addAsset(newResource)
    }
    setShowAddModal(false)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background p-12 overflow-hidden">
      <div className="flex items-center justify-between mb-12 shrink-0">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-white tracking-tight">Master Resource Pool</h2>
          <p className="text-on-primary-container/60 text-sm mt-1 uppercase tracking-widest font-bold">Command center for global fleet and team members</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-primary-container/50 text-sm">search</span>
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:ring-1 focus:ring-primary focus:outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => {
              setNewResource(activeTab === 'personnel' ? { id: `P-${Date.now().toString().slice(-4)}`, name: '', designation: '', experienceYears: 1 } : { assetId: `A-${Date.now().toString().slice(-4)}`, assetType: '', modelNumber: '', calibrationStatus: 'Active' })
              setShowAddModal(true)
            }}
            className="flex items-center gap-2 px-6 py-2.5 bg-secondary text-on-secondary text-xs font-bold uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-secondary/20"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add {activeTab === 'personnel' ? 'Personnel' : 'Asset'}
          </button>
        </div>
      </div>

      {/* Tabs & Bulk Actions */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-2 bg-surface-container-high/30 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => { setActiveTab('personnel'); setSelectedIds(new Set()) }}
            className={`px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'personnel' ? 'bg-primary text-white shadow-lg' : 'text-on-primary-container/40 hover:text-white'}`}
          >
            Personnel ({personnels.length})
          </button>
          <button 
            onClick={() => { setActiveTab('assets'); setSelectedIds(new Set()) }}
            className={`px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'assets' ? 'bg-primary text-white shadow-lg' : 'text-on-primary-container/40 hover:text-white'}`}
          >
            Fleet Assets ({assets.length})
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
            <span className="text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest mr-2">{selectedIds.size} Selected</span>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest border border-outline-variant/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-surface-bright transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span> Export
            </button>
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 text-error text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-error/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete</span> Delete
            </button>
          </div>
        )}
      </div>

      {/* Data Table with Scrolling */}
      <div className="glass-panel rounded-2xl border border-white/10 flex flex-col flex-1 overflow-hidden">
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 font-bold bg-surface-container-highest border-b border-white/5 shadow-md">
              <tr>
                <th className="px-6 py-5 w-12">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={
                      activeTab === 'personnel' 
                        ? (filteredPersonnel.length > 0 && filteredPersonnel.every(p => selectedPersonnelIds.has(p.id)))
                        : (filteredAssets.length > 0 && filteredAssets.every(a => selectedAssetIds.has(a.assetId)))
                    }
                    className="w-4 h-4 rounded border-white/10 bg-surface-container-high text-primary focus:ring-primary"
                  />
                </th>
                {activeTab === 'personnel' ? (
                  <>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest">ID</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest">Name</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest">Designation</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest">Project Assignment</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest">Asset ID</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest">Type</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest">Model</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest">Location</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-on-primary-container/50 uppercase tracking-widest text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeTab === 'personnel' ? (
                filteredPersonnel.map(p => (
                  <tr key={p.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.has(p.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-6 py-5">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 rounded border-white/10 bg-surface-container-high text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-primary font-mono">{p.id}</td>
                    <td className="px-8 py-5">
                      {editingId === p.id ? (
                        <input 
                          className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary"
                          value={editForm?.name || ''}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {p.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-white">{p.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      {editingId === p.id ? (
                        <input 
                          className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-on-primary-container focus:outline-none focus:ring-1 focus:ring-primary"
                          value={editForm?.designation || ''}
                          onChange={e => setEditForm({ ...editForm, designation: e.target.value })}
                        />
                      ) : (
                        <span className="text-xs text-on-primary-container/60">{p.designation}</span>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                         <span className={`w-2 h-2 rounded-full ${getProjectName(p.id) !== 'Unassigned' ? 'bg-secondary animate-pulse' : 'bg-white/20'}`}></span>
                         <span className={`text-[10px] font-bold uppercase tracking-widest ${getProjectName(p.id) !== 'Unassigned' ? 'text-secondary' : 'text-on-primary-container/40'}`}>
                           {getProjectName(p.id)}
                         </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {editingId === p.id ? (
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={saveEdit} className="p-1.5 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30 transition-colors">
                             <span className="material-symbols-outlined text-sm">check</span>
                           </button>
                           <button onClick={cancelEdit} className="p-1.5 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors">
                             <span className="material-symbols-outlined text-sm">close</span>
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => startEdit(p)} className="text-on-primary-container/40 hover:text-primary transition-colors">
                             <span className="material-symbols-outlined text-lg">edit</span>
                           </button>
                           <button onClick={() => { if(confirm('Delete?')) deletePersonnel(p.id) }} className="text-on-primary-container/40 hover:text-error transition-colors">
                             <span className="material-symbols-outlined text-lg">delete</span>
                           </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                filteredAssets.map(a => (
                  <tr key={a.assetId} className={`hover:bg-white/5 transition-colors group ${selectedIds.has(a.assetId) ? 'bg-secondary/5' : ''}`}>
                    <td className="px-6 py-5">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(a.assetId)}
                        onChange={() => toggleSelect(a.assetId)}
                        className="w-4 h-4 rounded border-white/10 bg-surface-container-high text-secondary focus:ring-secondary"
                      />
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-secondary font-mono">{a.assetId}</td>
                    <td className="px-8 py-5">
                      {editingId === a.assetId ? (
                        <input 
                          className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                          value={editForm?.assetType || ''}
                          onChange={e => setEditForm({ ...editForm, assetType: e.target.value })}
                        />
                      ) : (
                        <span className="text-xs text-white font-medium">{a.assetType}</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-xs text-on-primary-container/60 font-mono">{a.modelNumber}</td>
                    <td className="px-8 py-5">
                      {editingId === a.assetId ? (
                        <select 
                          className="bg-surface-container border border-outline-variant/30 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                          value={editForm?.calibrationStatus || ''}
                          onChange={e => setEditForm({ ...editForm, calibrationStatus: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Idle">Idle</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                          a.calibrationStatus === 'Active' ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                          a.calibrationStatus === 'Maintenance' ? 'bg-error/10 text-error border border-error/20' :
                          'bg-white/5 text-on-primary-container/40'
                        }`}>
                          {a.calibrationStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-xs text-on-primary-container/40 font-bold uppercase tracking-tighter">{getProjectName(a.assetId)}</td>
                    <td className="px-8 py-5 text-right">
                      {editingId === a.assetId ? (
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={saveEdit} className="p-1.5 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30 transition-colors">
                             <span className="material-symbols-outlined text-sm">check</span>
                           </button>
                           <button onClick={cancelEdit} className="p-1.5 bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors">
                             <span className="material-symbols-outlined text-sm">close</span>
                           </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => startEdit(a)} className="text-on-primary-container/40 hover:text-secondary transition-colors">
                             <span className="material-symbols-outlined text-lg">edit</span>
                           </button>
                           <button onClick={() => { if(confirm('Delete?')) deleteAsset(a.assetId) }} className="text-on-primary-container/40 hover:text-error transition-colors">
                             <span className="material-symbols-outlined text-lg">delete</span>
                           </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {((activeTab === 'personnel' && filteredPersonnel.length === 0) || (activeTab === 'assets' && filteredAssets.length === 0)) && (
            <div className="p-20 text-center">
              <span className="material-symbols-outlined text-6xl text-white/5 mb-4">search_off</span>
              <p className="text-sm font-bold text-on-primary-container/40 uppercase tracking-widest">No resources found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="relative glass-panel bg-surface-container w-full max-w-md rounded-3xl border border-white/10 shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-headline font-bold text-white mb-6">Add New {activeTab === 'personnel' ? 'Personnel' : 'Asset'}</h3>
            <form onSubmit={handleAdd} className="space-y-6">
              {activeTab === 'personnel' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest mb-1.5 ml-1">Personnel ID</label>
                    <input className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      value={newResource.id || ''} onChange={e => setNewResource({ ...newResource, id: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                    <input className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      value={newResource.name || ''} onChange={e => setNewResource({ ...newResource, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest mb-1.5 ml-1">Designation</label>
                    <input className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      value={newResource.designation || ''} onChange={e => setNewResource({ ...newResource, designation: e.target.value })} required />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest mb-1.5 ml-1">Asset ID</label>
                    <input className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                      value={newResource.assetId || ''} onChange={e => setNewResource({ ...newResource, assetId: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest mb-1.5 ml-1">Asset Type</label>
                    <input className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                      value={newResource.assetType || ''} onChange={e => setNewResource({ ...newResource, assetType: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-primary-container/40 uppercase tracking-widest mb-1.5 ml-1">Model Number</label>
                    <input className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-secondary"
                      value={newResource.modelNumber || ''} onChange={e => setNewResource({ ...newResource, modelNumber: e.target.value })} required />
                  </div>
                </>
              )}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="text-xs font-bold text-on-primary-container/60 uppercase">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:brightness-110 shadow-lg shadow-primary/20 transition-all">Create Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
