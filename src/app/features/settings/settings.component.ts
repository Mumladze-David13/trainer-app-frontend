// src/app/features/settings/settings.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSliderModule } from '@angular/material/slider';
import { SettingsApiService, UserApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/index';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatProgressSpinnerModule,
    MatDividerModule, MatSliderModule,
  ],
  template: `
    <h2>Настройки</h2>

    <!-- User info card -->
    <mat-card class="settings-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>account_circle</mat-icon>
        <mat-card-title>Профиль</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="info-row">
          <span class="label">Имя</span>
          <span>{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</span>
        </div>
        <div class="info-row">
          <span class="label">Email</span>
          <span>{{ auth.currentUser()?.email }}</span>
        </div>
        <div class="info-row">
          <span class="label">Роль</span>
          <span class="role-badge" [class]="'role-' + auth.currentUser()?.role?.toLowerCase()">
            {{ roleLabel() }}
          </span>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Trainer settings -->
    @if (auth.isTrainer()) {
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>sports</mat-icon>
          <mat-card-title>Настройки тренера</mat-card-title>
          <mat-card-subtitle>Параметры тренировочного процесса</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loadingTrainer()) {
            <mat-spinner diameter="30" />
          } @else {
            <form [formGroup]="trainerForm" (ngSubmit)="saveTrainerSettings()">
              <div class="slider-section">
                <div class="slider-label">
                  <mat-icon>event_repeat</mat-icon>
                  Занятий в сезоне:
                  <strong>{{ trainerForm.value.sessionsPerSeason }}</strong>
                </div>
                <div class="slider-hint">
                  Максимальное количество занятий в одном сезоне для каждого клиента
                </div>
                <div class="sessions-input">
                  <mat-form-field appearance="outline">
                    <mat-label>Количество занятий</mat-label>
                    <input matInput type="number" formControlName="sessionsPerSeason"
                           min="1" max="365" />
                    <mat-hint>от 1 до 365</mat-hint>
                    @if (trainerForm.get('sessionsPerSeason')?.hasError('min')) {
                      <mat-error>Минимум 1</mat-error>
                    }
                    @if (trainerForm.get('sessionsPerSeason')?.hasError('max')) {
                      <mat-error>Максимум 365</mat-error>
                    }
                  </mat-form-field>
                </div>
              </div>
              <div class="card-actions">
                <button mat-raised-button color="primary" type="submit"
                        [disabled]="savingTrainer() || trainerForm.invalid">
                  {{ savingTrainer() ? 'Сохраняю...' : 'Сохранить' }}
                </button>
              </div>
            </form>
          }
        </mat-card-content>
      </mat-card>
    }

    <!-- Client settings -->
    @if (auth.isClient()) {
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>person</mat-icon>
          <mat-card-title>Мой тренер</mat-card-title>
          <mat-card-subtitle>Выберите основного тренера</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loadingClient()) {
            <mat-spinner diameter="30" />
          } @else {
            <form [formGroup]="clientForm" (ngSubmit)="saveClientSettings()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Выберите тренера</mat-label>
                <mat-select formControlName="trainerId">
                  <mat-option [value]="null">— Без тренера —</mat-option>
                  @for (t of trainers(); track t.id) {
                    <mat-option [value]="t.id">
                      {{ t.firstName }} {{ t.lastName }}
                      @if (t.id === auth.currentUser()?.id) { (Я — тренер сам себе) }
                      <span class="trainer-email">({{ t.email }})</span>
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              @if (currentTrainer()) {
                <div class="current-trainer">
                  <mat-icon>check_circle</mat-icon>
                  Текущий тренер: <strong>{{ currentTrainer()!.firstName }} {{ currentTrainer()!.lastName }}</strong>
                </div>
              }

              <div class="card-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="savingClient()">
                  {{ savingClient() ? 'Сохраняю...' : 'Сохранить' }}
                </button>
              </div>
            </form>
          }
        </mat-card-content>
      </mat-card>
    }

    <!-- Mode switcher for TRAINER_CLIENT -->
    @if (auth.isTrainerClient()) {
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>swap_horiz</mat-icon>
          <mat-card-title>Режим интерфейса</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="mode-buttons">
            <button mat-raised-button
                    [color]="auth.activeMode() === 'trainer' ? 'primary' : ''"
                    (click)="auth.setActiveMode('trainer')">
              <mat-icon>sports</mat-icon> Режим тренера
            </button>
            <button mat-raised-button
                    [color]="auth.activeMode() === 'client' ? 'primary' : ''"
                    (click)="auth.setActiveMode('client')">
              <mat-icon>person</mat-icon> Режим клиента
            </button>
          </div>
          <p class="mode-hint">
            Вы можете переключаться между режимами в любое время из бокового меню или здесь.
          </p>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    h2 { margin: 0 0 16px; }
    .settings-card { margin-bottom: 16px; }
    mat-card-content { padding: 16px !important; }
    .info-row {
      display: flex; align-items: center; gap: 16px;
      padding: 8px 0; font-size: 15px;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-row:last-child { border-bottom: none; }
    .label { min-width: 80px; color: rgba(0,0,0,0.5); font-size: 13px; }
    .role-badge {
      padding: 3px 12px; border-radius: 12px;
      font-size: 13px; font-weight: 500;
    }
    .role-trainer { background: #e3f2fd; color: #1565c0; }
    .role-client { background: #e8f5e9; color: #1b5e20; }
    .role-trainer_client { background: #fff3e0; color: #e65100; }
    .full-width { width: 100%; }
    .slider-section { margin-bottom: 16px; }
    .slider-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 15px; margin-bottom: 4px;
    }
    .slider-hint { font-size: 13px; color: rgba(0,0,0,0.5); margin-bottom: 12px; }
    .sessions-input { max-width: 200px; }
    .card-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
    .current-trainer {
      display: flex; align-items: center; gap: 6px;
      color: #388e3c; font-size: 14px;
      background: #e8f5e9; padding: 8px 12px;
      border-radius: 6px; margin-bottom: 12px;
    }
    .trainer-email { font-size: 12px; color: rgba(0,0,0,0.4); margin-left: 4px; }
    .mode-buttons { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .mode-hint { font-size: 13px; color: rgba(0,0,0,0.5); margin: 0; }
  `],
})
export class SettingsComponent implements OnInit {
  loadingTrainer = signal(true);
  loadingClient = signal(true);
  savingTrainer = signal(false);
  savingClient = signal(false);
  trainers = signal<User[]>([]);

