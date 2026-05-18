// src/app/features/client/seasons/client-seasons.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { WorkoutApiService, SettingsApiService, UserApiService } from '../../../core/services/api.service';
import { Season, Workout } from '../../../core/models/index';

@Component({
  selector: 'app-client-seasons',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatExpansionModule, MatProgressSpinnerModule,
    MatChipsModule, MatSnackBarModule,
  ],
  template: `
    <h2>Мои занятия</h2>

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else if (!trainerId()) {
      <mat-card class="no-trainer">
        <mat-card-content>
          <mat-icon>person_search</mat-icon>
          <h3>Тренер не выбран</h3>
          <p>Перейдите в настройки, чтобы выбрать своего тренера</p>
          <button mat-raised-button color="primary" routerLink="/settings">
            <mat-icon>settings</mat-icon> Перейти в настройки
          </button>
        </mat-card-content>
      </mat-card>
    } @else if (seasons().length === 0) {
      <mat-card class="no-trainer">
        <mat-card-content>
          <mat-icon>event_note</mat-icon>
          <h3>Нет занятий</h3>
          <p>Ваш тренер ещё не добавил занятия</p>
        </mat-card-content>
      </mat-card>
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
                &nbsp;·&nbsp;
                {{ completedCount(season) }}/{{ season.workouts.length }} выполнено
              </mat-panel-description>
            </mat-expansion-panel-header>

            <div class="season-content">
              @if (season.workouts.length === 0) {
                <p class="empty">Занятий нет</p>
              } @else {
                <div class="workout-list">
                  @for (w of season.workouts; track w.id; let last = $last) {
                    <div class="workout-row"
                         [class.last-workout]="i === 0 && last"
                         [routerLink]="['/client/workout', w.id]">
                      <div class="workout-left">
                        <div class="workout-date">
                          <mat-icon>today</mat-icon>
                          {{ w.date | date:'EEEE, dd.MM.yyyy' }}
                        </div>
                        <div class="workout-stats">
                          {{ w.workoutExercises.length }} упр.
                          @if (w.isCompleted) {
                            · <span class="done-text">Выполнено</span>
                          } @else {
                            @if (donePercent(w) > 0) {
                              · {{ donePercent(w) }}% выполнено
                            }
                          }
                        </div>
                      </div>
                      <div class="workout-right">
                        @if (w.isCompleted) {
                          <mat-icon class="completed-icon">check_circle</mat-icon>
                        } @else {
                          <mat-chip class="open-chip">Открыть</mat-chip>
                        }
                        <mat-icon class="arrow">chevron_right</mat-icon>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </mat-expansion-panel>
        }
      </mat-accordion>
    }
  `,
  styles: [`
    h2 { margin: 0 0 16px; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .no-trainer mat-card-content {
      display: flex; flex-direction: column;
      align-items: center; text-align: center;
      padding: 40px 20px !important;
    }
    .no-trainer mat-icon { font-size: 48px; width: 48px; height: 48px; color: rgba(0,0,0,0.3); }
    .no-trainer h3 { margin: 12px 0 4px; }
    .no-trainer p { color: rgba(0,0,0,0.5); margin-bottom: 16px; }
    mat-expansion-panel-header mat-icon { margin-right: 6px; }
    .season-content { padding-top: 4px; }
    .empty { color: rgba(0,0,0,0.4); text-align: center; padding: 16px; }
    .workout-list { display: flex; flex-direction: column; gap: 6px; }
    .workout-row {
      display: flex; align-items: center;
      gap: 12px; padding: 12px 14px;
      background: #f8f9fa; border-radius: 8px;
      cursor: pointer; transition: background 0.15s;
      border: 2px solid transparent;
    }
    .workout-row:hover { background: #e3f2fd; }
    .workout-row.last-workout { border-color: #1976d2; background: #e8f4ff; }
    .workout-left { flex: 1; }
    .workout-date { display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 500; text-transform: capitalize; }
    .workout-stats { font-size: 12px; color: rgba(0,0,0,0.5); margin-top: 2px; }
    .done-text { color: #388e3c; font-weight: 500; }
    .workout-right { display: flex; align-items: center; gap: 4px; }
    .completed-icon { color: #388e3c; }
    .open-chip { background: #1976d2 !important; color: white !important; font-size: 11px !important; height: 24px !important; }
    .arrow { color: rgba(0,0,0,0.3); }
  `],
})
export class ClientSeasonsComponent implements OnInit {
  loading = signal(true);
  seasons = signal<Season[]>([]);
  trainerId = signal<string | null>(null);

  constructor(
    private workoutApi: WorkoutApiService,
    private settingsApi: SettingsApiService,
  ) {}

  ngOnInit() {
    this.settingsApi.getClientSettings().subscribe({
      next: (s) => {
        this.trainerId.set(s.trainerId);
        if (s.trainerId) {
          this.loadSeasons(s.trainerId);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  loadSeasons(trainerId: string) {
    this.workoutApi.getClientSeasons(trainerId).subscribe({
      next: (data) => { this.seasons.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  completedCount(season: Season) {
    return season.workouts.filter((w) => w.isCompleted).length;
  }

  donePercent(w: Workout) {
    const total = w.workoutExercises.length;
    if (!total) return 0;
    const done = w.workoutExercises.filter((e) => e.isDone).length;
    return Math.round((done / total) * 100);
  }
}
