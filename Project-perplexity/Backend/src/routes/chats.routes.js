import {Router} from 'express';
import { sendMessage , getChats , getMessages , deleteChat , updateChatTitle} from '../controller/chats.controller.js';
import { authUser } from '../middlewire/auth.middlewire.js';
import { enforceMessageQuota } from '../middlewire/rateLimiter.middlewire.js';

const chatsRoutes = Router();

// Full route: /api/chats/message
chatsRoutes.post('/message', authUser, enforceMessageQuota, sendMessage);
chatsRoutes.get('/', authUser, getChats);
chatsRoutes.get('/:chatId/messages', authUser, getMessages);
chatsRoutes.delete('/delete/:chatId', authUser, deleteChat);
chatsRoutes.put('/update/:chatId', authUser, updateChatTitle);

export default chatsRoutes;