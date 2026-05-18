// src/app/app.component.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from './core/services/auth.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatSidenavModule, MatListModule, MatMenuModule,
    MatDividerModule,
  ],
  template: `
    @if (auth.isLoggedIn()) {
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav [mode]="isMobile() ? 'over' : 'side'"
                     [opened]="!isMobile()"
                     class="sidenav">
          <div class="sidenav-header">
            <mat-icon class="logo-icon">fitness_center</mat-icon>
            <div>
              <div class="app-title">Помощник тренера</div>
              <div class="user-name">{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</div>
            </div>
          </div>

          <!-- Mode switcher for TRAINER_CLIENT -->
          @if (auth.isTrainerClient()) {
            <div class="mode-switcher">
              <button mat-button [class.active]="auth.activeMode() === 'trainer'"
                      (click)="auth.setActiveMode('trainer')">
                <mat-icon>sports</mat-icon> Тренер
              </button>
              <button mat-button [class.active]="auth.activeMode() === 'client'"
                      (click)="auth.setActiveMode('client')">
                <mat-icon>person</mat-icon> Клиент
              </button>
            </div>
          }

          <mat-nav-list>
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link"
               (click)="isMobile() && sidenav.close()">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span>Главная</span>
            </a>

            @if (showTrainerMenu()) {
              <mat-divider />
              <div class="nav-section-label">Тренер</div>
              <a mat-list-item routerLink="/trainer/exercises" routerLinkActive="active-link"
                 (click)="isMobile() && sidenav.close()">
                <mat-icon matListItemIcon>list</mat-icon>
                <span>Упражнения</span>
              </a>
              <a mat-list-item routerLink="/trainer/clients" routerLinkActive="active-link"
                 (click)="isMobile() && sidenav.close()">
                <mat-icon matListItemIcon>group</mat-icon>
                <span>Клиенты</span>
              </a>
            }

            @if (showClientMenu()) {
              <mat-divider />
              <div class="nav-section-label">Клиент</div>
              <a mat-list-item routerLink="/client/seasons" routerLinkActive="active-link"
                 (click)="isMobile() && sidenav.close()">
                <mat-icon matListItemIcon>event_note</mat-icon>
                <span>Мои занятия</span>
              </a>
            }

            <mat-divider />
            <a mat-list-item routerLink="/settings" routerLinkActive="active-link"
               (click)="isMobile() && sidenav.close()">
              <mat-icon matListItemIcon>settings</mat-icon>
              <span>Настройки</span>
            </a>
          </mat-nav-list>

          <div class="sidenav-footer">
            <button mat-button color="warn" (click)="auth.logout()" class="logout-btn">
              <mat-icon>logout</mat-icon> Выйти
            </button>
          </div>
        </mat-sidenav>

        <mat-sidenav-content>
          <mat-toolbar color="primary" class="toolbar">
            @if (isMobile()) {
              <button mat-icon-button (click)="sidenav.toggle()">
                <mat-icon>menu</mat-icon>
              </button>
            }
            <span class="toolbar-title">Помощник тренера</span>
            <span class="spacer"></span>
            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="user-menu-header">
                <div>{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</div>
                <div class="user-email">{{ auth.currentUser()?.email }}</div>
                <div class="role-label">{{ roleLabel() }}</div>
              </div>
              <mat-divider />
              <button mat-menu-item routerLink="/settings">
                <mat-icon>settings</mat-icon> Настройки
              </button>
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon>logout</mat-icon> Выйти
              </button>
            </mat-menu>
          </mat-toolbar>

          <div class="content">
            <router-outlet />
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav {
      width: 260px;
      display: flex;
      flex-direction: column;
    }
    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
      background: #1976d2;
      color: white;
    }
    .logo-icon { font-size: 36px; width: 36px; height: 36px; }
    .app-title { font-size: 16px; font-weight: 600; }
    .user-name { font-size: 12px; opacity: 0.8; }

    .mode-switcher {
      display: flex;
      padding: 8px;
      gap: 4px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }
    .mode-switcher button { flex: 1; font-size: 12px; }
    .mode-switcher button.active {
      background: #e3f2fd;
      color: #1976d2;
    }

    .nav-section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: rgba(0,0,0,0.4);
      padding: 8px 16px 4px;
      letter-spacing: 0.5px;
    }
    .active-link {
      background: #e3f2fd !important;
      color: #1976d2 !important;
    }
    .active-link mat-icon { color: #1976d2 !important; }

    .sidenav-footer {
      margin-top: auto;
      padding: 8px 16px 16px;
      border-top: 1px solid #e0e0e0;
    }
    .logout-btn { width: 100%; }

    .toolbar { position: sticky; top: 0; z-index: 10; }
    .toolbar-title { font-size: 18px; margin-left: 8px; }
    .spacer { flex: 1; }
    .content { padding: 16px; max-width: 1200px; margin: 0 auto; }

    .user-menu-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
    }
    .user-email { font-size: 12px; color: rgba(0,0,0,0.5); margin: 2px 0 6px; }
    .role-label { font-size: 12px; color: #1976d2; font-weight: 500; }

    @media (max-width: 600px) {
      .content { padding: 8px; }
    }
  `],
})
export class AppComponent {
  auth = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = toSignal(
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(map(r => r.matches)),
    { initialValue: false },
  );

  showTrainerMenu = computed(() => {
    const role = this.auth.currentUser()?.role;
    if (role === 'TRAINER') return true;
    if (role === 'TRAINER_CLIENT') return this.auth.activeMode() === 'trainer';
    return false;
  });

  showClientMenu = computed(() => {
    const role = this.auth.currentUser()?.role;
    if (role === 'CLIENT') return true;
    if (role === 'TRAINER_CLIENT') return this.auth.activeMode() === 'client';
    return false;
  });

  roleLabel = computed(() => {
    const roleMap: Record<string, string> = {
      TRAINER: 'Тренер',
      CLIENT: 'Клиент',
      TRAINER_CLIENT: 'Тренер-Клиент',
    };
    return roleMap[this.auth.currentUser()?.role || ''] || '';
  });
}
