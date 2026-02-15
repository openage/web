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
  bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
}).catch((err) => {
  const errorMessage = err?.message || 'Unknown error occurred';
  const errorDiv = document.createElement('div');
  errorDiv.className = 'card error';
  errorDiv.innerHTML = `
    <div class="content">
      <h1>Error</h1>
      <p>${errorMessage}</p>
      <button onclick="location.reload()">Retry</button>
    </div>
  `;
  document.body.appendChild(errorDiv);
  console.error('Initialization error:', err);
});
