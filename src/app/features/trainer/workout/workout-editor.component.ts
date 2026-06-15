import { Component, signal, OnInit, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder, FormArray, Validators,
  FormGroup, FormControl, AbstractControl,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { WorkoutApiService, ExerciseApiService } from '../../../core/services/api.service';
import { Exercise, Workout, WorkoutExercise } from '../../../core/models/index';
import { SupersetDialogComponent } from './superset-dialog.component';

interface RenderItem {
  type: 'single' | 'superset';
  indices: number[];
  supersetGroup?: number;
}

@Component({
  selector: 'app-workout-editor',
  standalone: true,
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonToggleModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule, MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './workout-editor.component.html',
  styleUrls: ['./workout-editor.component.css'],
})
export class WorkoutEditorComponent implements OnInit {
  public loading: WritableSignal<boolean> = signal(true);
  public saving: WritableSignal<boolean> = signal(false);
  public exercises: WritableSignal<Exercise[]> = signal<Exercise[]>([]);
  public workout: WritableSignal<Workout | null> = signal<Workout | null>(null);
  public isNew: WritableSignal<boolean> = signal(true);
  public clientId: WritableSignal<string> = signal('');
  public seasonId: WritableSignal<string> = signal('');
  public workoutId: WritableSignal<string> = signal('');

  public renderItems: RenderItem[] = [];

  public workoutForm: FormGroup<{ notes: FormControl<string | null>; exercises: FormArray }> =
    this._fb.group({ notes: [''], exercises: this._fb.array([]) });

  get exercisesArray(): FormArray { return this.workoutForm.get('exercises') as FormArray; }

  public getControl(i: number, name: string): AbstractControl {
    return (this.exercisesArray.at(i) as FormGroup).get(name) as AbstractControl;
  }

  public getSetWeightsArray(i: number): FormArray {
    return (this.exercisesArray.at(i) as FormGroup).get('setWeights') as FormArray;
  }

  public getSetWeightControl(i: number, j: number): FormControl {
    return this.getSetWeightsArray(i).at(j) as FormControl;
  }

  public setIndices(i: number): number[] {
    const sets = +(this.getControl(i, 'sets').value) || 0;
    return Array.from({ length: Math.max(0, sets) }, (_, j) => j);
  }

  public getExerciseName(i: number): string {
    const id = this.getControl(i, 'exerciseId').value;
    return this.exercises().find(e => e.id === id)?.name || `Упражнение ${i + 1}`;
  }

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _fb: FormBuilder,
    private _workoutApi: WorkoutApiService,
    private _exerciseApi: ExerciseApiService,
    private _snack: MatSnackBar,
    private _dialog: MatDialog,
  ) {}

  public ngOnInit(): void {
    const params = this._route.snapshot.paramMap;
    this.clientId.set(params.get('clientId')!);
    const wId = params.get('workoutId');
    const sId = params.get('seasonId');
    if (sId) { this.isNew.set(true); this.seasonId.set(sId); }
    else if (wId && wId !== 'new') { this.isNew.set(false); this.workoutId.set(wId); }

    this._exerciseApi.getAll().pipe(
      tap((exs: Exercise[]) => { this.exercises.set(exs); this._loadWorkout(); })
    ).subscribe();
  }

  private _makeSetWeightsArray(sets: number, values?: (number | null)[]): FormArray {
    const controls = Array.from({ length: Math.max(0, sets) }, (_, j) =>
      new FormControl<number | null>(values?.[j] ?? null)
    );
    return this._fb.array(controls);
  }

  private _makeGroup(data?: {
    exerciseId?: string; weight?: number | null; sets?: number; reps?: number;
    setWeights?: number[]; supersetGroup?: number | null; supersetOrder?: number | null;
  }): FormGroup {
    const sets = data?.sets ?? 3;
    const hasSetWeights = !!(data?.setWeights && data.setWeights.length > 0);
    return this._fb.group({
      exerciseId: [data?.exerciseId || '', Validators.required],
      weight: [data?.weight ?? null],
      sets: [sets, [Validators.required, Validators.min(1)]],
      reps: [data?.reps ?? 10, [Validators.required, Validators.min(1)]],
      useSetWeights: [hasSetWeights],
      setWeights: this._makeSetWeightsArray(sets, data?.setWeights),
      supersetGroup: [data?.supersetGroup ?? null],
      supersetOrder: [data?.supersetOrder ?? null],
    });
  }

  private _loadWorkout(): void {
    if (this.isNew()) { this.loading.set(false); this.addRow(); return; }
    this._workoutApi.getWorkout(this.workoutId()).pipe(
      tap((w: Workout) => {
        this.workout.set(w);
        this.workoutForm.patchValue({ notes: w.notes || '' });
        w.workoutExercises.forEach((we: WorkoutExercise) => {
          this.exercisesArray.push(this._makeGroup({
            exerciseId: we.exerciseId, weight: we.weight, sets: we.sets, reps: we.reps,
            setWeights: we.setWeights, supersetGroup: we.supersetGroup ?? null, supersetOrder: we.supersetOrder ?? null,
          }));
        });
        this._updateRenderItems();
        this.loading.set(false);
      }),
      catchError(() => { this.loading.set(false); return EMPTY; })
    ).subscribe();
  }

  public addRow(): void {
    this.exercisesArray.push(this._makeGroup());
    this._updateRenderItems();
  }

  public removeRow(i: number): void {
    const g = this.exercisesArray.at(i) as FormGroup;
    const sg: number | null = g.get('supersetGroup')?.value;
    this.exercisesArray.removeAt(i);
    if (sg != null) {
      let order = 0;
      this.exercisesArray.controls.forEach(c => {
        const fg = c as FormGroup;
        if (fg.get('supersetGroup')?.value === sg) fg.patchValue({ supersetOrder: order++ });
      });
      const remaining = this.exercisesArray.controls.filter(c => (c as FormGroup).get('supersetGroup')?.value === sg);
      if (remaining.length < 2) remaining.forEach(c => (c as FormGroup).patchValue({ supersetGroup: null, supersetOrder: null }));
    }
    this._updateRenderItems();
  }

  public onSetsChange(i: number, newSets: number): void {
    if (!newSets || newSets < 1) return;
    this._syncSetWeightsCount(i, newSets);
    const sg: number | null = (this.exercisesArray.at(i) as FormGroup).get('supersetGroup')?.value;
    if (sg != null) {
      this.exercisesArray.controls.forEach((c, idx) => {
        if (idx === i) return;
        const fg = c as FormGroup;
        if (fg.get('supersetGroup')?.value === sg) {
          fg.patchValue({ sets: newSets });
          this._syncSetWeightsCount(idx, newSets);
        }
      });
    }
  }

  public onRepsChange(supersetGroup: number, newReps: number): void {
    this.exercisesArray.controls.forEach(c => {
      const fg = c as FormGroup;
      if (fg.get('supersetGroup')?.value === supersetGroup) fg.patchValue({ reps: newReps });
    });
  }

  private _syncSetWeightsCount(i: number, newSets: number): void {
    const arr = this.getSetWeightsArray(i);
    while (arr.length < newSets) arr.push(new FormControl<number | null>(null));
    while (arr.length > newSets) arr.removeAt(arr.length - 1);
  }

  private _updateRenderItems(): void {
    const items: RenderItem[] = [];
    const seenGroups = new Set<number>();
    this.exercisesArray.controls.forEach((ctrl, i) => {
      const g = ctrl as FormGroup;
      const sg: number | null = g.get('supersetGroup')?.value;
      if (sg != null && !seenGroups.has(sg)) {
        seenGroups.add(sg);
        const indices = this.exercisesArray.controls
          .map((c, idx) => ({ idx, order: (c as FormGroup).get('supersetOrder')?.value ?? 0, sg: (c as FormGroup).get('supersetGroup')?.value }))
          .filter(x => x.sg === sg)
          .sort((a, b) => a.order - b.order)
          .map(x => x.idx);
        items.push({ type: 'superset', indices, supersetGroup: sg });
      } else if (sg == null) {
        items.push({ type: 'single', indices: [i] });
      }
    });
    this.renderItems = items;
  }

  public openSupersetDialog(): void {
    const available = this.exercisesArray.controls
      .map((c, i) => ({ index: i, name: this.getExerciseName(i), sg: (c as FormGroup).get('supersetGroup')?.value }))
      .filter(ex => ex.sg == null)
      .map(ex => ({ index: ex.index, name: ex.name }));
    if (available.length < 2) {
      this._snack.open('Нужно минимум 2 свободных упражнения для супер-сета', 'OK', { duration: 3000 });
      return;
    }
    const ref = this._dialog.open(SupersetDialogComponent, { data: { exercises: available }, width: '400px' });
    ref.afterClosed().subscribe((selectedIndices: number[] | undefined) => {
      if (!selectedIndices || selectedIndices.length < 2) return;
      const groups = this.exercisesArray.controls
        .map(c => (c as FormGroup).get('supersetGroup')?.value)
        .filter((v): v is number => v != null);
      const maxGroup = groups.length > 0 ? Math.max(...groups) : 0;
      const nextGroup = maxGroup + 1;
      const firstG = this.exercisesArray.at(selectedIndices[0]) as FormGroup;
      const sets = firstG.get('sets')?.value ?? 3;
      const reps = firstG.get('reps')?.value ?? 10;
      selectedIndices.forEach((idx, order) => {
        const g = this.exercisesArray.at(idx) as FormGroup;
        g.patchValue({ supersetGroup: nextGroup, supersetOrder: order, sets, reps });
        this._syncSetWeightsCount(idx, sets);
      });
      this._updateRenderItems();
    });
  }

  public breakSuperset(supersetGroup: number): void {
    this.exercisesArray.controls.forEach(c => {
      const g = c as FormGroup;
      if (g.get('supersetGroup')?.value === supersetGroup) g.patchValue({ supersetGroup: null, supersetOrder: null });
    });
    this._updateRenderItems();
  }

  public save(): void {
    if (this.exercisesArray.length === 0) {
      this._snack.open('Добавьте хотя бы одно упражнение', 'OK', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    const exercises = this.exercisesArray.controls.map((ctrl, i) => {
      const g = ctrl as FormGroup;
      const v = g.value;
      const useSetWeights: boolean = v.useSetWeights;
      const setWeightsArr: (number | null)[] = this.getSetWeightsArray(i).value;
      const firstNonNull = setWeightsArr.find(w => w != null && w > 0) ?? null;
      return {
        exerciseId: v.exerciseId, sets: +v.sets, reps: +v.reps, order: i,
        weight: useSetWeights ? (firstNonNull ?? undefined) : (v.weight || undefined),
        setWeights: useSetWeights ? setWeightsArr.map(w => w ?? 0) : undefined,
        supersetGroup: v.supersetGroup ?? undefined,
        supersetOrder: v.supersetOrder ?? undefined,
      };
    });
    const payload = { notes: this.workoutForm.value.notes || undefined, exercises };
    const obs = this.isNew()
      ? this._workoutApi.createWorkout({ seasonId: this.seasonId(), ...payload })
      : this._workoutApi.updateWorkout(this.workoutId(), payload);
    obs.pipe(
      tap(() => {
        this._snack.open(this.isNew() ? 'Занятие создано' : 'Занятие обновлено', 'OK', { duration: 2500 });
        this._router.navigate(['/trainer/clients', this.clientId()]);
      }),
      catchError((err: any) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 4000 });
        this.saving.set(false);
        return EMPTY;
      })
    ).subscribe();
  }
}
