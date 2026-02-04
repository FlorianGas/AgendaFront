import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CalendarOptions, DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { AppointmentService } from '../../shared/services/appointment.service';
import { AvailabilityService } from '../../shared/services/availability.service';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';
import { AppointmentModel } from '../../shared/models/appointment.model';
import { UserService } from '../../shared/services/user.service';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { Dialog } from 'primeng/dialog';
import {Button, ButtonDirective} from 'primeng/button';
import { DatePipe, NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { ClientModel } from '../../shared/models/client.model';
import { FormsModule } from '@angular/forms';
import { AppointmentTypeModel } from '../../shared/models/appointment_types.model';
import { AppointmentTypeService } from '../../shared/services/appointment_type.service';
import { UserStore } from '../../shared/store/user.store';
import { NotificationService } from '../../shared/services/notification.service';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { Calendar } from 'primeng/calendar';
import { InputText } from 'primeng/inputtext';
import { RadioButton } from 'primeng/radiobutton';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-dashboard-pro',
  standalone: true,
  imports: [
    FullCalendarModule,
    ButtonDirective,
    Dialog,
    NgIf,
    DatePipe,
    TitleCasePipe,
    FormsModule,
    NgForOf,
    TableModule,
    DropdownModule,
    InputText,
    RadioButton,
    Button,

  ],
  templateUrl: './dashboard-pro.component.html',
  styleUrls: ['./dashboard-pro.component.scss'],
})
export class DashboardProComponent implements OnInit {
  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  calendarOptions!: CalendarOptions;
  dialogViewVisible = false;
  dialogEditVisible = false;
  dialogChoiceVisible = false;
  selectedAppointment: AppointmentModel | null = null;
  selectedDateISO = '';
  slotIdToPass: string | null = null;
  editAppointment: any = {};
  appointmentTypes: AppointmentTypeModel[] = [];
  confirmDeleteVisible = false;
  calendarLoading: boolean = true;
  showAddSlotButton: boolean = false;

  constructor(
    private appointmentService: AppointmentService,
    private availabilityService: AvailabilityService,
    private toast: ToastService,
    protected router: Router,
    private userService: UserService,
    private apoType: AppointmentTypeService,
    private userStore: UserStore,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
  ) {}

  statusOptions = [
    { label: 'Confirmé', value: 'confirmed' },
    { label: 'En attente', value: 'pending' },
    { label: 'Annulé', value: 'canceled' },
    { label: 'Terminé', value: 'completed' }
  ];

  ngOnInit(): void {
    const currentUser = this.userStore.getCurrentUser();
    this.initCalendar();
    this.loadEvents();
    if (history.state.refreshCalendar) {
      setTimeout(() => this.loadEvents(), 500);
    }
    if (currentUser?._id) {
      this.loadAppointmentTypes(currentUser._id);
    }
  }

