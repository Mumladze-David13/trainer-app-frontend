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
  template: `
    <div class="back-row">
      <button mat-button [routerLink]="['/trainer/clients', clientId()]">
        <mat-icon>arrow_back</mat-icon> К клиенту
      </button>
    </div>

    <h2>{{ isNew() ? 'Новое занятие' : 'Занятие от ' + (workout()?.date | date:'dd.MM.yyyy') }}</h2>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <mat-card>
        <mat-card-content>
          <form [formGroup]="workoutForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Примечания (необязательно)</mat-label>
              <textarea matInput formControlName="notes" rows="2"></textarea>
            </mat-form-field>

            <mat-divider />

            <div class="exercises-header">
              <h3>Упражнения</h3>
              <button mat-raised-button color="accent" type="button" (click)="addRow()">
                <mat-icon>add</mat-icon> Добавить упражнение
              </button>
            </div>

            @if (exercisesArray.length === 0) {
              <div class="no-exercises">
                <mat-icon>fitness_center</mat-icon>
                <p>Нет упражнений. Добавьте хотя бы одно.</p>
              </div>
            } @else {
              <!-- Desktop table -->
              <div class="table-wrap">
                <table mat-table [dataSource]="exerciseRows" class="exercise-table">
                  <ng-container matColumnDef="order">
                    <th mat-header-cell *matHeaderCellDef>#</th>
                    <td mat-cell *matCellDef="let row; let i = index">{{ i + 1 }}</td>
                  </ng-container>

                  <ng-container matColumnDef="exercise">
                    <th mat-header-cell *matHeaderCellDef>Упражнение</th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <mat-select [formControl]="getControl(i, 'exerciseId')" class="table-select">
                        @for (ex of exercises(); track ex.id) {
                          <mat-option [value]="ex.id">{{ ex.name }}</mat-option>
                        }
                      </mat-select>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="weight">
                    <th mat-header-cell *matHeaderCellDef>Вес (кг)</th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <input type="number" [formControl]="getControl(i, 'weight')"
                             class="num-input" placeholder="—" min="0" step="0.5" />
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="sets">
                    <th mat-header-cell *matHeaderCellDef>Подходы</th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <input type="number" [formControl]="getControl(i, 'sets')"
                             class="num-input" min="1" />
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="reps">
                    <th mat-header-cell *matHeaderCellDef>Повторы</th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <input type="number" [formControl]="getControl(i, 'reps')"
                             class="num-input" min="1" />
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <button mat-icon-button color="warn" type="button"
                              (click)="removeRow(i)" matTooltip="Удалить">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="columns"></tr>
                  <tr mat-row *matRowDef="let row; columns: columns;"></tr>
                </table>
              </div>

              <!-- Mobile cards -->
              <div class="mobile-exercises">
                @for (g of exercisesArray.controls; track $index; let i = $index) {
                  <div class="mobile-exercise-card">
                    <div class="mobile-ex-header">
                      <span class="ex-num">{{ i + 1 }}</span>
                      <button mat-icon-button color="warn" type="button" (click)="removeRow(i)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Упражнение</mat-label>
                      <mat-select [formControl]="getControl(i, 'exerciseId')">
                        @for (ex of exercises(); track ex.id) {
                          <mat-option [value]="ex.id">{{ ex.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <div class="mobile-nums">
                      <mat-form-field appearance="outline">
                        <mat-label>Вес (кг)</mat-label>
                        <input matInput type="number" [formControl]="getControl(i, 'weight')" min="0" step="0.5" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Подходы</mat-label>
                        <input matInput type="number" [formControl]="getControl(i, 'sets')" min="1" />
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>Повторы</mat-label>
                        <input matInput type="number" [formControl]="getControl(i, 'reps')" min="1" />
                      </mat-form-field>
                    </div>
                  </div>
                }
              </div>
            }

            <div class="save-actions">
              <button mat-button type="button" [routerLink]="['/trainer/clients', clientId()]">
                Закрыть без сохранения
              </button>
              <button mat-raised-button color="primary" type="button"
                      [disabled]="saving() || exercisesArray.length === 0"
                      (click)="save()">
                <mat-icon>save</mat-icon>
                {{ saving() ? 'Сохраняю...' : 'Сохранить' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .back-row { margin-bottom: 8px; }
    h2 { margin: 0 0 16px; }
    mat-card-content { padding: 16px !important; }
    .full-width { width: 100%; }
    .exercises-header {
      display: flex; align-items: center;
      justify-content: space-between;
      margin: 16px 0 12px;
    }
    .exercises-header h3 { margin: 0; }
    .no-exercises { text-align: center; padding: 40px 20px; color: rgba(0,0,0,0.4); }
    .no-exercises mat-icon { font-size: 40px; width: 40px; height: 40px; display: block; margin: 0 auto 8px; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .table-wrap { overflow-x: auto; }
    .exercise-table { width: 100%; min-width: 500px; }
    .table-select { width: 180px; }
    .num-input {
      width: 60px; border: 1px solid #e0e0e0;
      border-radius: 4px; padding: 6px 8px;
      font-size: 14px; text-align: center;
    }
    .num-input:focus { outline: 2px solid #1976d2; border-color: transparent; }
    .save-actions {
      display: flex; gap: 8px; justify-content: flex-end;
      margin-top: 20px; flex-wrap: wrap;
    }

    /* Mobile exercise cards */
    .mobile-exercises { display: none; }
    @media (max-width: 600px) {
      .table-wrap { display: none; }
      .mobile-exercises { display: flex; flex-direction: column; gap: 12px; }
      .mobile-exercise-card {
        border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px;
      }
      .mobile-ex-header {
        display: flex; align-items: center;
        justify-content: space-between; margin-bottom: 8px;
      }
      .ex-num {
        width: 28px; height: 28px; border-radius: 50%;
        background: #1976d2; color: white;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; font-weight: 500;
      }
      .mobile-nums {
        display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;
      }
    }
  `],
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
