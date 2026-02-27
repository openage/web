export const environment = {
  // enviroment = tenant
  production: false,
  silent: false,
  env: 'local',

  debug: {
    host: 'localhost:4210',
  },

  code: 'website',
  name: 'Website',
  host: 'www.applegos.in', // this is only for local debugging
  title: 'Applegos',
  version: '1.0.0',
  ref: 'https://api.openage.in/system/v1/api/applications/host:{{host}}', // prod

  organization: { code: undefined },
  tenant: { code: undefined },
  loginTypes: ['email'],

  theme: {
    code: 'default',
    name: null,
    style: ':app/theme.css',
    icon: ':app/icons.css',
    type: 'light'
  },
  logo: { url: ':app/images/branding/logo.png' },
  splash: { url: ':app/images/branding/splash.png' },
  favicon: { url: ':app/images/branding/favicon.png' },
  styles: [],

  captcha: {
    provider: 'google',
    type: 'recaptcha',
    key: undefined
  },
  session: {
    timeout: 0,
    cache: {
      duration: 0,
      storage: 'local'
    }
  },
  errors: [],
  meta: { src: ':app/structure.json' },

  // if services section exists then it would be used

  services: [{
    code: 'app',
    url: '/assets/app/aquateams'
    // }, {
    //   code: 'directory',
    //   // url: 'http://localhost:3001/api'
    //   url: 'https://stage.openage.in/directory/api'
    // }, {
    //   code: 'drive',
    //   // url: 'http://localhost:3002/api'
    //   url: 'https://stage.openage.in/drive/api'
    // }, {
    // code: 'gateway',
    // url: 'http://localhost:3005/api'
    // url: 'https://stage.openage.in/gateway/api'
    // }, {
    //   code: 'insight',
    //   // url: 'http://localhost:3004/api'
    //   url: 'https://stage.openage.in/insight/api'
    // }, {
    //   code: 'sendIt',
    //   // url: 'http://localhost:3005/api'
    //   url: 'https://stage.openage.in/send-it/api'
    // }, {
    //   code: 'bap',
    //   // url: 'http://localhost:3005/api'
    //   url: 'https://stage.openage.in/billing/api'
  }],

  // if navs section exists then it would be used
  navs: [
    // {
    //   code: 'home',
    //   src: ':app/nav/home/nav.json'
    // },
    // {
    //   code: 'customers',
    //   src: ':app/nav/home/customers/nav.json'
    // },
    // {
    //   code: 'vendors',
    //   src: ':app/nav/home/vendors/nav.json'
    // },
    // {
    //   code: 'orders',
    //   src: ':app/nav/home/orders/nav.json'
    // },
  ]
};
