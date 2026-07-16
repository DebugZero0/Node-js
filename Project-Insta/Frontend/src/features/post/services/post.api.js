import axios from 'axios';

// common part for all api calls
const api= axios.create({
    baseURL: 'http://localhost:3000/api/posts',
    withCredentials: true,
})

export const getFeed = async () => {
    const response = await api.get('/feed');
    return response.data;
};

export const createPost = async (caption, imageFile) => {
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('image', imageFile);

    const response = await api.post('/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getMyPosts = async () => {
    const response = await api.get('/');
    return response.data;
};

export const getPostDetails = async (postId) => {
    const response = await api.get(`/details/${postId}`);
    return response.data;
};

export const likePost = async (postId) => {
    const response = await api.post(`/like/${postId}`);
    return response.data;
};