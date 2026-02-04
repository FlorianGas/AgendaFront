import {Injectable} from '@angular/core';
import {ToastrService}from 'ngx-toastr'


@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private toastr : ToastrService) {}

    success(text: string) {
    this.toastr.success(text , 'Succès');
    }
    error(text: string) {
    this.toastr.error(text , 'Erreur');
    }
    warning(text: string) {
    this.toastr.warning(text , 'Attention');
    }
    info(text: string) {
    this.toastr.info(text , 'Info');
    }

}
