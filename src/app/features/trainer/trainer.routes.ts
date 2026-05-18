// src/app/features/trainer/trainer.routes.ts
import { Routes } from '@angular/router';

export const trainerRoutes: Routes = [
  {
    path: 'exercises',
    loadComponent: () =>
      import('./exercises/exercises.component').then((m) => m.ExercisesComponent),
  },
  {
    path: 'clients',
    loadComponent: () =>
      import('./clients/clients-list.component').then((m) => m.ClientsListComponent),
  },
  {
    path: 'clients/:clientId',
    loadComponent: () =>
      import('./clients/client-detail.component').then((m) => m.ClientDetailComponent),
  },
  {
    path: 'clients/:clientId/workout/:workoutId',
    loadComponent: () =>
      import('./workout/workout-editor.component').then((m) => m.WorkoutEditorComponent),
  },
  {
    path: 'clients/:clientId/workout/new/:seasonId',
    loadComponent: () =>
      import('./workout/workout-editor.component').then((m) => m.WorkoutEditorComponent),
  },
];
