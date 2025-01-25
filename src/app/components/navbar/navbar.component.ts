import { Component, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterLinkWithHref } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, RouterLinkWithHref],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  user: any = null;

  constructor(private ele: ElementRef, private authServ: AuthService,){
    ele.nativeElement.className = 'navbar navbar-expand-lg bg-body-tertiary';
    const auth = authServ.currentToken();
    auth().observeToken.subscribe({
      next: (value)=> {
        if (value.trim() !== '') {
          authServ.getProfile().subscribe({
            next: (value)=> {
              this.user = value;
            },
          });
        }
      },
    })
  }

}
