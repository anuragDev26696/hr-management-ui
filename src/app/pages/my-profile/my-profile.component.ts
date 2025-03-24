import { Component, inject } from '@angular/core';
import { IUserRes } from '../../interfaces/IUser';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterLinkWithHref } from '@angular/router';

@Component({
  selector: 'app-my-profile',
  imports: [DatePipe, TitleCasePipe, RouterLinkWithHref],
  providers: [DatePipe],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent {
  public employee!: IUserRes;
  public isPending: boolean = true;
  private auth = inject(AuthService);

  constructor(){
    this.auth.loggedinUser.subscribe({
      next: (value) => {
        if(value) {this.employee = value; this.isPending = false;}
      },
    })
  }

}
