import { HttpClient, HttpErrorResponse, HttpHeaders, HttpStatusCode } from '@angular/common/http';
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

  public purchasePlan(plan: any): Observable<any> {
    let url = environment.API_URL + '/subscription/purchase';
    return this.http_client.post(url, plan, {
      headers: new HttpHeaders({
        "jwt": "true"
      })
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        let message: string = 'Something went wrong';
        return throwError(() => new Error(message));
      })
    );
  }

  public getBraintreeClientToken(): Observable<any> {
    let url: string = environment.API_URL + '/subscription/authorize';
    return this.http_client.post(url, {}, {
      headers: new HttpHeaders({
        "jwt": "true"
      })
    });
  }

  public cancelPlan() {
    let url: string = environment.API_URL + '/subscription/cancel'
    return this.http_client.post(url, {}, {
      headers: new HttpHeaders({
        "jwt": "true"
      })
    });
  }
}
