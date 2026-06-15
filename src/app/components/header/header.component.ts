import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserMappingService } from '../../services/user-mapping.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <header class="header">
      <!-- Top Navigation Bar -->
      <div class="top-bar">
        <div class="top-bar-left">
          <div class="logo">
            <img src="logo.png" alt="EG Logo" class="logo-image">
          </div>
          <nav class="main-nav">
            <a href="#" class="nav-link">SIGNOFF</a>
            <a href="#" class="nav-link alert">!</a>
            <a href="#" class="nav-link">ØKONOMI</a>
            <a href="#" class="nav-link active">ORDRE/FAKTURA</a>
            <a href="#" class="nav-link">BUTIKK</a>
            <a href="#" class="nav-link">LAGER/INNKJØP</a>
            <a href="#" class="nav-link">VAREADMINISTRASJON</a>
          </nav>
        </div>
        <div class="top-bar-right">
          <div class="user-chip" *ngIf="displayName">
            <span class="user-name">{{ displayName }}</span>
            <span class="user-lib" *ngIf="library">{{ library }}</span>
          </div>
          <a routerLink="/security/dashboard" class="security-info-btn">
            <span class="security-icon">&#x1F6E1;</span>
            Security Info
          </a>
          <button class="icon-btn search-btn">
            <span class="search-icon">&#x1F50D;</span>
          </button>
          <button class="icon-btn info-btn">
            <span>&#x24D8;</span>
          </button>
        </div>
      </div>

      <!-- Sub Navigation Bar -->
      <div class="sub-nav">
        <a href="#" class="sub-nav-link arrow">Hurtigvalg -&gt;</a>
        <a href="#" class="sub-nav-link">Ordrebehandling</a>
        <a href="#" class="sub-nav-link">Ny ordre/nytt tilbud</a>
        <a href="#" class="sub-nav-link">Bestillingsbehandling</a>
        <a href="#" class="sub-nav-link">Ny bestilling</a>
        <a href="#" class="sub-nav-link">Kunder</a>
        <a href="#" class="sub-nav-link">Vare / pris</a>
      </div>
    </header>
  `,
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  constructor(
    private userMappingService: UserMappingService,
    private authService: AuthService
  ) {}

  get displayName(): string {
    return this.userMappingService.displayName || this.authService.getUserName();
  }

  get library(): string {
    return this.userMappingService.library;
  }
}
