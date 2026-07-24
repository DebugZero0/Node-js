import { api } from "../../../app/api.client.js"

export async function getChats() {
    const response = await api.get("/api/chats")
    return response.data
}

export async function getMessages(chatId) {
    const response = await api.get(`/api/chats/${chatId}/messages`)
    return response.data
}

export async function sendMessage(message, chatId) {
    const response = await api.post("/api/chats/message", { message, chatId })
    return response.data
}

export async function deleteChat(chatId) {
    const response = await api.delete(`/api/chats/delete/${chatId}`)
    return response.data
}

export async function updateChatTitle(chatId, title) {
    const response = await api.put(`/api/chats/update/${chatId}`, { title })
    return response.data
}

export async function logout(token) {
    const response = await api.post("/api/auth/logout", { token })
    return response.data
}
export async function uploadAttachments(files) {
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    const response = await api.post("/api/chats/attachments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
}