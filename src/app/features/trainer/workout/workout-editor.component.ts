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
  columns = ['order', 'exercise', 'weight', 'sets', 'reps', 'actions'];

  loading = signal(true);
  saving = signal(false);
  exercises = signal<Exercise[]>([]);
  workout = signal<Workout | null>(null);
  isNew = signal(true);
  clientId = signal('');
  seasonId = signal('');
  workoutId = signal('');

  exerciseRows: any[] = [];

  workoutForm = this.fb.group({
    notes: [''],
    exercises: this.fb.array([]),
  });

  get exercisesArray() { return this.workoutForm.get('exercises') as FormArray; }

  getControl(i: number, name: string) {
    return (this.exercisesArray.at(i) as FormGroup).get(name) as any;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private workoutApi: WorkoutApiService,
    private exerciseApi: ExerciseApiService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.paramMap;
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

    this.exerciseApi.getAll().subscribe({
      next: (exs) => { this.exercises.set(exs); this.loadWorkout(); },
    });
  }

  loadWorkout() {
    if (this.isNew()) {
      this.loading.set(false);
      this.addRow();
      return;
    }
    this.workoutApi.getWorkout(this.workoutId()).subscribe({
      next: (w) => {
        this.workout.set(w);
        this.workoutForm.patchValue({ notes: w.notes || '' });
        w.workoutExercises.forEach((we) => {
          this.exercisesArray.push(this.fb.group({
            exerciseId: [we.exerciseId, Validators.required],
            weight: [we.weight || null],
            sets: [we.sets, [Validators.required, Validators.min(1)]],
            reps: [we.reps, [Validators.required, Validators.min(1)]],
          }));
        });
        this.updateRows();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addRow() {
    this.exercisesArray.push(this.fb.group({
      exerciseId: ['', Validators.required],
      weight: [null],
      sets: [3, [Validators.required, Validators.min(1)]],
      reps: [10, [Validators.required, Validators.min(1)]],
    }));
    this.updateRows();
  }

  removeRow(i: number) {
    this.exercisesArray.removeAt(i);
    this.updateRows();
  }

  updateRows() {
    this.exerciseRows = this.exercisesArray.controls.map((_, i) => ({ index: i }));
  }

  save() {
    if (this.exercisesArray.length === 0) {
      this.snack.open('Добавьте хотя бы одно упражнение', 'OK', { duration: 3000 });
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
      this.workoutApi.createWorkout({
        seasonId: this.seasonId(),
        notes: this.workoutForm.value.notes || undefined,
        exercises,
      }).subscribe({
        next: () => {
          this.snack.open('Занятие создано', 'OK', { duration: 2500 });
          this.router.navigate(['/trainer/clients', this.clientId()]);
        },
        error: (err) => {
          this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 4000 });
          this.saving.set(false);
        },
      });
    } else {
      this.workoutApi.updateWorkout(this.workoutId(), {
        notes: this.workoutForm.value.notes || undefined,
        exercises,
      }).subscribe({
        next: () => {
          this.snack.open('Занятие обновлено', 'OK', { duration: 2500 });
          this.router.navigate(['/trainer/clients', this.clientId()]);
        },
        error: (err) => {
          this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 4000 });
          this.saving.set(false);
        },
      });
    }
  }
}
