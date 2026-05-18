// src/app/features/trainer/clients/clients-list.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { ClientApiService, UserApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/index';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatListModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule,
    MatDialogModule, MatSelectModule,
  ],
  template: `
    <div class="page-header">
      <h2>Клиенты</h2>
      <button mat-raised-button color="primary" (click)="showAddForm.set(!showAddForm())">
        <mat-icon>person_add</mat-icon> Добавить клиента
      </button>
    </div>

    @if (showAddForm()) {
      <mat-card class="add-form-card">
        <mat-card-content>
          <h3>Добавить клиента</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Выберите пользователя</mat-label>
            <mat-select [formControl]="selectedUser">
              @for (u of allUsers(); track u.id) {
                <mat-option [value]="u.id">
                  {{ u.firstName }} {{ u.lastName }} ({{ u.email }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (isSelf()) {
            <div class="info-note">
              <mat-icon>info</mat-icon>
              Вы можете добавить себя как клиента (тренер сам себе)
            </div>
          }
          <div class="form-actions">
            <button mat-button (click)="showAddForm.set(false)">Отмена</button>
            <button mat-raised-button color="primary"
                    [disabled]="!selectedUser.value || adding()"
                    (click)="addClient()">
              {{ adding() ? 'Добавляю...' : 'Добавить' }}
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    }

    @if (loading()) {
      <div class="center"><mat-spinner /></div>
    } @else if (clients().length === 0) {
      <div class="empty-state">
        <mat-icon>group</mat-icon>
        <p>Нет клиентов. Добавьте первого!</p>
      </div>
    } @else {
      <div class="clients-grid">
        @for (item of clients(); track item.client.id) {
          <mat-card class="client-card" [routerLink]="['/trainer/clients', item.client.id]">
            <mat-card-content>
              <div class="client-avatar">
                {{ item.client.firstName[0] }}{{ item.client.lastName[0] }}
              </div>
              <div class="client-info">
                <div class="client-name">
                  {{ item.client.firstName }} {{ item.client.lastName }}
                  @if (item.client.id === currentUserId()) {
                    <span class="self-badge">Я</span>
                  }
                </div>
                <div class="client-email">{{ item.client.email }}</div>
                @if (item.lastSeason) {
                  <div class="client-season">
                    <mat-icon>event_note</mat-icon>
                    {{ item.lastSeason.name }}
                  </div>
                }
              </div>
              <mat-icon class="arrow-icon">chevron_right</mat-icon>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 16px;
    }
    .page-header h2 { margin: 0; font-size: 24px; }
    .add-form-card { margin-bottom: 16px; }
    mat-card-content { padding: 16px !important; }
    h3 { margin: 0 0 12px; }
    .full-width { width: 100%; }
    .info-note {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; color: #1976d2;
      background: #e3f2fd; padding: 8px 12px;
      border-radius: 4px; margin-bottom: 12px;
    }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .center { display: flex; justify-content: center; padding: 40px; }
    .empty-state { text-align: center; padding: 60px 20px; color: rgba(0,0,0,0.4); }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 8px; }
    .clients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 12px;
    }
    .client-card { cursor: pointer; transition: box-shadow 0.2s; }
    .client-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }
    .client-card mat-card-content {
      display: flex !important;
      align-items: center;
      gap: 12px;
    }
    .client-avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: #1976d2;
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 500;
      flex-shrink: 0;
    }
    .client-info { flex: 1; min-width: 0; }
    .client-name { font-size: 16px; font-weight: 500; display: flex; align-items: center; gap: 6px; }
    .client-email { font-size: 13px; color: rgba(0,0,0,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .client-season {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #388e3c; margin-top: 4px;
    }
    .client-season mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .self-badge {
      background: #f57c00; color: white;
      font-size: 10px; padding: 1px 6px;
      border-radius: 10px;
    }
    .arrow-icon { color: rgba(0,0,0,0.3); }
  `],
})
export class ClientsListComponent implements OnInit {
  clients = signal<any[]>([]);
  allUsers = signal<User[]>([]);
  loading = signal(true);
  adding = signal(false);
  showAddForm = signal(false);
  selectedUser = new FormControl<string>('');
  currentUserId = signal<string>('');

  isSelf = () => this.selectedUser.value === this.currentUserId();

  constructor(
    private clientApi: ClientApiService,
    private userApi: UserApiService,
    private auth: AuthService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.currentUserId.set(this.auth.currentUser()?.id || '');
    this.load();
    this.userApi.getTrainers().subscribe(); // preload
    // Load all users for the add form
    this.userApi.getMe().subscribe();
  }

  load() {
    this.loading.set(true);
    this.clientApi.getMyClients().subscribe({
      next: (data) => { this.clients.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    // Fetch all users (not just trainers) - use trainers endpoint as base, add self
    this.userApi.getTrainers().subscribe({
      next: (trainers) => {
        // In a real app we'd have a users/all endpoint. For now show all registered users
        // The trainer can add any user as client including themselves
        this.allUsers.set(trainers);
        // Add current user (themselves) if TRAINER_CLIENT
        const me = this.auth.currentUser();
        if (me && !trainers.find(t => t.id === me.id)) {
          this.allUsers.update(u => [me as any, ...u]);
        }
      }
    });
  }

  addClient() {
    const clientId = this.selectedUser.value;
    if (!clientId) return;
    this.adding.set(true);
    this.clientApi.addClient(clientId).subscribe({
      next: () => {
        this.snack.open('Клиент добавлен', 'OK', { duration: 2500 });
        this.showAddForm.set(false);
        this.selectedUser.reset();
        this.load();
        this.adding.set(false);
      },
      error: (err) => {
        this.snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.adding.set(false);
      },
    });
  }
}
