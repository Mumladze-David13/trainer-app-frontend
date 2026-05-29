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
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  public roles: RoleOption[] = [
    { value: 'TRAINER', label: 'Тренер', description: 'Веду клиентов', icon: 'sports' },
    { value: 'CLIENT', label: 'Клиент', description: 'Занимаюсь у тренера', icon: 'person' },
    { value: 'TRAINER_CLIENT', label: 'Тренер-клиент', description: 'Оба режима', icon: 'swap_horiz' },
  ];

  public form = this._fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['', Validators.required],
  });

  public loading = signal(false);
  public error = signal('');
  public showPass = signal(false);

  constructor(private _fb: FormBuilder, private _auth: AuthService) {}

  public onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const v = this.form.value;
    this._auth.register({
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
