import { Component, ElementRef, OnInit } from '@angular/core';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  imports: [],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];
  placementClass: string = 'top-0 end-0';

  constructor(private toastService: ToastService, private ele: ElementRef) {}

  ngOnInit() {
    this.toastService.getToasts().subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  public getToastClass(toast: Toast): {toast: string, btn: string} {
    let data = {toast: '', btn: 'btn-close-white'};
    switch (toast.type) {
      case 'success':
        data.toast = 'text-bg-success';
        break;
      case 'error':
        data.toast = 'text-bg-danger';
        break;
      case 'warning':
        data.toast = 'text-bg-warning';
        break;
      case 'normal':
        data.toast = 'bg-white';
        break;
      default:
        data = {toast: 'bg-white', btn: ''};
        break;
    }
    return data;
  }  
}
