// notification.model.ts
export interface NotificationModel {
  _id: string;
  user_id: string;
  message: string;
  type: 'email' | 'sms' | 'push' | 'created' | 'updated' | 'canceled';
  sent_at?: string;
  status?: string;
}
