import { useState, useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, GeoJSON, Tooltip } from 'react-leaflet'
import { Link, useParams } from 'react-router-dom'
import L from 'leaflet'
import { allSitePoints, boreholePoints, cptPoints, pltPoints, mapCenter, kpiData, soilStrata, sections, sectionPolygons, type SitePoint } from '../data/sampleData'
import { useResource } from '../context/ResourceContext'
import { useProjects } from '../context/ProjectContext'
import ExportCenter from '../components/ExportCenter'
import { exportToCSV, exportToPDF } from '../utils/exportUtils'

// ═══ COMMON STYLES ═══
const labelStyle = `
  .custom-marker-label {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    font-weight: 800;
    font-family: 'Inter', sans-serif;
    text-shadow: 0 0 3px #000, 0 1px 2px #000;
    transition: all 0.2s ease;
  }
  .custom-marker-label::before { display: none !important; }
  
  .label-color-BH { color: #bec6e0; }
  .label-color-CPT { color: #ffb95f; }
  .label-color-PLT { color: #4edea3; }

  /* Zoom-based scaling */
  .zoom-12 .custom-marker-label,
  .zoom-13 .custom-marker-label {
    display: none !important;
  }
  .zoom-14 .custom-marker-label {
    font-size: 7px;
    opacity: 0.7;
    margin-top: -5px;
  }
  .zoom-15 .custom-marker-label {
    font-size: 9px;
    opacity: 0.9;
    margin-top: -8px;
  }
  .zoom-16 .custom-marker-label,
  .zoom-17 .custom-marker-label,
  .zoom-18 .custom-marker-label {
    font-size: 11px;
    opacity: 1;
    margin-top: -10px;
  }
`

// ═══ DISTINCT MARKER ICONS ═══
function getSurveyColor(status: 'marked' | 'unmarked' | 'cancelled', defaultColor: string, surveyMode: boolean) {
  if (!surveyMode) return defaultColor
  if (status === 'marked') return '#4edea3'
  if (status === 'cancelled') return '#ff5449'
  return '#475569' // unmarked
}

function createBHIcon(isSelected = false, surveyStatus: 'marked'|'unmarked'|'cancelled' = 'unmarked', surveyMode = false) {
  const size = isSelected ? 16 : 10
  const color = getSurveyColor(surveyStatus, isSelected ? '#ffb95f' : '#bec6e0', surveyMode)
  const glow = isSelected ? `filter: drop-shadow(0 0 8px ${color});` : `filter: drop-shadow(0 0 3px ${color}50);`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="${color}" stroke="#0b1326" stroke-width="1.5" style="${glow}"/></svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [size, size], iconAnchor: [size/2, size/2] })
}

function createCPTIcon(isSelected = false, surveyStatus: 'marked'|'unmarked'|'cancelled' = 'unmarked', surveyMode = false) {
  const size = isSelected ? 18 : 12
  const color = getSurveyColor(surveyStatus, isSelected ? '#ffb95f' : '#ffb95f', surveyMode)
  const opacity = isSelected ? '1' : '0.85'
  const glow = isSelected ? `filter: drop-shadow(0 0 8px ${color});` : `filter: drop-shadow(0 0 3px ${color}50);`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16" style="${glow}"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="${color}" stroke="#0b1326" stroke-width="1.5" opacity="${opacity}" transform="rotate(45 8 8)"/></svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [size, size], iconAnchor: [size/2, size/2] })
}

function createPLTIcon(isSelected = false, surveyStatus: 'marked'|'unmarked'|'cancelled' = 'unmarked', surveyMode = false) {
  const size = isSelected ? 18 : 12
  const color = getSurveyColor(surveyStatus, isSelected ? '#ffb95f' : '#4edea3', surveyMode)
  const opacity = isSelected ? '1' : '0.85'
  const glow = isSelected ? `filter: drop-shadow(0 0 8px ${color});` : `filter: drop-shadow(0 0 3px ${color}50);`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16" style="${glow}"><polygon points="8,1 15,6 13,15 3,15 1,6" fill="${color}" stroke="#0b1326" stroke-width="1.5" opacity="${opacity}"/></svg>`
  return L.divIcon({ html: svg, className: '', iconSize: [size, size], iconAnchor: [size/2, size/2] })
}

