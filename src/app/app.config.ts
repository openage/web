import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, ENVIRONMENT_INITIALIZER, inject } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// import { AppInitService } from '../lib/oa/core/services/app-init.service';
// import { EnvironmentService } from '../lib/oa/core/services/environment.service';

// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideRouter(routes),
//     provideHttpClient(),
//     provideAnimationsAsync(),
//     EnvironmentService,
//     AppInitService,
//     {
//       provide: APP_INITIALIZER,
//       useFactory: (appInitService: AppInitService) => () => appInitService.init(),
//       deps: [AppInitService],
//       multi: true
//     }
//   ]
// };


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideClientHydration()
  ]
};
