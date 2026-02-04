import { Component } from '@angular/core';
import { Button, ButtonDirective } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { NgIf } from '@angular/common';
import { Password } from 'primeng/password';
import { Router } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-client-create',
  imports: [
    Button,
    ButtonDirective,
    DropdownModule,
    FormsModule,
    InputText,
    Message,
    NgIf,
    Password,
    ReactiveFormsModule
  ],
  templateUrl: './client-create.component.html',
  styleUrl: './client-create.component.scss'
})
export class ClientCreateComponent {
  form: FormGroup;
  loading = false;
  showAddress = false;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone_number: ['', Validators.required],
      role: ['client'],
      address: this.fb.group({
       street: [''], postal_code: [''], city: [''],country: ['']
      }),
    });
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const payload = this.form.value;

    try {
      await this.userService.createUser(payload);
      this.toast.success('Utilisateur client créé avec succès');
      this.router.navigate(['/clients']);
    } catch (err) {
      this.toast.error('Échec de la création du client. Veuillez vérifier les champs ou réessayer plus tard.');
    } finally {
      this.loading = false;
    }
  }
}
