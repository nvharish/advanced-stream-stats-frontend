import { HttpClient, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { catchError, Observable, take, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  constructor(
    private http_client: HttpClient
  ) { }

  purchasePlan(code: string): Observable<any> {
    let url = environment.API_URL + '/subscriptions';
    return this.http_client.post(url, { "plan_code": code }).pipe(
      catchError((error: HttpErrorResponse) => {
        let message: string = 'Something went wrong';
        return throwError(() => new Error(message));
      })
    );
  }
}
