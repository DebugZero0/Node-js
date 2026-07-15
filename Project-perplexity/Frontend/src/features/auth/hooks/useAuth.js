import { useDispatch } from 'react-redux' // Importing the useDispatch hook from react-redux to dispatch actions to the Redux store.
import { register, login, refresh, getMe } from '../services/auth.api.js'
import { setUser, setAccessToken, setLoading, setError,} from '../auth.slice.js'
import { api } from '../../../app/api.client.js'

export function useAuth() {
    const dispatch = useDispatch()

    async function handleRegister({ email, username, password }) {
        dispatch(setLoading(true))
        try {
            return await register(username, email, password)
        } catch (error) {
            dispatch(setError(error.response?.data?.message || error.message))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleLogin({ email, password }) {
        dispatch(setLoading(true))
        try {
            const data = await login(email, password)
            dispatch(setAccessToken(data.accessToken))
            dispatch(setUser(data.user))
            dispatch(setError(null))
            return data.user
        } catch (error) {
            dispatch(setError(error.response?.data?.message || error.message))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    // This function is responsible for refreshing the user's access token.
    async function handleRefresh() { 
        dispatch(setLoading(true))
        try {
            const data = await refresh()
            dispatch(setAccessToken(data.accessToken))
            dispatch(setUser(data.user))
            dispatch(setError(null))
            return data.user
        } catch (error) {
            dispatch(setAccessToken(null))
            dispatch(setUser(null))
            dispatch(setError(error.response?.data?.message || error.message))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    // This function is responsible for fetching the current user's information.
    async function handleGetMe() {
        dispatch(setLoading(true))
        try {
            const data = await getMe()
            dispatch(setUser(data.user))
            dispatch(setError(null))
            return data.user
        } catch (error) {
            dispatch(setError(error.response?.data?.message || error.message))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }
    // This function is responsible for logging out the user.And it clears the access token and user information from the Redux store.
    async function handleLogout() {
        dispatch(setLoading(true))
        try {
            await api.post("/api/auth/logout") 
            // why not use logout() from auth.api.js? Because we want to handle the logout process directly here, including clearing the Redux store.
            dispatch(setAccessToken(null))
            dispatch(setUser(null))
            dispatch(setError(null))
        } catch (error) {
            dispatch(setError(error.response?.data?.message || error.message))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    return { handleRegister, handleLogin, handleRefresh, handleGetMe, handleLogout }
}

// dispatch (setAccessToken(null))- Means that the access token is being cleared from the Redux store when the user logs out.