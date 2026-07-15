import axios from "axios"
import { store } from "./app.store.js"
import { setAccessToken, setError, setUser } from "../features/auth/auth.slice.js"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})

const refreshClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    withCredentials: true,
})
// Interceptor for adding authorization header
api.interceptors.request.use((config) => {
    const accessToken = store.getState().auth.accessToken
    if (accessToken) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
})
// Interceptor for handling 401 errors and refreshing the access token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const status = error.response?.status

        if (!originalRequest || status !== 401 || originalRequest._retry) {
            return Promise.reject(error)
        }

        const requestUrl = originalRequest.url || ""
        if (requestUrl.includes("/api/auth/login") || requestUrl.includes("/api/auth/register") || requestUrl.includes("/api/auth/refresh")) {
            return Promise.reject(error)
        }

        originalRequest._retry = true

        try {
            const refreshResponse = await refreshClient.post("/api/auth/refresh")
            const { accessToken, user } = refreshResponse.data

            store.dispatch(setAccessToken(accessToken))
            if (user) {
                store.dispatch(setUser(user))
            }
            store.dispatch(setError(null))

            originalRequest.headers = originalRequest.headers || {}
            originalRequest.headers.Authorization = `Bearer ${accessToken}`

            return api(originalRequest)
        } catch (refreshError) {
            store.dispatch(setAccessToken(null))
            store.dispatch(setUser(null))
            store.dispatch(setError(refreshError.response?.data?.message || refreshError.message))
            return Promise.reject(refreshError)
        }
    }
)

export { api }