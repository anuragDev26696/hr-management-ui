import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'normal';
  placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  autoHide: boolean;
  timeout?: number; // Auto-hide timeout in ms
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastSubject = new Subject<Toast[]>();

  constructor() {}

  // Observable to listen to toast updates
  getToasts() {
    return this.toastSubject.asObservable();
  }

  // Add a new toast
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'normal', placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center', autoHide: boolean = true, timeout: number = 3000) {
    const newToast: Toast = {
      message,
      type,
      placement,
      autoHide,
      timeout: autoHide ? timeout : 0,
    };
    this.toasts.push(newToast);
    this.toastSubject.next([...this.toasts]);

    if (autoHide) {
      setTimeout(() => {
        this.removeToast(newToast);
      }, timeout);
    }
  }

  // Remove a toast
  private removeToast(toast: Toast) {
    this.toasts = this.toasts.filter(t => t !== toast);
    this.toastSubject.next([...this.toasts]);
  }
}
