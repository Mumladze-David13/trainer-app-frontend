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
  public loading = signal(true);
  public saving = signal(false);
  public workout = signal<Workout | null>(null);
  public doneIds = signal<Set<string>>(new Set());

  public total = computed(() => this.workout()?.workoutExercises.length || 0);
  public doneCount = computed(() => this.doneIds().size);
  public donePercent = computed(() =>
    this.total() ? Math.round((this.doneCount() / this.total()) * 100) : 0,
  );
  public needMore = computed(() => {
    const needed = Math.ceil(this.total() * 0.5);
    return Math.max(0, needed - this.doneCount());
  });
  public progressClass = computed(() => this.donePercent() >= 50 ? 'progress-ok' : 'progress-warn');

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _workoutApi: WorkoutApiService,
    private _snack: MatSnackBar,
  ) {}

  public ngOnInit() {
    const id = this._route.snapshot.paramMap.get('workoutId')!;
    this._workoutApi.getWorkout(id).subscribe({
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

  public isDone(id: string): boolean { return this.doneIds().has(id); }

  public toggleExercise(id: string, checked: boolean) {
    const set = new Set(this.doneIds());
    checked ? set.add(id) : set.delete(id);
    this.doneIds.set(set);
  }

  public saveAndClose() {
    this.saving.set(true);
    const ids = Array.from(this.doneIds());
    this._workoutApi.saveProgress(this.workout()!.id, ids).subscribe({
      next: () => {
        this._snack.open('Прогресс сохранён', 'OK', { duration: 2000 });
        this._router.navigate(['/client/seasons']);
      },
      error: (err) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  public completeWorkout() {
    if (this.donePercent() < 50) return;
    this.saving.set(true);
    const ids = Array.from(this.doneIds());
    this._workoutApi.completeWorkout(this.workout()!.id, ids).subscribe({
      next: (w) => {
        this.workout.set(w);
        this._snack.open('🎉 Занятие выполнено!', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
      error: (err) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }
}
