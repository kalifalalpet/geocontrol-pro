import { Outlet, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { allSitePoints } from '../data/sampleData'
import { useProjects } from '../context/ProjectContext'

const TEXT_SIZES = [12, 13, 14, 15, 16, 17, 18]

export default function Layout() {
  const { id } = useParams()
  const { projects, setActiveProjectId } = useProjects()
  const location = useLocation()
  const navigate = useNavigate()
  
  const project = projects.find(p => p.id === id)

  useEffect(() => {
    if (id) setActiveProjectId(id)
  }, [id, setActiveProjectId])

  const navItems = [
    { to: `/project/${id}/map`, icon: 'map', label: 'Project Map' },
    { to: `/project/${id}/logs`, icon: 'description', label: 'Data Viewer' },
    { to: `/project/${id}/resources`, icon: 'precision_manufacturing', label: 'Resource Tracking' },
    { to: `/project/${id}/finance`, icon: 'payments', label: 'Financial Dashboard' },
    { to: `/project/${id}/data`, icon: 'sync_alt', label: 'Data Hub' },
  ]

  // Theme Toggle State
  const [isDark, setIsDark] = useState(true)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  // Text Size State
  const [textSizeIdx, setTextSizeIdx] = useState(() => {
    const saved = localStorage.getItem('gc-text-size')
    return saved ? parseInt(saved) : 2 // default 14px
  })
  useEffect(() => {
    const size = TEXT_SIZES[textSizeIdx] || 14
    document.documentElement.style.setProperty('--base-font-size', `${size}px`)
    document.documentElement.style.fontSize = `${size}px`
    localStorage.setItem('gc-text-size', String(textSizeIdx))
  }, [textSizeIdx])

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Advanced Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<typeof allSitePoints>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)
    if (q.length > 0) {
      const results = allSitePoints
        .filter(p => p.id.toLowerCase().includes(q.toLowerCase()))
        .slice(0, 8)
      setSuggestions(results)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (sid: string) => {
    setShowSuggestions(false)
    setSearchQuery('')
    navigate(`/project/${id}/logs?ids=${sid}`)
  }

  if (!project) return <div className="p-20 text-white">Project not found.</div>

  return (
    <div className="flex flex-1 overflow-hidden font-inter border-t border-white/5">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* SideNavBar */}
      <aside className={`bg-surface-container-low h-full z-40 border-r border-outline-variant/10 w-64 flex flex-col shrink-0 fixed lg:relative inset-y-0 left-0 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 border-b border-white/5">
           <button 
             onClick={() => navigate('/')}
             className="flex items-center gap-2 text-[10px] font-bold text-primary hover:text-white uppercase tracking-widest mb-6 transition-colors"
           >
             <span className="material-symbols-outlined text-sm">arrow_back</span>
             Back to Portfolio
           </button>
           
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                <span className="material-symbols-outlined text-primary">analytics</span>
              </div>
              <div className="overflow-hidden">
                <h3 className="text-white text-xs font-bold font-headline tracking-wider truncate">{project.name}</h3>
                <p className="text-[9px] text-on-primary-container/40 uppercase tracking-widest truncate">{project.client}</p>
              </div>
           </div>
        </div>

        <nav className="flex-1 mt-4 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.to} className="px-4">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 text-xs font-medium uppercase tracking-[0.05em] transition-all duration-200 rounded-xl ${
                      isActive
                        ? 'text-white bg-primary shadow-[0_5px_15px_rgba(100,161,238,0.2)]'
                        : 'text-on-primary-container/70 hover:bg-surface-container-high hover:text-primary'
                    }`
                  }
                >
                  <span className="material-symbols-outlined text-lg" style={location.pathname === item.to ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low/50">
          <div className="glass-panel p-4 rounded-xl border border-white/5 mb-4">
            <p className="text-[9px] font-bold text-on-primary-container/40 uppercase tracking-widest mb-2">Project Manager</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-[8px] font-bold text-secondary">AM</div>
              <span className="text-[10px] font-bold text-white uppercase tracking-tight">Admin Master</span>
            </div>
          </div>
          
          <ul className="space-y-4">
            <li>
              <a className="flex items-center gap-4 text-on-primary-container/50 hover:text-on-surface transition-colors text-[10px] font-bold uppercase tracking-widest group" href="#">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10">
                  <span className="material-symbols-outlined text-sm">help</span>
                </div>
                <span>Help Center</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative p-2 sm:p-4">
        {/* Project Sub-Header (Search/Theme/TextSize) */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-surface-container-low shadow-sm shrink-0 rounded-t-2xl">
          <div className="relative w-96" ref={searchRef}>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-primary-container/50 text-sm">search</span>
            <input
              className="w-full bg-surface-container border border-outline-variant/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white focus:ring-1 focus:ring-primary focus:outline-none transition-all placeholder:text-on-primary-container/30"
              placeholder={`Search in ${project.name}...`}
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => { if (searchQuery.length > 0) setShowSuggestions(true) }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-11 left-0 w-full bg-surface-container-high border border-outline-variant/20 shadow-2xl rounded-xl overflow-hidden z-[1000] animate-in slide-in-from-top-2 duration-200">
                <ul className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                  {suggestions.map(s => (
                    <li 
                      key={s.id}
                      onClick={() => handleSuggestionClick(s.id)}
                      className="px-4 py-2 hover:bg-primary/10 cursor-pointer flex items-center justify-between group rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-sm ${s.type === 'BH' ? 'text-primary' : s.type === 'CPT' ? 'text-secondary' : 'text-tertiary'}`}>
                          {s.type === 'BH' ? 'trip_origin' : s.type === 'CPT' ? 'diamond' : 'pentagon'}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">{s.id}</p>
                          <p className="text-[9px] text-on-primary-container/40">Section {s.section}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-on-primary-container/60 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                         {s.targetDepth}m
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {/* Mobile Menu Toggle */}
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-10 h-10 rounded-xl bg-surface-container border border-white/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all lg:hidden">
               <span className="material-symbols-outlined text-lg">menu</span>
             </button>

             {/* Text Size Controls */}
             <div className="hidden sm:flex items-center gap-1 bg-surface-container rounded-xl border border-white/5 p-1">
               <button onClick={() => setTextSizeIdx(Math.max(0, textSizeIdx - 1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-on-primary-container/60 hover:bg-white/10 transition-all" title="Decrease text size">A-</button>
               <span className="text-[9px] font-mono text-on-primary-container/40 px-1">{TEXT_SIZES[textSizeIdx]}px</span>
               <button onClick={() => setTextSizeIdx(Math.min(TEXT_SIZES.length - 1, textSizeIdx + 1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-on-primary-container/60 hover:bg-white/10 transition-all" title="Increase text size">A+</button>
             </div>

             <div className="hidden md:flex flex-col items-end mr-2">
               <p className="text-[9px] font-extrabold text-on-primary-container/40 uppercase tracking-widest leading-none">Project Status</p>
               <p className="text-[10px] font-bold text-secondary uppercase tracking-tight mt-1">On Schedule</p>
             </div>
             <button onClick={() => setIsDark(!isDark)} className="w-10 h-10 rounded-xl bg-surface-container border border-white/5 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">{isDark ? 'light_mode' : 'dark_mode'}</span>
             </button>
          </div>
        </div>

        <main className="flex-1 overflow-hidden flex flex-col relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
