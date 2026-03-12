import { NgModule, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-container',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="eg-container" [class.vertical]="vertical" [class.space-between]="spaceBetween" [class.button-group]="buttonGroup" [class.margin-bottom]="marginBottom"><ng-content></ng-content></div>',
  styles: [`
    :host { display: block; }
    .eg-container { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .eg-container.vertical { flex-direction: column; align-items: stretch; }
    .eg-container.space-between { justify-content: space-between; }
    .eg-container.button-group { gap: 4px; }
    .eg-container.margin-bottom { margin-bottom: 16px; }
  `]
})
export class EgContainerComponent {
  @Input() buttonGroup = false;
  @Input() inlineGroup = false;
  @Input() marginBottom = false;
  @Input() spaceBetween = false;
  @Input() vertical = false;
}

@NgModule({
  imports: [EgContainerComponent],
  exports: [EgContainerComponent]
})
export class EgContainerModule {}
