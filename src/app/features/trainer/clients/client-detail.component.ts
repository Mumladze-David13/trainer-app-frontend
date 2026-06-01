// src/app/features/trainer/clients/client-detail.component.ts
import { Component, signal, OnInit, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ClientApiService, SeasonApiService, WorkoutApiService } from '../../../core/services/api.service';
import { Season, Workout, User } from '../../../core/models/index';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatExpansionModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule,
    MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatDividerModule, MatBadgeModule,
  ],
  templateUrl: './client-detail.component.html',
  styleUrls: ['./client-detail.component.css'],
})
export class ClientDetailComponent implements OnInit {
  public loading: WritableSignal<boolean> = signal(true);
  public seasons: WritableSignal<Season[]> = signal<Season[]>([]);
  public client: WritableSignal<User | null> = signal<User | null>(null);
  public sessionsPerSeason: WritableSignal<number> = signal(30);
  public showSeasonForm: WritableSignal<boolean> = signal(false);
  public savingSeason: WritableSignal<boolean> = signal(false);
  public clientId: WritableSignal<string> = signal('');

  public clientName: Signal<string> = computed(() => {
    const c: User | null = this.client();
    return c ? `${c.firstName} ${c.lastName}` : '';
  });

  public seasonForm: FormGroup<{
    startDate: FormControl<Date | null>;
    endDate: FormControl<Date | null>;
  }> = this._fb.group({
    startDate: [new Date(), Validators.required],
    endDate: [null as Date | null],
  });

  constructor(
    private _route: ActivatedRoute,
    private _fb: FormBuilder,
    private _clientApi: ClientApiService,
    private _seasonApi: SeasonApiService,
    private _snack: MatSnackBar,
  ) {}

  public ngOnInit(): void {
    const id: string = this._route.snapshot.paramMap.get('clientId')!;
    this.clientId.set(id);
    this._load(id);
  }

  private _load(clientId: string): void {
    this.loading.set(true);
    this._clientApi.getClientDetail(clientId).pipe(
      tap((data) => {
        this.client.set(data.client);
        this.seasons.set(data.seasons);
        this.sessionsPerSeason.set(data.sessionsPerSeason);
        this.loading.set(false);
      }),
      catchError(() => {
        this.loading.set(false);
        return EMPTY;
      })
    ).subscribe();
  }

  public workoutCountClass(season: Season): string {
    return season.workouts.length >= this.sessionsPerSeason() ? 'warn-count' : 'ok-count';
  }

  public createSeason(): void {
    if (this.seasonForm.invalid) { this.seasonForm.markAllAsTouched(); return; }
    this.savingSeason.set(true);
    const formValue = this.seasonForm.value;
    this._seasonApi.createSeason(this.clientId(), {
      startDate: (formValue.startDate as Date).toISOString(),
      endDate: formValue.endDate ? (formValue.endDate as Date).toISOString() : undefined,
    }).pipe(
      tap(() => {
        this._snack.open('Сезон создан', 'OK', { duration: 2500 });
        this.showSeasonForm.set(false);
        this._load(this.clientId());
        this.savingSeason.set(false);
      }),
      catchError((err: any) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.savingSeason.set(false);
        return EMPTY;
      })
    ).subscribe();
  }
}
