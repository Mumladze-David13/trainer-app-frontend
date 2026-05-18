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
  template: `
    <div class="back-row">
      <button mat-button routerLink="/client/seasons">
        <mat-icon>arrow_back</mat-icon> Назад к занятиям
      </button>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else if (workout()) {
      <div class="workout-header">
        <div>
          <h2>Занятие</h2>
          <div class="workout-date">{{ workout()!.date | date:'EEEE, dd MMMM yyyy' }}</div>
        </div>
        @if (workout()!.isCompleted) {
          <div class="completed-badge">
            <mat-icon>check_circle</mat-icon> Выполнено
          </div>
        }
      </div>

      @if (workout()!.notes) {
        <mat-card class="notes-card">
          <mat-card-content>
            <mat-icon>notes</mat-icon>
            {{ workout()!.notes }}
          </mat-card-content>
        </mat-card>
      }

      <!-- Progress bar -->
      <div class="progress-section">
        <div class="progress-label">
          <span>Прогресс</span>
          <span [class]="progressClass()">{{ doneCount() }}/{{ total() }} упражнений ({{ donePercent() }}%)</span>
        </div>
        <mat-progress-bar mode="determinate" [value]="donePercent()"
                          [color]="donePercent() >= 50 ? 'accent' : 'primary'" />
        @if (donePercent() >= 50 && !workout()!.isCompleted) {
          <div class="can-complete-note">
            <mat-icon>star</mat-icon>
            Выполнено более 50% — можно завершить занятие!
          </div>
        }
      </div>

      <!-- Exercise list -->
      <mat-card class="exercises-card">
        <mat-card-content>
          @for (we of workout()!.workoutExercises; track we.id; let i = $index) {
            <div class="exercise-row" [class.done]="isDone(we.id)" [class.completed-workout]="workout()!.isCompleted">
              <mat-checkbox
                [checked]="isDone(we.id)"
                [disabled]="workout()!.isCompleted"
                (change)="toggleExercise(we.id, $event.checked)">
              </mat-checkbox>

              <div class="ex-info">
                <div class="ex-name" [class.done-name]="isDone(we.id)">
                  {{ i + 1 }}. {{ we.exercise.name }}
                </div>
                <div class="ex-details">
                  @if (we.weight) { <span>{{ we.weight }} кг</span> · }
                  <span>{{ we.sets }} подх. × {{ we.reps }} повт.</span>
                </div>
              </div>

              @if (isDone(we.id)) {
                <mat-icon class="check-icon">check_circle</mat-icon>
              }
            </div>
            @if (i < workout()!.workoutExercises.length - 1) {
              <mat-divider />
            }
          }
        </mat-card-content>
      </mat-card>

      <!-- Action buttons -->
      @if (!workout()!.isCompleted) {
        <div class="action-bar">
          <button mat-button (click)="saveAndClose()" [disabled]="saving()">
            <mat-icon>save</mat-icon> Сохранить и закрыть
          </button>

          <button mat-raised-button color="accent"
                  [disabled]="donePercent() < 50 || saving()"
                  (click)="completeWorkout()"
                  [matTooltip]="donePercent() < 50 ? 'Выполните минимум 50% упражнений' : ''">
            <mat-icon>emoji_events</mat-icon>
            {{ saving() ? 'Сохраняю...' : 'Занятие выполнено!' }}
          </button>
        </div>

        @if (donePercent() < 50 && doneCount() > 0) {
          <div class="hint">
            Ещё {{ needMore() }} упр. для завершения занятия
          </div>
        }
      } @else {
        <div class="completed-bar">
          <mat-icon>celebration</mat-icon>
          Занятие завершено! Отличная работа!
          <button mat-button routerLink="/client/seasons">Вернуться</button>
        </div>
      }
    }
  `,
  styles: [`
    .back-row { margin-bottom: 8px; }
    .workout-header {
      display: flex; align-items: flex-start;
      justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
    }
    h2 { margin: 0; }
    .workout-date { color: rgba(0,0,0,0.5); font-size: 14px; text-transform: capitalize; margin-top: 2px; }
    .completed-badge {
      display: flex; align-items: center; gap: 4px;
      background: #e8f5e9; color: #2e7d32;
      padding: 6px 14px; border-radius: 20px;
      font-size: 14px; font-weight: 500;
    }
    .notes-card { margin-bottom: 12px; }
    .notes-card mat-card-content {
      display: flex !important; align-items: flex-start;
      gap: 8px; padding: 12px 16px !important;
      color: rgba(0,0,0,0.7); font-size: 14px;
    }
    .progress-section { margin-bottom: 16px; }
    .progress-label {
      display: flex; justify-content: space-between;
      font-size: 14px; margin-bottom: 6px;
    }
    .progress-ok { color: #388e3c; font-weight: 500; }
    .progress-warn { color: rgba(0,0,0,0.5); }
    .can-complete-note {
      display: flex; align-items: center; gap: 4px;
      font-size: 13px; color: #f57c00;
      margin-top: 6px;
    }
    .exercises-card { margin-bottom: 16px; }
    .exercises-card mat-card-content { padding: 0 !important; }
    .exercise-row {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      transition: background 0.15s;
    }
    .exercise-row.done { background: #f1f8e9; }
    .exercise-row.completed-workout { opacity: 0.8; }
    .ex-info { flex: 1; }
    .ex-name { font-size: 15px; font-weight: 500; }
    .ex-name.done-name { text-decoration: line-through; color: rgba(0,0,0,0.4); }
    .ex-details { font-size: 13px; color: rgba(0,0,0,0.5); margin-top: 2px; }
    .check-icon { color: #66bb6a; font-size: 20px; width: 20px; height: 20px; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .action-bar {
      display: flex; gap: 12px; justify-content: flex-end;
      flex-wrap: wrap; margin-bottom: 8px;
    }
    .hint { text-align: right; font-size: 12px; color: rgba(0,0,0,0.4); }
    .completed-bar {
      display: flex; align-items: center; gap: 8px;
      background: #e8f5e9; color: #2e7d32;
      padding: 14px 20px; border-radius: 8px;
      font-size: 15px; font-weight: 500;
      flex-wrap: wrap;
    }
    .completed-bar mat-icon { color: #f9a825; }
    @media (max-width: 500px) {
      .action-bar { flex-direction: column; }
      .action-bar button { width: 100%; }
    }
  `],
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
