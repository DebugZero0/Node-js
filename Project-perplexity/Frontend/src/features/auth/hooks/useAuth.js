import { useDispatch } from 'react-redux'
import { register, login, refresh, getMe } from '../services/auth.api.js'
import { setUser, setAccessToken, setLoading, setError } from '../auth.slice.js'

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

    async function handleLogout() {
        dispatch(setAccessToken(null))
        dispatch(setUser(null))
        dispatch(setError(null))
    }

    return { handleRegister, handleLogin, handleRefresh, handleGetMe, handleLogout }
}

// dispatch (setAccessToken(null))- Means that the access token is being cleared from the Redux store when the user logs out.