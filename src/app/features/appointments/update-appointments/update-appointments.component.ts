import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { OnInit, Component } from '@angular/core';
import { AppointmentModel } from '../../../shared/models/appointment.model';
import { ClientModel } from '../../../shared/models/client.model';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { AppointmentTypeService } from '../../../shared/services/appointment_type.service';
import { UserService } from '../../../shared/services/user.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { UserStore } from '../../../shared/store/user.store';
import { ToastService } from '../../../shared/services/toast.service';
import {InputText} from 'primeng/inputtext';
import {Calendar} from 'primeng/calendar';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonDirective} from 'primeng/button';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-update-appointments',
  templateUrl: './update-appointments.component.html',
  styleUrls: ['./update-appointments.component.scss'],
  imports: [
    ReactiveFormsModule,
    InputText,
    Calendar,
    DropdownModule,
    ButtonDirective,
    NgIf
  ]
})
export class UpdateAppointmentsComponent implements OnInit {
  appointmentForm!: FormGroup;
  appointmentId!: string;
  appointment!: AppointmentModel;
  clients: ClientModel[] = [];
  appointmentTypes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private appointmentTypeService: AppointmentTypeService,
    private userService: UserService,
    private notificationService: NotificationService,
    private userStore: UserStore,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.appointmentId = this.route.snapshot.paramMap.get('id')!;
    console.log('Appointment ID:', this.appointmentId);
    if (!this.appointmentId) {
      this.toast.error('ID de rendez-vous manquant');
      this.router.navigate(['/dashboard-pro']);
      return;
    }
    this.initForm();
    const currentUser = this.userStore.getCurrentUser();
    this.loadInitialData();
  }

  private initForm(): void {
    this.appointmentForm = this.fb.group({
      professional_id: [{ value: '', disabled: true }, Validators.required],
      scheduled_time: ['', Validators.required],
      duration_minutes: [{ value: '', disabled: true }, Validators.required],
      client_id: ['', Validators.required],
      type_id: [{ value: '', disabled: true }, Validators.required],
      status: ['', Validators.required],
    });
  }

  private async loadInitialData(): Promise<void> {
    try {
      await Promise.all([this.loadClients(), this.loadAppointment()]);
    } catch {
      this.toast.error('Erreur lors du chargement des données initiales');
    }
  }

  private async loadClients(): Promise<void> {
    const rawClients = await this.userService.getClients();
    this.clients = rawClients
      .filter(c => !!c.user_id)
      .map(c => ({
        ...c,
        name: `${c.user_id.first_name} ${c.user_id.last_name}`
      }));
  }


  private async loadAppointment(): Promise<void> {
    this.appointment = await this.appointmentService.getAppointmentById(this.appointmentId);
    console.log('RDV récupéré :', this.appointment);

    if (!this.appointment) {
      this.toast.error('Rendez-vous introuvable');
      this.router.navigate(['/dashboard-pro']);
      return;
    }

    const scheduledTime = this.appointment.scheduled_time ? new Date(this.appointment.scheduled_time) : null;

    this.appointmentForm.patchValue({
      professional_id: typeof this.appointment.professional_id === 'object' ? this.appointment.professional_id._id : this.appointment.professional_id,
      scheduled_time: scheduledTime,
      duration_minutes: this.appointment.duration_minutes ?? 30,
      client_id: typeof this.appointment.client_id === 'object' ? this.appointment.client_id._id : this.appointment.client_id,
      type_id: typeof this.appointment.type_id === 'object' ? this.appointment.type_id._id : this.appointment.type_id,
      status: this.appointment.status,
    });

    await this.loadAppointmentTypes();
  }

  private async loadAppointmentTypes(): Promise<void> {
    const userId = this.userStore.getCurrentUser()?._id;
    if (!userId) return;

    try {
      const pro = await this.userService.getProfessionalByUserId(userId);
      if (pro?._id) {
        this.appointmentTypes = await this.appointmentTypeService.getTypesByPro(pro._id);
      }
    } catch (err) {
      console.error('Erreur chargement professional ou prestations', err);
      this.toast.error('Erreur chargement du professionnel');
    }
  }


  async onSubmit(): Promise<void> {
    if (this.appointmentForm.invalid) return;

    const formValue = this.appointmentForm.getRawValue();
    const payload: Partial<AppointmentModel> = {
      scheduled_time: new Date(formValue.scheduled_time).toISOString(),
      duration_minutes: formValue.duration_minutes,
      client_id: typeof formValue.client_id === 'object' ? formValue.client_id._id : formValue.client_id,
      type_id: typeof formValue.type_id === 'object' ? formValue.type_id._id : formValue.type_id,
      status: formValue.status,
      professional_id: typeof formValue.professional_id === 'object' ? formValue.professional_id._id : formValue.professional_id
    };

    try {
      const updated = await this.appointmentService.updateAppointment(this.appointmentId, payload);
      this.toast.success('Rendez-vous mis à jour');

      const dateStr = new Date(updated.scheduled_time).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });

      await Promise.all([
        this.notificationService.createNotification({
          userId: typeof updated.client_id === 'string' ? updated.client_id : updated.client_id._id,
          message: `Votre rendez-vous du ${dateStr} a été mis à jour.`,
          type: 'updated',
        }),
        this.notificationService.createNotification({
          userId: typeof updated.professional_id === 'string' ? updated.professional_id : updated.professional_id._id,
          message: `Rendez-vous modifié pour le ${dateStr}`,
          type: 'updated',
        }),
      ]);

      this.router.navigate(['/dashboard-pro']);
    } catch (err) {
      console.error(err);
      this.toast.error('Erreur lors de la mise à jour du rendez-vous');
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard-pro']);
  }

  getProfessionalName(): string | null {
    const pro: any = this.appointment?.professional_id;
    if (
      pro &&
      typeof pro === 'object' &&
      pro.user_id?.first_name &&
      pro.user_id?.last_name
    ) {
      return `${pro.user_id.first_name} ${pro.user_id.last_name}`;
    }
    return 'Non défini';
  }
}
