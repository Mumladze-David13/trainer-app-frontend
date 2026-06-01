// src/app/features/client/seasons/client-seasons.component.ts
import { Component, signal, OnInit, computed, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WorkoutApiService, SettingsApiService, UserApiService, ClientSettings } from '../../../core/services/api.service';
import { Season, Workout } from '../../../core/models/index';

@Component({
  selector: 'app-client-seasons',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatExpansionModule, MatProgressSpinnerModule,
    MatChipsModule, MatSnackBarModule,
  ],
  templateUrl: './client-seasons.component.html',
  styleUrls: ['./client-seasons.component.css'],
})
export class ClientSeasonsComponent implements OnInit {
  public loading: WritableSignal<boolean> = signal(true);
  public seasons: WritableSignal<Season[]> = signal<Season[]>([]);
  public trainerId: WritableSignal<string | null> = signal<string | null>(null);

  constructor(
    private _workoutApi: WorkoutApiService,
    private _settingsApi: SettingsApiService,
  ) {}

  public ngOnInit(): void {
    this._settingsApi.getClientSettings().pipe(
      tap((s: ClientSettings) => {
        this.trainerId.set(s.trainerId);
        if (s.trainerId) {
          this._loadSeasons(s.trainerId);
        } else {
          this.loading.set(false);
        }
      }),
      catchError(() => {
        this.loading.set(false);
        return EMPTY;
      })
    ).subscribe();
  }

  private _loadSeasons(trainerId: string): void {
    this._workoutApi.getClientSeasons(trainerId).pipe(
      tap((data: Season[]) => {
        this.seasons.set(data);
        this.loading.set(false);
      }),
      catchError(() => {
        this.loading.set(false);
        return EMPTY;
      })
    ).subscribe();
  }

  public completedCount(season: Season): number {
    return season.workouts.filter((w: Workout) => w.isCompleted).length;
  }

  public donePercent(w: Workout): number {
    const total: number = w.workoutExercises.length;
    if (!total) return 0;
    const done: number = w.workoutExercises.filter((e) => e.isDone).length;
    return Math.round((done / total) * 100);
  }
}
