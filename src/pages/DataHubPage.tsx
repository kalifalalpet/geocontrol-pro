import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { allSitePoints } from '../data/sampleData'
import { useProjects } from '../context/ProjectContext'
import { AGSParser } from '../utils/AGSParser'
import { BoreholeLog, LithologyLayer, SPTDataPoint } from '../types/enterprise'
import SiceBoreholeLog from '../components/SiceBoreholeLog'

export default function DataHubPage() {
  const navigate = useNavigate()
  const { activeProject, addBoreholeLog, boreholeLogs } = useProjects()
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'ai' | 'survey' | 'sice'>('sice')

  // --- AI TAB STATES ---
  const [selectedSection, setSelectedSection] = useState('Section 1')
  const [selectedType, setSelectedType] = useState('BH')
  const [selectedPointId, setSelectedPointId] = useState('')
  const [proposedDepth, setProposedDepth] = useState<number | null>(null)
  const [actualDepth, setActualDepth] = useState<string>('')
  const [dragActive, setDragActive] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'success'>('idle')
  const [processingLogs, setProcessingLogs] = useState<string[]>([])

  // --- SURVEY TAB STATES ---
  const [surveyFilter, setSurveyFilter] = useState('all')
  const [surveyTypeFilter, setSurveyTypeFilter] = useState('all')
  const [surveySearch, setSurveySearch] = useState('')
  const [, setForceTrigger] = useState(0)

  // --- SICE TAB STATES ---
  const [isDraggingSice, setIsDraggingSice] = useState(false)
  const [extractedLogs, setExtractedLogs] = useState<Partial<BoreholeLog>[]>([])
  const [selectedLog, setSelectedLog] = useState<BoreholeLog | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const [editingLog, setEditingLog] = useState<Partial<BoreholeLog> | null>(null)

  // Filtering for AI tab
  const filteredPoints = allSitePoints.filter(p => p.type === selectedType && (selectedSection === 'all' || p.section === selectedSection))
  
  useEffect(() => {
    if (filteredPoints.length > 0 && !filteredPoints.find(p => p.id === selectedPointId)) {
      setSelectedPointId(filteredPoints[0].id)
    }
  }, [selectedType, selectedSection, filteredPoints, selectedPointId])

  useEffect(() => {
    const pt = allSitePoints.find(p => p.id === selectedPointId)
    if (pt) {
      setProposedDepth(pt.targetDepth)
      setActualDepth(pt.targetDepth.toString())
    }
  }, [selectedPointId])

  // --- SHARED UTILS ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  // --- AI TAB LOGIC ---
  const simulateProcessing = () => {
    setUploadState('processing')
    setProcessingLogs([])
    const logs = [
      "Analyzing PDF Layout & Metadata...",
      "Extracting Tabular Log Data...",
      "Parsing Lithology Classifications...",
      "Mapping Raw Sensor Displacements...",
      "Reconciling Depth Discrepancies...",
      "A.I. Confidence Check Passed (98%).",
      "Injecting Data into Visualizer Core..."
    ]
    let step = 0;
    const interval = setInterval(() => {
      if (step < logs.length) {
        setProcessingLogs(prev => [...prev, logs[step]])
        step++
      } else {
        clearInterval(interval)
        setUploadState('success')
        setTimeout(() => { navigate(`/project/${activeProject?.id}/logs?ids=${selectedPointId}`) }, 1500)
      }
    }, 800)
  }

  const handleAIDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files?.[0]?.name.toLowerCase().endsWith('.pdf')) simulateProcessing()
    else alert("Please upload a PDF Log Report.")
  }

  const downloadOriginalData = () => {
    const pt = allSitePoints.find(p => p.id === selectedPointId)
    if (pt) {
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet([pt])
      XLSX.utils.book_append_sheet(wb, ws, "Current_Point_Data")
      XLSX.writeFile(wb, `${selectedPointId}_extract.xlsx`)
    }
  }

  // --- SURVEY TAB LOGIC ---
  const handleStatusChange = (id: string, newStatus: 'marked' | 'unmarked' | 'cancelled') => {
    const pt = allSitePoints.find(p => p.id === id)
    if (pt) {
      if (newStatus === 'marked' && (!pt.actualEasting || !pt.actualNorthing || !pt.elevation)) {
        alert(`Action Denied: ${id} cannot be set to "Marked" without Actual Coordinates.`)
        return
      }
      pt.surveyStatus = newStatus
      setForceTrigger(t => t + 1)
    }
  }

  const handleSurveyCoordChange = (id: string, field: string, value: string) => {
    const pt = allSitePoints.find(p => p.id === id) as any
    if (pt) {
      pt[field] = parseFloat(value) || 0
      setForceTrigger((t: number) => t + 1)
    }
  }

  const handleSurveyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split("\n")
      for (let i = 1; i < lines.length; i++) {
        const [id, eCoord, nCoord, elev] = lines[i].split(",").map(s => s.trim())
        if (!id) continue
        const pt = allSitePoints.find(p => p.id === id)
        if (pt) {
          if (eCoord) pt.actualEasting = parseFloat(eCoord)
          if (nCoord) pt.actualNorthing = parseFloat(nCoord)
          if (elev) pt.elevation = parseFloat(elev)
        }
      }
      setForceTrigger((t: number) => t + 1)
      alert("Survey data updated.")
    }
    reader.readAsText(file)
  }

  const surveyList = allSitePoints.filter(p => {
    if (surveyFilter !== 'all' && p.surveyStatus !== surveyFilter) return false
    if (surveyTypeFilter !== 'all' && p.type !== surveyTypeFilter) return false
    if (surveySearch && !p.id.toLowerCase().includes(surveySearch.toLowerCase())) return false
    return true
  })

  // --- SICE TAB LOGIC ---
  const handleSiceFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const logs = AGSParser.parse(content)
      if (logs.length > 0) {
        setExtractedLogs(logs)
        setShowValidation(true)
      } else {
        alert("No valid AGS/CSV data found in file.")
      }
    }
    reader.readAsText(file)
  }

  const onSiceDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDraggingSice(false)
    const file = e.dataTransfer.files[0]
    if (file) handleSiceFile(file)
  }, [])

  const confirmSiceUpload = (log: Partial<BoreholeLog>) => {
    if (!log.boreholeId || !activeProject) return
    
    // Construct final log with mandatory fields
    const finalLog: BoreholeLog = {
      ...log,
      id: `${activeProject.id}_${log.boreholeId}_${Date.now()}`, // Ensure unique ID
      projectId: activeProject.id,
      projectName: activeProject.name,
      location: log.location || { easting: 0, northing: 0, elevation: 0 },
      lithology: log.lithology || [],
      sptResults: log.sptResults || [],
      totalDepth: log.totalDepth || 0,
      method: log.method || 'Unknown'
    } as BoreholeLog

    addBoreholeLog(finalLog)
    
    // Remove from extraction list
    setExtractedLogs(prev => {
      const remaining = prev.filter(l => l.boreholeId !== log.boreholeId)
      if (remaining.length === 0) setShowValidation(false)
      return remaining
    })
    
    setEditingLog(null)
    // Auto-select the newly added log for visualization!
    setSelectedLog(finalLog)
    console.log('[DataHub] Borehole log confirmed and selected:', finalLog.boreholeId)
  }

  const updateEditingLog = (field: string, value: any) => {
    if (!editingLog) return
    setEditingLog({ ...editingLog, [field]: value })
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background custom-scrollbar text-white">
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-headline font-extrabold flex items-center gap-3 sm:gap-4">
          <span className="material-symbols-outlined text-2xl sm:text-4xl text-primary">hub</span>
          Data Intelligence Hub
        </h1>
        <p className="text-[10px] sm:text-sm text-on-primary-container/60 mt-2 uppercase tracking-widest font-bold">
          {activeProject?.name} — Unified Subsurface Data Management
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 sm:mb-10 border-b border-white/5 pb-4 sm:pb-6">
        {[
          { id: 'sice', label: 'Geotechnical Engine', icon: 'settings_suggest', color: 'primary' },
          { id: 'survey', label: 'Survey Progress', icon: 'radar', color: 'secondary' },
          { id: 'ai', label: 'A.I. Extractor', icon: 'auto_fix_high', color: 'tertiary' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 sm:gap-3 ${
              activeTab === tab.id 
              ? `bg-${tab.color} text-white shadow-lg shadow-${tab.color}/20` 
              : 'bg-surface-container hover:bg-white/5 text-on-primary-container/60'
            }`}
          >
            <span className="material-symbols-outlined text-base sm:text-lg">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* --- SICE TAB CONTENT --- */}
      {activeTab === 'sice' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
           <div className="xl:col-span-1 space-y-8">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDraggingSice(true) }}
                onDragLeave={() => setIsDraggingSice(false)}
                onDrop={onSiceDrop}
                className={`relative h-64 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center group ${
                  isDraggingSice ? 'border-primary bg-primary/5' : 'border-white/5 hover:border-primary/20 hover:bg-white/5'
                }`}
              >
                <input type="file" accept=".ags,.csv,.txt" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleSiceFile(e.target.files[0])} />
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 text-primary">
                  <span className="material-symbols-outlined text-3xl">upload_file</span>
                </div>
                <h4 className="text-sm font-bold mb-2">Upload AGS / CSV Data</h4>
                <p className="text-[10px] text-on-primary-container/40 uppercase tracking-widest leading-relaxed">
                  Extracts Boreholes, Coordinates, <br /> Lithology and SPT automatically
                </p>
              </div>

              <div className="glass-panel rounded-3xl border border-white/5 p-8">
                <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-6">Master Borehole Logs</h4>
                <div className="space-y-3">
                  {boreholeLogs.filter(l => l.projectId === activeProject?.id).map(log => (
                    <div key={log.id} onClick={() => setSelectedLog(log)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedLog?.id === log.id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-transparent text-on-primary-container/60 hover:bg-white/10'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold font-mono">{log.boreholeId}</span>
                        <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">{log.totalDepth}m</span>
                      </div>
                      <div className="text-[9px] opacity-40 uppercase tracking-tighter">Method: {log.method}</div>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      setExtractedLogs([{ boreholeId: 'NEW-BH', location: { easting: 0, northing: 0, elevation: 0 }, lithology: [], sptResults: [] }])
                      setShowValidation(true)
                    }}
                    className="w-full mt-4 py-3 rounded-xl border border-dashed border-white/10 text-[10px] uppercase font-bold text-on-primary-container/40 hover:text-white hover:border-white/20 transition-all"
                  >
                    + Add New Log Manually
                  </button>
                </div>
              </div>
           </div>

           <div className="xl:col-span-2 space-y-8">
              {showValidation && (
                <div className="rounded-3xl border border-primary/20 p-4 sm:p-6 overflow-hidden" style={{ background: 'rgba(91,155,248,.04)' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider">AGS Data Verification</h4>
                      <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Review extracted data → Edit → Save to project</p>
                    </div>
                    <button onClick={() => setShowValidation(false)} className="text-white/20 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>

                  <div className="space-y-6">
                    {extractedLogs.map((log, i) => (
                      <div key={i} className="rounded-2xl border border-white/5 p-4 sm:p-6 space-y-5" style={{ background: '#161c27' }}>
                        
                        {/* Project Metadata (extracted from PROJ group) */}
                        {log.projectName && (
                          <div className="flex flex-wrap gap-3 p-3 rounded-xl border border-white/5" style={{ background: 'rgba(91,155,248,.06)' }}>
                            <div className="flex items-center gap-2 text-[10px]">
                              <span className="material-symbols-outlined text-primary text-sm">folder</span>
                              <span className="font-bold text-primary">{log.projectId}</span>
                            </div>
                            <div className="text-[10px] opacity-60">{log.projectName}</div>
                            {log.projectLocation && <div className="text-[10px] opacity-40">📍 {log.projectLocation}</div>}
                            {log.projectClient && <div className="text-[10px] opacity-40">Client: {log.projectClient}</div>}
                          </div>
                        )}

                        {/* Core Fields */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                          <div>
                            <label className="text-[8px] font-bold opacity-40 uppercase mb-1 block tracking-widest">BH ID (Link to Project)</label>
                            <select 
                              className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                              value={log.boreholeId || ''}
                              onChange={(e) => {
                                const selectedId = e.target.value
                                const pt = allSitePoints.find(p => p.id === selectedId)
                                const newLogs = [...extractedLogs]
                                newLogs[i] = { 
                                  ...newLogs[i], 
                                  boreholeId: selectedId,
                                  // Auto-fill coordinates from project if available
                                  location: pt ? {
                                    easting: pt.actualEasting || pt.easting,
                                    northing: pt.actualNorthing || pt.northing,
                                    elevation: pt.elevation || 0
                                  } : newLogs[i].location
                                }
                                setExtractedLogs(newLogs)
                              }}
                            >
                              <option value="">Select ID...</option>
                              {allSitePoints.filter(p => p.type === 'BH').map(p => (
                                <option key={p.id} value={p.id}>{p.id}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[8px] font-bold opacity-40 uppercase mb-1 block tracking-widest">Easting</label>
                            <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                              value={log.location?.easting || ''} 
                              onChange={(e) => {
                                const newLogs = [...extractedLogs]
                                newLogs[i] = { ...newLogs[i], location: { ...newLogs[i].location!, easting: parseFloat(e.target.value) || 0 } }
                                setExtractedLogs(newLogs)
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-bold opacity-40 uppercase mb-1 block tracking-widest">Northing</label>
                            <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                              value={log.location?.northing || ''}
                              onChange={(e) => {
                                const newLogs = [...extractedLogs]
                                newLogs[i] = { ...newLogs[i], location: { ...newLogs[i].location!, northing: parseFloat(e.target.value) || 0 } }
                                setExtractedLogs(newLogs)
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-bold opacity-40 uppercase mb-1 block tracking-widest">Elevation</label>
                            <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                              value={log.location?.elevation || ''}
                              onChange={(e) => {
                                const newLogs = [...extractedLogs]
                                newLogs[i] = { ...newLogs[i], location: { ...newLogs[i].location!, elevation: parseFloat(e.target.value) || 0 } }
                                setExtractedLogs(newLogs)
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-bold opacity-40 uppercase mb-1 block tracking-widest">Depth (m)</label>
                            <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                              value={log.totalDepth || ''}
                              onChange={(e) => {
                                const newLogs = [...extractedLogs]
                                newLogs[i] = { ...newLogs[i], totalDepth: parseFloat(e.target.value) || 0 }
                                setExtractedLogs(newLogs)
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[8px] font-bold opacity-40 uppercase mb-1 block tracking-widest">Method</label>
                            <input className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none"
                              value={log.method || ''}
                              onChange={(e) => {
                                const newLogs = [...extractedLogs]
                                newLogs[i] = { ...newLogs[i], method: e.target.value }
                                setExtractedLogs(newLogs)
                              }}
                            />
                          </div>
                        </div>

                        {/* Summary + Assign */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 flex-1" style={{ background: 'rgba(255,255,255,.03)' }}>
                            <span className="material-symbols-outlined text-tertiary text-sm">inventory</span>
                            <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
                              {log.lithology?.length || 0} Strata · {log.sptResults?.length || 0} SPT · {log.drilledDate || 'No date'}
                            </span>
                          </div>
                          <button 
                            onClick={() => confirmSiceUpload(log)}
                            className="px-6 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all whitespace-nowrap shrink-0"
                          >
                            ✓ Save & Visualize
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {selectedLog ? <SiceBoreholeLog log={selectedLog} /> : (
                <div className="h-[600px] rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center p-12 bg-surface-container/30">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white/20"><span className="material-symbols-outlined text-4xl">analytics</span></div>
                  <h4 className="text-lg font-bold mb-2">No visualization selected</h4>
                  <p className="text-xs text-on-primary-container/40 max-w-xs uppercase tracking-widest font-bold">Select a borehole log or upload an AGS file.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* --- SURVEY TAB CONTENT --- */}
      {activeTab === 'survey' && (
        <div className="bg-surface-container-low rounded-3xl border border-white/5 shadow-2xl flex flex-col h-[75vh] overflow-hidden">
           <div className="p-8 flex flex-col h-full min-h-0">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-3"><span className="material-symbols-outlined text-secondary">radar</span> Survey Progress Matrix</h2>
                  <p className="text-[10px] text-on-primary-container/40 uppercase tracking-widest font-bold mt-1">Live Coordination with Site Marking Teams</p>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => {}} className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/5 transition-all">Download Template</button>
                   <label className="bg-secondary text-white px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-lg">
                      Upload Actuals (CSV)
                      <input type="file" className="hidden" accept=".csv" onChange={handleSurveyUpload} />
                   </label>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                 <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">search</span>
                    <input value={surveySearch} onChange={e => setSurveySearch(e.target.value)} placeholder="Search Point ID..." className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:ring-1 focus:ring-secondary focus:outline-none" />
                 </div>
                 <select value={surveyFilter} onChange={e => setSurveyFilter(e.target.value)} className="bg-surface-container-highest border border-white/5 text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl focus:outline-none focus:border-secondary">
                    <option value="all">All Statuses</option>
                    <option value="unmarked">Unmarked</option>
                    <option value="marked">Marked</option>
                    <option value="cancelled">Cancelled</option>
                 </select>
              </div>

              <div className="flex-1 overflow-auto rounded-2xl border border-white/5 bg-black/20 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface-container-high z-10 border-b border-white/10">
                    <tr className="text-[9px] uppercase tracking-[0.2em] font-bold text-on-primary-container/40">
                      <th className="p-4">Point ID</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">Proposed (E, N)</th>
                      <th className="p-4 text-secondary">Actual E</th>
                      <th className="p-4 text-secondary">Actual N</th>
                      <th className="p-4">Elev. (m)</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-mono">
                    {surveyList.map((pt) => (
                      <tr key={pt.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-primary">{pt.id}</td>
                        <td className="p-4 opacity-40">{pt.type}</td>
                        <td className="p-4 opacity-40 leading-tight">{pt.easting.toFixed(3)},<br/>{pt.northing.toFixed(3)}</td>
                        <td className="p-4"><input className="bg-surface-container-high border border-white/5 rounded px-2 py-1 w-24 focus:outline-none focus:border-secondary font-bold text-secondary" value={pt.actualEasting || ''} onChange={e => handleSurveyCoordChange(pt.id, 'actualEasting', e.target.value)} /></td>
                        <td className="p-4"><input className="bg-surface-container-high border border-white/5 rounded px-2 py-1 w-24 focus:outline-none focus:border-secondary font-bold text-secondary" value={pt.actualNorthing || ''} onChange={e => handleSurveyCoordChange(pt.id, 'actualNorthing', e.target.value)} /></td>
                        <td className="p-4"><input className="bg-surface-container-high border border-white/5 rounded px-2 py-1 w-16 focus:outline-none focus:border-primary font-bold text-primary" value={pt.elevation || ''} onChange={e => handleSurveyCoordChange(pt.id, 'elevation', e.target.value)} /></td>
                        <td className="p-4 text-center">
                          <select value={pt.surveyStatus} onChange={e => handleStatusChange(pt.id, e.target.value as any)} className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border transition-all ${pt.surveyStatus === 'marked' ? 'bg-secondary/20 border-secondary text-secondary' : pt.surveyStatus === 'cancelled' ? 'bg-error/20 border-error text-error' : 'bg-white/5 border-white/10 text-white/40'}`}>
                             <option value="unmarked">UNM</option>
                             <option value="marked">MRK</option>
                             <option value="cancelled">CAN</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {/* --- AI TAB CONTENT --- */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
           <div className="bg-surface-container-low rounded-3xl border border-white/5 overflow-hidden relative p-8 shadow-xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-tertiary"></div>
              <h2 className="text-xl font-bold flex items-center gap-3 mb-8"><span className="material-symbols-outlined text-tertiary">auto_fix_high</span> Legacy PDF Reconstruction</h2>
              
              <div className="space-y-6">
                <div>
                   <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Target Point ID</label>
                   <select value={selectedPointId} onChange={e => setSelectedPointId(e.target.value)} className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-tertiary">
                      {filteredPoints.map(p => <option key={p.id} value={p.id}>{p.id} ({p.section})</option>)}
                   </select>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-12 transition-all ${dragActive ? 'border-tertiary bg-tertiary/5 scale-[1.02]' : 'border-white/5 bg-black/20 hover:border-tertiary/40'}`}
                  onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleAIDrop}
                >
                  <span className="material-symbols-outlined text-4xl text-tertiary mb-4">picture_as_pdf</span>
                  <p className="text-xs font-bold uppercase tracking-widest text-center mb-6 opacity-40">Drag PDF Log for {selectedPointId} here</p>
                  <label className="bg-tertiary text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-tighter cursor-pointer hover:brightness-110 active:scale-95 transition-all">Browse PDF Logs</label>
                </div>
              </div>
           </div>

           <div className="flex flex-col gap-8">
              <div className="bg-surface-container-low rounded-3xl border border-white/5 p-8 relative overflow-hidden flex-1 shadow-xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4"><span className="material-symbols-outlined text-secondary">database</span> Record Archive</h3>
                <p className="text-xs opacity-40 mb-6 leading-relaxed">Download currently synchronized geotechnical parameters for {selectedPointId} to XLSX before performing an override.</p>
                <button onClick={downloadOriginalData} className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-xs font-bold uppercase tracking-widest transition-all">Download Original Profile</button>
              </div>

              <div className="bg-surface-container-low rounded-3xl border border-white/5 p-8 relative overflow-hidden shadow-xl">
                 <div className="absolute top-0 left-0 w-full h-1 bg-error"></div>
                 <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-error"><span className="material-symbols-outlined">gavel</span> Compliance & Audit</h3>
                 <div className="p-4 bg-error/10 border border-error/20 rounded-2xl">
                    <p className="text-[10px] font-bold leading-relaxed">System logs all depth overrides. Any deviation from the proposed +-{0.5}m threshold triggers an automatic inspector notification.</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  )
}
