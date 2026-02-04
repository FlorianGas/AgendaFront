import { Component, OnInit, HostListener } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { UserModel } from '../../models/user.model';
import { UserStore } from '../../store/user.store';
import { Router } from '@angular/router';

import { Button, ButtonDirective } from 'primeng/button';
import { NgClass, NgIf, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import {InputSwitch} from 'primeng/inputswitch';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [
    Button,
    ButtonDirective,
    NgOptimizedImage,
    RouterLink,
    NgIf,
    NgClass,
    InputSwitch,
    FormsModule
  ],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss'
})
export class NavBarComponent implements OnInit {
  user: UserModel | null = null;
  sidebarOpen = false;
  isMobile = false;
  isDarkMode = false;

  constructor(
    private auth: AuthService,
    private userStore: UserStore,
    private router: Router
  ) {}

  ngOnInit() {
    this.userStore.user$.subscribe(user => {
      this.user = user;
    });

    this.checkMobile();

    // Appliquer le thème sauvegardé
    const savedMode = localStorage.getItem('themeMode');
    this.isDarkMode = savedMode === 'dark';
    if (this.isDarkMode) {
      document.querySelector('html')?.classList.add('p-dark');
    }
  }

  get isClient(): boolean {
    return this.user?.role === 'client';
  }

  get isProfessional(): boolean {
    return this.user?.role === 'professional';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onNavigate(): void {
    this.sidebarOpen = false;
  }

  onLogout(): void {
    this.auth.logout();
  }

  toggleTheme(): void {
    const htmlElement = document.querySelector('html');
    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      htmlElement?.classList.add('p-dark');
      localStorage.setItem('themeMode', 'dark');
    } else {
      htmlElement?.classList.remove('p-dark');
      localStorage.setItem('themeMode', 'light');
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }
}
