// src/app/app.component.ts
import { Component, computed, inject, Signal } from '@angular/core';
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
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Role } from './core/models/index';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatSidenavModule, MatListModule, MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  public auth: AuthService = inject(AuthService);
  private _breakpointObserver: BreakpointObserver = inject(BreakpointObserver);

  public isMobile: Signal<boolean> = toSignal(
    this._breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(map((r: BreakpointState) => r.matches)),
    { initialValue: false },
  );

  public showTrainerMenu: Signal<boolean> = computed(() => {
    const role: Role | undefined = this.auth.currentUser()?.role;
    if (role === 'TRAINER') return true;
    if (role === 'TRAINER_CLIENT') return this.auth.activeMode() === 'trainer';
    return false;
  });

  public showClientMenu: Signal<boolean> = computed(() => {
    const role: Role | undefined = this.auth.currentUser()?.role;
    if (role === 'CLIENT') return true;
    if (role === 'TRAINER_CLIENT') return this.auth.activeMode() === 'client';
    return false;
  });

  public roleLabel: Signal<string> = computed(() => {
    const roleMap: Record<string, string> = {
      TRAINER: 'Тренер',
      CLIENT: 'Клиент',
      TRAINER_CLIENT: 'Тренер-Клиент',
    };
    return roleMap[this.auth.currentUser()?.role || ''] || '';
  });
}
