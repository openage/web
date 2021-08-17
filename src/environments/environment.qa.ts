export const environment = {
  // enviroment = tenant
  production: true,
  env: 'qa',

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
  captcha: {
    provider: 'google',
    type: 'recaptcha',
    key: undefined
  },
  theme: undefined,
  styles: [],
  session: {
    timeout: 0,
    cache: {
      duration: 1,
      storage: 'session'
    }
  },
  errors: [],
  meta: {},

  // if services section exists then it would be used
  services: [],
  // if navs section exists then it would be used
  navs: []
};
