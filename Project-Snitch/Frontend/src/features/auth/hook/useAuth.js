import { setError, setLoading, setUser } from '../state/auth.slice.js';
import { register,login } from '../services/auth.api.js';
import { useDispatch } from 'react-redux';

export const useAuth = () => {
    const dispatch = useDispatch();

    async function handleRegister({email,password,contact,fullName,isSeller=false}) {
        try {
            dispatch(setLoading(true));
            dispatch(setError(null));
            const data = await register({email,password,contact,fullName,isSeller});
            dispatch(setUser(data.user));
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            dispatch(setError(message));
        }
        finally {
            dispatch(setLoading(false));
        }
    }
    async function handleLogin({ email, password }) {
        try {
            dispatch(setLoading(true));
            const data = await login({ email, password });
            dispatch(setUser(data.user));
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            dispatch(setError(message));
        } finally {
            dispatch(setLoading(false));
        }
    }
        
    return {
        handleRegister,
        handleLogin,
    };
}