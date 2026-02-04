import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../shared/services/auth.service';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { UserService } from '../../../shared/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AppointmentTypeService } from '../../../shared/services/appointment_type.service';
import { AvailabilityService } from '../../../shared/services/availability.service';
import { UserStore } from '../../../shared/store/user.store';
import { AppointmentTypeModel } from '../../../shared/models/appointment_types.model';
import {ProfessionalModel} from '../../../shared/models/professional.model';
import {NotificationModel} from '../../../shared/models/notification.model';
import {NotificationService} from '../../../shared/services/notification.service';



@Component({
  selector: 'app-appointment-create',
  standalone: true,
  templateUrl: './appointment-create.component.html',
  styleUrls: ['./appointment-create.component.scss'],
  imports: [
    ReactiveFormsModule,
    DropdownModule,
    CalendarModule,
    ButtonModule,
    InputTextModule,
    NgIf
  ]
})
export class AppointmentCreateComponent implements OnInit {
  form!: FormGroup;
  clients: any[] = [];
  appointmentTypes: AppointmentTypeModel[] = [];
  loading = false;
  selectedSlotId: string | null = null;
  professionals: any[] = [];

  notifications: NotificationModel[] = [];
  dateString = '';
  constructor(
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private availabilityService: AvailabilityService,
    private userService: UserService,
    private toast: ToastService,
    private apoType: AppointmentTypeService,
    private router: Router,
    private userStore: UserStore,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  get isProfessional(): boolean {
    return this.userStore.getCurrentRole() === 'professional';
  }

  ngOnInit(): void {
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    const slotParam = this.route.snapshot.queryParamMap.get('slotId');
    this.selectedSlotId = slotParam;
    const initialDate = dateParam ? new Date(dateParam) : null;
    const currentUser = this.userStore.getCurrentUser();

    this.form = this.fb.group({
      professional_id: [this.isProfessional ? currentUser?._id : '', this.isProfessional ? [] : Validators.required],
      client_id: [this.isProfessional ? '' : currentUser?._id, this.isProfessional ? Validators.required : []],
      type_id: ['', Validators.required],
      scheduled_time: [initialDate, Validators.required],
      duration_minutes: [0, Validators.required]
    });

    if (this.isProfessional) {
      this.loadClients();
      if (currentUser?._id) {
        this.loadAppointmentTypes(currentUser._id);
      }
    } else {
      this.loadProfessionals();
    }

    this.form.get('type_id')?.valueChanges.subscribe(typeId => {
      const selectedType = this.appointmentTypes.find(t => t._id === typeId);
      this.form.get('duration_minutes')?.setValue(selectedType?.default_duration ?? 30);
    });

    this.form.get('professional_id')?.valueChanges.subscribe(proId => {
      if (proId) this.loadAppointmentTypes(proId);
    });
  }

  private async loadClients(): Promise<void> {
    try {
      const rawClients = await this.userService.getClients();
      this.clients = rawClients
        .filter(c => !!c.user_id)
        .map(c => ({
          ...c,
          _id: c._id,
          label: `${c.user_id.first_name} ${c.user_id.last_name}`
        }));
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      this.toast.error('Erreur de chargement des clients.');
    }
  }

  private async loadProfessionals(): Promise<void> {
    try {
      const rawPros: ProfessionalModel[] = await this.userService.getProfessionals();

      this.professionals = rawPros.map(p => ({
        _id: p._id,
        label: `${p.user_id.first_name} ${p.user_id.last_name}`,
        business_name: p.business_name,
        specialization: p.specialization,
        user_id: p.user_id
      }));
    } catch (error) {
      console.error('Erreur chargement professionnels:', error);
      this.toast.error('Erreur chargement professionnels');
    }
  }



  private async loadAppointmentTypes(proId: string): Promise<void> {
    try {
      this.appointmentTypes = await this.apoType.getTypesByPro(proId);
    } catch (error) {
      console.error('Erreur chargement prestations:', error);
      this.toast.error('Erreur de chargement des prestations.');
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.selectedSlotId) {
      console.warn('⛔ Formulaire invalide ou slot manquant :', this.form.value, 'SlotId:', this.selectedSlotId);
      this.toast.error("Veuillez compléter le formulaire correctement.");
      return;
    }

    const raw = this.form.getRawValue();
    let professionalId = raw.professional_id;

    // 🔍 Si client : récupérer l'ID du pro à partir de user_id
    if (!this.isProfessional) {
      try {
        const pro = await this.userService.getProfessionalByUserId(raw.professional_id);
        professionalId = pro._id;
        console.log('✅ ID professionnel récupéré pour le client :', professionalId);
      } catch (error) {
        console.error("❌ Erreur récupération pro par user_id :", error);
        this.toast.error("Erreur lors de la récupération du professionnel.");
        return;
      }
    }

    // 🔍 Vérifier et récupérer le créneau choisi
    let scheduledDate: string;
    try {
      const availability = await this.availabilityService.getMyAvailability();
      console.log('📋 Créneaux disponibles reçus :', availability.availability);

      const slot = availability.availability.find((s: any) => s._id?.toString() === this.selectedSlotId);
      console.log('📌 Slot sélectionné =', this.selectedSlotId);
      console.log('🎯 Slot trouvé =', slot);

      if (!slot) {
        const type = this.appointmentTypes.find(t => t._id === raw.type_id);

        if (type?.allowMultipleBookings) {
          console.log("🔁 Créneau inexistant, mais la prestation autorise les doubles RDV. Création auto...");
          try {
            await this.availabilityService.addSlot({
              professional_id: professionalId,
              start_time: raw.scheduled_time.toISOString(),
              end_time: new Date(new Date(raw.scheduled_time).getTime() + raw.duration_minutes * 60000).toISOString(),
              is_available: true
            });

            this.toast.success("Créneau automatiquement créé pour double RDV.");
            scheduledDate = new Date(raw.scheduled_time).toISOString();
            this.form.patchValue({ scheduled_time: new Date(scheduledDate) });
            console.log('🕒 Date du créneau créé automatiquement :', scheduledDate);

            // ✅ ➕ Déclaration de payload ICI
            const payload = {
              client_id: typeof raw.client_id === 'object' ? raw.client_id._id : raw.client_id,
              professional_id: professionalId,
              type_id: typeof raw.type_id === 'object' ? raw.type_id._id : raw.type_id,
              scheduled_time: scheduledDate,
              duration_minutes: raw.duration_minutes,
              status: 'confirmed' as const
            };

            return this.finishCreation(payload, scheduledDate);

          } catch (createErr) {
            console.error("❌ Erreur création de créneau :", createErr);
            this.toast.error("Impossible de créer un créneau automatiquement.");
            return;
          }
        } else {
          this.toast.error("Le créneau sélectionné est introuvable ou expiré.");
          return;
        }
      }


      scheduledDate = new Date(slot!.start_time).toISOString();
      this.form.patchValue({ scheduled_time: new Date(scheduledDate) });
      console.log('🕒 Date du créneau retenu :', scheduledDate);

    } catch (error) {
      console.error("❌ Erreur récupération des disponibilités :", error);
      this.toast.error("Impossible de vérifier le créneau.");
      return;
    }

    const payload = {
      client_id: typeof raw.client_id === 'object' ? raw.client_id._id : raw.client_id,
      professional_id: professionalId,
      type_id: typeof raw.type_id === 'object' ? raw.type_id._id : raw.type_id,
      scheduled_time: scheduledDate,
      duration_minutes: raw.duration_minutes,
      status: 'confirmed' as const
    };

    console.log('📦 Payload complet à envoyer :', payload);

    this.loading = true;

    try {
      const bookingData = {
        professional_id: payload.professional_id,
        scheduled_time: scheduledDate,
        duration_minutes: payload.duration_minutes
      };

      console.log('📅 Réservation du créneau avec :', bookingData);
      await this.availabilityService.bookSlot(this.selectedSlotId!, bookingData);

      const createdAppointment = await this.appointmentService.createAppointment(payload);
      console.log('✅ Rendez-vous créé :', createdAppointment);

      const dateString = new Date(scheduledDate).toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      await Promise.allSettled([
        this.notificationService.createNotification({
          userId: payload.client_id,
          message: `Votre rendez-vous est confirmé pour le ${dateString}`,
          type: 'created'
        }),
        this.notificationService.createNotification({
          userId: raw.professional_id,
          message: `Vous avez un nouveau rendez-vous le ${dateString}`,
          type: 'created'
        })
      ]);

      this.toast.success('Rendez-vous créé avec succès.');
      this.router.navigate(['/dashboard']);

    } catch (err) {
      console.error('❌ Erreur lors de la création du rendez-vous :', err);
      this.toast.error('Erreur lors de la création du rendez-vous.');
    } finally {
      this.loading = false;
    }
  }
  private async finishCreation(payload: any, scheduledDate: string): Promise<void> {
    this.loading = true;

    try {
      const bookingData = {
        professional_id: payload.professional_id,
        scheduled_time: scheduledDate,
        duration_minutes: payload.duration_minutes
      };

      console.log('📅 Réservation du créneau avec :', bookingData);
      await this.availabilityService.bookSlot(this.selectedSlotId!, bookingData);

      const createdAppointment = await this.appointmentService.createAppointment(payload);
      console.log('✅ Rendez-vous créé :', createdAppointment);

      const dateString = new Date(scheduledDate).toLocaleString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      await Promise.allSettled([
        this.notificationService.createNotification({
          userId: payload.client_id,
          message: `Votre rendez-vous est confirmé pour le ${dateString}`,
          type: 'created'
        }),
        this.notificationService.createNotification({
          userId: payload.professional_id,
          message: `Vous avez un nouveau rendez-vous le ${dateString}`,
          type: 'created'
        })
      ]);

      this.toast.success('Rendez-vous créé avec succès.');
      this.router.navigate(['/dashboard']);
    } catch (err) {
      console.error('❌ Erreur lors de la création du rendez-vous :', err);
      this.toast.error('Erreur lors de la création du rendez-vous.');
    } finally {
      this.loading = false;
    }
  }






}
