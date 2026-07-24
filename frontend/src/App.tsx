import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import RequestListPage from './pages/RequestListPage'
import CreateRequestPage from './pages/CreateRequestPage'
import RequestDetailPage from './pages/RequestDetailPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<RequestListPage />} />
          <Route path="/requests/new" element={<CreateRequestPage />} />
          <Route path="/requests/:id" element={<RequestDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
