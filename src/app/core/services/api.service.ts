// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Exercise, Season, Workout, ClientWithSeasons,
  TrainerSettings, User
} from '../models/index';

const API: string = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ExerciseApiService {
  constructor(private http: HttpClient) {}

  public getAll(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`${API}/exercises`);
  }

  public create(data: { name: string; description?: string }): Observable<Exercise> {
    return this.http.post<Exercise>(`${API}/exercises`, data);
  }

  public update(id: string, data: { name?: string; description?: string }): Observable<Exercise> {
    return this.http.put<Exercise>(`${API}/exercises/${id}`, data);
  }

  public delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${API}/exercises/${id}`);
  }
}

export interface ClientListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable({ providedIn: 'root' })
export class ClientApiService {
  constructor(private http: HttpClient) {}

  public getMyClients(): Observable<ClientListItem[]> {
    return this.http.get<ClientListItem[]>(`${API}/clients`);
  }

  public addClient(clientId: string): Observable<unknown> {
    return this.http.post(`${API}/clients`, { clientId });
  }

  public removeClient(clientId: string): Observable<unknown> {
    return this.http.delete(`${API}/clients/${clientId}`);
  }

  public getClientDetail(clientId: string): Observable<ClientWithSeasons> {
    return this.http.get<ClientWithSeasons>(`${API}/clients/${clientId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class SeasonApiService {
  constructor(private http: HttpClient) {}

  public getSeasons(clientId: string): Observable<Season[]> {
    return this.http.get<Season[]>(`${API}/clients/${clientId}/seasons`);
  }

  public createSeason(clientId: string, data: { startDate: string; endDate?: string }): Observable<Season> {
    return this.http.post<Season>(`${API}/clients/${clientId}/seasons`, data);
  }

  public updateSeason(clientId: string, seasonId: string, data: { name?: string; endDate?: string }): Observable<Season> {
    return this.http.put<Season>(`${API}/clients/${clientId}/seasons/${seasonId}`, data);
  }
}

export interface CreateWorkoutData {
  seasonId: string;
  notes?: string;
  exercises: Array<{
    exerciseId: string; sets: number; reps: number; weight?: number; order: number;
    setWeights?: number[]; supersetGroup?: number; supersetOrder?: number;
  }>;
}

export interface UpdateWorkoutData {
  notes?: string;
  exercises?: Array<{
    exerciseId: string; sets: number; reps: number; weight?: number; order: number;
    setWeights?: number[]; supersetGroup?: number; supersetOrder?: number;
  }>;
}

@Injectable({ providedIn: 'root' })
export class WorkoutApiService {
  constructor(private http: HttpClient) {}

  public getWorkout(id: string): Observable<Workout> {
    return this.http.get<Workout>(`${API}/workouts/${id}`);
  }

  public createWorkout(data: CreateWorkoutData): Observable<Workout> {
    return this.http.post<Workout>(`${API}/workouts`, data);
  }

  public updateWorkout(id: string, data: UpdateWorkoutData): Observable<Workout> {
    return this.http.put<Workout>(`${API}/workouts/${id}`, data);
  }

  public deleteWorkout(id: string): Observable<unknown> {
    return this.http.delete(`${API}/workouts/${id}`);
  }

  public saveProgress(id: string, doneExerciseIds: string[]): Observable<Workout> {
    return this.http.patch<Workout>(`${API}/workouts/${id}/progress`, { doneExerciseIds });
  }

  public completeWorkout(id: string, doneExerciseIds: string[]): Observable<Workout> {
    return this.http.post<Workout>(`${API}/workouts/${id}/complete`, { doneExerciseIds });
  }

  public getClientSeasons(trainerId: string): Observable<Season[]> {
    return this.http.get<Season[]>(`${API}/workouts/client/${trainerId}/seasons`);
  }
}

export interface ClientSettings {
  clientId: string;
  trainerId: string | null;
}

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  constructor(private http: HttpClient) {}

  public getTrainerSettings(): Observable<TrainerSettings> {
    return this.http.get<TrainerSettings>(`${API}/settings/trainer`);
  }

  public updateTrainerSettings(sessionsPerSeason: number): Observable<TrainerSettings> {
    return this.http.put<TrainerSettings>(`${API}/settings/trainer`, { sessionsPerSeason });
  }

  public getClientSettings(): Observable<ClientSettings> {
    return this.http.get<ClientSettings>(`${API}/settings/client`);
  }

  public setClientTrainer(trainerId: string | null): Observable<unknown> {
    return this.http.put(`${API}/settings/client/trainer`, { trainerId });
  }
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  constructor(private http: HttpClient) {}

  public getMe(): Observable<User> {
    return this.http.get<User>(`${API}/users/me`);
  }

  public getTrainers(): Observable<User[]> {
    return this.http.get<User[]>(`${API}/users/trainers`);
  }
}
