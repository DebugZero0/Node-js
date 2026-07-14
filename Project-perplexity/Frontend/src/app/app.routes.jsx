import { createBrowserRouter } from 'react-router-dom'
import Dashboard from '../features/chats/pages/Dashboard.jsx'
import Login from '../features/auth/pages/Login.jsx'
import Register from '../features/auth/pages/Register.jsx'
import Protected from '../features/auth/component/Protected.jsx'
import Notes from '../features/auth/pages/Notes.jsx'

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
    {
        path: '/notes',
        element: <Notes />,
    },
    {
        path:'/',
        element: <Protected><Dashboard /></Protected>
    }
])