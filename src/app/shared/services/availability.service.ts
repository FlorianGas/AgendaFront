import { Injectable } from '@angular/core';
import {ApiService} from './api.service';
import {AvailabilityModel, TimesSlotModel} from '../models/availability.model';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {
  private readonly endpoint = 'availability' ;
  constructor(private  api: ApiService , private http:HttpClient) { }

  getMyAvailability () : Promise<AvailabilityModel>{
    return this.api.get<AvailabilityModel>(`availabilities`);
  }
  getSlotById(slotId: string): Promise<TimesSlotModel> {
    return this.api.get<TimesSlotModel>(`/availability/slot/${slotId}`);
  }

  getAvailableSlots(proId: string, date: string, duration: number) {
    return this.api.get<any[]>(`availabilities/${proId}/slots?date=${date}&duration=${duration}`);
  }

  addAvailability(data: { availability: TimesSlotModel[] }): Promise<AvailabilityModel> {
    return this.api.post<AvailabilityModel>(`${this.endpoint}`, data);
  }
  addSlot(slot: {
    professional_id: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }): Promise<any> {
    return this.api.post(`${this.endpoint}/add-slot`, slot);
  }

  updateSlot (slotId : string, timeslots : TimesSlotModel[]) : Promise<AvailabilityModel> {
    return this.api.put<AvailabilityModel>(`${this.endpoint}/${slotId}`, timeslots);
  }

  deleteSlot(slotId: string): Promise<void> {
    console.log(`DELETE /api/${this.endpoint}/${slotId}`);
    return this.api.delete<void>(`${this.endpoint}/${slotId}`);
  }
  bookSlot(
    slotId: string,
    payload: { professional_id : string, scheduled_time: string, duration_minutes: number }
  ): Promise<AvailabilityModel> {
    return this.api.post<AvailabilityModel>(
      `${this.endpoint}/${slotId}/book`,
      payload
    );
  }

  bookSlotClient(
    slotId: string,
    professional_id: string,
    scheduled_time: string,   // ISO
    duration_minutes: number
  ): Promise<AvailabilityModel> {
    return this.api.post<AvailabilityModel>(
      `availabilities/${slotId}/book`,
      { professional_id, scheduled_time, duration_minutes }
    );
  }

}
