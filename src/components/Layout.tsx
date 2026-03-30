import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { allSitePoints } from '../data/sampleData'

const navItems = [
  { to: '/map', icon: 'map', label: 'Project Map' },
  { to: '/logs', icon: 'description', label: 'Data Viewer' },
  { to: '/resources', icon: 'precision_manufacturing', label: 'Resource Tracking' },
  { to: '/finance', icon: 'payments', label: 'Financial Dashboard' },
  { to: '/data', icon: 'sync_alt', label: 'Data Hub' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  // Theme Toggle State
  const [isDark, setIsDark] = useState(true)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

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

  const handleSuggestionClick = (id: string) => {
    setShowSuggestions(false)
    setSearchQuery('')
    navigate(`/logs?ids=${id}`)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* TopNavBar */}
      <header className="bg-background fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 h-28 border-b border-outline-variant/10 shadow-sm">
        <div className="flex items-center gap-10">
          <div className="flex flex-col justify-center gap-2">
            <img src="/acts-banner-logo.png" alt="ACTS" className="h-[96px] w-[350px] object-contain object-left mix-blend-screen" />
            <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase leading-tight opacity-90 pl-1 mt-1">GEO Project Management</span>
          </div>
          <nav className="hidden xl:flex items-center gap-8 font-headline text-base tracking-wide ml-6">
            <a className="text-on-primary-container hover:text-on-surface transition-colors px-2 py-1" href="#">Projects</a>
            <a className="text-on-primary-container hover:text-on-surface transition-colors px-2 py-1" href="#">Reports</a>
            <a className="text-on-primary-container hover:text-on-surface transition-colors px-2 py-1" href="#">Team</a>
          </nav>
        </div>
        <div className="flex items-center flex-1 max-w-md mx-12">
          <div className="relative w-full" ref={searchRef}>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-primary-container text-lg">search</span>
            <input
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg py-2 pl-10 pr-4 text-sm text-primary focus:ring-1 focus:ring-secondary focus:outline-none transition-all placeholder:text-on-primary-container/70"
              placeholder="Search points (e.g. BH-004)..."
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => { if (searchQuery.length > 0) setShowSuggestions(true) }}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-12 left-0 w-full bg-surface-container-high border border-outline-variant/20 shadow-xl rounded-lg overflow-hidden z-[100]">
                <ul className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                  {suggestions.map(s => (
                    <li 
                      key={s.id}
                      onClick={() => handleSuggestionClick(s.id)}
                      className="px-4 py-2 hover:bg-surface-container-highest cursor-pointer flex items-center justify-between group rounded"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-sm ${s.type === 'BH' ? 'text-primary' : s.type === 'CPT' ? 'text-secondary' : 'text-tertiary'}`}>
                          {s.type === 'BH' ? 'trip_origin' : s.type === 'CPT' ? 'diamond' : 'pentagon'}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-on-surface group-hover:text-secondary transition-colors">{s.id}</p>
                          <p className="text-[10px] text-on-surface-variant">Section {s.section}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded border border-outline-variant/10">
                         {s.targetDepth}m
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-primary hover:bg-surface-container-high rounded-full transition-colors"
            title="Toggle Light/Dark Theme"
          >
            <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button className="p-2 text-primary hover:bg-surface-container-high rounded-full transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full"></span>
          </button>
          <button className="p-2 text-primary hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="h-8 w-8 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center text-xs font-bold text-secondary">
            MA
          </div>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="bg-surface-container-low fixed left-0 top-0 h-full z-40 border-r border-outline-variant/10 w-64 pt-28 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center border border-outline-variant/20">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>precision_manufacturing</span>
          </div>
          <div>
            <h3 className="text-primary text-sm font-bold font-headline tracking-wider">Qiddiya Coastal</h3>
            <p className="text-[10px] text-on-primary-container uppercase tracking-widest">GI Survey</p>
          </div>
        </div>

        <nav className="flex-1 mt-4">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.to} className="px-4">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-4 py-3 text-xs font-medium uppercase tracking-[0.05em] transition-all duration-200 ${
                      isActive
                        ? 'text-secondary border-r-4 border-secondary bg-surface-container-high/50'
                        : 'text-on-primary-container hover:bg-surface-container-high hover:text-on-surface'
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

        <div className="p-6 border-t border-outline-variant/10">
          <NavLink to="/data" className="w-full bg-primary text-on-primary font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 text-sm">
            <span className="material-symbols-outlined text-sm">upload</span>
            Upload Data
          </NavLink>
          <ul className="mt-6 space-y-4">
            <li>
              <a className="flex items-center gap-4 text-on-primary-container hover:text-on-surface transition-colors text-xs font-medium uppercase tracking-[0.05em]" href="#">
                <span className="material-symbols-outlined text-sm">help</span>
                <span>Support</span>
              </a>
            </li>
            <li>
              <a className="flex items-center gap-4 text-on-primary-container hover:text-on-surface transition-colors text-xs font-medium uppercase tracking-[0.05em]" href="#">
                <span className="material-symbols-outlined text-sm">archive</span>
                <span>Archive</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 pt-28 flex-1 h-screen overflow-hidden flex flex-col">
        <Outlet />
      </main>
    </div>
  )
}
