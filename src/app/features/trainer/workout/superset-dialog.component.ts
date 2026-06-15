import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

export interface SupersetDialogData {
  exercises: Array<{ index: number; name: string }>;
}

@Component({
  selector: 'app-superset-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>Создать супер-сет</h2>
    <mat-dialog-content>
      <p class="hint">Выберите минимум 2 упражнения для объединения в супер-сет</p>
      @for (ex of data.exercises; track ex.index) {
        <div class="ex-item">
          <mat-checkbox [(ngModel)]="selected[ex.index]">{{ ex.name }}</mat-checkbox>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Отмена</button>
      <button mat-raised-button color="primary" [disabled]="selectedCount() < 2" (click)="confirm()">
        Создать ({{ selectedCount() }} упр.)
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .hint { font-size: 13px; color: rgba(0,0,0,0.5); margin-bottom: 12px; }
    .ex-item { margin-bottom: 8px; }
  `],
})
export class SupersetDialogComponent {
  selected: Record<number, boolean> = {};

  constructor(
    public dialogRef: MatDialogRef<SupersetDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SupersetDialogData,
  ) {}

  selectedCount(): number {
    return Object.values(this.selected).filter(Boolean).length;
  }

  confirm(): void {
    const indices = this.data.exercises.filter(ex => this.selected[ex.index]).map(ex => ex.index);
    this.dialogRef.close(indices);
  }
}
