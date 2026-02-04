import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Dialog} from 'primeng/dialog';
import {ButtonDirective} from 'primeng/button';
import {DatePipe, TitleCasePipe} from '@angular/common';
import {AppointmentModel} from '../../models/appointment.model';
import {Router} from '@angular/router';

@Component({
  selector: 'app-appo-dialog',
  standalone: true,
  imports: [
    Dialog,
    ButtonDirective,
    TitleCasePipe,
    DatePipe
  ],
  templateUrl: './appo-dialog.component.html',
  styleUrl: './appo-dialog.component.scss'
})
export class AppoDialogComponent {
  @Input() appointment!: AppointmentModel;
  @Input() visible = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  onClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.close.emit();
  }

  editAppointment(): void {
    if (this.appointment?._id) {
      this.router.navigate(['/appointment/edit', this.appointment._id]);
    }
  }
}
