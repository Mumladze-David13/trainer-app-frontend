// src/app/features/trainer/clients/clients-list.component.ts
import { Component, signal, OnInit, WritableSignal } from '@angular/core';
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
import { EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ClientApiService, UserApiService, ClientListItem } from '../../../core/services/api.service';
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
  public clients: WritableSignal<ClientListItem[]> = signal<ClientListItem[]>([]);
  public allUsers: WritableSignal<User[]> = signal<User[]>([]);
  public loading: WritableSignal<boolean> = signal(true);
  public adding: WritableSignal<boolean> = signal(false);
  public showAddForm: WritableSignal<boolean> = signal(false);
  public selectedUser: FormControl<string | null> = new FormControl<string>('');
  public currentUserId: WritableSignal<string> = signal<string>('');

  public isSelf = (): boolean => this.selectedUser.value === this.currentUserId();

  constructor(
    private _clientApi: ClientApiService,
    private _userApi: UserApiService,
    private _auth: AuthService,
    private _snack: MatSnackBar,
  ) {}

  public ngOnInit(): void {
    this.currentUserId.set(this._auth.currentUser()?.id || '');
    this._load();
    this._userApi.getTrainers().subscribe(); // preload
    // Load all users for the add form
    this._userApi.getMe().subscribe();
  }

  private _load(): void {
    this.loading.set(true);
    this._clientApi.getMyClients().pipe(
      tap((data: ClientListItem[]) => { this.clients.set(data); this.loading.set(false); }),
      catchError(() => { this.loading.set(false); return EMPTY; })
    ).subscribe();
    // Fetch all users (not just trainers) - use trainers endpoint as base, add self
    this._userApi.getTrainers().pipe(
      tap((trainers: User[]) => {
        // In a real app we'd have a users/all endpoint. For now show all registered users
        // The trainer can add any user as client including themselves
        this.allUsers.set(trainers);
        // Add current user (themselves) if TRAINER_CLIENT
        const me: User | null = this._auth.currentUser();
        if (me && !trainers.find((t: User) => t.id === me.id)) {
          this.allUsers.update((u: User[]) => [me, ...u]);
        }
      })
    ).subscribe();
  }

  public addClient(): void {
    const clientId: string | null = this.selectedUser.value;
    if (!clientId) return;
    this.adding.set(true);
    this._clientApi.addClient(clientId).pipe(
      tap(() => {
        this._snack.open('Клиент добавлен', 'OK', { duration: 2500 });
        this.showAddForm.set(false);
        this.selectedUser.reset();
        this._load();
        this.adding.set(false);
      }),
      catchError((err: any) => {
        this._snack.open(err.error?.message || 'Ошибка', 'OK', { duration: 3000 });
        this.adding.set(false);
        return EMPTY;
      })
    ).subscribe();
  }
}
