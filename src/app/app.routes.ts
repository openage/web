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
    path: 'diagnostics',
    canActivate: [roleGuard],
    loadComponent: () => import('./diagnostics/diagnostics.component').then(mod => mod.DiagnosticsComponent),
  },
  {
    path: 'canvas/applications/:code/builder',
    redirectTo: '/console/applications/:code/builder',
    pathMatch: 'full'
  },
  {
    path: 'canvas/pages/:code/builder',
    canActivate: [pageGuard],
    loadComponent: () => import('./page-builder/builder-page.component').then(mod => mod.BuilderPageComponent),
    resolve: { data: RouteDataResolver },
    runGuardsAndResolvers: 'always'
  },
  {
    path: ':area/:collection/:code/builder',
    canActivate: [pageGuard],
    loadComponent: () => import('./page-builder/builder-page.component').then(mod => mod.BuilderPageComponent),
    resolve: { data: RouteDataResolver },
    runGuardsAndResolvers: 'always'
  },
  {
    path: ':area',
    canActivate: [pageGuard],
    loadComponent: () => import('./dynamic-page/dynamic-page.component').then(mod => mod.DynamicPageComponent),
    resolve: { data: RouteDataResolver },
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: ':collection',
        canActivate: [pageGuard],
        loadComponent: () => import('./dynamic-page/dynamic-page.component').then(mod => mod.DynamicPageComponent),
        resolve: { data: RouteDataResolver },
        runGuardsAndResolvers: 'always',
        children: [
          {
            path: ':code',
            canActivate: [pageGuard],
            loadComponent: () => import('./dynamic-page/dynamic-page.component').then(mod => mod.DynamicPageComponent),
            resolve: { data: RouteDataResolver },
            runGuardsAndResolvers: 'always',
            children: [
              {
                path: ':action',
                canActivate: [pageGuard],
                loadComponent: () => import('./dynamic-page/dynamic-page.component').then(mod => mod.DynamicPageComponent),
                resolve: { data: RouteDataResolver },
                runGuardsAndResolvers: 'always'
              }
            ]
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
