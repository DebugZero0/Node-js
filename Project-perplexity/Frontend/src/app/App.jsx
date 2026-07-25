import React, { useEffect, useState } from 'react'
import { router } from './app.routes.jsx'
import { RouterProvider } from 'react-router-dom'
import { useAuth } from '../features/auth/hooks/useAuth.js'
import Loading from '../features/loading/pages/Loading.jsx'

function App() {
  const { handleRefresh } = useAuth()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    void handleRefresh().catch(() => {})
  }, [])

  if (showSplash) {
    return <Loading duration={3200} onFinish={() => setShowSplash(false)} />
  }

  return <RouterProvider router={router} />
}

export default App