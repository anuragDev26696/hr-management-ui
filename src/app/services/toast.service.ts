import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  message: string;
  type: toastType;
  placement: toastPlacement;
  autoHide: boolean;
  timeout?: number; // Auto-hide timeout in ms
}
export type toastType = 'success' | 'error' | 'warning' | 'normal';
export type toastPlacement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';

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
  protected showToast(message: string, type: toastType, placement: toastPlacement, autoHide: boolean = true, timeout: number = 10000) {
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

  public success(message: string, autoHide: boolean = true): void {
    this.showToast(message, "success", "bottom-left", autoHide);
  }
  public error(message: string, autoHide: boolean = true): void {
    this.showToast(message, "error", "bottom-left", autoHide);
  }
  public warning(message: string, autoHide: boolean = true): void {
    this.showToast(message, "warning", "bottom-left", autoHide);
  }
  public show(message: string, autoHide: boolean = true): void {
    this.showToast(message, "normal", "bottom-left", autoHide);
  }
}
