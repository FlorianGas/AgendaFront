import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { UserStore } from '../../../shared/store/user.store';
import { AppointmentModel } from '../../../shared/models/appointment.model';
import { ClientModel } from '../../../shared/models/client.model';
import { ProfessionalModel } from '../../../shared/models/professional.model';
import {UserService} from '../../../shared/services/user.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  templateUrl: 'list-appointments.component.html',
  styleUrls: ['./list-appointments.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
})
export class ListAppointmentsComponent implements OnInit {
  appointments: AppointmentModel[] = [];
  filteredAppointments: AppointmentModel[] = [];

  dateFilter = new FormControl('');
  personFilter = new FormControl('');
  statusFilter = new FormControl('');

  userRole: 'client' | 'professional' | null = null;

  constructor(
    private appointmentService: AppointmentService,
    private userStore: UserStore,
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const currentUser = this.userStore.getCurrentUser();
    this.userRole = currentUser?.role ?? null;

    this.loadAppointments();
    this.setupFilters();
  }

  async loadAppointments(): Promise<void> {
    try {
      let data: AppointmentModel[] =
        this.userRole === 'professional'
          ? await this.appointmentService.getMyAppointmentsPro()
          : await this.appointmentService.getMyAppointments();

      if (this.userRole === 'client') {
        data = await Promise.all(
          data.map(async (app) => {
            if (typeof app.professional_id === 'string') {
              try {
                const pro = await this.userService.getProfessionalByUserId(app.professional_id);
                return { ...app, professional_id: pro };
              } catch (err) {
                console.warn(`❌ Impossible de charger le professionnel ${app.professional_id}`, err);
                return app;
              }
            }
            return app;
          })
        );
      }

      this.appointments = data;
      this.filteredAppointments = [...data];
    } catch (error) {
      console.error('Erreur lors du chargement des rendez-vous', error);
    }
  }


  setupFilters(): void {
    this.dateFilter.valueChanges.subscribe(() => this.applyFilters());
    this.personFilter.valueChanges.subscribe(() => this.applyFilters());
    this.statusFilter.valueChanges.subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    const date = this.dateFilter.value;
    const person = this.personFilter.value?.toLowerCase();
    const status = this.statusFilter.value;

    this.filteredAppointments = this.appointments.filter((a) => {
      // ✅ Comparaison sur la date au format ISO (YYYY-MM-DD)
      const matchDate = !date || new Date(a.scheduled_time).toISOString().startsWith(date);

      let personFullName = '';

      if (
        this.userRole === 'professional' &&
        typeof a.client_id === 'object' &&
        a.client_id !== null &&
        'user_id' in a.client_id
      ) {
        const client = a.client_id as unknown as ClientModel;
        const user = client.user_id;
        personFullName = user
          ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.toLowerCase()
          : '';
      }

      if (
        this.userRole === 'client' &&
        typeof a.professional_id === 'object' &&
        a.professional_id !== null &&
        'user_id' in a.professional_id
      ) {
        const pro = a.professional_id as unknown as ProfessionalModel;
        const user = pro.user_id;
        personFullName = user
          ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.toLowerCase()
          : '';
      }

      const matchPerson = !person || personFullName.includes(person);
      const matchStatus = !status || a.status === status;

      return matchDate && matchPerson && matchStatus;
    });
  }
  getPersonName(a: AppointmentModel): string {
    if (this.userRole === 'professional') {
      const client = a.client_id as any;
      return client?.user_id
        ? `${client.user_id.first_name ?? ''} ${client.user_id.last_name ?? ''}`
        : '—';
    }

    if (this.userRole === 'client') {
      const pro = a.professional_id as any;
      return pro?.user_id
        ? `${pro.user_id.first_name ?? ''} ${pro.user_id.last_name ?? ''}`
        : '—';
    }

    return '—';
  }

}
