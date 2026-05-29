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
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  public loadingTrainer = signal(true);
  public loadingClient = signal(true);
  public savingTrainer = signal(false);
  public savingClient = signal(false);
  public trainers = signal<User[]>([]);

  public trainerForm = this._fb.group({
    sessionsPerSeason: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
  });

  public clientForm = this._fb.group({
    trainerId: [null as string | null],
  });

  public currentTrainer = computed(() => {
    const tid = this.clientForm.value.trainerId;
    return tid ? this.trainers().find((t) => t.id === tid) || null : null;
  });

  public roleLabel = computed(() => {
    const map: Record<string, string> = { TRAINER: 'Тренер', CLIENT: 'Клиент', TRAINER_CLIENT: 'Тренер-Клиент' };
    return map[this.auth.currentUser()?.role || ''] || '';
  });

  constructor(
    private _fb: FormBuilder,
    public auth: AuthService,
    private _settingsApi: SettingsApiService,
    private _userApi: UserApiService,
    private _snack: MatSnackBar,
  ) {}

  public ngOnInit() {
    if (this.auth.isTrainer()) {
      this._settingsApi.getTrainerSettings().subscribe({
        next: (s) => {
          this.trainerForm.patchValue({ sessionsPerSeason: s.sessionsPerSeason });
          this.loadingTrainer.set(false);
        },
        error: () => this.loadingTrainer.set(false),
      });
    }

    if (this.auth.isClient()) {
      this._userApi.getTrainers().subscribe({
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
      this._settingsApi.getClientSettings().subscribe({
        next: (s) => {
          this.clientForm.patchValue({ trainerId: s.trainerId });
          this.loadingClient.set(false);
        },
        error: () => this.loadingClient.set(false),
      });
    }
  }

  public saveTrainerSettings() {
    if (this.trainerForm.invalid) return;
    this.savingTrainer.set(true);
    this._settingsApi.updateTrainerSettings(this.trainerForm.value.sessionsPerSeason!).subscribe({
      next: () => {
        this._snack.open('Настройки сохранены', 'OK', { duration: 2500 });
        this.savingTrainer.set(false);
      },
      error: (err) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.savingTrainer.set(false);
      },
    });
  }

  public saveClientSettings() {
    this.savingClient.set(true);
    this._settingsApi.setClientTrainer(this.clientForm.value.trainerId || null).subscribe({
      next: () => {
        this._snack.open('Тренер сохранён', 'OK', { duration: 2500 });
        this.savingClient.set(false);
      },
      error: (err) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.savingClient.set(false);
      },
    });
  }
}
