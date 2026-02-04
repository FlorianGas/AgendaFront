// src/app/services/notification.service.ts
import { Injectable } from '@angular/core';
import { ApiService }      from './api.service';
import { NotificationModel } from '../models/notification.model';
interface NotificationPayload {
  userId:  string;
  message: string;
  type:    string;
  sent_at?: string;
  status?:  string;
}
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly base = 'notification';

  constructor(private api: ApiService) {}

  async getMyNotifications(): Promise<NotificationModel[]> {
    return this.api.get<NotificationModel[]>(`${this.base}/me`);
  }

  async markAsRead(id: string): Promise<void> {
    await this.api.put<void>(`${this.base}/${id}/read`, {});
  }

  async clearAll(): Promise<void> {
    await this.api.delete<void>(`${this.base}/me`);
  }
  sendNotification(data: { userId: string, message: string, type: string }): Promise<void> {
    return this.api.post('notifications', data);
  }

  async createNotification(payload: { userId: string; message: string; type: string; sent_at?: string;
    status?:  string; }): Promise<NotificationModel> {
    return this.api.post<NotificationModel>(`${this.base}/create`, payload);
  }
}
