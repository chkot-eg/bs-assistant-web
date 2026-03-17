import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

interface ShortcutItem {
  key: string;
  label: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatTooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  showNav = false;

  envMode = environment.production ? 'Production' : 'Development';
  envColor = environment.production ? '#d32f2f' : '#4CAF50';
  apiUrl = environment.apiUrl;
  defaultLibrary = environment.defaultLibrary;

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/security/dashboard', icon: 'dashboard' },
    { label: 'Tables', route: '/security/tables', icon: 'table_chart' },
    { label: 'Documents', route: '/security/documents', icon: 'description' },
    { label: 'Metrics', route: '/security/metrics', icon: 'analytics' },
    { label: 'Sessions', route: '/security/sessions', icon: 'forum' },
    { label: 'RAG Debug', route: '/security/rag-debug', icon: 'bug_report' },
    { label: 'Health', route: '/security/health', icon: 'monitor_heart' }
  ];

  shortcuts: ShortcutItem[] = [
    { key: 'F1', label: 'Velg firma' },
    { key: 'F5', label: 'Driftsmeny' },
    { key: 'F6', label: 'Meldinger' },
    { key: 'F10', label: 'Kommando-linje' }
  ];

  constructor(private router: Router) {
    this.showNav = this.router.url.startsWith('/security');

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.showNav = event.urlAfterRedirects.startsWith('/security');
    });
  }
}
