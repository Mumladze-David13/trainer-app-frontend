// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Exercise, Season, Workout, ClientWithSeasons,
  TrainerSettings, User
} from '../models/index';

const API = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ExerciseApiService {
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<Exercise[]>(`${API}/exercises`);
  }

  create(data: { name: string; description?: string }) {
    return this.http.post<Exercise>(`${API}/exercises`, data);
  }

  update(id: string, data: { name?: string; description?: string }) {
    return this.http.put<Exercise>(`${API}/exercises/${id}`, data);
  }

  delete(id: string) {
    return this.http.delete<{ message: string }>(`${API}/exercises/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class ClientApiService {
  constructor(private http: HttpClient) {}

  getMyClients() {
    return this.http.get<any[]>(`${API}/clients`);
  }

  addClient(clientId: string) {
    return this.http.post(`${API}/clients`, { clientId });
  }

  removeClient(clientId: string) {
    return this.http.delete(`${API}/clients/${clientId}`);
  }

  getClientDetail(clientId: string) {
    return this.http.get<ClientWithSeasons>(`${API}/clients/${clientId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class SeasonApiService {
  constructor(private http: HttpClient) {}

  getSeasons(clientId: string) {
    return this.http.get<Season[]>(`${API}/clients/${clientId}/seasons`);
  }

  createSeason(clientId: string, data: { startDate: string; endDate?: string }) {
    return this.http.post<Season>(`${API}/clients/${clientId}/seasons`, data);
  }

  updateSeason(clientId: string, seasonId: string, data: any) {
    return this.http.put<Season>(`${API}/clients/${clientId}/seasons/${seasonId}`, data);
  }
}

@Injectable({ providedIn: 'root' })
export class WorkoutApiService {
  constructor(private http: HttpClient) {}

  getWorkout(id: string) {
    return this.http.get<Workout>(`${API}/workouts/${id}`);
  }

  createWorkout(data: {
    seasonId: string;
    notes?: string;
    exercises: Array<{ exerciseId: string; sets: number; reps: number; weight?: number; order: number }>;
  }) {
    return this.http.post<Workout>(`${API}/workouts`, data);
  }

  updateWorkout(id: string, data: any) {
    return this.http.put<Workout>(`${API}/workouts/${id}`, data);
  }

  deleteWorkout(id: string) {
    return this.http.delete(`${API}/workouts/${id}`);
  }

  saveProgress(id: string, doneExerciseIds: string[]) {
    return this.http.patch<Workout>(`${API}/workouts/${id}/progress`, { doneExerciseIds });
  }

  completeWorkout(id: string, doneExerciseIds: string[]) {
    return this.http.post<Workout>(`${API}/workouts/${id}/complete`, { doneExerciseIds });
  }

  getClientSeasons(trainerId: string) {
    return this.http.get<Season[]>(`${API}/workouts/client/${trainerId}/seasons`);
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  constructor(private http: HttpClient) {}

  getTrainerSettings() {
    return this.http.get<TrainerSettings>(`${API}/settings/trainer`);
  }

  updateTrainerSettings(sessionsPerSeason: number) {
    return this.http.put<TrainerSettings>(`${API}/settings/trainer`, { sessionsPerSeason });
  }

  getClientSettings() {
    return this.http.get<{ clientId: string; trainerId: string | null }>(`${API}/settings/client`);
  }

  setClientTrainer(trainerId: string | null) {
    return this.http.put(`${API}/settings/client/trainer`, { trainerId });
  }
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  constructor(private http: HttpClient) {}

  getMe() {
    return this.http.get<User>(`${API}/users/me`);
  }

  getTrainers() {
    return this.http.get<User[]>(`${API}/users/trainers`);
  }
}
