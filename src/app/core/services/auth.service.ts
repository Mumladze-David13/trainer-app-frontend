// src/app/core/services/auth.service.ts
import { Injectable, signal, computed, Signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, Observable } from 'rxjs';
import { User, AuthResponse, Role } from '../models/index';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY: string = 'trainer_token';
  private readonly USER_KEY: string = 'trainer_user';

  // Active view mode for TRAINER_CLIENT users
  public activeMode: WritableSignal<'trainer' | 'client'> = signal<'trainer' | 'client'>('trainer');

  public currentUser: WritableSignal<User | null> = signal<User | null>(this.loadUser());

  public isLoggedIn: Signal<boolean> = computed(() => !!this.currentUser());
  public isTrainer: Signal<boolean> = computed(() =>
    this.currentUser()?.role === 'TRAINER' || this.currentUser()?.role === 'TRAINER_CLIENT',
  );
  public isClient: Signal<boolean> = computed(() =>
    this.currentUser()?.role === 'CLIENT' || this.currentUser()?.role === 'TRAINER_CLIENT',
  );
  public isTrainerClient: Signal<boolean> = computed(() => this.currentUser()?.role === 'TRAINER_CLIENT');

  constructor(private http: HttpClient, private router: Router) {}

  public register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(tap((res: AuthResponse) => this.handleAuth(res)));
  }

  public login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res: AuthResponse) => this.handleAuth(res)));
  }

  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public setActiveMode(mode: 'trainer' | 'client'): void {
    this.activeMode.set(mode);
  }

  private handleAuth(res: AuthResponse): void {
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
    const str: string | null = localStorage.getItem(this.USER_KEY);
    return str ? JSON.parse(str) : null;
  }
}
