import axios from 'axios';

const authApiInstance=axios.create({
    baseURL: 'http://localhost:5000/api/auth',
    withCredentials: true,
});

export async function register({email,password,contact,fullName,isSeller=false}) {
    const response = await authApiInstance.post('/register', {email,password,contact,fullName,isSeller});
    return response.data;
}