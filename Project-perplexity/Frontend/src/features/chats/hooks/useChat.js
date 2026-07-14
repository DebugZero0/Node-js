import { initializeSocketConnection } from "../service/chat.socket"
import { deleteChat, getChats, getMessages, sendMessage, updateChatTitle ,logout } from "../service/chat.api"

export const useChat = () => {
    return {
        initializeSocketConnection,
        deleteChat,
        getChats,
        getMessages,
        sendMessage,
        updateChatTitle,
        logout,
    }
}