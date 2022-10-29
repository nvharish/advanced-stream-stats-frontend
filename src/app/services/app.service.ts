import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  constructor(
    private http_client: HttpClient,
  ) { }

  public unsubscribeObservables(observables: Subscription[]): void {
    observables.forEach((item) => {
      item.unsubscribe();
    });
  }
}
