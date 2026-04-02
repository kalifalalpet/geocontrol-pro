import { useState } from 'react'
import { SitePoint, sectionPolygons } from '../data/sampleData'
import { exportToCSV, exportToPDF, exportToDXF, exportToKMZ } from '../utils/exportUtils'

interface ExportCenterProps {
  filteredPoints: SitePoint[]
  activeSections: Set<string>
  onClose: () => void
}

export default function ExportCenter({ filteredPoints, activeSections, onClose }: ExportCenterProps) {
  const [exporting, setExporting] = useState(false)

  const activePolys = Array.from(activeSections).reduce((acc, sec) => {
    if (sectionPolygons[sec]) acc[sec] = sectionPolygons[sec]
    return acc
  }, {} as Record<string, any>)

  const handleExport = async (format: 'CSV' | 'PDF' | 'DXF' | 'KMZ') => {
    setExporting(true)
    try {
      if (format === 'CSV') exportToCSV(filteredPoints)
      else if (format === 'PDF') exportToPDF(filteredPoints)
      else if (format === 'DXF') exportToDXF(filteredPoints)
      else if (format === 'KMZ') await exportToKMZ(filteredPoints, activePolys)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl w-[320px] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Export Center</h3>
          <p className="text-[10px] text-on-primary-container/60 mt-0.5">{filteredPoints.length} points visible</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors">
          <span className="material-symbols-outlined text-sm text-on-primary-container">close</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button 
          onClick={() => handleExport('CSV')}
          disabled={exporting}
          className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 hover:bg-secondary/10 hover:border-secondary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
            <span className="material-symbols-outlined text-secondary">csv</span>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Excel / CSV</p>
            <p className="text-[9px] text-on-surface-variant font-medium">Site data spreadsheet</p>
          </div>
        </button>

        <button 
          onClick={() => handleExport('PDF')}
          disabled={exporting}
          className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 hover:bg-tertiary/10 hover:border-tertiary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center group-hover:bg-tertiary/20 transition-colors">
            <span className="material-symbols-outlined text-tertiary">picture_as_pdf</span>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-on-surface uppercase tracking-wider">PDF Report</p>
            <p className="text-[9px] text-on-surface-variant font-medium">Professional point list</p>
          </div>
        </button>

        <button 
          onClick={() => handleExport('DXF')}
          disabled={exporting}
          className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 hover:bg-primary/10 hover:border-primary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-primary">architecture</span>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-on-surface uppercase tracking-wider">AutoCAD (DXF)</p>
            <p className="text-[9px] text-on-surface-variant font-medium">Georeferenced (UTM 37N)</p>
          </div>
        </button>

        <button 
          onClick={() => handleExport('KMZ')}
          disabled={exporting}
          className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-high border border-outline-variant/10 hover:bg-secondary/10 hover:border-secondary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
            <span className="material-symbols-outlined text-secondary">public</span>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Google Earth (KMZ)</p>
            <p className="text-[9px] text-on-surface-variant font-medium">Includes section zones</p>
          </div>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5">
        <p className="text-[9px] text-on-surface-variant/50 leading-relaxed italic">
          Data exported based on current map filters and zone selections. Geodetic Datum: WGS84 / UTM 37N.
        </p>
      </div>
    </div>
  )
}
