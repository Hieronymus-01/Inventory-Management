import { useContext, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { SessionContext } from './contexts/SessionContext'

import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp.jsx'
import Dashboard from './pages/admin/Dashboard'
import Inventory from './pages/admin/Inventory'

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useContext(SessionContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !session) navigate('/login')
  }, [session, loading])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  )
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App