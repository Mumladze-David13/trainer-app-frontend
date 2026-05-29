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
  loading = signal(true);
  seasons = signal<Season[]>([]);
  client = signal<any>(null);
  sessionsPerSeason = signal(30);
  showSeasonForm = signal(false);
  savingSeason = signal(false);
  clientId = signal('');

  clientName = computed(() => {
    const c = this.client();
    return c ? `${c.firstName} ${c.lastName}` : '';
  });

  seasonForm = this.fb.group({
    startDate: [new Date(), Validators.required],
    endDate: [null],
  });

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private clientApi: ClientApiService,
    private seasonApi: SeasonApiService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('clientId')!;
    this.clientId.set(id);
    this.load(id);
  }

  load(clientId: string) {
    this.loading.set(true);
    this.clientApi.getClientDetail(clientId).subscribe({
      next: (data) => {
        this.client.set(data.client);
        this.seasons.set(data.seasons);
        this.sessionsPerSeason.set(data.sessionsPerSeason);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  workoutCountClass(season: Season) {
    return season.workouts.length >= this.sessionsPerSeason() ? 'warn-count' : 'ok-count';
  }

  createSeason() {
    if (this.seasonForm.invalid) { this.seasonForm.markAllAsTouched(); return; }
    this.savingSeason.set(true);
    const v = this.seasonForm.value;
    this.seasonApi.createSeason(this.clientId(), {
      startDate: (v.startDate as Date).toISOString(),
      endDate: v.endDate ? (v.endDate as Date).toISOString() : undefined,
    }).subscribe({
      next: () => {
        this.snack.open('Сезон создан', 'OK', { duration: 2500 });
        this.showSeasonForm.set(false);
        this.load(this.clientId());
        this.savingSeason.set(false);
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.savingSeason.set(false);
      },
    });
  }
}
