import { Component, OnInit } from '@angular/core';
import { UserCredentials } from 'src/app/interfaces/user-credentials';
import { Subscription } from 'rxjs';
import { LoginService } from 'src/app/services/login.service';
import { Router } from '@angular/router';
import { HomeService } from 'src/app/services/home.service';
import { NgForm } from '@angular/forms';
import { AuthUser } from 'src/app/interfaces/auth-user';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  user_credentials: UserCredentials = {
    username: '',
    password: '',
    remember_me: false
  };
  login_error: string = '';
  is_submitted: boolean = false;
  observables: Subscription[] = [];

  constructor(
    private login_service: LoginService,
    private router: Router,
    private home_service: HomeService,
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.home_service.unsubscribeObservables(this.observables);
  }

  validateUser(login_form: NgForm): void {
    let remember_me = this.user_credentials.remember_me;
    this.login_error = '';
    this.is_submitted = true;

    if (login_form.form.valid) {
      this.observables.push(this.login_service.authenticate(this.user_credentials).subscribe({
        next: (response: AuthUser) => {          
          this.login_service.setAuthUser(response);

          if (remember_me) {
            let refresh_token = response.refresh_token?.length ? response.refresh_token : '';
            this.login_service.setRefreshToken(refresh_token);
          }

          this.router.navigateByUrl('dashboard');
        },
        error: (error: any) => {
          this.login_error = error.message;
        }
      }));
    }
  }

  resetForm(login_form: NgForm): void {
    this.is_submitted = false;
    this.login_error = '';
    login_form.form.reset();
  }

}
