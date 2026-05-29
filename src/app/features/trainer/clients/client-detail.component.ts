// src/app/features/trainer/clients/client-detail.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { ClientApiService, SeasonApiService, WorkoutApiService } from '../../../core/services/api.service';
import { Season, Workout } from '../../../core/models/index';

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
  public loading = signal(true);
  public seasons = signal<Season[]>([]);
  public client = signal<any>(null);
  public sessionsPerSeason = signal(30);
  public showSeasonForm = signal(false);
  public savingSeason = signal(false);
  public clientId = signal('');

  public clientName = computed(() => {
    const c = this.client();
    return c ? `${c.firstName} ${c.lastName}` : '';
  });

  public seasonForm = this._fb.group({
    startDate: [new Date(), Validators.required],
    endDate: [null],
  });

  constructor(
    private _route: ActivatedRoute,
    private _fb: FormBuilder,
    private _clientApi: ClientApiService,
    private _seasonApi: SeasonApiService,
    private _snack: MatSnackBar,
  ) {}

  public ngOnInit() {
    const id = this._route.snapshot.paramMap.get('clientId')!;
    this.clientId.set(id);
    this._load(id);
  }

  private _load(clientId: string) {
    this.loading.set(true);
    this._clientApi.getClientDetail(clientId).subscribe({
      next: (data) => {
        this.client.set(data.client);
        this.seasons.set(data.seasons);
        this.sessionsPerSeason.set(data.sessionsPerSeason);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  public workoutCountClass(season: Season) {
    return season.workouts.length >= this.sessionsPerSeason() ? 'warn-count' : 'ok-count';
  }

  public createSeason() {
    if (this.seasonForm.invalid) { this.seasonForm.markAllAsTouched(); return; }
    this.savingSeason.set(true);
    const v = this.seasonForm.value;
    this._seasonApi.createSeason(this.clientId(), {
      startDate: (v.startDate as Date).toISOString(),
      endDate: v.endDate ? (v.endDate as Date).toISOString() : undefined,
    }).subscribe({
      next: () => {
        this._snack.open('Сезон создан', 'OK', { duration: 2500 });
        this.showSeasonForm.set(false);
        this._load(this.clientId());
        this.savingSeason.set(false);
      },
      error: (err) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.savingSeason.set(false);
      },
    });
  }
}
