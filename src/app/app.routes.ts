import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/welcome/welcome.component')
      .then(m => m.WelcomeComponent),
    pathMatch: 'full'
  },
  {
    path: 'security/dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./components/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'security/tables',
    canActivate: [authGuard],
    loadComponent: () => import('./components/tables/table-browser.component')
      .then(m => m.TableBrowserComponent)
  },
  {
    path: 'security/tables/:tableName/schema',
    canActivate: [authGuard],
    loadComponent: () => import('./components/tables/schema-viewer.component')
      .then(m => m.SchemaViewerComponent)
  },
  {
    path: 'security/documents',
    canActivate: [authGuard],
    loadComponent: () => import('./components/documents/document-manager.component')
      .then(m => m.DocumentManagerComponent)
  },
  {
    path: 'security/metrics',
    canActivate: [authGuard],
    loadComponent: () => import('./components/metrics/metrics-dashboard.component')
      .then(m => m.MetricsDashboardComponent)
  },
  {
    path: 'security/sessions',
    canActivate: [authGuard],
    loadComponent: () => import('./components/sessions/session-manager.component')
      .then(m => m.SessionManagerComponent)
  },
  {
    path: 'security/rag-debug',
    canActivate: [authGuard],
    loadComponent: () => import('./components/rag-debug/rag-debug.component')
      .then(m => m.RagDebugComponent)
  },
  {
    path: 'security/health',
    canActivate: [authGuard],
    loadComponent: () => import('./components/health/health-dashboard.component')
      .then(m => m.HealthDashboardComponent)
  },
  {
    path: 'security/feedback-issues',
    canActivate: [authGuard],
    loadComponent: () => import('./components/feedback-issues/feedback-issues.component')
      .then(m => m.FeedbackIssuesComponent)
  },
  { path: '**', redirectTo: '' }
];
