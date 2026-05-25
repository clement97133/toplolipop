import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import GeneralPage from './pages/GeneralPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import CalendarPage from './pages/CalendarPage'
import CollaboratorsPage from './pages/CollaboratorsPage'
import CollaboratorDetailPage from './pages/CollaboratorDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/general" replace />} />
          <Route path="/general" element={<GeneralPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/collaborators" element={<CollaboratorsPage />} />
          <Route path="/collaborators/:id" element={<CollaboratorDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
