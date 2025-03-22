import { AfterViewChecked, Component, ElementRef } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterLinkWithHref } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IUserRes } from '../../interfaces/IUser';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, RouterLinkWithHref],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements AfterViewChecked {
  user!: IUserRes;
  userLoaded: boolean = false;

  constructor(private ele: ElementRef, private authServ: AuthService ){
    ele.nativeElement.className = 'navbar navbar-expand-lg fixed-top bg-primary shadow';
    ele.nativeElement.setAttribute('data-bs-theme',  "dark");
    const auth = authServ.currentToken();
    auth().observeToken.subscribe({
      next: (value)=> {
        if (value.trim() !== '') {
          authServ.getProfile().subscribe({
            next: (value)=> {
              authServ.loggedinUser.next(value.data);
              localStorage.setItem('uuid', value.data.uuid);
              localStorage.setItem('role', value.data.role);
              this.user = value.data;
            },
            error: (err) => {
              this.userLoaded = true;
              const {status, statusText, error} = err;
              console.log(error.message, " :Error message");
              if (status === 401 || statusText === '"Unauthorized"' || "TokenExpiredError") {
                this.authServ.logout();
                window.location.reload();
              }
            },
            complete: () => {
              this.userLoaded = true;
            }
          });
        }
      },
    });
  }

  ngAfterViewChecked(): void {
    const navLinks = document.querySelectorAll('#headerNav a.nav-link');
    const navbarToggler = document.querySelector('#headerNav .navbar-toggler');
    const navbar = document.querySelector('#navbarSupportedContent');
    navLinks.forEach((e) => {
      if(!e.classList.contains('dropdown-toggle')){
        e.addEventListener('click', (ev) => {
          ev.stopImmediatePropagation();
          if(window.innerWidth < 992) {
            navbarToggler?.classList.add('collapsed');
            navbar?.classList.remove('show');
          }
          e.parentNode?.parentElement?.classList.remove('show');
        });
      }
    });
  }

  public signout(event: Event): void {
    event.stopImmediatePropagation();
    this.authServ.logout();
    window.location.reload();
  }
}
