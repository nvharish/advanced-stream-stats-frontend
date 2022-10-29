import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor() { }

  public unsubscribeObservables(observables: Subscription[]): void {
    observables.forEach((item) => {
      item.unsubscribe();
    });
  }
}
