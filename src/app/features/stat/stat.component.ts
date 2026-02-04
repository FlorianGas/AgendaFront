import { Component, OnInit } from '@angular/core';
import { AppointmentModel } from '../../shared/models/appointment.model';
import { AppointmentTypeModel } from '../../shared/models/appointment_types.model';
import { AppointmentService } from '../../shared/services/appointment.service';
import { AppointmentTypeService } from '../../shared/services/appointment_type.service';
import { ToastService } from '../../shared/services/toast.service';
import { UserStore } from '../../shared/store/user.store';
import { Calendar } from 'primeng/calendar';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import {NgIf, TitleCasePipe} from '@angular/common';
import {TableModule} from 'primeng/table';
import {UIChart} from 'primeng/chart';

@Component({
  selector: 'app-stat',
  imports: [Calendar, FormsModule, DropdownModule, NgIf, TableModule, UIChart, TitleCasePipe],
  templateUrl: './stat.component.html',
  styleUrls: ['./stat.component.scss'] // <-- correction ici
})
export class StatComponent implements OnInit {
  appointments: AppointmentModel[] = [];
  appointmentType: AppointmentTypeModel[] = []; // <-- initialisé vide
  filteredAppointments: AppointmentModel[] = [];

  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedType: string | null = null;
  selectedStatus: string | null = null;

  chartData: any;
  chartOptions: any;

  statusOptions = [
    { label: 'Tous', value: null },
    { label: 'Confirmé', value: 'confirmed' },
    { label: 'Terminé', value: 'completed' },
    { label: 'Annulé', value: 'canceled' },
    { label: 'En attente', value: 'pending' }
  ];

  constructor(
    private appointmentService: AppointmentService,
    private appointmentTypeService: AppointmentTypeService,
    private toast: ToastService,
    private userStore: UserStore
  ) {}

  async ngOnInit() {
    const user = this.userStore.getCurrentUser();
    if (!user?._id) return;

    try {
      this.appointmentType = await this.appointmentTypeService.getTypesByPro(user._id);
      this.loadAppointments();
    } catch (error) {
      this.toast.error('Erreur lors du chargement des types de rendez-vous');
    }
  }

  async loadAppointments() {
    try {
      this.appointments = await this.appointmentService.getMyAppointmentsPro();
      this.filteredAppointments = [...this.appointments];
      this.updateChart();
    } catch (error) {
      this.toast.error('Erreur lors du chargement des données');
    }
  }

  filterData() {
    this.filteredAppointments = this.appointments.filter(app => {
      const date = new Date(app.scheduled_time);
      const isInDateRange =
        (!this.startDate || date >= this.startDate) &&
        (!this.endDate || date <= this.endDate);

      const matchesType = !this.selectedType || app.type_id?._id === this.selectedType;
      const matchesStatus = !this.selectedStatus || app.status === this.selectedStatus;

      return isInDateRange && matchesType && matchesStatus;
    });
    this.updateChart();
  }

  updateChart() {
    const typeCounts: { [key: string]: number } = {};

    this.filteredAppointments.forEach(app => {
      const typeName = app.type_id?.name || 'Sans type';
      typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
    });

    this.chartData = {
      labels: Object.keys(typeCounts),
      datasets: [{
        label: 'Nombre de rendez-vous',
        data: Object.values(typeCounts),
        backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EC407A', '#AB47BC', '#8D6E63', '#78909C', '#FF7043', '#9CCC65', '#B39DDB'],
        borderWidth: 1
      }]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Répartition des rendez-vous par type' }
      }
    };
  }
  get dropdownOptions() {
    return this.appointmentType.map(t => ({ label: t.name, value: t._id }));
  }

}
