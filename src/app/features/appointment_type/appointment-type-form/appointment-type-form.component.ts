import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {InputText} from 'primeng/inputtext';
import {ButtonDirective} from 'primeng/button';
import {AppointmentTypeService} from '../../../shared/services/appointment_type.service';
import {ToastService} from '../../../shared/services/toast.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ColorPicker} from 'primeng/colorpicker';
import {NgIf} from '@angular/common';
import {Checkbox} from 'primeng/checkbox';

@Component({
  selector: 'app-appointment-type-form',
  imports: [
    ReactiveFormsModule,
    InputText,
    ButtonDirective,
    ColorPicker,
    NgIf,
    Checkbox
  ],
  templateUrl: './appointment-type-form.component.html',
  styleUrl: './appointment-type-form.component.scss'
})
export class AppointmentTypeFormComponent implements OnInit {

form!: FormGroup;
loading = false;
constructor(
  private fb : FormBuilder,
  private typeService : AppointmentTypeService,
  private toast : ToastService,
  private route: ActivatedRoute,
  protected router: Router
) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:             ['', Validators.required],
      default_duration: [30, [Validators.required, Validators.min(1)]],
      price:            [0,  [Validators.required, Validators.min(0)]],
      description:      [''],
      color:            ['#90a4ae', Validators.required],
      allowMultipleBookings: [false]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.form.value;
    this.typeService.createType(payload)
      .then(() => {
        this.toast.success('Type de prestation créé');
        this.router.navigate(['/types']);
      })
      .catch(err => {
        console.error('Erreur création du type :', err);
        this.toast.error('Erreur lors de la création');
      })
      .finally(() => this.loading = false);
  }
}
