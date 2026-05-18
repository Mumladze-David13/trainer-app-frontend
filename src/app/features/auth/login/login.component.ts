// src/app/features/auth/login/login.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="auth-logo">
            <mat-icon>fitness_center</mat-icon>
          </div>
          <mat-card-title>Помощник тренера</mat-card-title>
          <mat-card-subtitle>Войдите в свой аккаунт</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-icon matPrefix>email</mat-icon>
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <mat-error>Email обязателен</mat-error>
              }
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <mat-error>Введите корректный email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Пароль</mat-label>
              <input matInput [type]="showPass() ? 'text' : 'password'"
                     formControlName="password" autocomplete="current-password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      (click)="showPass.set(!showPass())">
                <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                <mat-error>Пароль обязателен</mat-error>
              }
            </mat-form-field>

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <button mat-raised-button color="primary" class="full-width submit-btn"
                    type="submit" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Войти
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions align="center">
          <span>Нет аккаунта?</span>
          <a routerLink="/auth/register" mat-button color="primary">Зарегистрироваться</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #f5f5f5;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
    }
    mat-card-header {
      flex-direction: column;
      align-items: center;
      padding: 24px 24px 0;
      text-align: center;
    }
    .auth-logo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #1976d2;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
    .auth-logo mat-icon {
      color: white;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }
    mat-card-title { font-size: 22px !important; }
    mat-card-content { padding: 24px !important; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 8px; height: 44px; }
    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #ffebee;
      border-radius: 4px;
    }
    mat-card-actions { padding: 0 24px 16px !important; }
  `],
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      error: (err) => {
        this.error.set(err.error?.message || 'Неверный email или пароль');
        this.loading.set(false);
      },
    });
  }
}
