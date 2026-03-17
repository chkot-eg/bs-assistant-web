import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/welcome/welcome.component')
      .then(m => m.WelcomeComponent),
    pathMatch: 'full'
  },
  {
    path: 'security/dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'security/tables',
    loadComponent: () => import('./components/tables/table-browser.component')
      .then(m => m.TableBrowserComponent)
  },
  {
    path: 'security/tables/:tableName/schema',
    loadComponent: () => import('./components/tables/schema-viewer.component')
      .then(m => m.SchemaViewerComponent)
  },
  {
    path: 'security/documents',
    loadComponent: () => import('./components/documents/document-manager.component')
      .then(m => m.DocumentManagerComponent)
  },
  {
    path: 'security/metrics',
    loadComponent: () => import('./components/metrics/metrics-dashboard.component')
      .then(m => m.MetricsDashboardComponent)
  },
  {
    path: 'security/sessions',
    loadComponent: () => import('./components/sessions/session-manager.component')
      .then(m => m.SessionManagerComponent)
  },
  {
    path: 'security/rag-debug',
    loadComponent: () => import('./components/rag-debug/rag-debug.component')
      .then(m => m.RagDebugComponent)
  },
  {
    path: 'security/health',
    loadComponent: () => import('./components/health/health-dashboard.component')
      .then(m => m.HealthDashboardComponent)
  },
  { path: '**', redirectTo: '' }
];
