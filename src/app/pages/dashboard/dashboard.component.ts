import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  auth = inject(AuthService);

  constructor(){
    const tokenVal = this.auth.currentToken();
    const {token, userId, observeToken} = tokenVal();
    observeToken.subscribe({
      next: (value) => {
      },
    })
  }
}
