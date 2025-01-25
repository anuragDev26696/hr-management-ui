import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-auth',
  imports: [RouterModule, NavbarComponent, FooterComponent],
  template: `<app-navbar/> <router-outlet/> <app-footer/>`,
  styles: ``
})
export class AuthComponent {

}
