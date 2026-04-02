import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectContext'

export default function GlobalLayout() {
  const { logout } = useAuth()
  const { activeProject } = useProjects()
  const navigate = useNavigate()
  const location = useLocation()

  const isProjectView = location.pathname.startsWith('/project/')

  return (
    <div className="h-screen bg-background flex flex-col font-inter overflow-hidden">
      {/* Global Top Nav */}
      <header className="h-16 bg-surface-container border-b border-outline-variant/10 flex items-center justify-between px-8 z-[100] shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white">grid_view</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-widest uppercase">GeoControl <span className="text-primary italic">PRO</span></h1>
              <p className="text-[9px] text-on-primary-container font-medium uppercase tracking-[0.2em] leading-none">Enterprise Suite</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 ml-4">
            <NavLink 
              to="/" 
              end
              className={({ isActive }) => `px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-on-primary-container/60 hover:bg-white/5 hover:text-white'}`}
            >
              Projects
            </NavLink>
            <NavLink 
              to="/resources" 
              className={({ isActive }) => `px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-on-primary-container/60 hover:bg-white/5 hover:text-white'}`}
            >
              Master Resources
            </NavLink>
            <NavLink 
              to="/treasury" 
              className={({ isActive }) => `px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-on-primary-container/60 hover:bg-white/5 hover:text-white'}`}
            >
              Financial Treasury
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {activeProject && isProjectView && (
            <div className="flex items-center gap-3 px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Active: {activeProject.name}</span>
            </div>
          )}

          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <button className="text-on-primary-container/60 hover:text-white transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>
            <button 
              onClick={() => { if(confirm('Sign out?')) logout() }}
              className="px-4 py-2 bg-error/10 text-error text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg hover:bg-error/20 transition-colors border border-error/20"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
