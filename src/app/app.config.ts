import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {providePrimeNG} from 'primeng/config';
import Nora from '@primeng/themes/nora';
import {provideAnimations} from '@angular/platform-browser/animations';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {ConfirmationService, MessageService} from 'primeng/api';
import {provideToastr} from 'ngx-toastr';
import {AuthInterceptor} from './shared/interceptors/auth.interceptor';


export const appConfig: ApplicationConfig = {

  providers: [ ConfirmationService,
    provideHttpClient(withInterceptorsFromDi()),
    {provide : HTTP_INTERCEPTORS , useClass : AuthInterceptor , multi: true},
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    providePrimeNG({
      theme : {
        preset : Nora,
        options:{
          darkModeSelector:'html',
        }
      }
    }),
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-bottom-right',
      timeOut:3000
    }),

    MessageService,
    ConfirmationService,
  ]
};