function getIcon(point: SitePoint, isSelected: boolean, surveyMode: boolean) {
  if (point.type === 'CPT') return createCPTIcon(isSelected, point.surveyStatus, surveyMode)
  if (point.type === 'PLT') return createPLTIcon(isSelected, point.surveyStatus, surveyMode)
  return createBHIcon(isSelected, point.surveyStatus, surveyMode)
}

function createAssetIcon(type: string) {
  let color = '#ffb95f' // Default orange
  let path = ''
  
  if (type === 'Drilling Rig') {
    color = '#ff5449' // Red for Rigs
    path = "M8 1 L14 15 H2 Z M8 3 V13 M5 15 L8 7 L11 15" // Simple Rig/Derrick
  } else if (type === 'JCB') {
    color = '#ffb949' // Yellow/Orange
    path = "M2 14 H6 V10 H10 V14 H14 V8 H10 L8 5 H4 L2 8 Z" // Digger shape
  } else if (type === 'CPT' || type === 'PLT') {
    color = '#4edea3' // Green for instruments
    path = "M8 2 L14 8 L8 14 L2 8 Z M8 5 V11 M5 8 H11" // Diamond probe
  } else if (type === 'Water Tanker' || type === 'Water Pump') {
    color = '#4796ff' // Blue for water
    path = "M4 6 H12 V14 H4 Z M4 10 H14 M8 2 C8 2 12 5 12 8 C12 10 10 12 8 12 C6 12 4 10 4 8 C4 5 8 2 8 2 Z" // Drop/Tank
  } else {
    path = "M8 2 A6 6 0 1 0 8 14 A6 6 0 1 0 8 2" // Circle
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="filter: drop-shadow(0 0 4px ${color}80);">
      <circle cx="12" cy="12" r="10" fill="#0b1326" stroke="${color}" stroke-width="1.5" opacity="0.9"/>
      <g transform="translate(4,4) scale(0.65)" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${path}" />
      </g>
    </svg>`
  
  return L.divIcon({ 
    html: svg, 
    className: 'asset-marker-icon', 
    iconSize: [24, 24], 
    iconAnchor: [12, 12] 
  })
}

// Auto-fit map to bounds
function FitBounds({ points }: { points: SitePoint[] }) {
  const map = useMap()
  useMemo(() => {
    if (points.length) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    }
  }, [points, map])
  return null
}

function ZoomListener({ onZoom }: { onZoom: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  })
  useEffect(() => {
    onZoom(map.getZoom())
  }, [map, onZoom])
  return null
}

function MapClickHandler({ clearSelection }: { clearSelection: () => void }) {
  useMapEvents({
    click: clearSelection
  })
  return null
}

export default function DashboardPage() {
  const { assets } = useResource()
  const { activeProject } = useProjects()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showLayers, setShowLayers] = useState({ BH: true, CPT: true, PLT: true, assets: true })
  
  // Advanced Settings Toggles
  const [activeSections, setActiveSections] = useState<Set<string>>(new Set(sections)) // Default to all sections
  const [basemap, setBasemap] = useState<'dark' | 'satellite'>('dark')
  const [showLabels, setShowLabels] = useState(false)
  const [coordSystem, setCoordSystem] = useState<'UTM37N' | 'WGS84'>('UTM37N')
  const [zoomLevel, setZoomLevel] = useState(14)
  const [surveyMode, setSurveyMode] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const toggleSection = (section: string) => {
    const newSecs = new Set(activeSections)
    if (newSecs.has(section)) newSecs.delete(section)
    else newSecs.add(section)
    setActiveSections(newSecs)
  }

  const handleMarkerClick = (e: any, id: string) => {
    const isMulti = e.originalEvent.shiftKey || e.originalEvent.ctrlKey || e.originalEvent.metaKey
    if (isMulti) {
      const newSet = new Set(selectedIds)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      setSelectedIds(newSet)
    } else {
      setSelectedIds(new Set([id]))
    }
  }

  const selected = useMemo(() => {
    if (selectedIds.size === 1) return allSitePoints.find(b => b.id === Array.from(selectedIds)[0])
    return null
  }, [selectedIds])

  // Points filtering logic moved to useMemo(counts)

  const counts = useMemo(() => {
    const isQiddiya = activeProject?.id === 'qiddiya-coastal'
    const pts = isQiddiya ? allSitePoints : []
    
    const bh = pts.filter(p => p.type === 'BH')
    const cpt = pts.filter(p => p.type === 'CPT')
    const plt = pts.filter(p => p.type === 'PLT')
    
    return {
      points: pts,
      bh: bh.length,
      bhCompleted: bh.filter(p => p.status === 'completed').length,
      cpt: cpt.length,
      cptCompleted: cpt.filter(p => p.status === 'completed').length,
      plt: plt.length,
      pltCompleted: plt.filter(p => p.status === 'completed').length,
      metersPlanned: activeProject?.metersPlanned || 0,
      metersCompleted: activeProject?.metersCompleted || pts.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.targetDepth, 0)
    }
  }, [activeProject])

  // Points for Map/Sidebar
  const [filteredPoints, setFilteredPoints] = useState<SitePoint[]>(counts.points)
  useEffect(() => {
    setFilteredPoints(counts.points)
  }, [counts.points])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* KPI Header */}
      <section className="grid grid-cols-5 gap-3 px-6 py-4 bg-surface-container-lowest shrink-0">
        {/* Drilling Progress (First) */}
        <div className="bg-surface-container-high p-4 rounded-xl border-t border-white/5 flex flex-col justify-between">
          <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-primary-container mb-1">Drilling Progress (M)</p>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-baseline">
               <h2 className="text-2xl font-headline font-bold text-secondary">{counts.metersCompleted.toLocaleString()}m</h2>
               <span className="text-[10px] font-bold text-on-primary-container/40">/{counts.metersPlanned > 0 ? counts.metersPlanned.toLocaleString() : '---'}m</span>
            </div>
            <div className="mt-1 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-secondary shadow-[0_0_8px_rgba(255,185,95,0.4)] transition-all duration-1000" style={{ width: `${counts.metersPlanned > 0 ? Math.min(100, (counts.metersCompleted / counts.metersPlanned) * 100) : 0}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-high p-4 rounded-xl border-t border-white/5 flex flex-col justify-between">
          <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-primary-container mb-1">Boreholes</p>
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-headline font-bold text-primary">{counts.bh}</h2>
              <span className="text-[10px] text-on-primary-container">{activeSections.size} sections</span>
            </div>
            <p className="text-[10px] mt-1 space-x-1">
              <span className="font-bold text-tertiary">{counts.bhCompleted} completed</span>
              <span className="text-on-surface-variant font-medium">•</span>
              <span className="font-bold text-on-surface-variant">{counts.bh - counts.bhCompleted} remaining</span>
            </p>
          </div>
        </div>

        <div className="bg-surface-container-high p-4 rounded-xl border-t border-white/5 flex flex-col justify-between">
          <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-primary-container mb-1">CPT Tests</p>
          <div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl font-headline font-bold text-secondary">{counts.cpt}</h2>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            </div>
            <p className="text-[10px] mt-1 space-x-1">
              <span className="font-bold text-tertiary">{counts.cptCompleted} completed</span>
              <span className="text-on-surface-variant font-medium">•</span>
              <span className="font-bold text-on-surface-variant">{counts.cpt - counts.cptCompleted} remaining</span>
            </p>
          </div>
        </div>

        <div className="bg-surface-container-high p-4 rounded-xl border-t border-white/5 flex flex-col justify-between">
          <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-primary-container mb-1">PLT Tests</p>
          <div>
            <h2 className="text-2xl font-headline font-bold text-tertiary">{counts.plt}</h2>
            <p className="text-[10px] mt-1 space-x-1">
              <span className="font-bold text-tertiary">{counts.pltCompleted} completed</span>
              <span className="text-on-surface-variant font-medium">•</span>
              <span className="font-bold text-on-surface-variant">{counts.plt - counts.pltCompleted} remaining</span>
            </p>
          </div>
        </div>

        {/* Project Budget (Last) */}
        <div className="bg-surface-container-high p-4 rounded-xl border-t border-white/5 flex flex-col justify-between">
          <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-primary-container mb-1">Project Budget (SAR)</p>
          <div>
            <h2 className="text-2xl font-headline font-bold text-primary">{(activeProject?.budgetSAR || 0).toLocaleString()}</h2>
            <p className="text-[10px] mt-1 space-x-1">
              <span className="font-bold text-tertiary">{(activeProject?.spentSAR || 0).toLocaleString()} spent</span>
              <span className="text-on-surface-variant font-medium">•</span>
              <span className="font-bold text-on-surface-variant">{((activeProject?.budgetSAR || 0) - (activeProject?.spentSAR || 0)).toLocaleString()} remaining</span>
            </p>
          </div>
        </div>
      </section>

      {/* Map + Sidebar */}
      <div className={`flex-1 flex overflow-hidden relative min-h-0 zoom-${Math.floor(zoomLevel)}`}>
        <style>{labelStyle}</style>
        {/* Map */}
        <div className="flex-1 relative min-h-0">
          <MapContainer center={mapCenter} zoom={14} className="h-full w-full" zoomControl={false}>
            <ZoomListener onZoom={setZoomLevel} />
            <MapClickHandler clearSelection={() => setSelectedIds(new Set())} />
            {basemap === 'dark' ? (
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            ) : (
              <TileLayer
                attribution='&copy; Esri &mdash; ESRI World Imagery'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            )}
            
            <FitBounds points={filteredPoints} />

            {/* Render GeoJSON Polygons for active sections */}
            {Array.from(activeSections).map(sec => 
              sectionPolygons[sec] ? <GeoJSON key={`poly-${sec}`} data={sectionPolygons[sec]} style={{ fillColor: '#ffb95f', fillOpacity: 0.1, color: '#ffb95f', weight: 1.5, dashArray: '4 4' }} /> : null
            )}

            {filteredPoints.map(pt => (
              <Marker
                key={pt.id}
                position={[pt.lat, pt.lng]}
                icon={getIcon(pt, selectedIds.has(pt.id), surveyMode)}
                eventHandlers={{ click: (e: any) => handleMarkerClick(e, pt.id) }}
              >
                {showLabels && (
                  <Tooltip permanent direction="top" className={`custom-marker-label label-color-${pt.type}`}>
                    {pt.id}
                  </Tooltip>
                )}
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif', color: '#131b2e', minWidth: 120 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{pt.id}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>Type: {pt.type} • Section {pt.section}</div>
                    <div style={{ fontSize: 11 }}>Depth: {pt.targetDepth}m</div>
                    <div style={{ fontSize: 10, color: '#798098', marginTop: 4 }}>Tests: {pt.tests.map(t => `${t.count}x ${t.name}`).join(', ')}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render Active Assets */}
            {showLayers.assets && assets.filter(a => a.currentPosition && a.currentPosition !== 'Idle').map(a => {
              const pt = allSitePoints.find(p => p.id === a.currentPosition)
              if (!pt) return null
              return (
                <Marker
                  key={`asset-${a.assetId}`}
                  position={[pt.lat, pt.lng]}
                  icon={createAssetIcon(a.assetType)}
                  zIndexOffset={1000} // Ensure assets are above borehole points
                >
                  <Tooltip direction="bottom" offset={[0, 10]} className="custom-marker-label">
                    <span style={{ color: '#ffb95f' }}>{a.assetId} ({a.assetType})</span>
                  </Tooltip>
                  <Popup>
                    <div style={{ fontFamily: 'Inter, sans-serif', color: '#131b2e', minWidth: 150 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#ff5449' }}>{a.assetType}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, margin: '2px 0' }}>{a.assetId}</div>
                      <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>Model: {a.modelNumber}</div>
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>Current Assignment</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0b1326' }}>{pt.id} (Sec {pt.section})</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>

          {/* Map Layers Panel */}
          <div className="absolute bottom-6 left-6 glass-panel rounded-xl p-4 flex flex-col gap-2 border border-white/5 z-[1000] min-w-[200px]">
            <div className="flex items-center justify-between gap-4 mb-2 border-b border-white/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-tighter text-on-primary-container">Map Controls</span>
              <span className="material-symbols-outlined text-xs text-on-primary-container">tune</span>
            </div>

            {/* Advanced Settings */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => setBasemap(b => b === 'dark' ? 'satellite' : 'dark')}
                className="flex flex-col items-center justify-center p-2 rounded bg-surface-container-highest hover:bg-surface-bright transition-colors border border-outline-variant/10 text-primary"
              >
                <span className="material-symbols-outlined text-lg mb-1">{basemap === 'dark' ? 'satellite_alt' : 'map'}</span>
                <span className="text-[9px] font-bold uppercase">{basemap === 'dark' ? 'Satellite' : 'Dark Map'}</span>
              </button>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`flex flex-col items-center justify-center p-2 rounded transition-colors border border-outline-variant/10 ${showLabels ? 'bg-secondary text-on-secondary border-none' : 'bg-surface-container-highest hover:bg-surface-bright text-primary'}`}
              >
                <span className="material-symbols-outlined text-lg mb-1">{showLabels ? 'label' : 'label_off'}</span>
                <span className="text-[9px] font-bold uppercase">Marker IDs</span>
              </button>
            </div>

            <button
              onClick={() => setShowExport(!showExport)}
              className={`w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border transition-all duration-300 font-bold uppercase tracking-widest text-[10px] ${showExport ? 'bg-primary text-white border-primary shadow-[0_0_15px_rgba(100,161,238,0.3)]' : 'bg-surface-container-highest text-primary border-outline-variant/10 hover:bg-surface-bright shadow-sm'}`}
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export Site Data
            </button>

            <div className="border-t border-white/5 my-1"></div>

            {/* Type Toggles */}
            <button
              onClick={() => setShowLayers(p => ({ ...p, BH: !p.BH }))}
              className={`flex items-center gap-3 px-3 py-1.5 rounded text-xs font-medium transition-colors ${showLayers.BH ? 'bg-surface-container-highest text-primary' : 'text-on-primary-container/50'}`}
            >
              <svg width="10" height="10" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill={showLayers.BH ? '#bec6e0' : '#45464d'}/></svg>
              Boreholes ({counts.bh})
            </button>
            <button
              onClick={() => setShowLayers(p => ({ ...p, CPT: !p.CPT }))}
              className={`flex items-center gap-3 px-3 py-1.5 rounded text-xs font-medium transition-colors ${showLayers.CPT ? 'bg-surface-container-highest text-secondary' : 'text-on-primary-container/50'}`}
            >
              <svg width="10" height="10" viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="1" fill={showLayers.CPT ? '#ffb95f' : '#45464d'} transform="rotate(45 8 8)"/></svg>
              CPT Points ({counts.cpt})
            </button>
            <button
              onClick={() => setShowLayers(p => ({ ...p, PLT: !p.PLT }))}
              className={`flex items-center gap-3 px-3 py-1.5 rounded text-xs font-medium transition-colors ${showLayers.PLT ? 'bg-surface-container-highest text-tertiary' : 'text-on-primary-container/50'}`}
            >
              <svg width="10" height="10" viewBox="0 0 16 16"><polygon points="8,1 15,6 13,15 3,15 1,6" fill={showLayers.PLT ? '#4edea3' : '#45464d'}/></svg>
              PLT Tests ({counts.plt})
            </button>
            <button
              onClick={() => setShowLayers(p => ({ ...p, assets: !p.assets }))}
              className={`flex items-center gap-3 px-3 py-1.5 rounded text-xs font-medium transition-colors ${showLayers.assets ? 'bg-surface-container-highest text-secondary' : 'text-on-primary-container/50'}`}
            >
              <span className="material-symbols-outlined text-[14px]">local_shipping</span>
              Fleet tracking ({assets.length})
            </button>

            {/* Section Multi-Select */}
            <div className="border-t border-white/5 pt-2 mt-1">
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-on-primary-container">Zones (Multi)</span>
                <button 
                  onClick={() => setActiveSections(activeSections.size === sections.length ? new Set() : new Set(sections))}
                  className="text-[8px] uppercase font-bold text-secondary hover:underline"
                >
                  {activeSections.size === sections.length ? 'Clear All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {sections.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSection(s)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold border transition-colors ${activeSections.has(s) ? 'bg-secondary/20 text-secondary border-secondary/30' : 'bg-surface-container-high text-on-surface-variant border-transparent'}`}
                  >Sec {s}</button>
                ))}
              </div>
            </div>

            {/* Coordinate System Toggle */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Coord System</span>
              <button 
                onClick={() => setCoordSystem(c => c === 'UTM37N' ? 'WGS84' : 'UTM37N')}
                className="px-2 py-1 bg-surface-container-highest rounded text-[10px] font-bold text-tertiary"
              >
                {coordSystem}
              </button>
            </div>

            {/* Survey Tracking Layer */}
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-tertiary/20">
              <span className="text-[10px] text-tertiary uppercase tracking-widest font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">radar</span> Survey Layer
              </span>
              <button 
                onClick={() => setSurveyMode(!surveyMode)}
                className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${surveyMode ? 'bg-tertiary text-on-tertiary shadow-[0_0_8px_rgba(78,222,163,0.3)]' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'}`}
              >
                {surveyMode ? 'ON' : 'OFF'}
              </button>
            </div>
            
          </div>

          {/* Export Center Overlay */}
          {showExport && (
            <div className="absolute bottom-6 left-[250px] z-[2000]">
              <ExportCenter 
                filteredPoints={filteredPoints} 
                activeSections={activeSections} 
                onClose={() => setShowExport(false)} 
              />
            </div>
          )}

          {/* Legend */}
          <div className="absolute top-4 right-4 glass-panel rounded-lg px-4 py-3 border border-white/5 z-[1000] flex items-center gap-5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-on-primary-container">Legend</span>
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#bec6e0"/></svg>
              <span className="text-[10px] text-primary">BH</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="1" fill="#ffb95f" transform="rotate(45 8 8)"/></svg>
              <span className="text-[10px] text-secondary">CPT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 16 16"><polygon points="8,1 15,6 13,15 3,15 1,6" fill="#4edea3"/></svg>
              <span className="text-[10px] text-tertiary">PLT</span>
            </div>
            <span className="text-[10px] text-on-primary-container font-mono">{filteredPoints.length} shown</span>
          </div>
        </div>

        {/* Detail Sidebar - Single Selection */}
        {selectedIds.size === 1 && selected && (
          <aside className="w-[380px] bg-surface-container-low border-l border-outline-variant/10 flex flex-col shadow-2xl z-20 shrink-0 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-headline font-bold text-primary">{selected.id}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      selected.type === 'BH' ? 'text-primary bg-primary/10' :
                      selected.type === 'CPT' ? 'text-secondary bg-secondary/10' :
                      'text-tertiary bg-tertiary/10'
                    }`}>{selected.type}</span>
                    <span className="text-[10px] text-on-primary-container uppercase tracking-widest">Section {selected.section}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedIds(new Set())} className="text-on-primary-container hover:text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-surface-container-high/50 p-4 rounded-xl">
                <div className="space-y-1">
                  <p className="text-[10px] text-on-primary-container uppercase font-bold tracking-tighter">Target Depth</p>
                  <p className="text-lg font-headline font-bold text-secondary">{selected.targetDepth}m</p>
                </div>
                <div className="space-y-1 flex flex-col items-end">
                  <p className="text-[10px] flex items-center gap-1 text-on-primary-container uppercase font-bold tracking-tighter cursor-pointer hover:text-secondary transition-colors select-none"
                     onClick={() => setCoordSystem(c => c === 'UTM37N' ? 'WGS84' : 'UTM37N')}>
                    {coordSystem} <span className="material-symbols-outlined text-[12px]">swap_horiz</span>
                  </p>
                  <div className="text-right">
                    {coordSystem === 'UTM37N' ? (
                      <>
                        <p className="text-[11px] font-mono text-primary font-bold">{selected.easting?.toFixed(4) || '-'} E</p>
                        <p className="text-[11px] font-mono text-primary font-bold">{selected.northing?.toFixed(4) || '-'} N</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] font-mono text-primary font-bold">{selected.lat.toFixed(6)}°N</p>
                        <p className="text-[11px] font-mono text-primary font-bold">{selected.lng.toFixed(6)}°E</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-[10px] text-on-primary-container/40 uppercase font-bold tracking-widest mb-1">Financial Allocation</p>
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold text-white">Estimated Cost</span>
                   <span className="text-sm font-bold text-primary">{(selected.targetDepth * 450).toLocaleString()} SAR</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Tests */}
              <div>
                  <p className="text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-3">Required Tests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tests.map((t: any) => (
                      <span key={t.name} className="px-2 py-0.5 text-[10px] font-bold bg-surface-container-high text-primary rounded border border-outline-variant/20">{t.count}x {t.name}</span>
                    ))}
                  </div>
              </div>

              {/* Soil Strata (for BH only) */}
              {selected.type === 'BH' && (
                <div>
                  <p className="text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-4 flex justify-between">
                    Soil Strata Log
                    <span className="material-symbols-outlined text-[14px]">bar_chart</span>
                  </p>
                  <div className="space-y-1">
                    {soilStrata.filter(s => s.depthFrom < selected.targetDepth).map((layer, i) => (
                      <div key={i} className="flex rounded border border-white/10 group cursor-help transition-colors hover:brightness-125"
                        style={{ height: `${Math.max(36, (Math.min(layer.depthTo, selected.targetDepth) - layer.depthFrom) * 2)}px`, backgroundColor: `${layer.color}40` }}>
                        <div className="w-12 border-r border-white/5 flex items-center justify-center text-[10px] font-mono text-on-surface">{layer.depthFrom}-{Math.min(layer.depthTo, selected.targetDepth)}m</div>
                        <div className="flex-1 px-3 flex flex-col justify-center">
                          <span className="text-[10px] font-bold" style={{ color: '#e2e8f0' }}>{layer.type}</span>
                          <span className="text-[9px] italic" style={{ color: 'rgba(226,232,240,0.5)' }}>{layer.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mini Chart for CPT */}
              {selected.type === 'CPT' && (
                <div>
                  <p className="text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-4">Tip Resistance (qc) MPa</p>
                  <div className="h-24 w-full relative bg-surface-container-highest rounded-lg overflow-hidden border border-white/5">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="qcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#ffb95f" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 380 30" fill="none" stroke="#ffb95f" strokeWidth="2" />
                      <path d="M 0 60 Q 50 20 100 70 T 200 40 T 300 80 T 380 30 V 100 H 0 Z" fill="url(#qcGrad)" />
                    </svg>
                    <div className="absolute bottom-1 right-2 text-[8px] font-mono text-on-primary-container">Preview</div>
                  </div>
                </div>
              )}

              {/* PLT Info */}
              {selected.type === 'PLT' && (
                <div>
                  <p className="text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-4">Plate Load Test Info</p>
                  <div className="bg-surface-container-highest rounded-lg p-4 border border-white/5 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-on-surface-variant uppercase">Plate Diameter</span>
                      <span className="text-xs font-bold text-primary">300 mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-on-surface-variant uppercase">Max Load</span>
                      <span className="text-xs font-bold text-secondary">425 kN</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-on-surface-variant uppercase">Settlement Target</span>
                      <span className="text-xs font-bold text-tertiary">25 mm</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-surface-container-lowest grid grid-cols-1 gap-3 shrink-0">
              <Link to={`/logs?ids=${selected.id}`} className="w-full py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-xs font-bold uppercase tracking-wider text-primary hover:bg-surface-bright transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">visibility</span>
                View Full Data
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => selected && exportToCSV([selected])}
                  className="py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-surface-bright transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">download</span>
                  Export CSV
                </button>
                <button className="py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-surface-bright transition-colors flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-xs">edit_note</span>
                  Report
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* Detail Sidebar - Multi Selection */}
        {selectedIds.size > 1 && (
          <aside className="w-[380px] bg-surface-container-low border-l border-outline-variant/10 flex flex-col shadow-2xl z-20 shrink-0 overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-headline font-bold text-primary">{selectedIds.size} Points Selected</h2>
                  <p className="text-[10px] text-on-primary-container uppercase tracking-widest mt-1">Multi-Selection Mode</p>
                </div>
                <button onClick={() => setSelectedIds(new Set())} className="text-on-primary-container hover:text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="space-y-2">
                {Array.from(selectedIds).map((id: string) => {
                  const p = allSitePoints.find(x => x.id === id)
                  if (!p) return null
                  return (
                    <div key={id} className="flex items-center justify-between p-3 bg-surface-container-highest/50 border border-outline-variant/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          p.type === 'BH' ? 'text-primary bg-primary/10' :
                          p.type === 'CPT' ? 'text-secondary bg-secondary/10' :
                          'text-tertiary bg-tertiary/10'
                        }`}>{p.type}</span>
                        <span className="text-sm font-bold text-primary">{id}</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-mono">{p.section}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-6 bg-surface-container-lowest grid grid-cols-1 gap-3 shrink-0">
              <Link to={`/logs?ids=${Array.from(selectedIds).join(',')}`} className="w-full py-4 bg-secondary text-on-secondary shadow-[0_0_15px_rgba(255,185,95,0.3)] rounded-lg text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">multiline_chart</span>
                View Data in Data Viewer
              </Link>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button 
                  onClick={() => exportToCSV(filteredPoints.filter(p => selectedIds.has(p.id)))}
                  className="py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-surface-bright transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">csv</span> CSV
                </button>
                <button 
                  onClick={() => exportToPDF(filteredPoints.filter(p => selectedIds.has(p.id)))}
                  className="py-3 bg-surface-container-high border border-outline-variant/20 rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-surface-bright transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">picture_as_pdf</span> PDF
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
