import React from 'react'
import { router } from './app.routes.jsx'
import { RouterProvider } from 'react-router-dom' 
import { useAuth } from '../features/auth/hooks/useAuth.js'
import {useEffect} from 'react'

function App() {
  const { handleRefresh } = useAuth()

  useEffect(() => {
    void handleRefresh().catch(() => {})
  }, [])

  return (
    <RouterProvider router={router} />
  )
}

export default App
