import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { cptData, pltData, lithologyLayers, allSitePoints, type SitePoint } from '../data/sampleData'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 rounded-lg border border-outline-variant/30 shadow-2xl">
      <div className="text-[10px] text-secondary font-bold mb-1">DEPTH: {label}m</div>
      {payload.map((p: any) => (
        <div key={p.name} className="text-xs">
          <span className="text-on-surface-variant">{p.name}: </span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const PltTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 rounded-lg border border-outline-variant/30 shadow-2xl">
      <div className="text-[10px] text-secondary font-bold mb-1">DATA POINT</div>
      <div className="flex gap-4">
        <div>
          <div className="text-[9px] text-on-surface-variant uppercase">Settlement</div>
          <div className="text-xs font-bold text-on-surface">{payload[0]?.payload?.settlement} mm</div>
        </div>
        <div>
          <div className="text-[9px] text-on-surface-variant uppercase">Applied Load</div>
          <div className="text-xs font-bold text-on-surface">{payload[0]?.payload?.load} kN</div>
        </div>
      </div>
    </div>
  )
}

function GenericTestCard({ testName, index }: { testName: string, index: number }) {
  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden mb-6 filter drop-shadow-lg border border-white/5">
      <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-high/30">
        <h3 className="font-headline font-bold text-primary">{testName} — Record #{index}</h3>
        <button className="bg-surface-container-highest hover:bg-surface-bright text-primary text-[10px] font-bold px-3 py-1.5 rounded flex items-center gap-1.5 border border-outline-variant/20 transition-colors uppercase tracking-widest">
          <span className="material-symbols-outlined text-[14px]">download</span> Raw Data
        </button>
      </div>
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="h-[250px] bg-surface-container-highest/10 rounded-xl flex flex-col items-center justify-center border border-dashed border-outline-variant/20">
            <span className="material-symbols-outlined text-outline-variant mb-2 text-3xl">show_chart</span>
            <span className="text-on-surface-variant text-[10px] font-bold font-mono uppercase tracking-widest">{testName} Chart Pending</span>
         </div>
         <div className="h-[250px] bg-surface-container-highest/10 rounded-xl flex flex-col items-center justify-center border border-dashed border-outline-variant/20">
            <span className="material-symbols-outlined text-outline-variant mb-2 text-3xl">table_view</span>
            <span className="text-on-surface-variant text-[10px] font-bold font-mono uppercase tracking-widest">{testName} Table Pending</span>
         </div>
      </div>
    </div>
  )
}

