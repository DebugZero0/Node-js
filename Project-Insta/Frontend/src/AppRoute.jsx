import React from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router'
import { useEffect, useState } from 'react'

import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import Feed from './features/post/pages/Feed'
import { useAuth } from './features/auth/hooks/useAuth'

function ProtectedRoute({ children }) {
    const { user, loading, handleGetMe } = useAuth()
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        const run = async () => {
            await handleGetMe()
            setChecked(true)
        }
        run()
    }, [])

    if (loading || !checked) {
        return <h1>Loading session...</h1>
    }

    if (!user) {
        return <Navigate to='/login' replace />
    }

    return children
}

function AppRoutes(){
    return (
       <BrowserRouter>
            <Routes>
                <Route path='/' element={<Navigate to='/login' replace />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/dashboard' element={<h1>Welcome to 4 Layer Architechture of React</h1>} />
                <Route path='/feed' element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            </Routes>
       </BrowserRouter>
    )
}

export default AppRoutes
