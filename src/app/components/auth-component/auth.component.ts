import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-auth',
  imports: [RouterModule, NavbarComponent, FooterComponent],
  template: `<app-navbar/> <div class="spacebar"></div> <router-outlet/> <footer><app-footer/></footer>`,
  styles: `.spacebar {height: 50px} .footer {
    background-color: #343a40;
    color: #ffffff;
    padding-top: 50px;
} `
})
export class AuthComponent {

}
