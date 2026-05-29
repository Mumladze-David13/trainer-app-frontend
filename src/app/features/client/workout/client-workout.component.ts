// src/app/features/client/workout/client-workout.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { WorkoutApiService } from '../../../core/services/api.service';
import { Workout, WorkoutExercise } from '../../../core/models/index';

@Component({
  selector: 'app-client-workout',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatDividerModule, MatChipsModule,
  ],
  templateUrl: './client-workout.component.html',
  styleUrls: ['./client-workout.component.css'],
})
export class ClientWorkoutComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  workout = signal<Workout | null>(null);
  doneIds = signal<Set<string>>(new Set());

  total = computed(() => this.workout()?.workoutExercises.length || 0);
  doneCount = computed(() => this.doneIds().size);
  donePercent = computed(() =>
    this.total() ? Math.round((this.doneCount() / this.total()) * 100) : 0,
  );
  needMore = computed(() => {
    const needed = Math.ceil(this.total() * 0.5);
    return Math.max(0, needed - this.doneCount());
  });
  progressClass = computed(() => this.donePercent() >= 50 ? 'progress-ok' : 'progress-warn');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workoutApi: WorkoutApiService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('workoutId')!;
    this.workoutApi.getWorkout(id).subscribe({
      next: (w) => {
        this.workout.set(w);
        // Initialize done state from saved data
        const done = new Set(w.workoutExercises.filter((e) => e.isDone).map((e) => e.id));
        this.doneIds.set(done);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isDone(id: string): boolean { return this.doneIds().has(id); }

  toggleExercise(id: string, checked: boolean) {
    const set = new Set(this.doneIds());
    checked ? set.add(id) : set.delete(id);
    this.doneIds.set(set);
  }

  saveAndClose() {
    this.saving.set(true);
    const ids = Array.from(this.doneIds());
    this.workoutApi.saveProgress(this.workout()!.id, ids).subscribe({
      next: () => {
        this.snack.open('Прогресс сохранён', 'OK', { duration: 2000 });
        this.router.navigate(['/client/seasons']);
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  completeWorkout() {
    if (this.donePercent() < 50) return;
    this.saving.set(true);
    const ids = Array.from(this.doneIds());
    this.workoutApi.completeWorkout(this.workout()!.id, ids).subscribe({
      next: (w) => {
        this.workout.set(w);
        this.snack.open('🎉 Занятие выполнено!', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }
}
