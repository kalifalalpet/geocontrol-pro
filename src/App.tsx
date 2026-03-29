import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import TechnicalLogsPage from './pages/TechnicalLogsPage'
import ResourcePage from './pages/ResourcePage'
import DataHubPage from './pages/DataHubPage'
import FinancialDashboardPage from './pages/FinancialDashboardPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/map" replace />} />
        <Route path="map" element={<DashboardPage />} />
        <Route path="logs" element={<TechnicalLogsPage />} />
        <Route path="resources" element={<ResourcePage />} />
        <Route path="finance" element={<FinancialDashboardPage />} />
        <Route path="data" element={<DataHubPage />} />
      </Route>
    </Routes>
  )
}
