// src/app/features/dashboard/dashboard.component.ts
import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dashboard">
      <h1 class="greeting">
        Добро пожаловать, {{ auth.currentUser()?.firstName }}!
      </h1>
      <p class="subtitle">{{ roleDesc() }}</p>

      @if (auth.isTrainerClient()) {
        <div class="mode-banner">
          <mat-icon>swap_horiz</mat-icon>
          Активный режим:
          <strong>{{ auth.activeMode() === 'trainer' ? 'Тренер' : 'Клиент' }}</strong>
          — переключайте в боковом меню
        </div>
      }

      <div class="cards-grid">
        @for (card of visibleCards(); track card.title) {
          <mat-card class="dash-card" [routerLink]="card.link">
            <mat-card-content>
              <div class="card-icon" [style.background]="card.color">
                <mat-icon>{{ card.icon }}</mat-icon>
              </div>
              <div class="card-info">
                <div class="card-title">{{ card.title }}</div>
                <div class="card-desc">{{ card.desc }}</div>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 900px; }
    .greeting { font-size: 28px; font-weight: 500; margin: 0 0 4px; }
    .subtitle { color: rgba(0,0,0,0.5); margin: 0 0 20px; }
    .mode-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #1565c0;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 16px;
    }
    .dash-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .dash-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }
    mat-card-content {
      display: flex !important;
      align-items: center;
      gap: 16px;
      padding: 20px !important;
    }
    .card-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .card-icon mat-icon { color: white; font-size: 26px; width: 26px; height: 26px; }
    .card-title { font-size: 16px; font-weight: 500; margin-bottom: 2px; }
    .card-desc { font-size: 13px; color: rgba(0,0,0,0.5); }
  `],
})
export class DashboardComponent {
  private allCards = [
    {
      title: 'Упражнения',
      desc: 'Справочник упражнений',
      icon: 'list',
      link: '/trainer/exercises',
      color: '#1976d2',
      roles: ['TRAINER', 'TRAINER_CLIENT_trainer'],
    },
    {
      title: 'Клиенты',
      desc: 'Управление клиентами',
      icon: 'group',
      link: '/trainer/clients',
      color: '#388e3c',
      roles: ['TRAINER', 'TRAINER_CLIENT_trainer'],
    },
    {
      title: 'Мои занятия',
      desc: 'Сезоны и тренировки',
      icon: 'event_note',
      link: '/client/seasons',
      color: '#f57c00',
      roles: ['CLIENT', 'TRAINER_CLIENT_client'],
    },
    {
      title: 'Настройки',
      desc: 'Профиль и параметры',
      icon: 'settings',
      link: '/settings',
      color: '#7b1fa2',
      roles: ['TRAINER', 'CLIENT', 'TRAINER_CLIENT_trainer', 'TRAINER_CLIENT_client'],
    },
  ];

  visibleCards = computed(() => {
    const role = this.auth.currentUser()?.role;
    const mode = this.auth.activeMode();
    return this.allCards.filter((c) => {
      if (role === 'TRAINER') return c.roles.includes('TRAINER');
      if (role === 'CLIENT') return c.roles.includes('CLIENT');
      if (role === 'TRAINER_CLIENT') {
        return c.roles.includes(`TRAINER_CLIENT_${mode}`);
      }
      return false;
    });
  });

  roleDesc = computed(() => {
    const r = this.auth.currentUser()?.role;
    if (r === 'TRAINER') return 'Вы работаете в режиме тренера';
    if (r === 'CLIENT') return 'Вы работаете в режиме клиента';
    return 'Вы можете переключаться между режимами тренера и клиента';
  });

  constructor(public auth: AuthService) {}
}
