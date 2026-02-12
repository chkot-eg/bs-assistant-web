import { Component } from '@angular/core';

@Component({
  selector: 'app-welcome',
  standalone: true,
  template: `
    <div class="welcome-section">
      <h1 class="welcome-title">Nexstep Cloud</h1>
      <div class="welcome-logo">
        <img src="logo.png" alt="EG Logo" class="eg-logo">
      </div>
      <p class="welcome-tagline">Let's go further</p>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .welcome-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
      background: #ffffff;
      overflow: auto;
      min-height: 100%;
    }

    .welcome-title {
      color: #1a1a1a;
      font-size: 48px;
      font-weight: 400;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0 0 32px 0;
      letter-spacing: -0.5px;
    }

    .welcome-logo {
      margin-bottom: 32px;
    }

    .eg-logo {
      width: 240px;
      height: auto;
      object-fit: contain;
    }

    .welcome-tagline {
      color: #1a1a1a;
      font-size: 32px;
      font-weight: 300;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      letter-spacing: -0.3px;
      margin: 0;
    }
  `]
})
export class WelcomeComponent {}
