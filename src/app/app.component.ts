import {Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {LoginComponent} from './features/auth/login/login.component';
import {AuthService} from './shared/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(private auth: AuthService) {}
  ngOnInit() {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode === 'dark') {
      document.querySelector('html')?.classList.add('p-dark');
    }
    this.auth.initialize();
  }

}
