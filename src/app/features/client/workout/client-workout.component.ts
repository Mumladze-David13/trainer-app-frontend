import { Component, signal, OnInit, computed, WritableSignal, Signal } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WorkoutApiService } from '../../../core/services/api.service';
import { Workout, WorkoutExercise, hasSetWeights } from '../../../core/models/index';

export interface ExerciseGroup {
  type: 'single' | 'superset';
  exercises: WorkoutExercise[];
  group?: number;
}

@Component({
  selector: 'app-client-workout',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatDividerModule, MatChipsModule, MatTooltipModule,
  ],
  templateUrl: './client-workout.component.html',
  styleUrls: ['./client-workout.component.css'],
})
export class ClientWorkoutComponent implements OnInit {
  public loading: WritableSignal<boolean> = signal(true);
  public saving: WritableSignal<boolean> = signal(false);
  public workout: WritableSignal<Workout | null> = signal<Workout | null>(null);
  public doneIds: WritableSignal<Set<string>> = signal<Set<string>>(new Set());

  public groupedExercises: Signal<ExerciseGroup[]> = computed(() => {
    const wo = this.workout();
    if (!wo) return [];
    const items: ExerciseGroup[] = [];
    const seenGroups = new Set<number>();
    wo.workoutExercises.forEach(we => {
      if (we.supersetGroup != null && !seenGroups.has(we.supersetGroup)) {
        seenGroups.add(we.supersetGroup);
        const groupExercises = wo.workoutExercises
          .filter(e => e.supersetGroup === we.supersetGroup)
          .sort((a, b) => (a.supersetOrder ?? 0) - (b.supersetOrder ?? 0));
        items.push({ type: 'superset', exercises: groupExercises, group: we.supersetGroup });
      } else if (we.supersetGroup == null) {
        items.push({ type: 'single', exercises: [we] });
      }
    });
    return items;
  });

  public total: Signal<number> = computed(() => this.workout()?.workoutExercises.length || 0);
  public doneCount: Signal<number> = computed(() => this.doneIds().size);
  public donePercent: Signal<number> = computed(() =>
    this.total() ? Math.round((this.doneCount() / this.total()) * 100) : 0,
  );
  public needMore: Signal<number> = computed(() => {
    const needed = Math.ceil(this.total() * 0.5);
    return Math.max(0, needed - this.doneCount());
  });
  public progressClass: Signal<string> = computed(() => this.donePercent() >= 50 ? 'progress-ok' : 'progress-warn');

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _workoutApi: WorkoutApiService,
    private _snack: MatSnackBar,
  ) {}

  public ngOnInit(): void {
    const id: string = this._route.snapshot.paramMap.get('workoutId')!;
    this._workoutApi.getWorkout(id).pipe(
      tap((w: Workout) => {
        this.workout.set(w);
        const done = new Set(w.workoutExercises.filter((e: WorkoutExercise) => e.isDone).map((e: WorkoutExercise) => e.id));
        this.doneIds.set(done);
        this.loading.set(false);
      }),
      catchError(() => { this.loading.set(false); return EMPTY; }),
    ).subscribe();
  }

  public isDone(id: string): boolean { return this.doneIds().has(id); }

  public toggleExercise(id: string, checked: boolean): void {
    const set = new Set(this.doneIds());
    checked ? set.add(id) : set.delete(id);
    this.doneIds.set(set);
  }

  public hasSetWeights(we: WorkoutExercise): boolean { return hasSetWeights(we); }

  public saveAndClose(): void {
    this.saving.set(true);
    const ids = Array.from(this.doneIds());
    this._workoutApi.saveProgress(this.workout()!.id, ids).pipe(
      tap(() => {
        this._snack.open('Прогресс сохранён', 'OK', { duration: 2000 });
        this._router.navigate(['/client/seasons']);
      }),
      catchError((err: any) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.saving.set(false);
        return EMPTY;
      }),
    ).subscribe();
  }

  public completeWorkout(): void {
    if (this.donePercent() < 50) return;
    this.saving.set(true);
    const ids = Array.from(this.doneIds());
    this._workoutApi.completeWorkout(this.workout()!.id, ids).pipe(
      tap((w: Workout) => {
        this.workout.set(w);
        this._snack.open('🎉 Занятие выполнено!', 'OK', { duration: 3000 });
        this.saving.set(false);
      }),
      catchError((err: any) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.saving.set(false);
        return EMPTY;
      }),
    ).subscribe();
  }
}
