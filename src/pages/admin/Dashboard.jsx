import React, { useContext } from 'react'
import { SessionContext } from '../../contexts/SessionContext'
import AdminDashboard from './AdminDashboard'
import StaffDashboard from './StaffDashboard'

const Dashboard = () => {
    const { profile, loading } = useContext(SessionContext)

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
        </div>
    )

    return profile?.role === 'admin' ? <AdminDashboard /> : <StaffDashboard />
}

export default Dashboard