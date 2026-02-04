import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentModel } from '../../shared/models/appointment.model';
import { AppointmentService } from '../../shared/services/appointment.service';
import { AppointmentTypeService } from '../../shared/services/appointment_type.service';
import { AvailabilityService } from '../../shared/services/availability.service';
import { UserService } from '../../shared/services/user.service';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmationService } from 'primeng/api';
import { NgIf, NgForOf, DatePipe, TitleCasePipe, NgClass } from '@angular/common';
import { Calendar } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { Dialog } from 'primeng/dialog';
import { ButtonDirective } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { NotificationService } from '../../shared/services/notification.service';
import { NotificationModel } from '../../shared/models/notification.model';
import { UserStore } from '../../shared/store/user.store';
import {GoogleCalendarClientService} from '../../shared/services/googleCalendar.service';

interface ProfessionalOption {
  _id: string;
  label: string;
  business_name?: string;
  specialization?: string;
  raw: any;
}

@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  templateUrl: './dashboard-client.component.html',
  styleUrls: ['./dashboard-client.component.scss'],
  imports: [
    NgIf,
    NgForOf,
    DatePipe,
    TitleCasePipe,
    ReactiveFormsModule,
    DropdownModule,
    Calendar,
    PanelModule,
    Dialog,
    ButtonDirective,
    ConfirmDialog,

  ],
  encapsulation: ViewEncapsulation.None
})
export class DashboardClientComponent implements OnInit {
  upcomingAppointments: AppointmentModel[] = [];
  pastAppointments: AppointmentModel[] = [];
  nextAppointment?: AppointmentModel;

  professionals: ProfessionalOption[] = [];
  appointmentTypes: any[] = [];
  availableSlots: any[] = [];

  dialogVisible = false;
  editing = false;
  editingId: string | undefined = '';
  isCancelling = false;

  appointmentForm: FormGroup;
  minDate = new Date();
  selectedSlotId: string | undefined = '';
  selectedSlotIso: string | undefined = '';

  viewDialogVisible = false;
  selectedAppointment: AppointmentModel | null = null;

  notifications: NotificationModel[] = [];
  dateString = '';

