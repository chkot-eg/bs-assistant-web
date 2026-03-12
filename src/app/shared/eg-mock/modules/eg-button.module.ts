import { NgModule, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="'eg-btn eg-btn-' + variant + ' eg-btn-' + size"
      [disabled]="disabled"
      (click)="clicked.emit($event)"
      [attr.type]="type">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    :host { display: inline-block; }
    .eg-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      font-weight: 500;
      transition: background 0.2s, opacity 0.2s;
    }
    .eg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .eg-btn-large { padding: 10px 20px; font-size: 15px; }
    .eg-btn-medium { padding: 8px 16px; font-size: 14px; }
    .eg-btn-small { padding: 6px 12px; font-size: 13px; }
    .eg-btn-tiny { padding: 4px 8px; font-size: 12px; }
    .eg-btn-primary { background: #2196F3; color: #fff; }
    .eg-btn-primary:hover:not(:disabled) { background: #1976D2; }
    .eg-btn-secondary { background: #fff; color: #333; border: 1px solid #ddd; }
    .eg-btn-secondary:hover:not(:disabled) { background: #f5f5f5; }
    .eg-btn-danger { background: #F44336; color: #fff; }
    .eg-btn-danger:hover:not(:disabled) { background: #D32F2F; }
    .eg-btn-warning { background: #FF9800; color: #fff; }
    .eg-btn-text { background: transparent; color: #2196F3; }
    .eg-btn-text:hover:not(:disabled) { background: rgba(33,150,243,0.08); }
    .eg-btn-text-muted { background: transparent; color: #6C757D; }
    .eg-btn-text-muted:hover:not(:disabled) { background: rgba(0,0,0,0.04); }
  `]
})
export class EgButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'text' | 'text-muted' | 'danger' | 'warning' = 'primary';
  @Input() size: 'large' | 'medium' | 'small' | 'tiny' = 'medium';
  @Input() icon = '';
  @Input() disabled = false;
  @Input() type = 'button';
  @Output() clicked = new EventEmitter<Event>();
}

@NgModule({
  imports: [EgButtonComponent],
  exports: [EgButtonComponent]
})
export class EgButtonModule {}
