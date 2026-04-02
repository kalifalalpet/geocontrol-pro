import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Project, BoreholeLog } from '../types/enterprise'

interface ProjectContextType {
  projects: Project[]
  activeProject: Project | null
  boreholeLogs: BoreholeLog[]
  setActiveProjectId: (id: string | null) => void
  addProject: (p: Project) => void
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  addBoreholeLog: (log: BoreholeLog) => void
  getBoreholeLog: (id: string) => BoreholeLog | undefined
}

const initialProjects: Project[] = [
  {
    id: 'qiddiya-coastal',
    name: 'Qiddiya Coastal Project',
    location: 'Qiddiya, Saudi Arabia',
    client: 'QIC',
    coordinates: [21.980665, 38.952141],
    budgetSAR: 15000000,
    spentSAR: 4200000,
    status: 'active',
    startDate: '2025-01-15',
    teamIds: ['P1', 'P2', 'P3'],
    assetIds: ['RIG-001', 'CPT-01'],
    pointIds: ['BH-001', 'BH-002', 'BH-003', 'BH-004', 'BH-005', 'BH-006'], // Sample points for Qiddiya
    metersPlanned: 6750,
    metersCompleted: 2450,
    description: 'Ground investigation and site characterization for the coastal development zone.'
  }
]

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

const initialBoreholeLogs: BoreholeLog[] = [
  {
    id: 'BH-001',
    projectId: 'qiddiya-coastal',
    boreholeId: 'ADD-BH-01',
    location: { easting: 636743.24, northing: 2715596.02, elevation: 649.996 },
    totalDepth: 9.95,
    drilledDate: '2025-04-12',
    method: 'RC / HQ Core',
    lithology: [
      { top: 0, base: 5, uscs: 'SM', description: 'Loose, creamish beige, Silty Sand with Gravel (SM).', geolCode: 'SAND si gr', color: '#c9a958', formation: 'QUATERNARY DEPOSITS' },
      { top: 5, base: 9.95, uscs: 'SP-SM', description: 'Medium dense, creamish beige, Poorly Graded Sand with Silt (SP-SM).', geolCode: 'SAND si', color: '#b09060', formation: 'QUATERNARY DEPOSITS' }
    ],
    sptResults: [
      { depth: 0, nValue: 4, report: '1,2,2', increments: [1,0,2,0,2,0], penetration: 450 },
      { depth: 1, nValue: 20, report: '5,7,13', increments: [5,0,7,0,13,0], penetration: 450 },
      { depth: 2, nValue: 'R50', report: '9,50/100', increments: [9,0,50,0,0,0], penetration: 250 },
      { depth: 3, nValue: 21, report: '5,8,13', increments: [5,0,8,0,13,0], penetration: 450 },
      { depth: 4, nValue: 20, report: '3,8,12', increments: [3,0,8,0,12,0], penetration: 450 },
      { depth: 5, nValue: 22, report: '4,11,11', increments: [4,0,11,0,11,0], penetration: 450 },
      { depth: 6.5, nValue: 'R50', report: '17,50/50', increments: [17,0,50,0,0,0], penetration: 200 },
      { depth: 8, nValue: 46, report: '6,19,27', increments: [6,0,19,0,27,0], penetration: 450 },
      { depth: 9, nValue: 72, report: '11,32,40', increments: [11,0,32,0,40,0], penetration: 450 }
    ]
  }
]

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [boreholeLogs, setBoreholeLogs] = useState<BoreholeLog[]>(initialBoreholeLogs)
  const [activeProjectId, setActiveProjectIdInner] = useState<string | null>(null)

  const activeProject = projects.find(p => p.id === activeProjectId) || null

  const addProject = (p: Project) => setProjects((prev: Project[]) => [...prev, p])
  const updateProject = (id: string, data: Partial<Project>) => {
    setProjects((prev: Project[]) => prev.map(p => p.id === id ? { ...p, ...data } : p))
  }
  const deleteProject = (id: string) => setProjects((prev: Project[]) => prev.filter(p => p.id !== id))
  
  const addBoreholeLog = (log: BoreholeLog) => setBoreholeLogs((prev: BoreholeLog[]) => [...prev.filter(l => l.id !== log.id), log])
  const getBoreholeLog = (id: string) => boreholeLogs.find(l => l.id === id)

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      activeProject, 
      boreholeLogs,
      setActiveProjectId: setActiveProjectIdInner,
      addProject, 
      updateProject, 
      deleteProject,
      addBoreholeLog,
      getBoreholeLog
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProjects = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) throw new Error('useProjects must be used within ProjectProvider')
  return context
}
