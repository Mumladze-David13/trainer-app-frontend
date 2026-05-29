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
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
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
