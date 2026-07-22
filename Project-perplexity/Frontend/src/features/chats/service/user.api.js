import { api } from "../../../app/api.client.js"

export async function updateUserName(newUsername) {
    const response = await api.put(`/api/user/update-username`, { newName: newUsername })
    return response.data
}

export async function deleteUser() {
    const response = await api.delete(`/api/user/delete-user`)
    return response.data
}

export async function getQuota() {
    const response = await api.get(`/api/user/quota`)
    return response.data
}