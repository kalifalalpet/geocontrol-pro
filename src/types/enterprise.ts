export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'planned'

export interface Project {
  id: string
  name: string
  location: string
  client: string
  coordinates: [number, number] // [lat, lng]
  budgetSAR: number
  spentSAR: number
  status: ProjectStatus
  startDate: string
  endDate?: string
  teamIds: string[]    // References to Master Personnel
  assetIds: string[]   // References to Master Assets
  pointIds?: string[]  // References to Project Survey Points
  metersPlanned: number
  metersCompleted: number
  description: string
}

/* --- Borehole & Geotechnical Structures --- */

export interface LithologyLayer {
  top: number
  base: number
  description: string
  uscs: string
  geolCode: string
  color: string
  formation: string
}

export interface SPTDataPoint {
  depth: number
  nValue: number | string // e.g. 24 or 'R50'
  report: string         // e.g. '5,8,11'
  increments: number[]   // blows per 75mm
  penetration: number    // total pen in mm
}

export interface BoreholeLog {
  id: string             // Matches SitePoint.id
  projectId: string
  boreholeId: string     // Human-friendly ID
  location: {
    easting: number
    northing: number
    elevation: number
  }
  totalDepth: number
  drilledDate: string
  method: string
  lithology: LithologyLayer[]
  sptResults: SPTDataPoint[]
  moistureData?: { depth: number; value: number }[]
  densityData?: { depth: number; value: number }[]
  // Extra metadata extracted from AGS PROJ group
  projectName?: string
  projectLocation?: string
  projectClient?: string
}

export interface Treasury {
  totalBalanceSAR: number
  allocatedSAR: number
  availableSAR: number
  transactions: Transaction[]
}

export interface Transaction {
  id: string
  date: string
  amount: number
  type: 'allocation' | 'deposit' | 'expense'
  targetProjectId?: string
  description: string
}
