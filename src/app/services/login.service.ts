import { HttpClient, HttpErrorResponse, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import jwtDecode from 'jwt-decode';
import { CookieService } from 'ngx-cookie-service';
import { catchError, Observable, take, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthUser } from '../interfaces/auth-user';
import { UserCredentials } from '../interfaces/user-credentials';
import { AppService } from './app.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private auth_user: AuthUser | undefined = undefined;
  private refresh_token: string | undefined = undefined;
  private refresh_token_timeout: any = undefined;

  constructor(
    private cookie: CookieService,
    private http_client: HttpClient,
    private router: Router,
    private app_service: AppService
  ) { }

  public getAuthUser(): AuthUser | undefined {
    if (this.auth_user === undefined) {
      let user_session_cookie = this.cookie.get(environment.USER_SESSION_COOKIE);
      if (user_session_cookie === null || user_session_cookie === undefined || user_session_cookie === '') {
        return undefined;
      }
      this.auth_user = JSON.parse(user_session_cookie);
    }
    return this.auth_user;
  }

  public setAuthUser(auth_user: AuthUser): void {
    this.auth_user = auth_user;
    this.auth_user.payload = jwtDecode(this.auth_user.access_token);
    this.cookie.set(environment.USER_SESSION_COOKIE, JSON.stringify(this.auth_user));
  }

  public getRefreshToken(): string {
    if (this.refresh_token === undefined) {
      let remember_token = this.cookie.get(environment.USER_REMEMBER_COOKIE);
      let refresh_token = this.getAuthUser()?.refresh_token
      this.refresh_token = (refresh_token === undefined || refresh_token === null || refresh_token === '') ? remember_token : refresh_token;
    }
    return this.refresh_token;
  }

  public setRefreshToken(refresh_token: string): void {
    this.refresh_token = refresh_token;
    this.cookie.set(environment.USER_REMEMBER_COOKIE, this.refresh_token);
  }

  public authenticate(user_credentials: UserCredentials | string, background_process: boolean = false): Observable<AuthUser> {
    let request = {};
    let headers: any;
    if (typeof user_credentials === 'string') {
      request = {
        "grant_type": "refresh_token",
        "refresh_token": user_credentials
      };
    } else {
      request = {
        "grant_type": "password",
        "username": user_credentials.username,
        "password": user_credentials.password,
      };
    }

    if (background_process) {
      headers = new HttpHeaders({
        "background_process": "true"
      });
    }

    let url = environment.API_URL + '/auth/token';
    return this.http_client.post<AuthUser>(url, request, { headers: headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        let message: string = '';
        switch (error.status) {
          case HttpStatusCode.Unauthorized:
            message = 'Invalid username or password';
            break;
          default:
            message = 'Something went wrong';
        }
        return throwError(() => new Error(message));
      })
    );
  }

  public refreshToken(): void {
    if (this.auth_user?.refresh_token) {
      this.stopRefreshTokenTimer();
      this.authenticate(this.auth_user.refresh_token, true).pipe(take(1)).subscribe({
        next: (response: AuthUser) => {
          this.auth_user = response;
          this.setAuthUser(this.auth_user);
          this.startRefreshTokenTimer();
        },
        error: () => {
          this.logout();
        }
      });
    } else {
      this.logout();
    }
  }

  public startRefreshTokenTimer(): void {
    let expire_at = new Date(this.auth_user?.payload.access_token_expire_at);
    let now = new Date();
    let now_utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    let remaining_time = Math.trunc(((expire_at.getTime() - now_utc.getTime()) / 1000));
    if (remaining_time < environment.REFRESH_TIMEOUT_SECONDS) {
      this.refreshToken();
    } else {
      let timeout = (remaining_time - environment.REFRESH_TIMEOUT_SECONDS) * 1000;
      this.refresh_token_timeout = setTimeout(() => this.refreshToken(), timeout);
    }
  }

  public stopRefreshTokenTimer(): void {
    clearTimeout(this.refresh_token_timeout);
  }

  public logout(): void {
    let url = environment.API_URL + '/auth/token';
    let headers = new HttpHeaders({
      "jwt": "true"
    });
    this.http_client.delete(url, { headers: headers }).pipe(take(1)).subscribe().add(() => {
      this.destroyUserSession();
      this.router.navigate(['']);
    });
  }

  public destroyUserSession(): void {
    this.cookie.deleteAll('/');
    this.stopRefreshTokenTimer();
    this.auth_user = undefined;
    this.refresh_token = undefined;
    this.refresh_token_timeout = undefined;
  }
}
