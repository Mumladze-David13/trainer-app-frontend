// src/app/core/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { User, AuthResponse, Role } from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'trainer_token';
  private readonly USER_KEY = 'trainer_user';

  // Active view mode for TRAINER_CLIENT users
  activeMode = signal<'trainer' | 'client'>('trainer');

  currentUser = signal<User | null>(this.loadUser());

  isLoggedIn = computed(() => !!this.currentUser());
  isTrainer = computed(() =>
    this.currentUser()?.role === 'TRAINER' || this.currentUser()?.role === 'TRAINER_CLIENT',
  );
  isClient = computed(() =>
    this.currentUser()?.role === 'CLIENT' || this.currentUser()?.role === 'TRAINER_CLIENT',
  );
  isTrainerClient = computed(() => this.currentUser()?.role === 'TRAINER_CLIENT');

  constructor(private http: HttpClient, private router: Router) {}

  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
  }) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap((res) => this.handleAuth(res)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.handleAuth(res)));
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setActiveMode(mode: 'trainer' | 'client') {
    this.activeMode.set(mode);
  }

  private handleAuth(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this.currentUser.set(res.user);

    // Set default active mode based on role
    if (res.user.role === 'TRAINER') this.activeMode.set('trainer');
    else if (res.user.role === 'CLIENT') this.activeMode.set('client');
    else this.activeMode.set('trainer');

    this.router.navigate(['/dashboard']);
  }

  private loadUser(): User | null {
    const str = localStorage.getItem(this.USER_KEY);
    return str ? JSON.parse(str) : null;
  }
}
