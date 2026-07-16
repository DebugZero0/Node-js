import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api/users',
    withCredentials: true,
});

export const followUser = async (username) => {
    const response = await api.post(`/follow/${username}`);
    return response.data;
};

export const acceptFollowRequest = async (username) => {
    const response = await api.post(`/follow/accept/${username}`);
    return response.data;
};

export const rejectFollowRequest = async (username) => {
    const response = await api.post(`/follow/reject/${username}`);
    return response.data;
};

export const unfollowUser = async (username) => {
    const response = await api.post(`/unfollow/${username}`);
    return response.data;
};
