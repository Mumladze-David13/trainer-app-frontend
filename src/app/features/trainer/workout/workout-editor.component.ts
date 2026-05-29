// src/app/features/trainer/workout/workout-editor.component.ts
import { Component, signal, OnInit, computed, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators, FormGroup, FormControl, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WorkoutApiService, ExerciseApiService } from '../../../core/services/api.service';
import { Exercise, Workout, WorkoutExercise } from '../../../core/models/index';

interface ExerciseRow {
  index: number;
}

@Component({
  selector: 'app-workout-editor',
  standalone: true,
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTableModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './workout-editor.component.html',
  styleUrls: ['./workout-editor.component.css'],
})

export class WorkoutEditorComponent implements OnInit {
  public columns: string[] = ['order', 'exercise', 'weight', 'sets', 'reps', 'actions'];

  public loading: WritableSignal<boolean> = signal(true);
  public saving: WritableSignal<boolean> = signal(false);
  public exercises: WritableSignal<Exercise[]> = signal<Exercise[]>([]);
  public workout: WritableSignal<Workout | null> = signal<Workout | null>(null);
  public isNew: WritableSignal<boolean> = signal(true);
  public clientId: WritableSignal<string> = signal('');
  public seasonId: WritableSignal<string> = signal('');
  public workoutId: WritableSignal<string> = signal('');

  public exerciseRows: ExerciseRow[] = [];

  public workoutForm: FormGroup<{
    notes: FormControl<string | null>;
    exercises: FormArray;
  }> = this._fb.group({
    notes: [''],
    exercises: this._fb.array([]),
  });

  get exercisesArray(): FormArray { return this.workoutForm.get('exercises') as FormArray; }

  public getControl(i: number, name: string): AbstractControl {
    return (this.exercisesArray.at(i) as FormGroup).get(name) as AbstractControl;
  }

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _fb: FormBuilder,
    private _workoutApi: WorkoutApiService,
    private _exerciseApi: ExerciseApiService,
    private _snack: MatSnackBar,
  ) {}

  public ngOnInit(): void {
    const params = this._route.snapshot.paramMap;
    this.clientId.set(params.get('clientId')!);
    const wId: string | null = params.get('workoutId');
    const sId: string | null = params.get('seasonId');

    if (sId) {
      this.isNew.set(true);
      this.seasonId.set(sId);
    } else if (wId && wId !== 'new') {
      this.isNew.set(false);
      this.workoutId.set(wId);
    }

    this._exerciseApi.getAll()
      .pipe(
        tap((exs: Exercise[]) => {
          this.exercises.set(exs);
          this._loadWorkout();
        })
      )
      .subscribe();
  }

  private _loadWorkout(): void {
    if (this.isNew()) {
      this.loading.set(false);
      this.addRow();
      return;
    }
    this._workoutApi.getWorkout(this.workoutId())
      .pipe(
        tap((w: Workout) => {
          this.workout.set(w);
          this.workoutForm.patchValue({ notes: w.notes || '' });
          w.workoutExercises.forEach((we: WorkoutExercise) => {
            this.exercisesArray.push(this._fb.group({
              exerciseId: [we.exerciseId, Validators.required],
              weight: [we.weight || null],
              sets: [we.sets, [Validators.required, Validators.min(1)]],
              reps: [we.reps, [Validators.required, Validators.min(1)]],
            }));
          });
          this._updateRows();
          this.loading.set(false);
        }),
        catchError(() => {
          this.loading.set(false);
          return EMPTY;
        })
      )
      .subscribe();
  }

  public addRow(): void {
    this.exercisesArray.push(this._fb.group({
      exerciseId: ['', Validators.required],
      weight: [null as number | null],
      sets: [3, [Validators.required, Validators.min(1)]],
      reps: [10, [Validators.required, Validators.min(1)]],
    }));
    this._updateRows();
  }

  public removeRow(i: number): void {
    this.exercisesArray.removeAt(i);
    this._updateRows();
  }

  private _updateRows(): void {
    this.exerciseRows = this.exercisesArray.controls.map((_: AbstractControl, i: number) => ({ index: i }));
  }

  public save(): void {
    if (this.exercisesArray.length === 0) {
      this._snack.open('Добавьте хотя бы одно упражнение', 'OK', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    const exercises = this.exercisesArray.value.map((e: any, i: number) => ({
      exerciseId: e.exerciseId,
      weight: e.weight || undefined,
      sets: +e.sets,
      reps: +e.reps,
      order: i,
    }));

    if (this.isNew()) {
      this._workoutApi.createWorkout({
        seasonId: this.seasonId(),
        notes: this.workoutForm.value.notes || undefined,
        exercises,
      })
        .pipe(
          tap(() => {
            this._snack.open('Занятие создано', 'OK', { duration: 2500 });
            this._router.navigate(['/trainer/clients', this.clientId()]);
          }),
          catchError((err: any) => {
            this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 4000 });
            this.saving.set(false);
            return EMPTY;
          })
        )
        .subscribe();
    } else {
      this._workoutApi.updateWorkout(this.workoutId(), {
        notes: this.workoutForm.value.notes || undefined,
        exercises,
      })
        .pipe(
          tap(() => {
            this._snack.open('Занятие обновлено', 'OK', { duration: 2500 });
            this._router.navigate(['/trainer/clients', this.clientId()]);
          }),
          catchError((err: any) => {
            this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 4000 });
            this.saving.set(false);
            return EMPTY;
          })
        )
        .subscribe();
    }
  }
}
