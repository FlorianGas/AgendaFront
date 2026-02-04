import { Component } from '@angular/core';
import {Button} from "primeng/button";
import {NgIf, NgOptimizedImage} from "@angular/common";
import {RouterLink} from "@angular/router";
import {UserModel} from '../../models/user.model';
import {AuthService} from '../../services/auth.service';
import {UserStore} from '../../store/user.store';
import {Textarea} from 'primeng/textarea';

@Component({
  selector: 'app-nav-bar-pro',
  imports: [
    Button,
    NgIf,
    NgOptimizedImage,
    RouterLink,
    Textarea
  ],
  templateUrl: './nav-bar-pro.component.html',
  styleUrl: './nav-bar-pro.component.scss'
})
export class NavBarProComponent {
  user: UserModel | null = null;
  constructor( private auth :AuthService , private userStore:UserStore) {
  }
  ngOnInit() {
    this.userStore.user$.subscribe( user => {
      this.user = user;
    })
  }
  async onlogout() {
    this.auth.logout();
  }
}
