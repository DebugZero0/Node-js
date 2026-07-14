import { api } from "../../../app/api.client.js"

export async function login(email, password) {
    try {
        const response = await api.post("/api/auth/login", { email, password })
        return response.data
    } catch (error) {
        console.error("Login failed:", error.response?.data || error.message)
        throw error
    }
}

export async function register(username, email, password) {
    try {
        const response = await api.post("/api/auth/register", { username, email, password })
        return response.data
    } catch (error) {
        console.error("Registration failed:", error.response?.data || error.message)
        throw error
    }
}

export async function refresh() {
    try {
        const response = await api.post("/api/auth/refresh")
        return response.data
    } catch (error) {
        console.error("Refresh failed:", error.response?.data || error.message)
        throw error
    }
}

export async function getMe() {
    try {
        const response = await api.get("/api/auth/get-me")
        return response.data
    } catch (error) {
        console.error("Failed to fetch user data:", error.response?.data || error.message)
        throw error
    }
}

export async function logout() {
    try {
        const response = await api.post("/api/auth/logout")
        return response.data
    } catch (error) {
        console.error("Logout failed:", error.response?.data || error.message)
        throw error
    }
}