  constructor(
    private appointmentService: AppointmentService,
    private appointmentTypeService: AppointmentTypeService,
    private availabilityService: AvailabilityService,
    private userService: UserService,
    private toast: ToastService,
    private fb: FormBuilder,
    private router: Router,
    private confirmationService: ConfirmationService,
    private notificationService: NotificationService,
    private userStore: UserStore,
    private googleCalendarClientService: GoogleCalendarClientService
  ) {
    this.appointmentForm = this.fb.group({
      professional_id: ['', Validators.required],
      type_id: ['', Validators.required],
      selected_date: ['', Validators.required],
      scheduled_time: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.reloadAppointments();
    await this.loadNotifications();
  }

  viewAppointment(appointment: AppointmentModel) {
    this.selectedAppointment = appointment;
    this.viewDialogVisible = true;
  }

  closeViewDialog() {
    this.viewDialogVisible = false;
    this.selectedAppointment = null;
  }

  private async reloadAppointments() {
    try {
      const res = await this.appointmentService.getMyAppointments();
      const appointments = (res as AppointmentModel[]).map(a => ({
        ...a,
        scheduled_time: new Date(a.scheduled_time)
      }));

      const now = new Date();
      this.upcomingAppointments = appointments
        .filter(a => a.scheduled_time > now)
        .sort((a, b) => a.scheduled_time.getTime() - b.scheduled_time.getTime());

      this.pastAppointments = appointments
        .filter(a => a.scheduled_time <= now)
        .sort((a, b) => b.scheduled_time.getTime() - a.scheduled_time.getTime());

      this.nextAppointment = this.upcomingAppointments[0];
    } catch (e) {
      this.toast.error('Erreur lors du chargement des rendez-vous');
    }
  }

  private async loadProfessionals(): Promise<void> {
    try {
      const rawPros: any[] = await this.userService.getProfessionals();
      this.professionals = rawPros.map(p => {
        let label = 'Professionnel inconnu';
        if (p.user_id?.first_name && p.user_id?.last_name) {
          label = `${p.user_id.first_name} ${p.user_id.last_name}`;
        } else if (p.user?.firstName && p.user?.lastName) {
          label = `${p.user.firstName} ${p.user.lastName}`;
        } else if (p.first_name && p.last_name) {
          label = `${p.first_name} ${p.last_name}`;
        } else if (p.business_name) {
          label = p.business_name;
        }
        return {_id: p._id, label, business_name: p.business_name, specialization: p.specialization, raw: p};
      });
    } catch (error) {
      console.error('Erreur chargement professionnels :', error);
      this.toast.error('Erreur chargement professionnels');
    }
  }

  async openCreateDialog() {
    this.dialogVisible = true;
    this.editing = false;
    this.editingId = '';
    this.appointmentForm.reset();
    this.availableSlots = [];

    await this.loadProfessionals();
    const firstProId = this.professionals[0]?._id;
    if (firstProId) {
      this.appointmentForm.patchValue({professional_id: firstProId});
      try {
        this.appointmentTypes = await this.appointmentTypeService.getTypesByPro(firstProId);
      } catch {
        this.toast.error('Erreur lors du chargement des prestations.');
        this.appointmentTypes = [];
      }
    }
  }

  async onProfessionalChange() {
    const proId: string = this.appointmentForm.value.professional_id;
    if (!proId) {
      this.appointmentTypes = [];
      this.appointmentForm.patchValue({type_id: '', scheduled_time: ''});
      this.availableSlots = [];
      return;
    }
    try {
      this.appointmentTypes = await this.appointmentTypeService.getTypesByPro(proId);
    } catch {
      this.toast.error('Erreur lors du chargement des prestations.');
      this.appointmentTypes = [];
    }
    this.appointmentForm.patchValue({type_id: '', scheduled_time: ''});
    this.availableSlots = [];
  }

  async onTypeChange() {
    this.appointmentForm.patchValue({scheduled_time: ''});
    await this.loadAvailableSlots();
  }

  async onDateSelected() {
    this.appointmentForm.patchValue({scheduled_time: ''});
    await this.loadAvailableSlots();
  }

  private async loadAvailableSlots() {
    const {professional_id, type_id, selected_date} = this.appointmentForm.value;

    if (professional_id && type_id && selected_date) {
      const duration = this.appointmentTypes.find(t => t._id === type_id)?.default_duration || 30;
      const dateISO = new Date(selected_date).toISOString();

      try {
        const raw: Array<{ id: string; start_time: string; display: string }> =
          await this.availabilityService.getAvailableSlots(professional_id, dateISO, duration);

        const now = new Date();

        this.availableSlots = raw
          .filter(slot => new Date(slot.start_time) > now) // filtrer les créneaux passés
          .map(slot => ({
            value: slot.id,
            label: slot.display,
            iso: slot.start_time
          }));

      } catch {
        this.toast.error('Erreur lors du chargement des créneaux disponibles.');
        this.availableSlots = [];
      }
    }
  }


  async saveAppointment(): Promise<void> {
    if (this.appointmentForm.invalid || !this.selectedSlotId || !this.selectedSlotIso) {
      return;
    }
    const {professional_id, type_id} = this.appointmentForm.value;
    const selectedType = this.appointmentTypes.find(t => t._id === type_id)!;
    const duration = selectedType.default_duration;

    try {
      await this.availabilityService.bookSlotClient(
        this.selectedSlotId,
        professional_id,
        this.selectedSlotIso,
        duration
      );
    } catch (err: any) {
      this.toast.error(err.error?.error || 'Le créneau n’est plus disponible');
      return;
    }

    const currentUser = this.userStore.getCurrentUser()!;
    const payload = {
      client_id: currentUser._id,
      professional_id,
      type_id,
      scheduled_time: this.selectedSlotIso,
      duration_minutes: duration,
      status: 'confirmed' as const
    };

    try {
      await this.appointmentService.createAppointment(payload);
      this.toast.success('Rendez-vous confirmé et dispos mises à jour');
      this.dialogVisible = false;
      this.dateString = new Date(this.selectedSlotIso).toLocaleString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const clientNotif = {
        userId: payload.client_id,
        message: `Votre rendez-vous est confirmé pour le ${this.dateString}`,
        type: 'created'
      };
      const proNotif = {
        userId: payload.professional_id,
        message: `Vous avez un nouveau rendez-vous le ${this.dateString}`,
        type: 'created'
      };

      try {
        await Promise.all([
          this.notificationService.createNotification(clientNotif),
          this.notificationService.createNotification(proNotif)
        ]);
      } catch (notifErr) {
        console.error('Erreur création des notifications :', notifErr);
      }

      await this.reloadAppointments();
    } catch (err) {
      console.error('Erreur lors de la création du rendez-vous :', err);
      this.toast.error('Erreur lors de la création du rendez-vous');
    }
  }

  openEditDialog(appointment: AppointmentModel) {
    this.editing = true;
    this.dialogVisible = true;
    this.editingId = appointment._id!

    const proId = typeof appointment.professional_id === 'string'
      ? appointment.professional_id
      : appointment.professional_id._id;
    const typeId = typeof appointment.type_id === 'string'
      ? appointment.type_id
      : appointment.type_id._id;

    this.appointmentForm.patchValue({
      professional_id: proId,
      type_id: typeId,
      selected_date: new Date(appointment.scheduled_time),
      scheduled_time: appointment.scheduled_time
    });
    this.loadAvailableSlots();
  }

  confirmCancelAppointment(appointment: AppointmentModel) {
    const now = new Date();
    const scheduled = new Date(appointment.scheduled_time);
    const diffHours = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      this.toast.warning('Impossible d’annuler ce rendez-vous : délai inférieur à 24h.');
      return;
    }

    if (appointment.status === 'canceled' || appointment.status === 'completed') {
      this.toast.warning('Ce rendez-vous ne peut plus être annulé.');
      return;
    }

    this.confirmationService.confirm({
      message: `Voulez-vous vraiment annuler le rendez-vous du ${scheduled.toLocaleDateString()} ?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.performCancel(appointment._id!)
    });
  }


  private async performCancel(id: string) {
    this.isCancelling = true;
    try {
      await this.appointmentService.cancelAppointment(id);
      this.toast.success('Rendez-vous annulé.');
      await this.reloadAppointments();
    } catch {
      this.toast.error('Erreur lors de l’annulation');
    } finally {
      this.isCancelling = false;
    }
  }

  selectSlot(slotId: string, startIso: string): void {
    this.selectedSlotId = slotId;
    this.selectedSlotIso = startIso;
    this.appointmentForm.patchValue({scheduled_time: startIso});
  }

  private async loadNotifications(): Promise<void> {
    try {
      this.notifications = await this.notificationService.getMyNotifications();
    } catch {
      this.toast.error('Impossible de charger les notifications');
    }
  }

  async syncWithGoogleCalendar() {
    try {
      await this.googleCalendarClientService.syncAppointments().toPromise();
      this.toast.success('Synchronisation Google Calendar réussie');
      await this.reloadAppointments(); // recharge les RDV locaux
    } catch (error) {
      this.toast.error('Erreur lors de la synchronisation Google Calendar');
    }
  }
}
