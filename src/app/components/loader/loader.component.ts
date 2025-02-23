import { Component, inject } from '@angular/core';
import { Loader, LoaderService } from '../../services/loader.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-loader',
  imports: [],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {
  private loaderServ = inject(LoaderService);
  public loader!: Loader;

  constructor(){
    this.loaderServ.loaderState$.subscribe({
      next: (value) => {
        this.loader = value;
      },
    })
  }
}
