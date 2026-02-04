import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentTypeService } from '../../../shared/services/appointment_type.service';
import { ToastService } from '../../../shared/services/toast.service';
import { NgIf } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import {ColorPicker} from 'primeng/colorpicker';
import {InputNumber} from 'primeng/inputnumber';
import {AppointmentTypeModel} from '../../../shared/models/appointment_types.model';
import {Checkbox} from 'primeng/checkbox';

@Component({
  selector: 'app-appointment-type-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    InputTextModule,
    ButtonModule,
    ColorPicker,
    InputNumber,
    Checkbox
  ],
  templateUrl: './appointment-type-edit.component.html',
  styleUrls: ['./appointment-type-edit.component.scss']
})
export class AppointmentTypeEditComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  typeId!: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    protected router: Router,
    private appointmentTypeService: AppointmentTypeService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.typeId = this.route.snapshot.paramMap.get('id')!;
    // Ajout du champ 'color' au formulaire
    this.form = this.fb.group({
      name: ['', Validators.required],
      default_duration: [30, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      color: ['#90a4ae', Validators.required] ,
      allowMultipleBookings: [false]
    });
    this.loadType();
  }

  private async loadType(): Promise<void> {
    this.loading = true;
    try {
      const type = await this.appointmentTypeService.getTypeById(this.typeId);
      console.log('Type chargé:', type);
      // Patch la couleur depuis la DB
      const rawPrice = type.price;
      const priceValue =
        typeof rawPrice === 'object' && rawPrice.$numberDecimal
          ? parseFloat(rawPrice.$numberDecimal)
          : Number(rawPrice);

      this.form.patchValue({
        name: type.name,
        default_duration: type.default_duration,
        price: priceValue,
        color: type.color,
        description: type.description,
        allowMultipleBookings: type.allowMultipleBookings
      });

    } catch (err) {
      console.error('Erreur chargement du type:', err);
      this.toast.error('Impossible de charger le type');
    } finally {
      this.loading = false;
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const raw = this.form.getRawValue();

    // ON ENVOIE PRICE COMME NUMBER, PAS COMME OBJET
    const payload: Partial<AppointmentTypeModel> = {
      name:             raw.name,
      default_duration: raw.default_duration,
      price:            raw.price,      // <- un simple number
      description:      raw.description,
      allowMultipleBookings: raw.allowMultipleBookings,
      color:            raw.color
    };

    try {
      await this.appointmentTypeService.updateType(this.typeId, payload);
      this.toast.success('Type de rendez-vous mis à jour');
      this.router.navigate(['/types']);
    } catch (err) {
      console.error('Erreur mise à jour du type:', err);
      this.toast.error('Erreur lors de la mise à jour');
    } finally {
      this.loading = false;
    }
  }

}
