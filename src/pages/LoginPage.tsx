import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Artificial delay for premium feel
    setTimeout(() => {
      const success = login(username, password)
      if (success) {
        navigate('/map')
      } else {
        setError('Invalid username or password. Please try again.')
        setIsLoading(false)
      }
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#0b1326] flex items-center justify-center p-6 relative overflow-hidden font-inter">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse"></div>
      
      <div className="w-full max-w-[440px] relative z-10 transition-all duration-700 animate-in fade-in zoom-in slide-in-from-bottom-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-32 h-32 mb-6 relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/40 transition-all duration-500"></div>
            <img 
              src="/Geoportal/acts-recolored.png" 
              alt="ACTS Logo" 
              className="w-full h-full object-contain relative z-10 filter drop-shadow(0 0 15px rgba(100, 161, 238, 0.4))"
              onError={(e) => {
                // Fallback if the path is different
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('public')) {
                    target.src = '/acts-recolored.png';
                }
              }}
            />
          </div>
          <h1 className="text-3xl font-headline font-bold text-white tracking-tight text-center">
            GEOPORTAL <span className="text-primary">PRO</span>
          </h1>
          <p className="text-on-primary-container/60 text-sm mt-2 uppercase tracking-[0.2em] font-medium">Project Management Suite</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-10 rounded-[28px] border border-white/10 shadow-2xl backdrop-blur-xl bg-white/[0.02]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-primary uppercase tracking-widest mb-2 ml-1">Username</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-primary-container/30 group-focus-within:text-primary transition-colors">person</span>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-surface-container-highest/50 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-on-primary-container/20 focus:outline-none focus:border-primary/50 focus:bg-surface-container-highest transition-all"
                  placeholder="Enter username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-primary uppercase tracking-widest mb-2 ml-1">Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-primary-container/30 group-focus-within:text-primary transition-colors">lock</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-highest/50 border border-white/5 rounded-xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-on-primary-container/20 focus:outline-none focus:border-primary/50 focus:bg-surface-container-highest transition-all"
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-error text-xl">error</span>
                <span className="text-xs text-error font-medium">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-[0_10px_20px_rgba(100,161,238,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <p className="text-center text-[11px] text-on-primary-container/30 mt-8 font-medium">
          &copy; 2026 Advanced Construction Technology Services. <br/> All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
