import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../context/ProjectContext'
import { useFinance } from '../context/FinanceContext'
import { useResource } from '../context/ResourceContext'
import { Project } from '../types/enterprise'

export default function ProjectListPage() {
  const { projects, addProject, setActiveProjectId, updateProject, deleteProject } = useProjects()
  const { treasury, allocateFunds } = useFinance()
  const { assets, personnels } = useResource()
  const navigate = useNavigate()
  
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // New Project Form State
  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    location: '',
    client: '',
    budgetSAR: 0,
    metersPlanned: 0,
    status: 'planned',
    teamIds: [],
    assetIds: [],
    description: ''
  })

  // Edit State
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    const id = newProject.name?.toLowerCase().replace(/\s+/g, '-') || `proj-${Date.now()}`
    const project: Project = {
      ...newProject,
      id,
      coordinates: [21.980665, 38.952141], // Default coordinates
      spentSAR: 0,
      metersCompleted: 0,
      startDate: new Date().toISOString().split('T')[0],
      teamIds: newProject.teamIds || [],
      assetIds: newProject.assetIds || [],
      metersPlanned: newProject.metersPlanned || 0,
    } as Project

    addProject(project)
    if (project.budgetSAR > 0) {
      allocateFunds(project.id, project.budgetSAR, `Initial allocation for ${project.name}`)
    }
    setShowModal(false)
  }

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return
    updateProject(editingProject.id, editingProject)
    setEditingProject(null)
  }

  const handleDeleteProject = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return
    deleteProject(id)
  }

  const selectProject = (id: string) => {
    setActiveProjectId(id)
    navigate(`/project/${id}/map`)
  }

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-background custom-scrollbar">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-white tracking-tight">Project Portfolio</h2>
          <p className="text-on-primary-container/60 text-sm mt-1 uppercase tracking-widest font-bold">Manage and monitor all active sites</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-primary-container/50 text-sm">search</span>
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            New Project
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <p className="text-[10px] font-bold text-on-primary-container/60 uppercase tracking-widest mb-1">Total Projects</p>
          <h3 className="text-2xl font-headline font-bold text-white">{projects.length}</h3>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <p className="text-[10px] font-bold text-on-primary-container/60 uppercase tracking-widest mb-1">Active Sites</p>
          <h3 className="text-2xl font-headline font-bold text-secondary">{projects.filter(p => p.status === 'active').length}</h3>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <p className="text-[10px] font-bold text-on-primary-container/60 uppercase tracking-widest mb-1">Total Portfolio Value</p>
          <h3 className="text-2xl font-headline font-bold text-primary">{(projects.reduce((sum, p) => sum + p.budgetSAR, 0) / 1000000).toFixed(1)}M <span className="text-xs">SAR</span></h3>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5">
          <p className="text-[10px] font-bold text-on-primary-container/60 uppercase tracking-widest mb-1">Treasury Reserve</p>
          <h3 className="text-2xl font-headline font-bold text-tertiary">{(treasury.availableSAR / 1000000).toFixed(1)}M <span className="text-xs">SAR</span></h3>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredProjects.map(project => (
          <div 
            key={project.id}
            onClick={() => selectProject(project.id)}
            className="group relative cursor-pointer"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-secondary rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
            <div className="relative glass-panel bg-surface-container/50 border border-white/10 rounded-2xl p-8 hover:bg-surface-container transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-surface-container-highest rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
                  <span className="material-symbols-outlined text-primary text-2xl">architecture</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingProject(project) }}
                    className="p-1.5 rounded-lg bg-white/5 text-on-primary-container/40 hover:text-primary hover:bg-primary/10 transition-all"
                    title="Edit project"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id, project.name) }}
                    className="p-1.5 rounded-lg bg-white/5 text-on-primary-container/40 hover:text-error hover:bg-error/10 transition-all"
                    title="Delete project"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                    project.status === 'active' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                    project.status === 'completed' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                    'bg-white/5 text-on-primary-container/60 border-white/10'
                  }`}>
                    {project.status}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-headline font-bold text-white mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
              <p className="text-xs text-on-primary-container/60 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {project.location}
              </p>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-primary-container/50">
                  <span>Finance Status</span>
                  <span>{((project.spentSAR / project.budgetSAR) * 100).toFixed(0)}% Utilized</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 shadow-[0_0_10px_rgba(100,161,238,0.5)]" 
                    style={{ width: `${(project.spentSAR / project.budgetSAR) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-xs text-on-primary-container/40">Budget Allocated</span>
                  <span className="text-sm text-primary">{(project.budgetSAR/1000).toLocaleString()}K SAR</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {project.teamIds.slice(0, 3).map((id, i) => (
                      <div key={id} className="w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-surface-container flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                        {id}
                      </div>
                    ))}
                    {project.teamIds.length > 3 && (
                      <div className="w-8 h-8 rounded-full bg-surface-container-low border-2 border-surface-container flex items-center justify-center text-[8px] font-bold text-primary">
                        +{project.teamIds.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-on-primary-container/40">local_shipping</span>
                    <span className="text-[10px] font-bold text-on-primary-container/60">{project.assetIds.length} Assets</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty Placeholder / Add Card */}
        <div 
           onClick={() => setShowModal(true)}
           className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center p-12 transition-all hover:bg-white/5 hover:border-primary/20 cursor-pointer group"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-white/20 text-3xl group-hover:text-primary transition-colors">add</span>
          </div>
          <p className="text-xs font-bold text-on-primary-container/40 uppercase tracking-widest group-hover:text-primary transition-colors">Initiate New Project</p>
        </div>
      </div>

      {/* NEW PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <div className="relative glass-panel bg-surface-container w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5 bg-primary/5">
              <h3 className="text-xl font-headline font-bold text-white">Create New Enterprise Project</h3>
              <p className="text-[10px] text-on-primary-container/60 uppercase font-bold tracking-widest mt-1">Configure site, resources, and treasury allocation</p>
            </div>

            <form onSubmit={handleCreateProject} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Project Name</label>
                  <input required
                    className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                    value={newProject.name}
                    onChange={e => setNewProject({...newProject, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Client Name</label>
                  <input required
                    className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                    value={newProject.client}
                    onChange={e => setNewProject({...newProject, client: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Location Address</label>
                <input required
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="e.g. NEOM Sector 4, Tabuk Region"
                  value={newProject.location}
                  onChange={e => setNewProject({...newProject, location: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Budget (SAR)</label>
                  <input type="number" required
                    className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                    value={newProject.budgetSAR}
                    onChange={e => setNewProject({...newProject, budgetSAR: Number(e.target.value)})}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Planned Meters (m)</label>
                  <input type="number" required
                    className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-secondary focus:outline-none"
                    value={newProject.metersPlanned}
                    onChange={e => setNewProject({...newProject, metersPlanned: Number(e.target.value)})}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Initial Status</label>
                  <select 
                    className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                    value={newProject.status}
                    onChange={e => setNewProject({...newProject, status: e.target.value as any})}
                  >
                    <option value="planned">Planned / Pre-Survey</option>
                    <option value="active">Active Execution</option>
                    <option value="proposal">Drafting Phase</option>
                  </select>
                </div>
              </div>

              {/* Resource Selectors */}
              <div className="pt-6 border-t border-white/5 mt-6">
                <h4 className="text-[10px] text-on-primary-container-variant uppercase font-extrabold tracking-[0.2em] mb-4">Master Resource Allocation</h4>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-[9px] font-bold text-white uppercase tracking-widest bg-white/5 py-1 px-2 inline-block rounded">Fleet Selection ({assets.length})</p>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2">
                        {assets.map(a => (
                          <button key={a.assetId} type="button" 
                            onClick={() => {
                              const ids = new Set(newProject.assetIds)
                              if (ids.has(a.assetId)) ids.delete(a.assetId)
                              else ids.add(a.assetId)
                              setNewProject({...newProject, assetIds: Array.from(ids)})
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${newProject.assetIds?.includes(a.assetId) ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20' : 'bg-surface-container-highest text-on-primary-container/40 border-white/5 hover:border-white/10'}`}
                          >
                            {a.assetId}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[9px] font-bold text-white uppercase tracking-widest bg-white/5 py-1 px-2 inline-block rounded">Project Team ({personnels.length})</p>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2">
                        {personnels.map(p => (
                          <button key={p.id} type="button"
                            onClick={() => {
                              const ids = new Set(newProject.teamIds)
                              if (ids.has(p.id)) ids.delete(p.id)
                              else ids.add(p.id)
                              setNewProject({...newProject, teamIds: Array.from(ids)})
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${newProject.teamIds?.includes(p.id) ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-surface-container-highest text-on-primary-container/40 border-white/5 hover:border-white/10'}`}
                          >
                            {p.id}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-8">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-xs font-bold text-on-primary-container/60 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  Confirm & Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setEditingProject(null)}></div>
          <div className="relative glass-panel bg-surface-container w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-white/5 bg-secondary/5">
              <h3 className="text-xl font-headline font-bold text-white">Edit Enterprise Project</h3>
              <p className="text-[10px] text-on-primary-container/60 uppercase font-bold tracking-widest mt-1">Modify site configuration and resources</p>
            </div>

            <form onSubmit={handleUpdateProject} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Project Name</label>
                  <input required
                    className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                    value={editingProject.name}
                    onChange={e => setEditingProject({...editingProject, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Client Name</label>
                  <input required
                    className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                    value={editingProject.client}
                    onChange={e => setEditingProject({...editingProject, client: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Location Address</label>
                <input required
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                  value={editingProject.location}
                  onChange={e => setEditingProject({...editingProject, location: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Budget (SAR)</label>
                    <input type="number" required
                      className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                      value={editingProject.budgetSAR}
                      onChange={e => setEditingProject({...editingProject, budgetSAR: Number(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-secondary uppercase tracking-widest mb-1.5 ml-1">Target Meters (m)</label>
                    <input type="number" required
                      className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-secondary focus:outline-none"
                      value={editingProject.metersPlanned}
                      onChange={e => setEditingProject({...editingProject, metersPlanned: Number(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">Status</label>
                    <select 
                      className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-primary focus:outline-none"
                      value={editingProject.status}
                      onChange={e => setEditingProject({...editingProject, status: e.target.value as any})}
                    >
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                 </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <h4 className="text-[10px] text-on-primary-container-variant uppercase font-extrabold tracking-[0.2em] mb-4">Master Resource Allocation</h4>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <p className="text-[9px] font-bold text-white uppercase tracking-widest bg-white/5 py-1 px-2 inline-block rounded">Fleet Selection ({assets.length})</p>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2">
                        {assets.map(a => (
                          <button key={a.assetId} type="button" 
                            onClick={() => {
                              const ids = new Set(editingProject.assetIds)
                              if (ids.has(a.assetId)) ids.delete(a.assetId)
                              else ids.add(a.assetId)
                              setEditingProject({...editingProject, assetIds: Array.from(ids)})
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${editingProject.assetIds?.includes(a.assetId) ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/20' : 'bg-surface-container-highest text-on-primary-container/40 border-white/5 hover:border-white/10'}`}
                          >
                            {a.assetId}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div className="space-y-4">
                      <p className="text-[9px] font-bold text-white uppercase tracking-widest bg-white/5 py-1 px-2 inline-block rounded">Project Team ({personnels.length})</p>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 flex flex-wrap gap-2">
                        {personnels.map(p => (
                          <button key={p.id} type="button"
                            onClick={() => {
                              const ids = new Set(editingProject.teamIds)
                              if (ids.has(p.id)) ids.delete(p.id)
                              else ids.add(p.id)
                              setEditingProject({...editingProject, teamIds: Array.from(ids)})
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${editingProject.teamIds?.includes(p.id) ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-surface-container-highest text-on-primary-container/40 border-white/5 hover:border-white/10'}`}
                          >
                            {p.id}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-8">
                <button type="button" onClick={() => setEditingProject(null)} className="px-6 py-2.5 text-xs font-bold text-on-primary-container/60 uppercase">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-secondary text-white text-xs font-bold uppercase rounded-xl transition-colors hover:brightness-110">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
