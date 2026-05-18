// src/app/features/trainer/exercises/exercises.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExerciseApiService } from '../../../core/services/api.service';
import { Exercise } from '../../../core/models/index';

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatTableModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="page-header">
      <h2>Упражнения</h2>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Добавить
      </button>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    }

    <!-- Add/Edit Form -->
    @if (showForm()) {
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>{{ editingId() ? 'Редактировать' : 'Новое' }} упражнение</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Название</mat-label>
              <input matInput formControlName="name" />
              @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                <mat-error>Обязательное поле</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Описание (необязательно)</mat-label>
              <textarea matInput formControlName="description" rows="2"></textarea>
            </mat-form-field>
            <div class="form-actions">
              <button mat-button type="button" (click)="cancelForm()">Отмена</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                {{ saving() ? 'Сохраняю...' : 'Сохранить' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }

    <!-- Exercises table -->
    @if (!loading()) {
      @if (exercises().length === 0) {
        <div class="empty-state">
          <mat-icon>fitness_center</mat-icon>
          <p>Нет упражнений. Добавьте первое!</p>
        </div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="exercises()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Название</th>
              <td mat-cell *matCellDef="let ex">
                <strong>{{ ex.name }}</strong>
                @if (ex.description) {
                  <div class="ex-desc">{{ ex.description }}</div>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="actions-col">Действия</th>
              <td mat-cell *matCellDef="let ex" class="actions-col">
                <button mat-icon-button color="primary"
                        matTooltip="Редактировать"
                        (click)="editExercise(ex)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn"
                        matTooltip="Удалить"
                        (click)="deleteExercise(ex)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
        </mat-card>
      }
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .page-header h2 { margin: 0; font-size: 24px; }
    .form-card { margin-bottom: 16px; }
    mat-card-content { padding: 16px !important; }
    .full-width { width: 100%; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .empty-state {
      text-align: center; padding: 60px 20px;
      color: rgba(0,0,0,0.4);
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 8px; }
    table { width: 100%; }
    .ex-desc { font-size: 12px; color: rgba(0,0,0,0.5); margin-top: 2px; }
    .actions-col { width: 100px; text-align: right; }
    @media (max-width: 600px) {
      .page-header h2 { font-size: 18px; }
    }
  `],
})
export class ExercisesComponent implements OnInit {
  columns = ['name', 'actions'];
  exercises = signal<Exercise[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  editingId = signal<string | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  constructor(
    private fb: FormBuilder,
    private api: ExerciseApiService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getAll().subscribe({
      next: (data) => { this.exercises.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm() {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  editExercise(ex: Exercise) {
    this.editingId.set(ex.id);
    this.form.patchValue({ name: ex.name, description: ex.description || '' });
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = { name: this.form.value.name!, description: this.form.value.description || undefined };
    const id = this.editingId();
    const req = id ? this.api.update(id, data) : this.api.create(data);
    req.subscribe({
      next: () => {
        this.snack.open(id ? 'Упражнение обновлено' : 'Упражнение добавлено', 'OK', { duration: 2500 });
        this.cancelForm();
        this.load();
        this.saving.set(false);
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  deleteExercise(ex: Exercise) {
    if (!confirm(`Удалить упражнение "${ex.name}"?`)) return;
    this.api.delete(ex.id).subscribe({
      next: () => {
        this.snack.open('Удалено', 'OK', { duration: 2000 });
        this.load();
      },
      error: (err) => this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 }),
    });
  }
}
