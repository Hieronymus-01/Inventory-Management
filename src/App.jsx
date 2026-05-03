import { useContext, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { SessionContext } from './contexts/SessionContext'

import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import Dashboard from './pages/admin/Dashboard'
import Inventory from './pages/admin/Inventory'
import Users from './pages/admin/Users'
import AuditLogs from './pages/admin/AuditLogs'
import EditProfile from './pages/admin/EditProfile'

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

const AdminRoute = ({ children }) => {
  const { session, profile, loading } = useContext(SessionContext)
  const navigate = useNavigate()
  useEffect(() => {
    if (!loading && !session) navigate('/login')
    if (!loading && profile && profile.role !== 'admin') navigate('/')
  }, [session, profile, loading])
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
      <Route path="/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
      <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
      <Route path="/audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App