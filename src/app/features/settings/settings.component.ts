// src/app/features/settings/settings.component.ts
import { Component, signal, OnInit, computed, WritableSignal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
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
import { SettingsApiService, UserApiService, ClientSettings } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { User, TrainerSettings } from '../../core/models/index';

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
  public loadingTrainer: WritableSignal<boolean> = signal(true);
  public loadingClient: WritableSignal<boolean> = signal(true);
  public savingTrainer: WritableSignal<boolean> = signal(false);
  public savingClient: WritableSignal<boolean> = signal(false);
  public trainers: WritableSignal<User[]> = signal<User[]>([]);

  public trainerForm: FormGroup<{
    sessionsPerSeason: FormControl<number | null>;
  }> = this._fb.group({
    sessionsPerSeason: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
  });

  public clientForm: FormGroup<{
    trainerId: FormControl<string | null>;
  }> = this._fb.group({
    trainerId: [null as string | null],
  });

  public currentTrainer: Signal<User | null> = computed(() => {
    const tid: string | null = this.clientForm.value.trainerId || null;
    return tid ? this.trainers().find((t: User) => t.id === tid) || null : null;
  });

  public roleLabel: Signal<string> = computed(() => {
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

  public ngOnInit(): void {
    if (this.auth.isTrainer()) {
      this._settingsApi.getTrainerSettings().subscribe({
        next: (s: TrainerSettings) => {
          this.trainerForm.patchValue({ sessionsPerSeason: s.sessionsPerSeason });
          this.loadingTrainer.set(false);
        },
        error: () => this.loadingTrainer.set(false),
      });
    }

    if (this.auth.isClient()) {
      this._userApi.getTrainers().subscribe({
        next: (ts: User[]) => {
          // Include self for TRAINER_CLIENT
          const me: User | null = this.auth.currentUser();
          const list: User[] = [...ts];
          if (me && me.role === 'TRAINER_CLIENT' && !list.find((t: User) => t.id === me.id)) {
            list.unshift(me);
          }
          this.trainers.set(list);
        },
      });
      this._settingsApi.getClientSettings().subscribe({
        next: (s: ClientSettings) => {
          this.clientForm.patchValue({ trainerId: s.trainerId });
          this.loadingClient.set(false);
        },
        error: () => this.loadingClient.set(false),
      });
    }
  }

  public saveTrainerSettings(): void {
    if (this.trainerForm.invalid) return;
    this.savingTrainer.set(true);
    this._settingsApi.updateTrainerSettings(this.trainerForm.value.sessionsPerSeason!).subscribe({
      next: () => {
        this._snack.open('Настройки сохранены', 'OK', { duration: 2500 });
        this.savingTrainer.set(false);
      },
      error: (err: any) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.savingTrainer.set(false);
      },
    });
  }

  public saveClientSettings(): void {
    this.savingClient.set(true);
    this._settingsApi.setClientTrainer(this.clientForm.value.trainerId || null).subscribe({
      next: () => {
        this._snack.open('Тренер сохранён', 'OK', { duration: 2500 });
        this.savingClient.set(false);
      },
      error: (err: any) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.savingClient.set(false);
      },
    });
  }
}
