import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { allSitePoints } from '../data/sampleData'

export default function DataHubPage() {
  const navigate = useNavigate()
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'ai' | 'survey'>('ai')

  // Extract Stats
  const [extractScope, setExtractScope] = useState('all')
  const [extractFormat, setExtractFormat] = useState('excel')
  
  // Update Flow States
  const [selectedSection, setSelectedSection] = useState('Section 1')
  const [selectedType, setSelectedType] = useState('BH')
  const [selectedPointId, setSelectedPointId] = useState('')
  const [proposedDepth, setProposedDepth] = useState<number | null>(null)
  const [actualDepth, setActualDepth] = useState<string>('')
  
  // File Upload & AI Simulation States
  const [dragActive, setDragActive] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'success'>('idle')
  const [processingLogs, setProcessingLogs] = useState<string[]>([])

  // Available points based on type + section filter
  const filteredPoints = allSitePoints.filter(p => p.type === selectedType && (selectedSection === 'all' || p.section === selectedSection))
  
  useEffect(() => {
    // Reset selection if list changes
    if (filteredPoints.length > 0 && !filteredPoints.find(p => p.id === selectedPointId)) {
      setSelectedPointId(filteredPoints[0].id)
    }
  }, [selectedType, selectedSection, filteredPoints])

  useEffect(() => {
    // Auto-populate depth when point changes
    const pt = allSitePoints.find(p => p.id === selectedPointId)
    if (pt) {
      setProposedDepth(pt.targetDepth)
      setActualDepth(pt.targetDepth.toString())
    }
  }, [selectedPointId])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

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
        setTimeout(() => {
          navigate(`/logs?ids=${selectedPointId}`)
        }, 1500)
      }
    }, 800)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.name.toLowerCase().endsWith('.pdf')) {
        simulateProcessing()
      } else {
        alert("Please upload a PDF Log Report.")
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (file.name.toLowerCase().endsWith('.pdf')) {
        simulateProcessing()
      } else {
        alert("Please upload a PDF Log Report.")
      }
    }
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

  const [surveyFilter, setSurveyFilter] = useState('all')
  const [surveyTypeFilter, setSurveyTypeFilter] = useState('all')
  const [surveySearch, setSurveySearch] = useState('')

  // Because allSitePoints is a mutable array imported from sampleData, we need a local state trigger to force re-render when we mutate it.
  const [, setForceTrigger] = useState(0)

  const handleStatusChange = (id: string, newStatus: 'marked'|'unmarked'|'cancelled') => {
    const pt = allSitePoints.find(p => p.id === id)
    if (pt) {
      pt.surveyStatus = newStatus
      setForceTrigger(t => t + 1)
    }
  }

  const handleElevationChange = (id: string, newElevation: string) => {
    const pt = allSitePoints.find(p => p.id === id)
    if (pt) {
      pt.elevation = parseFloat(newElevation) || 0
      setForceTrigger(t => t + 1)
    }
  }

  const surveyList = allSitePoints.filter(p => {
    if (surveyFilter !== 'all' && p.surveyStatus !== surveyFilter) return false
    if (surveyTypeFilter !== 'all' && p.type !== surveyTypeFilter) return false
    if (surveySearch && !p.id.toLowerCase().includes(surveySearch.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-surface text-on-surface flex flex-col">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold text-primary tracking-tight flex items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-tertiary">document_scanner</span>
          A.I. Extractor & Data Hub
        </h1>
        <p className="text-sm text-on-surface-variant max-w-2xl mt-2">
          Update existing project map points by uploading raw PDF reports, or manage the Master Survey tracking matrix for the 306 core points.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-outline-variant/10 pb-4">
        <button 
          onClick={() => setActiveTab('ai')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'bg-tertiary text-on-tertiary shadow-[0_4px_14px_rgba(78,222,163,0.3)]' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}
        >
          <span className="material-symbols-outlined text-lg">auto_fix_high</span> A.I. Extraction Flow
        </button>
        <button 
          onClick={() => setActiveTab('survey')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'survey' ? 'bg-primary text-on-primary shadow-[0_4px_14px_rgba(190,198,224,0.3)]' : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'}`}
        >
          <span className="material-symbols-outlined text-lg">radar</span> Survey
        </button>
      </div>

      {activeTab === 'ai' && (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* COLUMN 1: Update Existing Workflow */}
        <div className="bg-surface-container-low rounded-2xl relative overflow-hidden border border-outline-variant/20 shadow-xl flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-tertiary to-transparent"></div>
          
          <div className="p-8">
            <h2 className="text-xl font-headline font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">auto_fix_high</span>
              Update Existing Point Data
            </h2>

            {/* Selection Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <div>
                <label className="block text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-2">Project Section</label>
                <select 
                  value={selectedSection} 
                  onChange={e => setSelectedSection(e.target.value)}
                  className="w-full bg-surface-container-high text-primary text-sm border border-outline-variant/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-tertiary transition-colors"
                >
                  <option value="all">Global Search (All Sites)</option>
                  <option value="Section 1">Section 1</option>
                  <option value="Section 2">Section 2</option>
                  <option value="Section 3A">Section 3A</option>
                  <option value="Section 3B">Section 3B</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-2">Location Type</label>
                <select 
                  value={selectedType} 
                  onChange={e => setSelectedType(e.target.value)}
                  className="w-full bg-surface-container-high text-primary text-sm border border-outline-variant/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-tertiary transition-colors"
                >
                  <option value="BH">Borehole (BH)</option>
                  <option value="CPT">CPT Profiling</option>
                  <option value="PLT">Plate Load Test (PLT)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-2">Select Target ID (Existing)</label>
                <select 
                  value={selectedPointId} 
                  onChange={e => setSelectedPointId(e.target.value)}
                  className="w-full bg-surface-container-high text-primary font-bold text-sm border border-outline-variant/20 rounded-lg px-3 py-2.5 focus:outline-none focus:border-tertiary transition-colors"
                >
                  {filteredPoints.length > 0 ? filteredPoints.map(p => (
                    <option key={p.id} value={p.id}>{p.id} ({p.section})</option>
                  )) : (
                    <option value="" disabled>No points found for criteria</option>
                  )}
                </select>
                <div className="mt-2 text-[10px] text-error flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[12px]">info</span> You cannot create new points. You can only reconcile and update existing mapped points.
                </div>
              </div>
            </div>

            {/* Depth Reconciliation */}
            <div className="bg-surface-container-highest/20 rounded-xl p-6 border border-outline-variant/10 mb-8">
              <h3 className="text-sm font-bold text-primary font-headline uppercase tracking-wider mb-4 border-b border-outline-variant/10 pb-2">Depth Reconciliation</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] text-on-primary-container uppercase tracking-widest mb-2">Proposed Depth (m)</label>
                  <div className="w-full bg-surface-container-highest/50 text-on-surface-variant text-sm border border-outline-variant/10 rounded-lg px-3 py-2 cursor-not-allowed font-mono">
                    {proposedDepth ?? 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-tertiary font-bold uppercase tracking-widest mb-2">Actual Drilled Depth (m)</label>
                  <input 
                    type="number" 
                    value={actualDepth}
                    onChange={e => setActualDepth(e.target.value)}
                    step="0.1"
                    className="w-full bg-surface-container-high text-primary font-bold text-sm border border-outline-variant/20 rounded-lg px-3 py-2 focus:outline-none focus:border-tertiary transition-colors font-mono"
                    placeholder="Override depth..."
                  />
                </div>
              </div>
              {parseFloat(actualDepth) !== proposedDepth && proposedDepth !== null && (
                <div className="mt-3 text-[10px] text-secondary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">warning</span> Discrepancy detected. Actual depth will override master plan up upload.
                </div>
              )}
            </div>

            {/* Smart Upload Zone */}
            {uploadState === 'idle' ? (
              <div 
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all ${dragActive ? 'border-tertiary bg-tertiary/5 scale-[1.02]' : 'border-outline-variant/20 bg-surface-container/30 hover:border-tertiary/50 hover:bg-surface-container/50'}`}
                onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
              >
                <div className={`p-4 rounded-full mb-3 ${dragActive ? 'bg-tertiary text-on-tertiary shadow-[0_0_15px_rgba(78,222,163,0.4)]' : 'bg-surface-container-high text-primary'}`}>
                  <span className="material-symbols-outlined text-3xl">picture_as_pdf</span>
                </div>
                <h3 className="text-sm font-bold text-primary mb-1">Drag {selectedPointId}.pdf here</h3>
                <p className="text-xs text-on-surface-variant text-center mb-6">
                  System will automatically extract table strata, graphs, and sensors using local A.I. inference.
                </p>
                <label className="bg-tertiary/10 text-tertiary border border-tertiary/20 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-tertiary/20 transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">upload</span> Browse PDF
                  <input type="file" className="hidden" accept=".pdf" onChange={handleFileSelect}/>
                </label>
              </div>
            ) : uploadState === 'processing' ? (
              <div className="bg-surface-container-highest/20 rounded-xl p-8 border border-outline-variant/10 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-tertiary animate-pulse"></div>
                <span className="material-symbols-outlined text-5xl text-tertiary animate-spin mb-4" style={{ animationDuration: '3s' }}>hourglass_empty</span>
                <h3 className="text-lg font-bold text-primary mb-4">A.I. Engine Processing...</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar text-left bg-surface p-4 rounded-lg font-mono text-[10px] text-on-surface-variant">
                  {processingLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-center animate-in fade-in slide-in-from-bottom-2">
                      <span className="text-tertiary">❯</span> {log}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-tertiary/10 rounded-xl p-8 border border-tertiary/30 text-center animate-in zoom-in-95">
                <span className="material-symbols-outlined text-5xl text-tertiary mb-2">check_circle</span>
                <h3 className="text-lg font-bold text-tertiary font-headline mb-1">Extraction Successful</h3>
                <p className="text-xs text-on-surface-variant mb-4">Data updated. Opening Visualizer automatically...</p>
              </div>
            )}

          </div>
        </div>

        {/* COLUMN 2: Legacy Extraction (Optional tools) */}
        <div className="flex flex-col gap-8">
          
          <div className="bg-surface-container-low rounded-2xl relative overflow-hidden border border-outline-variant/20 shadow-xl p-8">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-secondary to-transparent"></div>
            <h2 className="text-xl font-headline font-bold text-primary mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">database</span>
              Manual Record Download
            </h2>
            <p className="text-xs text-on-surface-variant mb-6">
              Need to backup or view the actual raw parameters of {selectedPointId} before you override it with the new PDF? Download the existing record below.
            </p>
            <button 
              onClick={downloadOriginalData}
              className="w-full bg-surface-container-high hover:bg-surface-container-highest text-primary font-bold py-3 rounded-xl border border-outline-variant/20 transition-all text-sm uppercase tracking-wider flex justify-center items-center gap-2"
            >
              <span className="material-symbols-outlined">download</span> Download Original XLSX
            </button>
          </div>

          <div className="bg-surface-container-low rounded-2xl relative overflow-hidden border border-outline-variant/20 shadow-xl p-8 flex-1">
             <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-error to-transparent"></div>
             <h2 className="text-xl font-headline font-bold text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-error">gavel</span>
              Compliance Logging
            </h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Our automated system cross-references all new PDF uploads against the Master Geotechnical Plan. Any detected depth disparities are automatically flagged in the Project ERP.
            </p>
            <div className="p-4 bg-error/10 border-l-4 border-error rounded-r-lg">
              <p className="text-xs font-bold text-error">Warning: Audit Trails are permanently recorded. Ensure PDF uploaded is stamped and approved by Lead Inspector.</p>
            </div>
          </div>

        </div>
      </div>
      )}

      {activeTab === 'survey' && (
        <div className="bg-surface-container-low rounded-2xl relative border border-outline-variant/20 shadow-xl flex flex-col min-h-0 h-[75vh]">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-transparent"></div>
          
          <div className="p-8 flex flex-col h-full min-h-0">
            <h2 className="text-xl font-headline font-bold text-primary mb-2 flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-primary">edit_location</span>
              Survey Progress
            </h2>
            <p className="text-sm text-on-surface-variant mb-6 shrink-0">
              Track and update physical site demarcations. Any status changed here instantly updates the Map Visualizer layer.
            </p>

            <div className="flex items-center gap-4 mb-6 shrink-0">
              <input 
                type="text" 
                placeholder="Search Point ID (e.g. BH-020)..."
                value={surveySearch}
                onChange={e => setSurveySearch(e.target.value)}
                className="bg-surface-container-high text-primary text-sm border border-outline-variant/20 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors flex-1"
              />
              <select 
                value={surveyTypeFilter}
                onChange={e => setSurveyTypeFilter(e.target.value)}
                className="bg-surface-container-high text-primary text-sm border border-outline-variant/20 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors cursor-pointer w-[150px]"
              >
                <option value="all">All Types</option>
                <option value="BH">Boreholes (BH)</option>
                <option value="CPT">CPTs</option>
                <option value="PLT">PLTs</option>
              </select>
              <select 
                value={surveyFilter}
                onChange={e => setSurveyFilter(e.target.value)}
                className="bg-surface-container-high text-primary text-sm border border-outline-variant/20 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-colors cursor-pointer w-[200px]"
              >
                <option value="all">All Statuses ({allSitePoints.length})</option>
                <option value="unmarked">Unmarked ({allSitePoints.filter(p=>p.surveyStatus==='unmarked').length})</option>
                <option value="marked">Marked ({allSitePoints.filter(p=>p.surveyStatus==='marked').length})</option>
                <option value="cancelled">Cancelled ({allSitePoints.filter(p=>p.surveyStatus==='cancelled').length})</option>
              </select>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest relative custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-high z-10 border-b border-outline-variant/20">
                  <tr>
                    <th className="p-3 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant font-label">Point ID</th>
                    <th className="p-3 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant font-label">Type</th>
                    <th className="p-3 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant font-label">Section</th>
                    <th className="p-3 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant font-label">Coordinate (E, N)</th>
                    <th className="p-3 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant font-label">Elevation (m)</th>
                    <th className="p-3 text-[10px] uppercase font-bold tracking-widest text-on-surface-variant font-label">Survey Status</th>
                  </tr>
                </thead>
                <tbody>
                  {surveyList.map((pt, i) => (
                    <tr key={pt.id} className="border-b border-outline-variant/5 text-sm hover:bg-surface-container/30 transition-colors">
                      <td className="p-3 font-bold text-primary">{pt.id}</td>
                      <td className="p-3 text-on-surface-variant font-mono">{pt.type}</td>
                      <td className="p-3 text-on-surface-variant">{pt.section}</td>
                      <td className="p-3 text-on-surface-variant font-mono text-[11px]">{pt.easting.toFixed(1)}, {pt.northing.toFixed(1)}</td>
                      <td className="p-3">
                        <input 
                          type="number" 
                          step="0.01"
                          value={pt.elevation || ''}
                          onChange={(e) => handleElevationChange(pt.id, e.target.value)}
                          placeholder="0.0"
                          className="w-20 bg-surface-container-high text-primary font-mono text-xs px-2 py-1 rounded border border-outline-variant/20 focus:outline-none focus:border-tertiary transition-colors"
                        />
                      </td>
                      <td className="p-3">
                        <select 
                          value={pt.surveyStatus}
                          onChange={(e) => handleStatusChange(pt.id, e.target.value as any)}
                          className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded outline-none border border-transparent transition-colors cursor-pointer ${
                            pt.surveyStatus === 'marked' ? 'bg-tertiary/20 text-tertiary hover:border-tertiary/40' :
                            pt.surveyStatus === 'cancelled' ? 'bg-error/20 text-error hover:border-error/40' :
                            'bg-surface-container-highest text-on-surface-variant hover:border-outline-variant/40'
                          }`}
                        >
                          <option value="unmarked">UNMARKED</option>
                          <option value="marked">MARKED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {surveyList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant text-sm">No points match the filter criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
