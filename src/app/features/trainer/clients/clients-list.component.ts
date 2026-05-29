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
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.css'],
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
