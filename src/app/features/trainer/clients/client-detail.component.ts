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
  template: `
    <div class="back-row">
      <button mat-button routerLink="/trainer/clients">
        <mat-icon>arrow_back</mat-icon> Все клиенты
      </button>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else {
      <div class="client-header">
        <div class="client-avatar">
          {{ clientName()[0] }}{{ clientName().split(' ')[1]?.[0] || '' }}
        </div>
        <div>
          <h2>{{ clientName() }}</h2>
          <div class="client-email">{{ client()?.email }}</div>
        </div>
        <div class="sessions-info">
          <mat-icon>info_outline</mat-icon>
          Занятий в сезоне: <strong>{{ sessionsPerSeason() }}</strong>
        </div>
      </div>

      <!-- Add Season Form -->
      @if (showSeasonForm()) {
        <mat-card class="form-card">
          <mat-card-content>
            <h3>Новый сезон</h3>
            <form [formGroup]="seasonForm" (ngSubmit)="createSeason()">
              <div class="season-name-hint">
                <mat-icon>info_outline</mat-icon>
                Название присваивается автоматически: Сезон {{ seasons().length + 1 }}
              </div>
              <div class="date-row">
                <mat-form-field appearance="outline">
                  <mat-label>Дата начала</mat-label>
                  <input matInput [matDatepicker]="startPicker" formControlName="startDate" />
                  <mat-datepicker-toggle matSuffix [for]="startPicker" />
                  <mat-datepicker #startPicker />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Дата окончания (необяз.)</mat-label>
                  <input matInput [matDatepicker]="endPicker" formControlName="endDate" />
                  <mat-datepicker-toggle matSuffix [for]="endPicker" />
                  <mat-datepicker #endPicker />
                </mat-form-field>
              </div>
              <div class="form-actions">
                <button mat-button type="button" (click)="showSeasonForm.set(false)">Отмена</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="savingSeason()">
                  {{ savingSeason() ? 'Создаю...' : 'Создать сезон' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <div class="seasons-header">
        <h3>Сезоны</h3>
        <button mat-raised-button color="accent" (click)="showSeasonForm.set(true)">
          <mat-icon>add</mat-icon> Новый сезон
        </button>
      </div>

      @if (seasons().length === 0) {
        <div class="empty-state">
          <mat-icon>event_note</mat-icon>
          <p>Нет сезонов. Создайте первый!</p>
        </div>
      } @else {
        <mat-accordion multi="false">
          @for (season of seasons(); track season.id; let i = $index) {
            <mat-expansion-panel [expanded]="i === 0">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>event_note</mat-icon>
                  {{ season.name }}
                </mat-panel-title>
                <mat-panel-description>
                  {{ season.startDate | date:'dd.MM.yyyy' }}
                  @if (season.endDate) { — {{ season.endDate | date:'dd.MM.yyyy' }} }
                  &nbsp;·&nbsp;
                  <span [class]="workoutCountClass(season)">
                    {{ season.workouts.length }}/{{ sessionsPerSeason() }} занятий
                  </span>
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="season-content">
                <div class="workout-list-header">
                  <span>Занятия</span>
                  <button mat-raised-button color="primary" [disabled]="season.workouts.length >= sessionsPerSeason()"
                          [routerLink]="['/trainer/clients', clientId(), 'workout', 'new', season.id]">
                    <mat-icon>add</mat-icon> Добавить занятие
                  </button>
                </div>

                @if (season.workouts.length >= sessionsPerSeason()) {
                  <div class="limit-warn">
                    <mat-icon>warning</mat-icon>
                    Достигнут лимит занятий в сезоне ({{ sessionsPerSeason() }})
                  </div>
                }

                @if (season.workouts.length === 0) {
                  <p class="no-workouts">Занятий нет. Добавьте первое!</p>
                } @else {
                  <div class="workout-cards">
                    @for (w of season.workouts; track w.id) {
                      <div class="workout-item"
                           [routerLink]="['/trainer/clients', clientId(), 'workout', w.id]">
                        <div class="workout-date">
                          <mat-icon>today</mat-icon>
                          {{ w.date | date:'dd.MM.yyyy' }}
                        </div>
                        <div class="workout-meta">
                          {{ w.workoutExercises.length }} упр.
                        </div>
                        @if (w.isCompleted) {
                          <mat-icon class="done-icon" matTooltip="Выполнено клиентом">check_circle</mat-icon>
                        }
                        <mat-icon class="arrow">chevron_right</mat-icon>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>
      }
    }
  `,
  styles: [`
    .back-row { margin-bottom: 12px; }
    .client-header {
      display: flex; align-items: center; gap: 16px;
      margin-bottom: 20px; flex-wrap: wrap;
    }
    .client-avatar {
      width: 60px; height: 60px; border-radius: 50%;
      background: #1976d2; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px; font-weight: 500; flex-shrink: 0;
    }
    .client-header h2 { margin: 0; }
    .client-email { color: rgba(0,0,0,0.5); font-size: 14px; }
    .sessions-info {
      margin-left: auto; display: flex; align-items: center; gap: 4px;
      font-size: 14px; color: rgba(0,0,0,0.6);
      background: #f5f5f5; padding: 6px 12px; border-radius: 8px;
    }
    .form-card { margin-bottom: 16px; }
    mat-card-content { padding: 16px !important; }
    h3 { margin: 0 0 12px; }
    .season-name-hint {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #1976d2;
      background: #e3f2fd; padding: 8px 12px;
      border-radius: 6px; margin-bottom: 12px;
    }
    .season-name-hint mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .full-width { width: 100%; }
    .date-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 500px) { .date-row { grid-template-columns: 1fr; } }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .seasons-header {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 12px;
    }
    .seasons-header h3 { margin: 0; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; padding: 60px 20px; color: rgba(0,0,0,0.4); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 8px; }
    mat-expansion-panel-header mat-icon { margin-right: 6px; }
    .warn-count { color: #f57c00; font-weight: 500; }
    .ok-count { color: #388e3c; }
    .season-content { padding: 8px 0; }
    .workout-list-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 12px;
    }
    .limit-warn {
      display: flex; align-items: center; gap: 6px;
      color: #f57c00; background: #fff3e0;
      padding: 8px 12px; border-radius: 4px;
      font-size: 14px; margin-bottom: 12px;
    }
    .no-workouts { color: rgba(0,0,0,0.4); text-align: center; padding: 20px; }
    .workout-cards { display: flex; flex-direction: column; gap: 6px; }
    .workout-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px; background: #f8f9fa;
      border-radius: 8px; cursor: pointer;
      transition: background 0.15s;
    }
    .workout-item:hover { background: #e3f2fd; }
    .workout-date { display: flex; align-items: center; gap: 4px; font-size: 14px; }
    .workout-meta { font-size: 12px; color: rgba(0,0,0,0.5); }
    .done-icon { color: #388e3c; margin-left: auto; }
    .arrow { color: rgba(0,0,0,0.3); margin-left: auto; }
  `],
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
