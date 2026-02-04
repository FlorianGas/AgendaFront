import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../shared/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-client-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, ButtonModule],
  templateUrl: './client-update.component.html'
})
export class ClientUpdateComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  userId: string = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private userService: UserService,
    private toast: ToastService,
    protected router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('id') ?? '';
    if (!this.userId) {
      this.toast.error('ID client manquant dans l’URL');
      this.router.navigate(['/clients']);
      return;
    }

    this.buildForm();
    this.loadClient();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  private async loadClient(): Promise<void> {
    try {
      const user = await this.userService.getUserById(this.userId);
      this.form.patchValue(user);
    } catch {
      this.toast.error('Erreur lors du chargement du client');
      this.router.navigate(['/clients']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading = true;
    try {
      await this.userService.updateUser(this.userId, this.form.value);
      this.toast.success('Client mis à jour avec succès');
      this.router.navigate(['/clients']);
    } catch {
      this.toast.error('Erreur lors de la mise à jour du client');
    } finally {
      this.loading = false;
    }
  }
}
