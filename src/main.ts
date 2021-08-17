import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { EnvironmentService } from './lib/oa/core/services/environment.service';

// const environment = new EnvironmentService()
// environment.init().then(() => {
// bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
// });


const environment = new EnvironmentService()
environment.init().then(() => {
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
});
