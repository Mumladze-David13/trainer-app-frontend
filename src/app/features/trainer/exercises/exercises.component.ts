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
  templateUrl: './exercises.component.html',
  styleUrls: ['./exercises.component.css'],
})
export class ExercisesComponent implements OnInit {
  public columns = ['name', 'actions'];
  public exercises = signal<Exercise[]>([]);
  public loading = signal(true);
  public saving = signal(false);
  public showForm = signal(false);
  public editingId = signal<string | null>(null);

  public form = this._fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  constructor(
    private _fb: FormBuilder,
    private _api: ExerciseApiService,
    private _snack: MatSnackBar,
  ) {}

  public ngOnInit() { this._load(); }

  private _load() {
    this.loading.set(true);
    this._api.getAll().subscribe({
      next: (data) => { this.exercises.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  public openForm() {
    this.editingId.set(null);
    this.form.reset();
    this.showForm.set(true);
  }

  public editExercise(ex: Exercise) {
    this.editingId.set(ex.id);
    this.form.patchValue({ name: ex.name, description: ex.description || '' });
    this.showForm.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public cancelForm() {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  public save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const data = { name: this.form.value.name!, description: this.form.value.description || undefined };
    const id = this.editingId();
    const req = id ? this._api.update(id, data) : this._api.create(data);
    req.subscribe({
      next: () => {
        this._snack.open(id ? 'Упражнение обновлено' : 'Упражнение добавлено', 'OK', { duration: 2500 });
        this.cancelForm();
        this._load();
        this.saving.set(false);
      },
      error: (err) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }

  public deleteExercise(ex: Exercise) {
    if (!confirm(`Удалить упражнение "${ex.name}"?`)) return;
    this._api.delete(ex.id).subscribe({
      next: () => {
        this._snack.open('Удалено', 'OK', { duration: 2000 });
        this._load();
      },
      error: (err) => this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 }),
    });
  }
}
