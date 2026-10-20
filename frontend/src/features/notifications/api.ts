import { notificationSchema, type z } from '@campusfind/contracts';
import { api } from '../../api/client';
export const listNotifications = () =>
  api<z.infer<typeof notificationSchema>[]>('listNotifications');
export const setPreferences = (inApp: boolean, email: boolean) =>
  api<{ inApp: boolean; email: boolean }>('setPreferences', { body: { inApp, email } });
