import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RequestListPage from './pages/RequestListPage'
import CreateRequestPage from './pages/CreateRequestPage'
import RequestDetailPage from './pages/RequestDetailPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminConfigPage from './pages/AdminConfigPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<RequestListPage />} />
                  <Route path="/requests/new" element={<CreateRequestPage />} />
                  <Route path="/requests/:id" element={<RequestDetailPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/config" element={<AdminConfigPage />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
