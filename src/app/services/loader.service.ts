import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Loader {
  type: 'circle' | 'grow', label: string, value: boolean
}

@Injectable({
  providedIn: 'root'
})
export class LoaderService {
  private loaderSubject = new BehaviorSubject<Loader>({type: 'circle', label: "", value: false});
  public loaderState$ = this.loaderSubject.asObservable();

  public show(type: 'circle' | 'grow' = 'circle', label: string = ""): void {
    console.log(type);
    this.loaderSubject.next({type, label, value: true});
  }
  public hide(): void {this.loaderSubject.next({type: 'circle', label: "", value: false});}
}
