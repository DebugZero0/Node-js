import {Router} from 'express';
import { sendMessage , getChats , getMessages , deleteChat , updateChatTitle} from '../controller/chats.controller.js';
import { authUser } from '../middlewire/auth.middlewire.js';
import { enforceMessageQuota } from '../middlewire/rateLimiter.middlewire.js';
import { uploadAttachments } from '../controller/attachment.controller.js';
import { uploadMiddleware } from '../middlewire/upload.middlewire.js';

const chatsRoutes = Router();

chatsRoutes.post('/message', authUser, enforceMessageQuota, sendMessage);
chatsRoutes.post('/attachments', authUser, uploadMiddleware.array('files', 5), uploadAttachments);
chatsRoutes.get('/', authUser, getChats);
chatsRoutes.get('/:chatId/messages', authUser, getMessages);
chatsRoutes.delete('/delete/:chatId', authUser, deleteChat);
chatsRoutes.put('/update/:chatId', authUser, updateChatTitle);

export default chatsRoutes;