import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth.service';
import {UserStore} from '../store/user.store';

export const roleGuard: CanActivateFn = (route, state) => {
  const userStore = inject(UserStore);
  const router = inject(Router);

  if(userStore.getCurrentUser()?.role === 'professional'){
    router.navigate(['/dashboard-pro']);
    return false;
  }else if(userStore.getCurrentUser()?.role === 'client'){
    router.navigate(['/dashboard-client']);
    return false;
  }else {
    return true;
  }

};
