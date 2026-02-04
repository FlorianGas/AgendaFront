import { Component } from '@angular/core';
import {NavBarComponent} from '../../nav-bar/nav-bar.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  imports: [
    NavBarComponent,
    RouterOutlet
  ],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss'
})
export class DashboardLayoutComponent {

}
