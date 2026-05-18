// src/app/features/client/client.routes.ts
import { Routes } from '@angular/router';

export const clientRoutes: Routes = [
  {
    path: 'seasons',
    loadComponent: () =>
      import('./seasons/client-seasons.component').then((m) => m.ClientSeasonsComponent),
  },
  {
    path: 'workout/:workoutId',
    loadComponent: () =>
      import('./workout/client-workout.component').then((m) => m.ClientWorkoutComponent),
  },
];
