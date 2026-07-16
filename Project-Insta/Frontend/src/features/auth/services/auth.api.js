// To communicate with the backend API, we use Axios to send HTTP requests.
import axios from 'axios'

/*
    Create an Axios instance with default configuration..
    to avoid repeating the base URL and credentials in every request
*/

const api= axios.create({
    baseURL:'http://localhost:3000/api/auth',
    withCredentials:true // Include cookies in requests
})

export async function register(username,email,password,bio = '',profileImage = '') {
    try{
        const response = await api.post('/register', {
            username,
            email,
            password,
            bio,
            profileImage
        }) 
        return response.data

    } catch (error) {
        console.error('Error registering user:', error)
        throw error
    }
}

export async function login(username,password) {
    try{
        const response = await api.post('/login', {
            username,
            password
        })
        return response.data
    } catch (error) {
        console.error('Error logging in user:', error)
        throw error
    }
}

export async function logout() {
    try{
        const response = await api.post('/logout')
        return response.data
    } catch (error) {
        console.error('Error logging out user:', error)
        throw error
    }
}

export async function getMe() {
    try{
        const response = await api.post('/get-me')
        return response.data
    } catch (error) {
        console.error('Error fetching user data:', error)
        throw error
    }
}