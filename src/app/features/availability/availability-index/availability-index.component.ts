import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AvailabilityService} from '../../../shared/services/availability.service';
import {ToastService} from '../../../shared/services/toast.service';
import {InputText} from 'primeng/inputtext';
import {ButtonDirective} from 'primeng/button';
import {Divider} from 'primeng/divider';
import {TableModule} from 'primeng/table';
import {DatePipe, NgClass, NgIf} from '@angular/common';
import {ProgressSpinner} from 'primeng/progressspinner';

@Component({
  selector: 'app-availability-index',
  imports: [
    ReactiveFormsModule,
    InputText,
    ButtonDirective,
    Divider,
    TableModule,
    NgIf,
    DatePipe,
    NgClass,
    ProgressSpinner
  ],
  templateUrl: './availability-index.component.html',
  styleUrl: './availability-index.component.scss'
})
export class AvailabilityIndexComponent implements OnInit {
availability : any[] = [];
form!: FormGroup;
loading = false;
editForm!: FormGroup;
editingSlotId: string | null = null;
  constructor(
    private availabilityService : AvailabilityService,
    private toast: ToastService,
    private fb :FormBuilder
  ) {}
  initForm() {
    this.form = this.fb.group({
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
    });
    this.editForm = this.fb.group({
      start_time: ['', Validators.required],
      end_time: ['', Validators.required],
    });
  }

    async loadAvailability() {
    try {
      this.loading = true;
      const data = await this.availabilityService.getMyAvailability();
      this.availability = data;
    }catch(error) {
      this.toast.error('Erreur lors du chargement des disponibilités');
    }finally {
      this.loading = false;
    }
  }
  async addSlot(){
    if (this.form.invalid)return;

    try {
      const slot = this.form.value;
      await this.availabilityService.addAvailability(slot);
      this.toast.success('Créneau ajouté');
      this.form.reset();
      this.loadAvailability();
    }catch(error) {
      this.toast.error('Erreur lors de l\' ajout');
    }
  }
  async deleteSlot(slotId : string){
    try {
      await this.availabilityService.deleteSlot(slotId);
      this.toast.success('Créneau supprimé');
      this.loadAvailability();
    }catch(error) {
      this.toast.error('Erreur lors de la suppression');
    }
  }
  startEdit(slot: any) {
    this.editingSlotId = slot._id;
    this.editForm.patchValue({
      start_time: this.toDatetimeLocal(slot.start_time),
      end_time: this.toDatetimeLocal(slot.end_time),
    });
  }

  toDatetimeLocal(dateStr: string): string {
    const date = new Date(dateStr);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }
  async updateSlot() {
    if (!this.editingSlotId || this.editForm.invalid) return;
    try {
      const updated = this.editForm.value;
      await this.availabilityService.updateSlot(this.editingSlotId, updated);
      this.toast.success('Créneau modifié');
      this.editingSlotId = null;
      this.loadAvailability();
    } catch (error) {
      this.toast.error('Erreur lors de la modification');
    }
  }
  cancelEdit() {
    this.editingSlotId = null;
    this.editForm.reset();
  }

  ngOnInit() {
    this.initForm();
    this.loadAvailability();
  }

}
