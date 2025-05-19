import { provideServerRendering } from '@angular/ssr';
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideClientHydration(),
    provideHttpClient(withFetch()),
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
