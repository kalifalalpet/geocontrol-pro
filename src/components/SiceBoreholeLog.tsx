import { useState, useRef, useEffect, useCallback } from 'react'
import { BoreholeLog } from '../types/enterprise'
import { BoreholeExport } from '../utils/BoreholeExport'

interface Props {
  log: BoreholeLog
}

/* ── Helpers ── */
const nNum = (v: number | string) => typeof v === 'string' ? 50 : v
const sptColor = (n: number | string) => {
  if (typeof n === 'string') return '#5b9bf8'
  if (n < 4) return '#f56565' 
  if (n < 10) return '#f56565'
  if (n < 30) return '#f0b429'
  return '#3dd68c'
}
const density = (n: number | string) => {
  if (typeof n === 'string') return 'Refusal — very dense / rock'
  if (n < 4) return 'Very loose / very soft'
  if (n < 10) return 'Loose / soft'
  if (n < 25) return 'Medium dense / firm'
  if (n < 50) return 'Dense / stiff'
  return 'Very dense / hard'
}

export default function SiceBoreholeLog({ log }: Props) {
  const [activeTab, setActiveTab] = useState<'log' | 'spt' | 'data'>('log')
  const sptCanvasRef = useRef<HTMLCanvasElement>(null)
  const incCanvasRef = useRef<HTMLCanvasElement>(null)
  const PX = 40 // pixels per meter

  const nValues = log.sptResults.map(s => nNum(s.nValue))
  const nMin = nValues.length > 0 ? Math.min(...nValues) : 0
  const nMax = nValues.length > 0 ? Math.max(...nValues) : 0

  /* ── SPT Profile Canvas ── */
  const drawSPTProfile = useCallback(() => {
    const c = sptCanvasRef.current
    if (!c) return
    const parent = c.parentElement
    if (!parent) return
    const W = parent.offsetWidth
    const H = 380
    c.width = W; c.height = H
    const ctx = c.getContext('2d')
    if (!ctx) return

    const isDark = document.documentElement.classList.contains('dark')
    ctx.fillStyle = isDark ? '#0b1326' : '#f8fafc'; ctx.fillRect(0, 0, W, H)
    const gridColor = isDark ? '#1e2535' : '#e2e8f0'
    const textColor = isDark ? '#4a5570' : '#64748b'

    const PAD = { top: 24, right: 50, bottom: 44, left: 56 }
    const cW = W - PAD.left - PAD.right
    const cH = H - PAD.top - PAD.bottom
    const maxN = 80
    const maxD = log.totalDepth

    const xS = (v: number) => PAD.left + (v / maxN) * cW
    const yS = (d: number) => PAD.top + (d / maxD) * cH

    // Grid lines
    ctx.strokeStyle = gridColor; ctx.lineWidth = 0.5
    for (const n of [0, 10, 20, 30, 40, 50, 60, 70, 80]) {
      ctx.beginPath(); ctx.moveTo(xS(n), PAD.top); ctx.lineTo(xS(n), PAD.top + cH); ctx.stroke()
      ctx.fillStyle = textColor; ctx.font = '9px monospace'; ctx.textAlign = 'center'
      ctx.fillText(String(n), xS(n), PAD.top + cH + 14)
    }
    for (let d = 0; d <= maxD; d += 1) {
      ctx.beginPath(); ctx.moveTo(PAD.left, yS(d)); ctx.lineTo(PAD.left + cW, yS(d)); ctx.stroke()
      ctx.fillStyle = textColor; ctx.textAlign = 'right'; ctx.font = '9px monospace'
      ctx.fillText(d.toFixed(0), PAD.left - 6, yS(d) + 3)
    }

    // Geology background bands
    log.lithology.forEach(g => {
      ctx.fillStyle = g.color + '18'
      ctx.fillRect(PAD.left, yS(g.top), cW, yS(g.base) - yS(g.top))
      ctx.fillStyle = g.color + '80'; ctx.font = '9px monospace'; ctx.textAlign = 'left'
      ctx.fillText(g.uscs, PAD.left + 4, yS(g.top) + 12)
    })

    // Reference lines for Loose (10) and Medium (30) thresholds
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(245,101,101,.4)'; ctx.beginPath(); ctx.moveTo(xS(10), PAD.top); ctx.lineTo(xS(10), PAD.top + cH); ctx.stroke()
    ctx.strokeStyle = 'rgba(240,180,41,.4)'; ctx.beginPath(); ctx.moveTo(xS(30), PAD.top); ctx.lineTo(xS(30), PAD.top + cH); ctx.stroke()
    ctx.setLineDash([])

    // Connecting trend line
    ctx.beginPath(); ctx.strokeStyle = 'rgba(91,155,248,.35)'; ctx.lineWidth = 1.5
    log.sptResults.forEach((s, i) => {
      const n = nNum(s.nValue)
      if (i === 0) ctx.moveTo(xS(n), yS(s.depth))
      else ctx.lineTo(xS(n), yS(s.depth))
    })
    ctx.stroke()

    // Individual SPT data points
    log.sptResults.forEach(s => {
      const n = nNum(s.nValue)
      const col = sptColor(s.nValue)
      const x1 = xS(n), y = yS(s.depth)
      
      // Horizontal bar
      ctx.fillStyle = col + '20'
      ctx.fillRect(PAD.left, y - 5, x1 - PAD.left, 10)
      
      // Data point dot
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x1, y, 4, 0, Math.PI * 2); ctx.fill()
      
      // Label
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left'
      ctx.fillText(typeof s.nValue === 'string' ? '>50' : String(s.nValue), x1 + 6, y + 3)
    })

    // Labels
    ctx.fillStyle = isDark ? '#8a96b0' : '#475569'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('SPT N value (blows/300mm)', PAD.left + cW / 2, H - 6)
    ctx.save(); ctx.translate(12, PAD.top + cH / 2); ctx.rotate(-Math.PI / 2)
    ctx.fillText('Depth (m)', 0, 0); ctx.restore()
  }, [log])

  /* ── SPT Increments Canvas ── */
  const drawIncrements = useCallback(() => {
    const c = incCanvasRef.current
    if (!c) return
    const parent = c.parentElement
    if (!parent) return
    const W = parent.offsetWidth
    const H = 280
    c.width = W; c.height = H
    const ctx = c.getContext('2d')
    if (!ctx) return

    const isDark = document.documentElement.classList.contains('dark')
    ctx.fillStyle = isDark ? '#0b1326' : '#f8fafc'; ctx.fillRect(0, 0, W, H)
    const gridColor = isDark ? '#1e2535' : '#e2e8f0'
    const textColor = isDark ? '#4a5570' : '#64748b'

    const PAD = { top: 16, right: 16, bottom: 48, left: 50 }
    const cW = W - PAD.left - PAD.right
    const cH = H - PAD.top - PAD.bottom
    const n = log.sptResults.length
    if (n === 0) return
    const groupW = cW / n
    const barW = Math.max(groupW * 0.15, 4)
    const labelStep = n > 15 ? 2 : n > 30 ? 3 : 1

    ctx.strokeStyle = gridColor; ctx.lineWidth = 0.5
    for (const v of [0, 10, 20, 30, 40, 50]) {
      const y = PAD.top + cH - (v / 50) * cH
      ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(PAD.left + cW, y); ctx.stroke()
      ctx.fillStyle = textColor; ctx.font = '8px monospace'; ctx.textAlign = 'right'
      ctx.fillText(v.toString(), PAD.left - 4, y + 3)
    }

    const colors = ['#5b9bf8', '#a78bfa', '#3dd68c']

    log.sptResults.forEach((s, gi) => {
      const gx = PAD.left + gi * groupW + groupW * 0.15
      const incs = [s.increments[0] || 0, s.increments[2] || 0, s.increments[4] || 0]

      incs.forEach((v, bi) => {
        if (v === 0) return
        const bx = gx + bi * (barW + 2)
        const bh = (v / 50) * cH
        const by = PAD.top + cH - bh
        ctx.fillStyle = colors[bi]
        ctx.fillRect(bx, by, barW, bh)
        ctx.fillStyle = isDark ? '#e8edf5' : '#1e293b'; ctx.font = '7px monospace'; ctx.textAlign = 'center'
        ctx.fillText(v.toString(), bx + barW / 2, by - 2)
      })

      if (gi % labelStep === 0) {
        const nx = gx + barW * 1.5
        ctx.fillStyle = sptColor(s.nValue); ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'
        const lbl = (typeof s.nValue === 'string') ? '>50' : s.nValue.toString()
        ctx.fillText('N=' + lbl, nx, PAD.top + cH + 14)
        ctx.fillStyle = '#8a96b0'; ctx.font = '8px monospace'
        ctx.fillText(s.depth + 'm', nx, PAD.top + cH + 26)
      }
    })

    ctx.fillStyle = isDark ? '#8a96b0' : '#475569'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('Blows per 75mm increment', PAD.left + cW / 2, H - 6)
  }, [log])

  useEffect(() => {
    setTimeout(() => { drawSPTProfile(); drawIncrements() }, 100)
  }, [drawSPTProfile, drawIncrements, activeTab, log])

  useEffect(() => {
    const handleResize = () => { drawSPTProfile(); drawIncrements() }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawSPTProfile, drawIncrements])

  const hatchBG = (uscs: string) => {
    const isDark = document.documentElement.classList.contains('dark')
    const stroke = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)'
    const p: Record<string, string> = {
      'SM': `repeating-linear-gradient(45deg, ${stroke} 0, ${stroke} 1px, transparent 1px, transparent 5px)`,
      'SP-SM': `repeating-linear-gradient(90deg, ${stroke} 0, ${stroke} 1px, transparent 1px, transparent 4px)`,
      'CL': `repeating-linear-gradient(0deg, ${stroke} 0, ${stroke} 1px, transparent 1px, transparent 6px)`,
    }
    return p[uscs.toUpperCase()] || ''
  }

  const totalH = log.totalDepth * PX

  return (
    <div className="rounded-2xl border border-outline-variant/10 overflow-hidden bg-surface shadow-xl">
      {/* ═══ Header ═══ */}
      <div className="p-4 sm:p-6 bg-surface-container border-b border-outline-variant/10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#5b9bf8' }}>{log.projectId}</div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">{log.boreholeId}</h3>
            <div className="text-xs mt-1 text-on-surface-variant font-medium">{log.projectName}</div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium" style={{ background: 'rgba(91,155,248,.12)', color: '#5b9bf8', border: '1px solid rgba(91,155,248,.25)' }}>{log.method}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium" style={{ background: 'rgba(91,155,248,.12)', color: '#5b9bf8', border: '1px solid rgba(91,155,248,.25)' }}>{log.totalDepth} m</span>
              {nMin < 10 && <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium" style={{ background: 'rgba(240,180,41,.12)', color: '#f0b429', border: '1px solid rgba(240,180,41,.25)' }}>N={nMin} - Soft</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => BoreholeExport.exportToExcel(log)} className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-primary/20 transition-all">
              <span className="material-symbols-outlined text-sm">spreadsheet</span> Excel
            </button>
            <button onClick={() => { console.log('Export PDF Clicked'); BoreholeExport.exportToPDF(log, { spt: sptCanvasRef.current, inc: incCanvasRef.current }) }} className="flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 text-error text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-error/20 transition-all">
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="flex flex-wrap gap-1 mx-3 sm:mx-4 my-4 p-1 rounded-lg bg-surface-container border border-outline-variant/10">
        {(['log', 'spt', 'data'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all border ${activeTab === t ? 'bg-primary text-white border-primary shadow-md' : 'bg-transparent text-on-surface-variant/60 border-transparent hover:text-on-surface'}`}>
            {t === 'log' ? 'Borehole Log' : t === 'spt' ? 'SPT Analysis' : 'Raw Data'}
          </button>
        ))}
      </div>

      {/* ═══ Visible Containers for Capture ═══ */}
      <div className={activeTab === 'log' ? 'block' : 'hidden'}>
        <div className="p-3 sm:p-4 min-h-[400px]">
          <div className="flex gap-4 p-4 rounded-xl bg-surface-container overflow-x-auto custom-scrollbar">
            {/* Elevation Ticks */}
            <div className="flex-none pt-8" style={{ width: '30px' }}>
              {Array.from({ length: Math.ceil(log.totalDepth) + 1 }).map((_, i) => (
                <div key={i} className="text-[9px] font-mono text-on-surface-variant/40" style={{ height: PX + 'px' }}>{i}</div>
              ))}
            </div>
            {/* Lithology Column */}
            <div className="flex-none pt-8" style={{ width: '40px' }}>
              {log.lithology.map((l, i) => (
                <div key={i} className="relative border-b border-black/20" style={{ height: (l.base - l.top) * PX + 'px', background: l.color }}>
                  {hatchBG(l.uscs) && <div className="absolute inset-0" style={{ background: hatchBG(l.uscs) }} />}
                </div>
              ))}
            </div>
            {/* Description Column */}
            <div className="flex-1 space-y-0 pt-8">
              {log.lithology.map((l, i) => (
                <div key={i} className="border-b border-outline-variant/5 px-4 flex flex-col justify-center bg-surface-container-low/50" style={{ height: (l.base - l.top) * PX + 'px' }}>
                  <div className="text-[10px] font-bold text-on-surface uppercase tracking-tight">{l.description}</div>
                  <div className="text-[9px] text-primary font-mono mt-0.5">{l.uscs} · {l.formation}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={activeTab === 'spt' ? 'block' : 'hidden'}>
        <div className="p-3 sm:p-4 space-y-4">
          <div className="rounded-xl p-4 sm:p-6 bg-surface-container-high border border-outline-variant/10">
            <canvas ref={sptCanvasRef} style={{ width: '100%', display: 'block' }} className="rounded-lg shadow-inner" />
          </div>
          <div className="rounded-xl p-4 sm:p-6 bg-surface-container-high border border-outline-variant/10">
            <canvas ref={incCanvasRef} style={{ width: '100%', display: 'block' }} className="rounded-lg shadow-inner" />
          </div>
        </div>
      </div>

      <div className={activeTab === 'data' ? 'block' : 'hidden'}>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant/10 text-on-surface-variant/40">
                <th className="p-3 font-bold uppercase">From</th>
                <th className="p-3 font-bold uppercase">To</th>
                <th className="p-3 font-bold uppercase">USCS</th>
                <th className="p-3 font-bold uppercase">Description</th>
              </tr>
            </thead>
            <tbody>
              {log.lithology.map((l, i) => (
                <tr key={i} className="border-b border-outline-variant/5 hover:bg-white/5">
                  <td className="p-3 font-mono font-bold text-primary">{l.top.toFixed(2)}</td>
                  <td className="p-3 font-mono font-bold text-primary">{l.base.toFixed(2)}</td>
                  <td className="p-3 font-mono font-black text-secondary">{l.uscs}</td>
                  <td className="p-3 text-on-surface-variant leading-relaxed">{l.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
