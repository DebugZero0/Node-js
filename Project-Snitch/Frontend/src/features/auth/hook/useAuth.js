import { setError, setLoading, setUserr } from '../state/auth.slice.js';
import { register } from '../services/auth.api.js';
import { useDispatch } from 'react-redux';

export const useAuth = () => {
    const dispatch = useDispatch();

    async function handleRegister({email,password,contact,fullName,isSeller=false}) {
        try {
            dispatch(setLoading(true));
            const data = await register({email,password,contact,fullName,isSeller});
            dispatch(setUserr(data.user));
        } catch (error) {
            dispatch(setError(error.message));
        }
        finally {
            dispatch(setLoading(false));
        }
    }

    return {
        handleRegister,
    };
}