function LithologyCard({ point }: { point: SitePoint }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden mb-8 border border-white/5 shadow-lg">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-tertiary/20 to-transparent"></div>
      <h3 className="font-headline text-lg font-bold mb-6 flex items-center gap-2 text-primary">
        <span className="material-symbols-outlined text-tertiary">layers</span> Geotechnical Soil Strata (Core Log)
      </h3>
      <div className="h-[600px] flex gap-4">
        <div className="w-12 flex flex-col justify-between text-[10px] text-on-primary-container font-mono py-4 border-r border-outline-variant/10 pr-2 items-end">
          <span>0m</span><span>-10m</span><span>-20m</span><span>-30m</span><span>-40m</span><span>-50m</span>
        </div>
        <div className="flex-1 max-w-sm flex flex-col gap-0.5 rounded-lg overflow-hidden border border-outline-variant/20 shadow-inner bg-surface-container-highest/20 p-1">
          {lithologyLayers.map((layer, i) => (
            <div key={i} className="flex items-center justify-center group relative cursor-help transition-all hover:brightness-125 rounded-md" style={{ height: `${layer.percentage}%`, backgroundColor: layer.color }}>
              <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md tracking-widest" style={{ color: i < 2 ? '#131b2e' : '#dae2fd' }}>{layer.label}</span>
              {i === lithologyLayers.length - 1 && <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }}></div>}
            </div>
          ))}
        </div>
        <div className="w-16 flex flex-col gap-4 ml-8">
          <div className="flex-1 bg-surface-container-high rounded-xl flex flex-col items-center justify-around py-4 border border-outline-variant/10">
            <span className="text-[9px] font-bold rotate-90 whitespace-nowrap tracking-widest text-on-surface-variant">REC %</span>
            <div className="w-1.5 flex-1 bg-tertiary/10 rounded-full relative"><div className="absolute top-0 w-full h-[95%] bg-tertiary rounded-full shadow-[0_0_8px_rgba(78,222,163,0.5)]"></div></div>
            <span className="text-xs font-bold text-tertiary">95</span>
          </div>
          <div className="flex-1 bg-surface-container-high rounded-xl flex flex-col items-center justify-around py-4 border border-outline-variant/10">
            <span className="text-[9px] font-bold rotate-90 whitespace-nowrap tracking-widest text-on-surface-variant">RQD %</span>
            <div className="w-1.5 flex-1 bg-secondary/10 rounded-full relative"><div className="absolute bottom-0 w-full h-[72%] bg-secondary rounded-full"></div></div>
            <span className="text-xs font-bold text-secondary">72</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CPTCard({ point }: { point: SitePoint }) {
  return (
    <div className="grid grid-cols-1 gap-6 mb-8">
      <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden border border-white/5 drop-shadow-lg">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/20 to-transparent"></div>
        <h3 className="font-headline text-lg font-bold mb-6 flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-secondary">bar_chart</span> CPT Tip & Friction Profiling
        </h3>
        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cptData} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#45464d20" />
              <XAxis type="number" tick={{ fill: '#798098', fontSize: 10 }} axisLine={{ stroke: '#45464d30' }} />
              <YAxis dataKey="depth" type="number" reversed tick={{ fill: '#798098', fontSize: 10 }} axisLine={{ stroke: '#45464d30' }} label={{ value: 'Depth (m)', angle: -90, position: 'insideLeft', style: { fill: '#798098', fontSize: 10, fontWeight: 'bold' } }} />
              <Tooltip content={<CustomTooltip />} />
              <Line dataKey="qc" name="qc (MPa)" stroke="#ffb95f" strokeWidth={2.5} dot={{ r: 2, fill: '#ffb95f', strokeWidth: 0 }} />
              <Line dataKey="fs" name="fs (kPa)" stroke="#bec6e0" strokeWidth={2.5} dot={{ r: 2, fill: '#bec6e0', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function PLTCard({ point }: { point: SitePoint }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-6 relative overflow-hidden mb-8 border border-white/5 drop-shadow-lg">
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-secondary/20 to-transparent"></div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-headline text-lg font-bold flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-secondary">show_chart</span> Plate Load Test Curve
          </h3>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex flex-col bg-surface-container-highest px-3 py-1.5 rounded border border-outline-variant/10">
              <span className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Plate Diam.</span>
              <span className="text-secondary font-bold text-sm">300 mm</span>
            </div>
            <div className="flex flex-col bg-surface-container-highest px-3 py-1.5 rounded border border-outline-variant/10">
              <span className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Max Applied Load</span>
              <span className="text-secondary font-bold text-sm">325 kN</span>
            </div>
          </div>
        </div>
        <div className="text-right bg-secondary/10 p-4 rounded-xl border border-secondary/20">
          <div className="text-[9px] uppercase font-bold text-secondary tracking-widest">Calculated Bearing Capacity</div>
          <div className="text-2xl font-headline font-bold text-secondary-fixed">425 kN/m²</div>
        </div>
      </div>
      <div className="h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={pltData} margin={{ top: 10, right: 10, bottom: 30, left: 30 }}>
            <defs>
              <linearGradient id="pltGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffb95f" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ffb95f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#45464d20" />
            <XAxis dataKey="settlement" tick={{ fill: '#798098', fontSize: 10 }} axisLine={{ stroke: '#45464d30' }} label={{ value: 'MEASURED SETTLEMENT (δ mm)', position: 'bottom', offset: 15, style: { fill: '#798098', fontSize: 10, fontWeight: 'bold' } }} />
            <YAxis tick={{ fill: '#798098', fontSize: 10 }} axisLine={{ stroke: '#45464d30' }} label={{ value: 'APPLIED LOAD (kN)', angle: -90, position: 'insideLeft', offset: -15, style: { fill: '#798098', fontSize: 10, fontWeight: 'bold' } }} />
            <Tooltip content={<PltTooltip />} />
            <Area type="monotone" dataKey="load" stroke="#ffb95f" strokeWidth={3} fill="url(#pltGrad)" dot={{ r: 4, fill: '#ffb95f', stroke: '#0b1326', strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#ffb95f', strokeWidth: 2, fill: '#0b1326' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function PointVisualizer({ point, testType }: { point: SitePoint, testType: string }) {
  const showAll = testType === 'ALL'
  const hasLithology = point.type === 'BH'
  const hasCPT = point.type === 'CPT'
  const hasPLT = point.type === 'PLT'

  return (
    <div className="mb-16">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-headline font-bold text-primary">
          Data Viewer: {point.id}
        </h2>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
          point.type === 'BH' ? 'text-primary bg-primary/10 border border-primary/20' :
          point.type === 'CPT' ? 'text-secondary bg-secondary/10 border border-secondary/20' :
          'text-tertiary bg-tertiary/10 border border-tertiary/20'
        }`}>{point.type} (Section {point.section})</span>
        <div className="flex-1 h-px bg-white/10 ml-4"></div>
      </div>
      
      {(showAll || testType === 'Lithology') && hasLithology && <LithologyCard point={point} />}
      {(showAll || testType === 'CPT') && hasCPT && <CPTCard point={point} />}
      {(showAll || testType === 'PLT') && hasPLT && <PLTCard point={point} />}

      {point.tests.map(t => {
        if (['CPT', 'PLT', 'Lithology', 'Core Recovery'].includes(t.name)) return null
        if (!showAll && testType !== t.name) return null
        return (
          <div key={t.name}>
            {Array.from({ length: t.count }).map((_, i) => <GenericTestCard key={i} testName={t.name} index={i + 1} />)}
          </div>
        )
      })}
    </div>
  )
}

export default function TechnicalLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlIds = searchParams.get('ids')?.split(',').filter(Boolean) || []

  const [pointType, setPointType] = useState<'ALL' | 'BH' | 'CPT' | 'PLT'>('ALL')
  
  // Update internal filtering state when URL changes
  useEffect(() => {
    if (urlIds.length > 0) {
      setPointType('ALL')
    }
  }, [searchParams])

  const filteredPoints = useMemo(() => allSitePoints.filter(p => pointType === 'ALL' || p.type === pointType), [pointType])
  
  const [pointIds, setPointIds] = useState<string[]>(urlIds.length > 0 ? urlIds : [filteredPoints[0]?.id])

  // Sync internal UI selection to URL whenever it changes, and fallback if empty
  useEffect(() => {
    if (urlIds.length > 0 && urlIds.join(',') !== pointIds.join(',')) {
      setPointIds(urlIds)
    } else if (urlIds.length === 0 && pointIds.length === 0 && filteredPoints.length > 0) {
      setPointIds([filteredPoints[0].id])
    }
  }, [urlIds, filteredPoints])

  const selectedPoints = useMemo(() => {
    return pointIds.map(id => allSitePoints.find(p => p.id === id)).filter(Boolean) as SitePoint[]
  }, [pointIds])

  // Aggregate all tests across all currently selected points
  const aggregatedTests = useMemo(() => {
    const testMap = new Map<string, number>()
    selectedPoints.forEach(p => {
      if (p.type === 'BH' && !testMap.has('Lithology')) testMap.set('Lithology', 1)
      p.tests.forEach(t => {
        if (!testMap.has(t.name)) testMap.set(t.name, t.count)
      })
    })
    return Array.from(testMap.entries()).map(([name, count]) => ({ name, count }))
  }, [selectedPoints])

  const [testType, setTestType] = useState('ALL')

  // Safety fallback for test type if the selected points change and don't support the current test
  useEffect(() => {
    if (testType !== 'ALL' && aggregatedTests.length > 0 && !aggregatedTests.find(t => t.name === testType)) {
      setTestType('ALL')
    }
  }, [aggregatedTests, testType])

  if (selectedPoints.length === 0) return <div className="p-10 text-primary">No points selected...</div>

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
      
      {/* Top Bar Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-4 bg-surface-container-low p-2 rounded-xl border border-white/5 shadow-lg">
          
          <div className="px-4 py-2 border-r border-outline-variant/20">
            <label className="block text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-2">Project</label>
            <select className="bg-surface-container-high text-primary text-xs font-bold border border-outline-variant/20 rounded px-2 py-1 cursor-pointer focus:outline-none focus:border-secondary">
              <option>Qiddiya Coastal GI</option>
            </select>
          </div>

          <div className="px-4 py-2 border-r border-outline-variant/20">
            <label className="block text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-2">Filter Type</label>
            <div className="flex bg-surface-container-high rounded p-0.5">
              {['ALL', 'BH', 'CPT', 'PLT'].map(t => (
                <button
                  key={t}
                  onClick={() => { setPointType(t as any); setSearchParams({}) }} // Clear URL params if manually filtering
                  disabled={urlIds.length > 1}
                  className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider transition-colors ${pointType === t ? 'bg-secondary text-on-secondary shadow' : 'text-on-surface-variant hover:text-primary'} disabled:opacity-30`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="px-4 py-2 border-r border-outline-variant/20">
            <label className="block text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-2">Location ID</label>
            {pointIds.length > 1 ? (
              <div className="flex items-center gap-2 bg-surface-container-high border border-secondary/30 px-3 py-1 rounded text-xs font-bold text-secondary">
                {pointIds.length} Points Selected
                <button onClick={() => setSearchParams({})} className="ml-2 hover:text-white transition-colors bg-surface-container-highest rounded-full w-4 h-4 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[10px]">close</span>
                </button>
              </div>
            ) : (
              <select
                value={pointIds[0] || ''}
                onChange={e => { setPointIds([e.target.value]); setSearchParams({}); }}
                className="bg-surface-container-high text-primary text-xs font-bold border border-outline-variant/20 rounded px-2 py-1 cursor-pointer focus:outline-none focus:border-secondary"
              >
                {filteredPoints.slice(0, 100).map(p => <option key={p.id} value={p.id}>{p.id} ({p.section})</option>)}
              </select>
            )}
          </div>
          
          <div className="px-4 py-2">
            <label className="block text-[10px] text-on-primary-container uppercase font-bold tracking-widest mb-2">Tests View Toggle</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTestType('ALL')}
                className={`px-3 py-1 rounded font-bold text-[10px] transition-colors border ${
                  testType === 'ALL'
                    ? 'bg-primary text-on-primary shadow-lg border-primary/50'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright border-outline-variant/10'
                }`}
              >
                ALL TESTS
              </button>
              {aggregatedTests.map(t => (
                <button
                  key={t.name}
                  onClick={() => setTestType(t.name)}
                  className={`px-3 py-1 rounded font-bold text-[10px] transition-colors flex items-center gap-1.5 border ${
                    testType === t.name
                      ? 'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed/50 shadow-lg'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-bright border-outline-variant/10'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC RENDERING AREA (Maps over all selected points concurrently) */}
      <div className="grid grid-cols-1 xl:grid-cols-1 gap-8">
        {selectedPoints.map(pt => (
          <PointVisualizer key={pt.id} point={pt} testType={testType} />
        ))}
      </div>

    </div>
  )
}