  trainerForm = this.fb.group({
    sessionsPerSeason: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
  });

  clientForm = this.fb.group({
    trainerId: [null as string | null],
  });

  currentTrainer = computed(() => {
    const tid = this.clientForm.value.trainerId;
    return tid ? this.trainers().find((t) => t.id === tid) || null : null;
  });

  roleLabel = computed(() => {
    const map: Record<string, string> = { TRAINER: 'Тренер', CLIENT: 'Клиент', TRAINER_CLIENT: 'Тренер-Клиент' };
    return map[this.auth.currentUser()?.role || ''] || '';
  });

  constructor(
    private fb: FormBuilder,
    public auth: AuthService,
    private settingsApi: SettingsApiService,
    private userApi: UserApiService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    if (this.auth.isTrainer()) {
      this.settingsApi.getTrainerSettings().subscribe({
        next: (s) => {
          this.trainerForm.patchValue({ sessionsPerSeason: s.sessionsPerSeason });
          this.loadingTrainer.set(false);
        },
        error: () => this.loadingTrainer.set(false),
      });
    }

    if (this.auth.isClient()) {
      this.userApi.getTrainers().subscribe({
        next: (ts) => {
          // Include self for TRAINER_CLIENT
          const me = this.auth.currentUser();
          const list = [...ts];
          if (me && me.role === 'TRAINER_CLIENT' && !list.find(t => t.id === me.id)) {
            list.unshift(me as any);
          }
          this.trainers.set(list);
        },
      });
      this.settingsApi.getClientSettings().subscribe({
        next: (s) => {
          this.clientForm.patchValue({ trainerId: s.trainerId });
          this.loadingClient.set(false);
        },
        error: () => this.loadingClient.set(false),
      });
    }
  }

  saveTrainerSettings() {
    if (this.trainerForm.invalid) return;
    this.savingTrainer.set(true);
    this.settingsApi.updateTrainerSettings(this.trainerForm.value.sessionsPerSeason!).subscribe({
      next: () => {
        this.snack.open('Настройки сохранены', 'OK', { duration: 2500 });
        this.savingTrainer.set(false);
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.savingTrainer.set(false);
      },
    });
  }

  saveClientSettings() {
    this.savingClient.set(true);
    this.settingsApi.setClientTrainer(this.clientForm.value.trainerId || null).subscribe({
      next: () => {
        this.snack.open('Тренер сохранён', 'OK', { duration: 2500 });
        this.savingClient.set(false);
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.savingClient.set(false);
      },
    });
  }
}
