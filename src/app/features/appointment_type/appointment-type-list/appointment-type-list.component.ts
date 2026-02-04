import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgIf, NgForOf, CurrencyPipe } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import { AppointmentTypeService } from '../../../shared/services/appointment_type.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AppointmentTypeModel } from '../../../shared/models/appointment_types.model';

import { TableModule } from 'primeng/table';
import { Button, ButtonDirective } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Card } from 'primeng/card';
import {Tag} from 'primeng/tag';

@Component({
  selector: 'app-appointment-type-list',
  templateUrl: './appointment-type-list.component.html',
  styleUrl: './appointment-type-list.component.scss',
  standalone: true,
  imports: [
    TableModule,
    ButtonDirective,
    ConfirmDialog,
    Card,
    CurrencyPipe,
    Tag
  ]
})
export class AppointmentTypeListComponent implements OnInit {
  types: AppointmentTypeModel[] = [];
  loading = true;

  constructor(
    private typeService: AppointmentTypeService,
    private toast: ToastService,
    private router: Router,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadTypes();
  }

  async loadTypes(): Promise<void> {
    try {
      const res :any = await this.typeService.getMyTypes();
      this.types = (Array.isArray(res) ? res : res.data || []).map((type: any) => ({
        ...type,
        priceDecimal: parseFloat(type.price?.$numberDecimal || '0')
      }));

    } catch (error) {
      console.error('Erreur lors du chargement des prestations :', error);
      this.toast.error('Impossible de charger les prestations');
    } finally {
      this.loading = false;
    }
  }

  onAdd(): void {
    this.router.navigate(['/types/create']);
  }

  onEdit(typeId: string): void {
    this.router.navigate(['/types/edit', typeId]);
  }

  confirmDelete(typeId: string): void {
    this.confirmationService.confirm({
      message: 'Êtes-vous sûr de vouloir supprimer cette prestation ?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => this.deleteType(typeId)
    });
  }

  private async deleteType(typeId: string): Promise<void> {
    try {
      await this.typeService.deleteType(typeId);
      this.toast.success('Prestation supprimée avec succès');
      await this.loadTypes();
    } catch (error) {
      console.error('Erreur suppression :', error);
      this.toast.error('Erreur lors de la suppression de la prestation');
    }
  }
}
