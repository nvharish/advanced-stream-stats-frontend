import { Component, OnInit } from '@angular/core';
import { Card } from 'src/app/interfaces/card';
import { PaymentService } from 'src/app/services/payment.service';
import { loadScript } from '@paypal/paypal-js';
import { environment } from 'src/environments/environment.prod';
import { LoginService } from 'src/app/services/login.service';
import { Router } from '@angular/router';
import { LoaderService } from 'src/app/services/loader.service';

declare function loadBarChart(): void;
declare function loadLineChart(): void;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  card_info: Card = {
    card_number: '',
    card_name: '',
    cvv: '',
    exp_month: '',
    exp_year: '',
    email: 'admin_harrysoftechhub.com@yopmail.com'
  };
  current_page: string = 'card_div';
  charging_amount: string = '';
  plan_code: string = '';
  subscription: any = null;
  payment_methods: any = null;
  is_subscribed: boolean = false;
  amount: number = 0;


  constructor(
    private payment_service: PaymentService,
    private login_service: LoginService,
    private router: Router,
    private loader_service: LoaderService
  ) { }

  ngOnInit(): void {
    loadBarChart();
    this.subscription = this.login_service.getAuthUser()?.payload.subscription;
    this.payment_methods = this.login_service.getAuthUser()?.payload.payment_methods;
    if (this.subscription !== null && this.subscription !== '') {
      this.is_subscribed = true;
      loadLineChart();
    } else {
      this.loadPayPal();
    }
  }

  cancelSubscription() {
    this.payment_service.cancelPlan().subscribe({
      next: (response: any) => {
        alert('Cancelled successfully');
        let refresh_token = this.login_service.getAuthUser()?.refresh_token ?? '';
        this.login_service.authenticate(refresh_token).subscribe({
          next: (response: any) => {
            this.login_service.setAuthUser(response);
            this.router.navigateByUrl('dashboard').then(() => {
              window.location.reload();
            });
          }
        });
      },
      error: (err: any) => {
        alert(err.message);
      }
    });
  }

  changeAmount(amount: string, plan_code: string, charging_amount: number) {
    this.charging_amount = amount;
    this.plan_code = plan_code;
    this.amount = charging_amount;
  }

  loadPage(page: string) {
    this.current_page = page;
  }

  logout() {
    this.login_service.logout();
  }

  purchasePlan(): void {
    this.payment_service.getBraintreeClientToken().subscribe({
      next: (response: any) => {
        let client_token = response.client_token;
        let client = require('braintree-web/client');
        client.create({
          authorization: client_token
        }, (err: any, client_instance: any) => {
          if (err) {
            throw new Error(err);
          }

          let data: any = {
            creditCard: {
              number: this.card_info.card_number,
              cvv: this.card_info.cvv,
              expirationDate: this.card_info.exp_month + "/" + this.card_info.exp_year,
              options: {
                validate: true
              }
            }
          };
          //console.log(data);

          this.loader_service.show();
          client_instance.request({
            endpoint: 'payment_methods/credit_cards',
            method: 'post',
            data: data
          }, (err: any, response: any) => {
            if (err) {
              throw new Error(err);
            }
            //console.log(response);
            let secure_3ds = require('braintree-web/three-d-secure');
            secure_3ds.create({
              authorization: client_token,
              version: 2
            }, (err: any, secure_3ds_instance: any) => {
              if (err) {
                throw new Error(err);
              }
              secure_3ds_instance.verifyCard({
                amount: this.amount,
                nonce: response.creditCards[0].nonce,
                bin: response.creditCards[0].details.bin,
                email: this.card_info.email,
                billingAddress: {},
                additionalInformation: {},
                onLookupComplete: (err: any, next: any) => {
                  next();
                }
              }, (err: any, verify_response: any) => {
                if (err) {
                  throw new Error(err);
                } else {
                  let payment_method_nonce = verify_response.nonce;
                  //console.log(payment_method_nonce);
                  this.payment_service.purchasePlan({
                    'plan_code': this.plan_code,
                    'payment_method_nonce': payment_method_nonce
                  }).subscribe({
                    next: (response: any) => {
                      if (response.success) {
                        alert('Payment done successfully');
                        let refresh_token = this.login_service.getAuthUser()?.refresh_token ?? '';
                        this.login_service.authenticate(refresh_token).subscribe({
                          next: (response: any) => {
                            this.login_service.setAuthUser(response);
                            this.router.navigateByUrl('dashboard').then(() => {
                              window.location.reload();
                            });
                          }
                        });
                      } else {
                        alert(response.message);
                      }
                    },
                    error: (err: any) => {
                      alert(err.message);
                    }
                  });
                }
              });
            });
          });
        });
      }
    });
  }

  loadPayPal() {
    this.payment_service.getBraintreeClientToken().subscribe({
      next: (response: any) => {
        let client_token = response.client_token;
        let client = require('braintree-web/client');
        client.create({
          authorization: client_token
        }, (err: any, client_instance: any) => {
          if (err) {
            throw new Error(err);
          }
          let paypal_checkout = require('braintree-web/paypal-checkout');
          this.loader_service.show();
          paypal_checkout.create({
            client: client_instance
          }, (err: any, paypal_instance: any) => {
            if (err) {
              throw new Error(err);
            }
            //console.log(paypal_checkout);
            paypal_instance.loadPayPalSDK({
              currency: 'USD',
              intent: 'capture'
            }, async () => {
              let paypal: any;
              try {
                paypal = await loadScript({
                  "client-id": environment.PAYPAL_CLIENT_ID,
                  "disable-funding": environment.DISABLE_PAYPAL_PAYMENT_METHODS
                });
              } catch (error: any) {

              }

              if (paypal) {
                try {
                  await paypal.Buttons({
                    createOrder: () => {
                      return paypal_instance.createPayment({
                        flow: 'checkout', // Required
                        amount: this.amount, // Required
                        currency: 'USD', // Required, must match the currency passed in with loadPayPalSDK
                        requestBillingAgreement: true, // Required
                        billingAgreementDetails: {
                          description: 'Description of the billng agreement to display to the customer'
                        },
                        intent: 'capture', // Must match the intent passed in with loadPayPalSDK                    
                      });
                    },

                    onApprove: (data: any, actions: any) => {
                      return paypal_instance.tokenizePayment(data, (err: any, payload: any) => {
                        if (err) {
                          throw Error(err);
                        }
                        let payment_method_nonce = payload.nonce;
                        let order_id = data.orderID;
                        console.log(data);
                        console.log(JSON.stringify(data));
                        console.log(payload);
                        this.payment_service.purchasePlan({
                          'plan_code': this.plan_code,
                          'payment_method_nonce': payment_method_nonce,
                          'paypal': true,
                          'order_id': order_id
                        }).subscribe({
                          next: (response: any) => {
                            if (response.success) {
                              alert('Payment done successfully');
                              let refresh_token = this.login_service.getAuthUser()?.refresh_token ?? '';
                              this.login_service.authenticate(refresh_token).subscribe({
                                next: (response: any) => {
                                  this.login_service.setAuthUser(response);
                                  this.router.navigateByUrl('dashboard').then(() => {
                                    window.location.reload();
                                  });
                                }
                              });
                            } else {
                              alert(response.message);
                            }
                          },
                          error: (err: any) => {
                            alert(err.message);
                          }
                        });
                      });
                    },

                    onCancel: (data: any) => {
                      console.log('PayPal payment cancelled', JSON.stringify(data));
                    },

                    onError: (err: any) => {
                      console.error('PayPal error', err);
                    }
                  }).render("#paypal-button").then(() => {
                    this.loader_service.hide();
                  });
                } catch (error) {
                  console.error("failed to render the PayPal Buttons", error);
                }
              }
            });
          });
        });
      }
    });
  }
}