  private initCalendar() {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'timeGridWeek',
      slotMinTime: '07:00:00',
      slotMaxTime: '20:00:00',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'timeGridWeek,timeGridDay'
      },
      displayEventTime: false,
      selectable: true,
      select: this.onDateSelect.bind(this),
      eventClick: this.onEventClick.bind(this),
      locale: 'fr',
      height: 'auto',
      events: []
    };
  }

  private async loadAppointmentTypes(proId: string): Promise<void> {
    try {
      this.appointmentTypes = await this.apoType.getTypesByPro(proId);
    } catch (error) {
      console.error('Erreur chargement prestations:', error);
      this.toast.error('Erreur de chargement des prestations.');
    }
  }

  getClientName(app: AppointmentModel): string {
    const client = app.client_id as ClientModel;
    if (client && typeof client === 'object' && client.user_id?.first_name) {
      return `${client.user_id.first_name} ${client.user_id.last_name}`;
    }
    return '—';
  }

  private async loadEvents() {
    this.calendarLoading = true;
    try {
      const [appointments, availabilityDoc] = await Promise.all([
        this.appointmentService.getMyAppointmentsPro(),
        this.availabilityService.getMyAvailability()
      ]);

      const enrichedAppointments: AppointmentModel[] = await Promise.all(
        appointments.map(async app => {
          if (typeof app.client_id === 'string') {
            const client = await this.userService.getUserById(app.client_id);
            app.client_id = client;
          }
          return app;
        })
      );

      const appointmentEvents = this.mapAppointmentsToEvents(enrichedAppointments);
      const slots = availabilityDoc?.availability ?? [];
      const availabilityEvents = this.mapAvailabilityToEvents(slots);

      const calendarApi = this.calendarComponent.getApi();
      calendarApi.removeAllEvents();
      [...appointmentEvents, ...availabilityEvents].forEach(event => {
        calendarApi.addEvent(event);
      });
    } catch (err) {
      console.error('❌ Erreur de chargement du calendrier :', err);
      this.toast.error('Erreur lors du chargement du calendrier');
    } finally {
      this.calendarLoading = false;
    }
  }

  private mapAppointmentsToEvents(appointments: AppointmentModel[]): EventInput[] {
    return appointments.map(app => {
      const typeName = app.type_id?.name ?? 'Sans type';
      const clientName = this.getClientName(app);
      let color = app.type_id?.color ?? '#ffb74d';
      if (app.status === 'canceled') color = '#e57373';

      return {
        id: app._id!,
        title: `${typeName} – ${clientName}`,
        start: new Date(app.scheduled_time),
        end: new Date(new Date(app.scheduled_time).getTime() + (app.duration_minutes ?? 30) * 60000),
        color,
        extendedProps: { isAppointment: true, appointment: app }
      };
    });
  }

  private mapAvailabilityToEvents(slots: any[]): EventInput[] {
    return slots.map(slot => ({
      id: 'slot-' + slot._id,
      title: 'Créneau libre',
      start: new Date(slot.start_time),
      end: new Date(slot.end_time),
      color: '#64b5f6',
      display: 'auto',
      editable: false,
      extendedProps: {
        isAvailability: true,
        slotId: slot._id,
        slotStart: slot.start_time
      }
    }));
  }

  private onDateSelect(selectInfo: DateSelectArg) {
    this.selectedDateISO = selectInfo.start?.toISOString() ?? '';
    this.dialogChoiceVisible = true;
  }

  private onEventClick(info: EventClickArg) {
    const props = info.event.extendedProps as any;
    this.slotIdToPass = null;
    this.showAddSlotButton = false;

    if (props.isAppointment && props.appointment) {
      this.selectedAppointment = props.appointment;

      const type = this.selectedAppointment?.type_id as AppointmentTypeModel;
      this.showAddSlotButton = !!type && typeof type === 'object' && type.allowMultipleBookings === true;

      this.dialogViewVisible = true;
    } else if (props.isAvailability) {
      this.selectedDateISO = props.slotStart;
      this.dialogChoiceVisible = true;
      this.slotIdToPass = props.slotId;
    }
  }


  onDialogClose(refresh: boolean = false) {
    this.dialogViewVisible = false;
    if (refresh) {
      this.loadEvents();
      const api = this.calendarComponent.getApi();
      api.refetchEvents?.();
    }
  }

  onChooseDispo() {
    this.dialogChoiceVisible = false;
    this.router.navigate(['/availability'], { queryParams: { date: this.selectedDateISO } });
  }

  onChooseRDV() {
    this.dialogChoiceVisible = false;
    this.router.navigate(['/appointment/create'], {
      queryParams: { date: this.selectedDateISO, slotId: this.slotIdToPass }
    });
  }

  onDeleteDispo() {
    if (!this.slotIdToPass) return;
    this.availabilityService.deleteSlot(this.slotIdToPass)
      .then(() => {
        this.toast.success('Créneau supprimé');
        this.dialogChoiceVisible = false;
        this.loadEvents();
      })
      .catch(() => {
        this.toast.error('Erreur lors de la suppression du créneau');
      });
  }

  private formatLocalDatetime(date: Date): string {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  async openEditDialog() {
    if (!this.selectedAppointment) return;
    this.dialogViewVisible = false;

    if (!this.appointmentTypes.length) {
      const user = this.userStore.getCurrentUser();
      if (user?._id) {
        await this.loadAppointmentTypes(user._id);
      }
    }

    const date = new Date(this.selectedAppointment.scheduled_time);
    const formattedDate = this.formatLocalDatetime(date);

    this.editAppointment = {
      _id: this.selectedAppointment._id!,
      type_id: this.selectedAppointment.type_id?._id ?? '',
      scheduled_time: formattedDate,
      duration_minutes: this.selectedAppointment.duration_minutes ?? 30,
      status: this.selectedAppointment.status
    };

    setTimeout(() => {
      this.dialogEditVisible = true;
    }, 0);
  }

  onAddAvailability() {
    this.router.navigate(['/availability']);
  }

  onNewAppointment() {
    this.router.navigate(['/appointment/create']);
  }

  handleAppointmentSave(data: Partial<AppointmentModel>) {
    if (!this.selectedAppointment?._id) return;

    const cleanedData = { ...data };

    if (typeof cleanedData.scheduled_time === 'string') {
      cleanedData.scheduled_time = new Date(cleanedData.scheduled_time).toISOString();
    }

    delete cleanedData.professional_id;

    this.appointmentService.updateAppointment(this.selectedAppointment._id, cleanedData)
      .then(() => {
        this.toast.success('Rendez-vous mis à jour');
        this.dialogEditVisible = false;
        this.loadEvents();
      })
      .catch(() => {
        this.toast.error('Erreur lors de la mise à jour du rendez-vous');
      });
  }

  async confirmDeleteAppointment() {
    if (!this.selectedAppointment?._id) return;

    try {
      await this.appointmentService.deleteAppointment(this.selectedAppointment._id);
      this.toast.success('Rendez-vous supprimé');

      const clientId =
        (this.selectedAppointment.client_id as ClientModel)?.user_id?._id ??
        this.selectedAppointment.client_id;

      const professionalId =
        (this.selectedAppointment.professional_id as any)?.user_id?._id ??
        this.selectedAppointment.professional_id;

      const dateString = new Date(this.selectedAppointment.scheduled_time).toLocaleString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const clientNotif = {
        userId: clientId,
        message: `Votre rendez-vous du ${dateString} a été annulé.`,
        type: 'canceled'
      };
      const proNotif = {
        userId: professionalId,
        message: `Le rendez-vous du ${dateString} a été annulé.`,
        type: 'canceled'
      };

      try {
        await Promise.all([
          this.notificationService.createNotification(clientNotif),
          this.notificationService.createNotification(proNotif)
        ]);
      } catch (notifErr) {
        console.warn('Notifications non envoyées :', notifErr);
      }

      this.dialogViewVisible = false;
      this.loadEvents();
    } catch (err) {
      console.error('Erreur suppression rendez-vous :', err);
      this.toast.error('Erreur lors de la suppression du rendez-vous');
    }
  }
  async onAddSlotFromAppointment() {
    if (!this.selectedAppointment || !this.selectedAppointment.scheduled_time) return;

    const user = this.userStore.getCurrentUser();
    if (!user?._id) return;

    const start = new Date(this.selectedAppointment.scheduled_time);
    const duration = this.selectedAppointment.duration_minutes ?? 30;

    const slots = this.splitIntoSlots(start, duration, 30); // ⏱️ 30 minutes

    try {
      await Promise.all(
        slots.map(slot =>
          this.availabilityService.addSlot({
            professional_id: user._id!,
            ...slot
          })
        )
      );

      this.toast.success(`${slots.length} créneau(x) ajouté(s).`);
      this.dialogViewVisible = false;
      this.loadEvents();
    } catch (err) {
      console.error('❌ Erreur lors de l’ajout des créneaux :', err);
      this.toast.error('Erreur lors de l’ajout des créneaux.');
    }
  }

  private splitIntoSlots(start: Date, durationMinutes: number, slotDuration = 30): { start_time: string; end_time: string; is_available: true }[] {
    const slots: { start_time: string; end_time: string; is_available: true }[] = [];
    let cursor = new Date(start);

    const end = new Date(start.getTime() + durationMinutes * 60000);

    while (cursor < end) {
      const next = new Date(cursor.getTime() + slotDuration * 60000);
      if (next > end) break;

      slots.push({
        start_time: cursor.toISOString(),
        end_time: next.toISOString(),
        is_available: true,
      });

      cursor = next;
    }

    return slots;
  }
  exportWeekCalendarCSV() {
    const calendarApi = this.calendarComponent.getApi();
    const view = calendarApi.view;
    const start = new Date(view.activeStart);
    const end = new Date(view.activeEnd);

    const events = calendarApi.getEvents().filter(ev =>
      ev.start && ev.start >= start && ev.start < end
    );

    if (!events.length) {
      this.toast.warning('Aucun événement cette semaine.');
      return;
    }

    // 📅 Configuration de la grille
    const slotStart = 7;   // 07:00
    const slotEnd = 20;    // 20:00
    const slotDuration = 30; // minutes

    const days: string[] = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }));
    }

    // En-tête CSV
    let csv = ['Heure', ...days].join(',') + '\n';

    // Générer la grille heure par heure
    for (let hour = slotStart; hour < slotEnd; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const row: string[] = [];
        const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        row.push(`"${timeLabel}"`);

        days.forEach((dayLabel, i) => {
          const dayDate = new Date(start);
          dayDate.setDate(start.getDate() + i);
          dayDate.setHours(hour, minute, 0, 0);

          const slotEvents = events.filter(ev =>
            ev.start && ev.end &&
            ev.start <= dayDate && ev.end > dayDate
          );

          if (slotEvents.length) {
            const ev = slotEvents[0]; // premier événement trouvé
            const type = (ev.extendedProps as any)?.appointment?.type_id?.name ?? '';
            const client = this.getClientName((ev.extendedProps as any)?.appointment ?? {});
            row.push(`"${ev.title} (${type} - ${client})"`);
          } else {
            row.push('""');
          }
        });

        csv += row.join(',') + '\n';
      }
    }

    // 📥 Téléchargement
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendrier-semaine-tableau.csv';
    a.click();
    URL.revokeObjectURL(url);
  }


}
