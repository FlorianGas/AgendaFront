import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelModule } from 'primeng/panel';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';

import { NotificationService } from '../../services/notification.service';
import { NotificationModel } from '../../models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    PanelModule,
    ScrollPanelModule,
    DividerModule,
    ButtonModule,
    CardModule
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  providers: [MessageService]
})
export class NotificationsComponent implements OnInit {
  public notifications: NotificationModel[] = [];
  public loading = false;

  constructor(
    private notifService: NotificationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  private async loadNotifications(): Promise<void> {
    this.loading = true;
    try {
      this.notifications = await this.notifService.getMyNotifications();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de charger les notifications.'
      });
    } finally {
      this.loading = false;
    }
  }

  public async markAsRead(notif: NotificationModel): Promise<void> {
    if (notif.status !== 'sent') return;

    try {
      await this.notifService.markAsRead(notif._id);
      notif.status = 'read';
      this.messageService.add({
        severity: 'success',
        summary: 'Lu',
        detail: 'Notification marquée comme lue.'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de marquer comme lue.'
      });
    }
  }

  public async clearAll(): Promise<void> {
    try {
      await this.notifService.clearAll();
      this.notifications = [];
      this.messageService.add({
        severity: 'info',
        summary: 'Vidé',
        detail: 'Toutes les notifications ont été supprimées.'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de supprimer les notifications.'
      });
    }
  }
}
