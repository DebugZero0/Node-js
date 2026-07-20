import {
    initializeSocketConnection,
    sendMessageSocket,
    onAiStart,
    onAiChunk,
    onAiDone,
    onAiError,
} from "../service/chat.socket"
import { deleteChat, getChats, getMessages, updateChatTitle, logout } from "../service/chat.api"

export const useChat = () => {
    return {
        initializeSocketConnection,
        sendMessageSocket,
        onAiStart,
        onAiChunk,
        onAiDone,
        onAiError,
        deleteChat,
        getChats,
        getMessages,
        updateChatTitle,
        logout,
    }
}