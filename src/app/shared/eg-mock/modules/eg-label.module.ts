import { NgModule, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-label',
  standalone: true,
  imports: [CommonModule],
  template: '<span class="eg-label" [class]="\'eg-label eg-label-\' + type"><ng-content></ng-content></span>',
  styles: [`
    :host { display: inline-flex; }
    .eg-label { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .eg-label-default { background: #f0f0f0; color: #333; }
    .eg-label-success { background: #e8f5e9; color: #2e7d32; }
    .eg-label-danger { background: #ffebee; color: #c62828; }
    .eg-label-warning { background: #fff3e0; color: #e65100; }
    .eg-label-info { background: #e3f2fd; color: #1565c0; }
  `]
})
export class EgLabelComponent {
  @Input() type: 'default' | 'success' | 'danger' | 'warning' | 'info' = 'default';
}

@NgModule({
  imports: [EgLabelComponent],
  exports: [EgLabelComponent]
})
export class EgLabelModule {}
