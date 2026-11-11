export const environment = {
  // enviroment = tenant
  production: true,
  env: 'qa',

  debug: {
    host: 'localhost:4210',
  },

  code: 'website',
  name: 'Website',
  host: 'www.applegos.in', // this is only for local debugging
  title: 'Applegos',
  version: '1.0.0',
  ref: 'https://api.openage.in/system/beta/api/applications/host:{{host}}?env=qa', // prod

  organization: { code: undefined },
  tenant: { code: undefined },

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
