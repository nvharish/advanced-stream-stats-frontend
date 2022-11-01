// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  APP_NAME: "Gateways Portal",
  APP_URL: "http://localhost",
  API_URL: "https://api.harrysoftechhub.com/v1",
  APP_DOMAIN: "localhost",
  USER_SESSION_COOKIE: 'gp_user',
  USER_REMEMBER_COOKIE: 'gp_refresh_token',
  REFRESH_TOKEN_EXPIRY_DAYS: 1,
  REFRESH_TIMEOUT_SECONDS: 60,
  DEFAULT_API_SERVER_ERROR_MESSAGE: 'Something went wrong',
  PAYPAL_CLIENT_ID: 'AVeNjvv-IAb2Iw-oZ_-BNeQ_IL452Yz5XUro_ULHrRvLPNIIhyS1JywrDAqeA2e9-cIDfPWLT0bfPo1c'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
