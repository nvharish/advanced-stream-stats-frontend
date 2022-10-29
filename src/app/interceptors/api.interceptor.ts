import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { LoaderService } from '../services/loader.service';
import { LoginService } from '../services/login.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  // private exclude_jwt: any = {
  //   "/auth/token": "post",
  //   "/payment-gateways": "get",
  //   "/countries": "get",
  //   "/users": "post",
  //   "/plans": "get"
  // };
  private total_requests: number = 0;
  private completed_requests: number = 0;

  constructor(
    private loader_service: LoaderService,
    private login_service: LoginService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let background_process = request.headers.get('background_process');
    let has_jwt = request.headers.get('jwt');
    let request_clone = request.clone({
      headers: request.headers.delete('background_process').delete('jwt')
    });
    //let url = request.url.replace(environment.API_URL, '');
    //let method = this.exclude_jwt[url];

    if (has_jwt) {
      let access_token = 'Bearer ' + this.login_service.getAuthUser()?.access_token;
      request_clone = request_clone.clone({
        setHeaders: {
          'Authorization': access_token
        }
      });
    }

    if (!background_process) {
      this.loader_service.show();
      this.total_requests++;
    }

    return next.handle(request_clone).pipe(
      catchError((error: HttpErrorResponse) => {
        if (has_jwt) {
          this.login_service.logout();
        }
        return throwError(() => error);
      }),
      finalize(
        () => {
          if (!background_process) {
            this.completed_requests++;
            if (this.total_requests === this.completed_requests) {
              this.loader_service.hide();
              this.completed_requests = 0;
              this.total_requests = 0;
            }
          }
        }
      )
    );
  }
}