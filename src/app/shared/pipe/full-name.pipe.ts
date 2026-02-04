import { Pipe, PipeTransform } from '@angular/core';
import { PopulatedUser } from '../models/client.model';

@Pipe({ name: 'fullName', standalone: true })
export class FullNamePipe implements PipeTransform {
  transform(user: PopulatedUser | null | undefined): string {
    if (!user) return '';
    return `${user.first_name} ${user.last_name}`;
  }
}
