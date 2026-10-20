import { chatSchema, chatMessageSchema, type z } from '@campusfind/contracts';
import { api } from '../../api/client';
// Irmuun, weeks 12–13: UI adapters. Narmandakh implements ChatModule; currently 501.
type Chat = z.infer<typeof chatSchema>;
type Message = z.infer<typeof chatMessageSchema>;
export const createChat = (postId: string) => api<Chat>('createChat', { body: { postId } });
export const listChats = () => api<Chat[]>('listChats');
export const getChat = (chatId: string) => api<Chat>('getChat', { params: { chatId } });
export const listMessages = (chatId: string, after?: string) =>
  api<Message[]>('listMessages', {
    params: { chatId },
    query: { limit: 50, ...(after ? { after } : {}) },
  });
export const sendMessage = (chatId: string, body: string) =>
  api<Message>('sendMessage', { params: { chatId }, body: { body } });
