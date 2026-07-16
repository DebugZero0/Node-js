import { useContext } from "react";
import { AuthContext } from "../auth.context.jsx";
import { getMe,login,register,logout } from "../services/auth.api";

export function useAuth(){
    const context = useContext(AuthContext) // consume the context
    const {user,setUser,loading,setLoading} = context // destructure the context to get the state and functions

    const handleLogin = async (username, password) => {
        setLoading(true)
        try{
            const response = await login(username,password) // calls the api 
            if (response?.user) {
                setUser(response.user) // set the response to the user state in the context
                return true
            }
            return false
        }
        catch(error){
            console.error('Error logging in user:', error)
            return false
        }
        finally{
            setLoading(false)
        }
    }

    const handleRegister= async (username,email,password,bio = '',profileImage = '') => {
        setLoading(true)
        try{
            const response = await register(username,email,password,bio,profileImage)
            if (response?.user) {
                setUser(response.user)
                return true
            }
            return false
        }
        catch(error){
            console.error('Error registering user:', error)
            return false
        }
        finally{
            setLoading(false)
        }
    }

    const handleGetMe = async () => {
        setLoading(true)
        try {
            const response = await getMe()
            if (response?.user) {
                setUser(response.user)
                return response.user
            }
            setUser(null)
            return null
        } catch {
            setUser(null)
            return null
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try{
            await logout()
            setUser(null)
            return true
        }
        catch(error){
            console.error('Error logging out user:', error)
            return false
        }
        finally{
            setLoading(false)
        }
    }

    return{
        user,
        loading,
        handleLogin,
        handleRegister,
        handleLogout,
        handleGetMe
    }
}

// Hooks manages the data came from Api layer and store it in the state layer (context)

