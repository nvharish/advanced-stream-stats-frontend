import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthUser } from '../interfaces/auth-user';
import { LoginService } from '../services/login.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly REG_PROTECTED_ROUTE: string = '/?dashboard*';

  constructor(
    private router: Router,
    private login_service: LoginService,
  ) { }

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    let current_url = state.url;
    return this.authenticate(current_url);
  }

  canLoad(route: Route, segments: UrlSegment[]): boolean {
    let current_url = route.path;
    return this.authenticate(current_url);
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    let current_url: string = state.url;
    return this.authenticate(current_url);
  }

  private authenticate(url: string | undefined): boolean {
    let auth_user = this.login_service.getAuthUser();
    let is_valid_user = auth_user !== undefined;
    let route_matched = url?.match(this.REG_PROTECTED_ROUTE)?.length;

    if (route_matched && !is_valid_user) {
      this.router.navigateByUrl('');
      return false;
    }

    if (!route_matched) {
      let refresh_token = this.login_service.getRefreshToken();
      if (refresh_token !== null && refresh_token !== '' && refresh_token !== undefined) {
        this.login_service.authenticate(refresh_token).subscribe({
          next: (response: AuthUser) => {
            this.login_service.setAuthUser(response);
            this.router.navigateByUrl('dashboard');
          },
          error: () => {
            this.login_service.logout();
          }
        });
        return false;
      }
    }

    return true;
  }
  
}
