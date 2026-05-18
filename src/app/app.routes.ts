// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'trainer',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['TRAINER', 'TRAINER_CLIENT'] },
    loadChildren: () =>
      import('./features/trainer/trainer.routes').then((m) => m.trainerRoutes),
  },
  {
    path: 'client',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CLIENT', 'TRAINER_CLIENT'] },
    loadChildren: () =>
      import('./features/client/client.routes').then((m) => m.clientRoutes),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then(
        (m) => m.SettingsComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
