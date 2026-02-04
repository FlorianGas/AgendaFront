import { Injectable } from '@angular/core';
import {ApiService} from './api.service';
import {HistoryModel} from '../models/history.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  constructor(private api: ApiService) { }
  getHistoryByAppointment(appointmentId: string): Promise<HistoryModel> {
    return this.api.get< HistoryModel>(`history/${appointmentId}`);
  }
}
