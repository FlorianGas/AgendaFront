import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserModel } from '../../../shared/models/user.model';
import { ClientModel } from '../../../shared/models/client.model';
import { ProfessionalModel } from '../../../shared/models/professional.model';
import { UserService } from '../../../shared/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserStore } from '../../../shared/store/user.store';
import { NgIf } from '@angular/common';
import { InputText } from 'primeng/inputtext';
import { ButtonDirective } from 'primeng/button';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  selector: 'app-detail-user',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    InputText,
    ButtonDirective,
    ProgressSpinner
  ],
  templateUrl: './detail-user.component.html',
  styleUrls: ['./detail-user.component.scss']
})
export class DetailUserComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  loading = false;
  user!: UserModel;
  role!: 'professional' | 'client';
  professional?: ProfessionalModel;
  client?: ClientModel;

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toast: ToastService,
    private userStore: UserStore
  ) {}

  ngOnInit() {
    // Subscribe to user changes
    this.subscriptions.add(
      this.userStore.user$.subscribe(u => {
        if (u) {
          this.user = u;
          this.role = u.role as any;
          this.patchFormUser();
        }
      })
    );
    this.loadData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private async loadData() {
    this.loading = true;
    const currentUser = this.userStore.getCurrentUser();
    if (!currentUser) {
      this.toast.error('Utilisateur non authentifié');
      this.loading = false;
      return;
    }

    this.user = currentUser;
    this.role = currentUser.role as any;

    try {
      if (this.role === 'professional') {
        this.professional = await this.userService.getProfessionalProfile(this.user._id);
      } else {
        this.client = await this.userService.getClientProfile(this.user._id);
      }
    } catch (err) {
      this.toast.error('Impossible de charger les données de rôle');
      console.error(err);
    } finally {
      this.initForm();
      this.loading = false;
    }
  }

  private initForm() {
    this.form = this.fb.group({
      first_name:  [this.user.first_name, Validators.required],
      last_name:   [this.user.last_name, Validators.required],
      email:       [{ value: this.user.email, disabled: true }],
      password:    [''],
      phone_number:[this.user.phone_number],
      address: this.fb.group({
        street:      [this.user.address?.street],
        postal_code: [this.user.address?.postal_code],
        city:        [this.user.address?.city],
        country:     [this.user.address?.country]
      })
    });

    if (this.role === 'professional' && this.professional) {
      this.form.addControl('professional', this.fb.group({
        business_name:    [this.professional.business_name],
        specialization:   [this.professional.specialization],
        tax_number:       [this.professional.tax_number],
        business_address: [this.professional.business_address],
        phone_number:     [this.professional.phone_number],
        is_admin:         [this.professional.is_admin]
      }));
    }

    if (this.role === 'client' && this.client) {
      this.form.addControl('client', this.fb.group({
        preferences: [this.client.preferences],
        is_active:   [this.client.is_active]
      }));
    }
  }

  private patchFormUser() {
    if (!this.form) return;
    this.form.patchValue({
      first_name: this.user.first_name,
      last_name:  this.user.last_name,
      phone_number: this.user.phone_number,
      address: {
        street:      this.user.address?.street,
        postal_code: this.user.address?.postal_code,
        city:        this.user.address?.city,
        country:     this.user.address?.country
      }
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue() as any;
    const { password, professional, client, ...baseData } = raw;

    if (typeof password === 'string' && password.trim().length > 0) {
      baseData.password = password;
    }

    try {
      const updatedUser = await this.userService.updateUser(this.user._id, baseData);

      this.userStore.updateUserData(updatedUser);

      this.patchFormUser();

      if (professional) {
        await this.userService.updateProfessionalProfile(this.user._id, professional);
      }
      if (client) {
        await this.userService.updateClientProfile(this.user._id, client);
      }

      this.toast.success('Profil mis à jour avec succès');
    } catch (err: any) {
      console.error(err);
      this.toast.error(err.error?.message || 'Erreur lors de la mise à jour');
    }
  }
}
