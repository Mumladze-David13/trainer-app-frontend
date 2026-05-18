// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRoles: string[] = route.data['roles'] || [];
  const userRole = auth.currentUser()?.role;

  if (!userRole) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (userRole === 'TRAINER_CLIENT') return true;
  if (requiredRoles.includes(userRole)) return true;

  router.navigate(['/dashboard']);
  return false;
};
