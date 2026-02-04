import {
  Component,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Table } from 'primeng/table';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NgIf, NgForOf } from '@angular/common';
import { UserService } from '../../../shared/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ClientModel } from '../../../shared/models/client.model';
import { UserModel } from '../../../shared/models/user.model';
import { Router } from '@angular/router';


@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    NgIf,

  ],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss']
})
export class ClientListComponent implements OnInit {
  clients: ClientModel[] = [];
  form!: FormGroup;
  dialogVisible = false;
  isEditing = false;
  loading = false;

  @ViewChild('table') table!: any;

  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadClients();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      _id: [''],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['', Validators.required]
    });
  }

  private async loadClients(): Promise<void> {
    try {
      this.clients = (await this.userService.getClients()).filter(
        client => client.user_id && client.user_id.first_name
      );

    } catch {
      this.toast.error('Erreur lors de la récupération des clients');
    }
  }

  onNew(): void {
    this.router.navigate(['clients/create']);
  }

  onEdit(client: ClientModel): void {
    this.isEditing = true;
    this.dialogVisible = true;

    this.form.patchValue({
      _id: client.user_id._id,
      first_name: client.user_id.first_name,
      last_name: client.user_id.last_name,
      email: client.user_id.email,
      phone_number: client.user_id.phone_number
    });
  }

  async onDelete(client: ClientModel): Promise<void> {
    const confirmDelete = confirm(`Supprimer le client ${client.user_id.first_name} ${client.user_id.last_name} ?`);
    if (!confirmDelete) return;

    this.loading = true;
    try {
      await this.userService.deleteUser(client.user_id._id);
      this.toast.success('Client supprimé avec succès');
      this.loadClients();
    } catch {
      this.toast.error('Erreur lors de la suppression du client');
    } finally {
      this.loading = false;
    }
  }

  async onSave(): Promise<void> {
    if (this.form.invalid) return;

    const { _id, first_name, last_name, email, phone_number } = this.form.value;
    const payload: Partial<UserModel> = { first_name, last_name, email, phone_number };
    this.loading = true;

    try {
      if (this.isEditing && _id) {
        await this.userService.updateUser(_id, payload);
        this.toast.success('Client mis à jour avec succès');
      } else {
        await this.userService.createUser(payload);
        this.toast.success('Client créé avec succès');
      }
      this.dialogVisible = false;
      this.loadClients();
    } catch {
      this.toast.error('Erreur lors de la création ou de la mise à jour du client');
    } finally {
      this.loading = false;
    }
  }

  onGlobalSearch(event: any): void {
    const value = event.target.value;
    this.table.filterGlobal(value, 'contains');
  }
}
