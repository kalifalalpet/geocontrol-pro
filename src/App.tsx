import { Routes, Route, Navigate } from 'react-router-dom'
import GlobalLayout from './components/GlobalLayout'
import Layout from './components/Layout'
import ProjectListPage from './pages/ProjectListPage'
import MasterResourcePage from './pages/MasterResourcePage'
import MasterFinancePage from './pages/MasterFinancePage'
import DashboardPage from './pages/DashboardPage'
import TechnicalLogsPage from './pages/TechnicalLogsPage'
import ResourcePage from './pages/ResourcePage'
import DataHubPage from './pages/DataHubPage'
import FinancialDashboardPage from './pages/FinancialDashboardPage'
import LoginPage from './pages/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route 
        element={
          <ProtectedRoute>
            <GlobalLayout />
          </ProtectedRoute>
        }
      >
        {/* Global Level Routes */}
        <Route path="/" element={<ProjectListPage />} />
        <Route path="/resources" element={<MasterResourcePage />} />
        <Route path="/treasury" element={<MasterFinancePage />} />

        {/* Project Level Routes */}
        <Route path="/project/:id" element={<Layout />}>
          <Route index element={<Navigate to="map" replace />} />
          <Route path="map" element={<DashboardPage />} />
          <Route path="logs" element={<TechnicalLogsPage />} />
          <Route path="resources" element={<ResourcePage />} />
          <Route path="finance" element={<FinancialDashboardPage />} />
          <Route path="data" element={<DataHubPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
