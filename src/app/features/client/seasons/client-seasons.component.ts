// src/app/features/client/seasons/client-seasons.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkoutApiService, SettingsApiService, UserApiService } from '../../../core/services/api.service';
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
  loading = signal(true);
  seasons = signal<Season[]>([]);
  trainerId = signal<string | null>(null);

  constructor(
    private workoutApi: WorkoutApiService,
    private settingsApi: SettingsApiService,
  ) {}

  ngOnInit() {
    this.settingsApi.getClientSettings().subscribe({
      next: (s) => {
        this.trainerId.set(s.trainerId);
        if (s.trainerId) {
          this.loadSeasons(s.trainerId);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  loadSeasons(trainerId: string) {
    this.workoutApi.getClientSeasons(trainerId).subscribe({
      next: (data) => { this.seasons.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  completedCount(season: Season) {
    return season.workouts.filter((w) => w.isCompleted).length;
  }

  donePercent(w: Workout) {
    const total = w.workoutExercises.length;
    if (!total) return 0;
    const done = w.workoutExercises.filter((e) => e.isDone).length;
    return Math.round((done / total) * 100);
  }
}
