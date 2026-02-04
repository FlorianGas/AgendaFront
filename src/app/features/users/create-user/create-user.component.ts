import { Component , OnInit } from '@angular/core';
import {Button, ButtonDirective} from 'primeng/button';
import {NgIf} from '@angular/common';
import {InputText} from 'primeng/inputtext';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {DropdownModule} from 'primeng/dropdown';
import {Password, PasswordDirective} from 'primeng/password';
import {Router, RouterLink} from '@angular/router';
import {UserService} from '../../../shared/services/user.service';
import {ToastService} from '../../../shared/services/toast.service';
import {Message} from 'primeng/message';


@Component({
  selector: 'app-create-user',
  imports: [
    ButtonDirective,
    NgIf,
    InputText,
    ReactiveFormsModule,
    DropdownModule,
    Message,
    Password,
    Button
  ],
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.scss'
})
export class CreateUserComponent  {
  form : FormGroup;
  loading = false;
  showAddress = false;

  roleOptions = [
    { label: 'Client', value: 'client' },
    { label: 'Professionnel', value: 'professional' },
  ];

  constructor(
    private fb : FormBuilder,
    private router: Router,
    private userService: UserService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required , Validators.email]],
      password: ['', [Validators.required , Validators.minLength(8)]],
      phone_number: ['', Validators.required],
      role: ['', Validators.required],
      address: this.fb.group({
        street: [''],
        postal_code: [''],
        city: [''],
        country: ['']
      }),
      business_name: [''],
      specialization: [''],
      tax_number: [''],
    });
  }
  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const data = this.form.value;

    const { business_name, specialization, tax_number, ...commonFields } = data;
    const payload = {
      ...commonFields,
      ...(data.role === 'professional' && { business_name, specialization, tax_number }),
    };

    try {
      await this.userService.createUser(payload);
      this.toast.success('Utilisateur créé avec succès');
      this.router.navigate(['/login']);
    } catch (err) {
      this.toast.error('Échec de la création de l’utilisateur. Veuillez vérifier les champs ou réessayer plus tard.');
    } finally {
      this.loading = false;
    }
  }

  BackToLogin() {
    this.router.navigate(['/login']);
  }
}


