import { Component, OnInit } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Calendar } from 'primeng/calendar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AvailabilityService } from '../../../shared/services/availability.service';
import { ToastService } from '../../../shared/services/toast.service';
import { TimesSlotModel } from '../../../shared/models/availability.model';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { AppointmentModel } from '../../../shared/models/appointment.model';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-availability-create',
  standalone: true,
  imports: [
    ButtonDirective,
    InputText,
    Calendar,
    ReactiveFormsModule
  ],
  templateUrl: './availability-create.component.html',
  styleUrl: './availability-create.component.scss'
})
export class AvailabilityCreateComponent implements OnInit {
  batchForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private availabilityService: AvailabilityService,
    private appointmentService: AppointmentService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const initialDate = this.route.snapshot.queryParamMap.get('date');

    this.batchForm = this.fb.group({
      start_date: [initialDate ? new Date(initialDate) : '', Validators.required],
      end_date: [initialDate ? new Date(initialDate) : '', Validators.required],
      start_hour: ['09:00', Validators.required],
      end_hour: ['17:00', Validators.required],
      duration: [30, [Validators.required, Validators.min(5)]],
    });
  }

  async generateAndSubmitSlots() {
    const { start_date, end_date, start_hour, end_hour, duration } = this.batchForm.value;

    const start = new Date(start_date);
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999); // ✅ Inclure toute la journée de fin

    const rawSlots = this.generateSlots(start, end, start_hour, end_hour, duration);

    try {
      const appointments = await this.appointmentService.getAppointmentsInRange(start, end);

      const filteredSlots = rawSlots.filter(slot =>
        !appointments.some(app =>
          this.isOverlapping(
            slot.start_time,
            slot.end_time,
            new Date(app.scheduled_time),
            new Date(new Date(app.scheduled_time).getTime() + (app.duration_minutes ?? 0) * 60000)
          )
        )
      );

      if (filteredSlots.length === 0) {
        this.toast.info('Aucun créneau disponible : tous en conflit avec des rendez-vous.');
        return;
      }

      await this.availabilityService.addAvailability({ availability: filteredSlots });
      this.toast.success(`${filteredSlots.length} créneaux ajoutés avec succès.`);
      this.batchForm.reset();
    } catch (error) {
      console.error('❌ Erreur de génération ou de filtrage des créneaux :', error);
      this.toast.error('Erreur lors de la génération ou du filtrage des créneaux.');
    }
  }

  generateSlots(
    startDate: Date,
    endDate: Date,
    startHour: string,
    endHour: string,
    duration: number
  ): TimesSlotModel[] {
    const slots: TimesSlotModel[] = [];
    const day = new Date(startDate);

    while (day <= endDate) {
      const [hStart, mStart] = startHour.split(':').map(Number);
      const [hEnd, mEnd] = endHour.split(':').map(Number);

      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hStart, mStart, 0);
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hEnd, mEnd, 0);

      let cursor = new Date(dayStart);
      while (cursor < dayEnd) {
        const next = new Date(cursor.getTime() + duration * 60000);
        if (next <= dayEnd) {
          slots.push({
            start_time: new Date(cursor),
            end_time: new Date(next),
            is_available: true
          });
        }
        cursor = next;
      }

      day.setDate(day.getDate() + 1);
    }

    return slots;
  }

  isOverlapping(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && start2 < end1;
  }
}
