// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/index';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean => {
  const auth: AuthService = inject(AuthService);
  const router: Router = inject(Router);
  const requiredRoles: string[] = route.data['roles'] || [];
  const userRole: Role | undefined = auth.currentUser()?.role;

  if (!userRole) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (userRole === 'TRAINER_CLIENT') return true;
  if (requiredRoles.includes(userRole)) return true;

  router.navigate(['/dashboard']);
  return false;
};
