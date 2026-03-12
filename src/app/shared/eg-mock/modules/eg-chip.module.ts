import { NgModule, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="eg-chip" [class.active]="active" [class.removable]="removable">
      <ng-content></ng-content>
      @if (removable) {
        <span class="eg-chip-remove" (click)="removed.emit()">×</span>
      }
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }
    .eg-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 16px; font-size: 12px; background: #f0f0f0; color: #333; }
    .eg-chip.active { background: #2196F3; color: #fff; }
    .eg-chip-remove { cursor: pointer; font-size: 14px; line-height: 1; opacity: 0.7; }
    .eg-chip-remove:hover { opacity: 1; }
  `]
})
export class EgChipComponent {
  @Input() active = false;
  @Input() removable = false;
  @Input() size: 'medium' | 'small' = 'medium';
  @Output() removed = new EventEmitter<void>();
}

@Component({
  selector: 'eg-chip-container',
  standalone: true,
  template: '<div style="display:flex;flex-wrap:wrap;gap:6px"><ng-content></ng-content></div>'
})
export class EgChipContainerComponent {}

@NgModule({
  imports: [EgChipComponent, EgChipContainerComponent],
  exports: [EgChipComponent, EgChipContainerComponent]
})
export class EgChipModule {}
