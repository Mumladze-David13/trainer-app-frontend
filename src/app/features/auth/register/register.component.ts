// src/app/features/auth/register/register.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { Role } from '../../../core/models/index';

interface RoleOption {
  value: Role;
  label: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="auth-logo">
            <mat-icon>fitness_center</mat-icon>
          </div>
          <mat-card-title>Регистрация</mat-card-title>
          <mat-card-subtitle>Создайте аккаунт</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="name-row">
              <mat-form-field appearance="outline">
                <mat-label>Имя</mat-label>
                <input matInput formControlName="firstName" />
                @if (form.get('firstName')?.hasError('required') && form.get('firstName')?.touched) {
                  <mat-error>Обязательное поле</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Фамилия</mat-label>
                <input matInput formControlName="lastName" />
                @if (form.get('lastName')?.hasError('required') && form.get('lastName')?.touched) {
                  <mat-error>Обязательное поле</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              <mat-icon matPrefix>email</mat-icon>
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <mat-error>Некорректный email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Пароль</mat-label>
              <input matInput [type]="showPass() ? 'text' : 'password'"
                     formControlName="password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      (click)="showPass.set(!showPass())">
                <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
                <mat-error>Минимум 6 символов</mat-error>
              }
            </mat-form-field>

            <div class="role-label">Выберите роль</div>
            <div class="role-grid">
              @for (role of roles; track role.value) {
                <div class="role-card" [class.selected]="form.value.role === role.value"
                     (click)="form.get('role')?.setValue(role.value)">
                  <mat-icon>{{ role.icon }}</mat-icon>
                  <div class="role-card-title">{{ role.label }}</div>
                  <div class="role-card-desc">{{ role.description }}</div>
                </div>
              }
            </div>
            @if (form.get('role')?.hasError('required') && form.get('role')?.touched) {
              <div class="role-error">Выберите роль</div>
            }

            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }

            <button mat-raised-button color="primary" class="full-width submit-btn"
                    type="submit" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20" />
              } @else {
                Зарегистрироваться
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions align="center">
          <span>Уже есть аккаунт?</span>
          <a routerLink="/auth/login" mat-button color="primary">Войти</a>
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
      max-width: 480px;
    }
    mat-card-header {
      flex-direction: column;
      align-items: center;
      padding: 24px 24px 0;
      text-align: center;
    }
    .auth-logo {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: #1976d2;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .auth-logo mat-icon { color: white; font-size: 32px; width: 32px; height: 32px; }
    mat-card-content { padding: 24px !important; }
    .name-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .name-row mat-form-field { width: 100%; }
    .full-width { width: 100%; }
    .role-label { font-size: 14px; color: rgba(0,0,0,0.6); margin-bottom: 8px; }
    .role-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    @media (max-width: 400px) {
      .role-grid { grid-template-columns: 1fr; }
      .name-row { grid-template-columns: 1fr; }
    }
    .role-card {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px 8px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .role-card:hover { border-color: #1976d2; background: #f3f7ff; }
    .role-card.selected { border-color: #1976d2; background: #e3f2fd; }
    .role-card mat-icon { color: #1976d2; display: block; margin: 0 auto 4px; }
    .role-card-title { font-size: 13px; font-weight: 500; }
    .role-card-desc { font-size: 11px; color: rgba(0,0,0,0.5); margin-top: 2px; }
    .role-error { color: #f44336; font-size: 12px; margin-bottom: 8px; }
    .error-message {
      color: #f44336; font-size: 14px;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #ffebee;
      border-radius: 4px;
    }
    .submit-btn { margin-top: 8px; height: 44px; }
    mat-card-actions { padding: 0 24px 16px !important; }
  `],
})
export class RegisterComponent {
  roles: RoleOption[] = [
    { value: 'TRAINER', label: 'Тренер', description: 'Веду клиентов', icon: 'sports' },
    { value: 'CLIENT', label: 'Клиент', description: 'Занимаюсь у тренера', icon: 'person' },
    { value: 'TRAINER_CLIENT', label: 'Тренер-клиент', description: 'Оба режима', icon: 'swap_horiz' },
  ];

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['', Validators.required],
  });

  loading = signal(false);
  error = signal('');
  showPass = signal(false);

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const v = this.form.value;
    this.auth.register({
      email: v.email!,
      password: v.password!,
      firstName: v.firstName!,
      lastName: v.lastName!,
      role: v.role as Role,
    }).subscribe({
      error: (err) => {
        this.error.set(err.error?.message || 'Ошибка регистрации');
        this.loading.set(false);
      },
    });
  }
}
