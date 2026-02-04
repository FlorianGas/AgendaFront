import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { CreateUserComponent } from './features/users/create-user/create-user.component';
import { DetailUserComponent } from './features/users/detail-user/detail-user.component';
import { UpdateUserComponent } from './features/users/update-user/update-user.component';
import {
  AppointmentTypeListComponent
} from './features/appointment_type/appointment-type-list/appointment-type-list.component';
import {
  AppointmentTypeFormComponent
} from './features/appointment_type/appointment-type-form/appointment-type-form.component';
import { DashboardProComponent } from './features/dashboard-pro/dashboard-pro.component';
import { DashboardClientComponent } from './features/dashboard-client/dashboard-client.component';
import { AppointmentCreateComponent } from './features/appointments/appointment-create/appointment-create.component';
import { roleGuard } from './shared/guards/role.guard';
import {DashboardLayoutComponent} from './shared/components/layouts/dashboard-layout/dashboard-layout.component';
import {AvailabilityCreateComponent} from './features/availability/availability-create/availability-create.component';
import {UpdateAppointmentsComponent} from './features/appointments/update-appointments/update-appointments.component';
import {ClientListComponent} from './features/clients/client-list/client-list.component';
import {ClientCreateComponent} from './features/clients/client-create/client-create.component';
import {ClientUpdateComponent} from './features/clients/client-update/client-update.component';
import {ListAppointmentsComponent} from './features/appointments/list-appointments/list-appointments.component';

import {
  AppointmentTypeEditComponent
} from './features/appointment_type/appointment-type-edit/appointment-type-edit.component';
import {NotificationsComponent} from './shared/components/notifications/notifications.component';
import {StatComponent} from './features/stat/stat.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [roleGuard] },
  { path: 'user/create', component: CreateUserComponent },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: NotificationsComponent },
      { path: 'dashboard-pro', component: DashboardProComponent },
      { path: 'dashboard-client', component: DashboardClientComponent },
      { path: 'appointment/create', component: AppointmentCreateComponent },
      { path: 'appointment/update/:id', component: UpdateAppointmentsComponent },
      { path: 'appointments/me', component: ListAppointmentsComponent },
      { path: 'appointments/pro/me', component: ListAppointmentsComponent },
      { path: 'availability', component: AvailabilityCreateComponent },
      { path: 'clients', component: ClientListComponent},
      { path: 'clients/create', component: ClientCreateComponent},
      { path: 'clients/edit', component: ClientUpdateComponent},
      { path: 'notifications', component: NotificationsComponent },
      { path: 'user/me', component: DetailUserComponent },
      { path: 'user/:userId', component: UpdateUserComponent },
      {path:'stat', component: StatComponent},

      {
        path: 'types',
        children: [
          { path: '', component: AppointmentTypeListComponent },
          { path: 'create', component: AppointmentTypeFormComponent },
          { path: 'edit/:id', component: AppointmentTypeEditComponent },
        ]
      }
    ]
  },

  // Public route d’inscription
  {
    path: 'register',
    loadComponent: () => import('./features/users/create-user/create-user.component').then(m => m.CreateUserComponent)
  },

  { path: '**', redirectTo: 'login' }
];
