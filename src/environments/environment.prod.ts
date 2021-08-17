export const environment = {
  // enviroment = tenant
  production: true,
  env: 'prod',

  debug: {
    host: 'localhost:4210',
  },

  code: 'mo',
  name: 'Fulfilment',
  host: 'mo.applegos.in', // this is only for local debugging
  title: 'Fulfilment',
  version: '1.0.0',
  ref: 'https://api.openage.in/system/v1/api/applications/host:{{host}}', // prod

  organization: { code: undefined },
  tenant: { code: undefined },
  loginTypes: ['email'],

  theme: null,
  logo: null,
  splash: null,
  favicon: null,
  styles: [],

  captcha: {
    provider: 'google',
    type: 'recaptcha',
    key: undefined
  },
  session: {
    timeout: 0,
    cache: {
      duration: 10,
      storage: 'local'
    }
  },
  errors: [],
  meta: null,

  // if services section exists then it would be used
  services: [],

  // if navs section exists then it would be used
  navs: []
};
