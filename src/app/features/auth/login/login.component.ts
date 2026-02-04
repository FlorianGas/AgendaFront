import {Component, inject} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../../shared/services/auth.service';
import {InputText} from 'primeng/inputtext';
import { PasswordDirective} from 'primeng/password';
import {NgIf, NgOptimizedImage} from '@angular/common';
import {ButtonDirective} from 'primeng/button';
import {Router} from '@angular/router';
import {Image} from 'primeng/image';
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    InputText,
    NgIf,
    ButtonDirective,
    PasswordDirective,
    Image,
    NgOptimizedImage
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  loginForm: FormGroup;
  errorMessage = "";
 private router =  inject(Router);
  constructor(
    private fb: FormBuilder,
    private auth: AuthService,

  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }
  async onSubmit() {
    if(this.loginForm.invalid) {
      this.errorMessage = "Veuillez remplir tous les champs correctement";
      return;
    }
    const { email, password } = this.loginForm.value;

    try {
      await this.auth.login(email, password);
      this.errorMessage = '';
    }catch(err : any) {
      console.log('ERREUR',err);
      if (err?.status === 401) {
        this.errorMessage = "Email ou mot de passe incorrect";
      }else {
        this.errorMessage = 'Une erreur est survenue, veuillez réessayer plus tard';
      }
    }

  }

  onRegister() {
  this.router.navigate(['/user/create']);
  }
}
