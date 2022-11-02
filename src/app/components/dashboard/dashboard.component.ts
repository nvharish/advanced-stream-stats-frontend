import { Component, OnInit } from '@angular/core';
import { Card } from 'src/app/interfaces/card';
import { PaymentService } from 'src/app/services/payment.service';
import { loadScript } from '@paypal/paypal-js';
import { environment } from 'src/environments/environment.prod';

declare function loadBarChart(): void;

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
  alert_type: string = '';
  alert_status: string = '';
  alert_message: string = '';
  show_alert: boolean = false;

  constructor(
    private payment_service: PaymentService
  ) { }

  ngOnInit(): void {
    loadBarChart();
    this.loadPayPal();
  }

  purchasePlan(plan_code: string): void {
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
                validate: false
              }
            }
          };

          client_instance.request({
            endpoint: 'payment_methods/credit_cards',
            method: 'post',
            data: data
          }, (err: any, response: any) => {
            if (err) {
              throw new Error(err);
            }

            let secure_3ds = require('braintree-web/three-d-secure');
            secure_3ds.create({
              authorization: client_token,
              version: 2
            }, (err: any, secure_3ds_instance: any) => {
              if (err) {
                throw new Error(err);
              }
              secure_3ds_instance.verifyCard({
                amount: 0.01,
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
                  this.payment_service.purchasePlan({
                    'plan_code': plan_code,
                    'payment_method_nonce': payment_method_nonce
                  }).subscribe({
                    next: (response: any) => {
                      this.alert_type = 'alert alert-success alert-dismissible fade show';
                      this.alert_message = 'Subscription purchased successfully';
                      this.alert_status = 'Success!';
                      this.show_alert = true;
                    },
                    error: (err: any) => {
                      this.alert_type = 'alert alert-danger alert-dismissible fade show';
                      this.alert_message = 'Something went wrong';
                      this.alert_status = 'Error!';
                      this.show_alert = true;
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
          paypal_checkout.create({
            client: client_instance
          }, (err: any, paypal_instance: any) => {
            if (err) {
              throw new Error(err);
            }
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
                        amount: 199.00, // Required
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
                        console.log(data);
                        console.log(payload);
                      });
                    },

                    onCancel: (data: any) => {
                      console.log('PayPal payment cancelled', JSON.stringify(data));
                    },

                    onError: (err: any) => {
                      console.error('PayPal error', err);
                    }
                  }).render("#paypal-button").then(() => {
                    // The PayPal button will be rendered in an html element with the ID
                    // `paypal-button`. This function will be called when the PayPal button
                    // is set up and ready to be used
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
