import { Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

  constructor(private ele: ElementRef){
    ele.nativeElement.className = 'footer d-block';
  }
}
