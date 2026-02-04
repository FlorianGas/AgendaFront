import {Injectable} from '@angular/core';
import {ApiService} from './api.service';
import {Observable} from 'rxjs';


@Injectable ({ providedIn: 'root' })

export class StatService{
  constructor(private api: ApiService) {}

  getProfessionalStats(proId: string, start: string, end: string): Promise<any> {
    return this.api.get<any>(`pro/${proId}?start=${start}&end=${end}`);
  }
}
