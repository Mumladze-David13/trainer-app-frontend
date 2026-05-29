// src/app/features/trainer/workout/workout-editor.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
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
import { WorkoutApiService, ExerciseApiService } from '../../../core/services/api.service';
import { Exercise, Workout } from '../../../core/models/index';

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
  public columns = ['order', 'exercise', 'weight', 'sets', 'reps', 'actions'];

  public loading = signal(true);
  public saving = signal(false);
  public exercises = signal<Exercise[]>([]);
  public workout = signal<Workout | null>(null);
  public isNew = signal(true);
  public clientId = signal('');
  public seasonId = signal('');
  public workoutId = signal('');

  public exerciseRows: any[] = [];

  public workoutForm = this._fb.group({
    notes: [''],
    exercises: this._fb.array([]),
  });

  get exercisesArray() { return this.workoutForm.get('exercises') as FormArray; }

  public getControl(i: number, name: string) {
    return (this.exercisesArray.at(i) as FormGroup).get(name) as any;
  }

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _fb: FormBuilder,
    private _workoutApi: WorkoutApiService,
    private _exerciseApi: ExerciseApiService,
    private _snack: MatSnackBar,
  ) {}

  public ngOnInit() {
    const params = this._route.snapshot.paramMap;
    this.clientId.set(params.get('clientId')!);
    const wId = params.get('workoutId');
    const sId = params.get('seasonId');

    if (sId) {
      this.isNew.set(true);
      this.seasonId.set(sId);
    } else if (wId && wId !== 'new') {
      this.isNew.set(false);
      this.workoutId.set(wId);
    }

    this._exerciseApi.getAll().subscribe({
      next: (exs) => { this.exercises.set(exs); this._loadWorkout(); },
    });
  }

  private _loadWorkout() {
    if (this.isNew()) {
      this.loading.set(false);
      this.addRow();
      return;
    }
    this._workoutApi.getWorkout(this.workoutId()).subscribe({
      next: (w) => {
        this.workout.set(w);
        this.workoutForm.patchValue({ notes: w.notes || '' });
        w.workoutExercises.forEach((we) => {
          this.exercisesArray.push(this._fb.group({
            exerciseId: [we.exerciseId, Validators.required],
            weight: [we.weight || null],
            sets: [we.sets, [Validators.required, Validators.min(1)]],
            reps: [we.reps, [Validators.required, Validators.min(1)]],
          }));
        });
        this._updateRows();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  public addRow() {
    this.exercisesArray.push(this._fb.group({
      exerciseId: ['', Validators.required],
      weight: [null],
      sets: [3, [Validators.required, Validators.min(1)]],
      reps: [10, [Validators.required, Validators.min(1)]],
    }));
    this._updateRows();
  }

  public removeRow(i: number) {
    this.exercisesArray.removeAt(i);
    this._updateRows();
  }

  private _updateRows() {
    this.exerciseRows = this.exercisesArray.controls.map((_, i) => ({ index: i }));
  }

  public save() {
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
      }).subscribe({
        next: () => {
          this._snack.open('Занятие создано', 'OK', { duration: 2500 });
          this._router.navigate(['/trainer/clients', this.clientId()]);
        },
        error: (err) => {
          this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 4000 });
          this.saving.set(false);
        },
      });
    } else {
      this._workoutApi.updateWorkout(this.workoutId(), {
        notes: this.workoutForm.value.notes || undefined,
        exercises,
      }).subscribe({
        next: () => {
          this._snack.open('Занятие обновлено', 'OK', { duration: 2500 });
          this._router.navigate(['/trainer/clients', this.clientId()]);
        },
        error: (err) => {
          this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 4000 });
          this.saving.set(false);
        },
      });
    }
  }
}
