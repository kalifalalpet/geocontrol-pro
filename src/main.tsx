import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ResourceProvider } from './context/ResourceContext'
import { ProjectProvider } from './context/ProjectContext'
import { FinanceProvider } from './context/FinanceContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <ProjectProvider>
          <FinanceProvider>
            <ResourceProvider>
              <App />
            </ResourceProvider>
          </FinanceProvider>
        </ProjectProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
)
