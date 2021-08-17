import { Routes } from '@angular/router';
import { ErrorComponent } from './error/error.component';
import { roleGuard } from '../lib/oa/core/guards/role.guard';
import { sessionGuard } from '../lib/oa/core/guards/session.guard';
import { RouteDataResolver } from '../lib/oa/core/services/route-data.resolver';
import { pageGuard } from '../lib/oa/core/guards/page.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'errors',
    loadComponent: () => import('./error/error.component').then(mod => mod.ErrorComponent),
    children: [
      {
        path: ':code',
        loadComponent: () => import('./error/error.component').then(mod => mod.ErrorComponent),
      }
    ]
  },
  {
    path: 'debug',
    canActivate: [roleGuard],
    loadComponent: () => import('./debug/debug.component').then(mod => mod.DebugComponent),
  },
  {
    path: ':area',
    canActivate: [pageGuard],
    loadComponent: () => import('./landing/landing.component').then(mod => mod.LandingComponent),
    resolve: { data: RouteDataResolver },
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: ':collection',
        canActivate: [pageGuard],
        loadComponent: () => import('./landing/landing.component').then(mod => mod.LandingComponent),
        resolve: { data: RouteDataResolver },
        runGuardsAndResolvers: 'always',
        children: [
          {
            path: ':code',
            canActivate: [pageGuard],
            loadComponent: () => import('./landing/landing.component').then(mod => mod.LandingComponent),
            resolve: { data: RouteDataResolver },
            runGuardsAndResolvers: 'always'
          }
        ]
      }
    ]
  },
  {
    path: '**',
    component: ErrorComponent
  }
];
