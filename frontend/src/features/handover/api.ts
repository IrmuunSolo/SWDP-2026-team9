import { handoverSchema, type z } from '@campusfind/contracts';
import { api } from '../../api/client';
type Handover = z.infer<typeof handoverSchema>;
export const assignOwner = (postId: string, chatId: string) =>
  api<Handover>('assignOwner', { params: { postId }, body: { chatId } });
export const confirmHandover = (handoverId: string) =>
  api<Handover>('confirmHandover', { params: { handoverId } });
