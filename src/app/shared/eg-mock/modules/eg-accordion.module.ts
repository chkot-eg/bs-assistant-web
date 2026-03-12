import { NgModule, Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-accordion',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="eg-accordion"><ng-content></ng-content></div>',
  styles: [':host { display: block; } .eg-accordion { display: flex; flex-direction: column; gap: 8px; }']
})
export class EgAccordionComponent {
  @Input() multi = false;
}

@Component({
  selector: 'eg-accordion-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eg-accordion-panel" [class.expanded]="expanded">
      <div class="eg-accordion-header" (click)="toggle()">
        <ng-content select="[eg-accordion-header]"></ng-content>
        <span class="eg-accordion-arrow">{{ expanded ? '▲' : '▼' }}</span>
      </div>
      @if (expanded) {
        <div class="eg-accordion-body">
          <ng-content></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-accordion-panel { background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
    .eg-accordion-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; cursor: pointer; }
    .eg-accordion-header:hover { background: #f5f5f5; }
    .eg-accordion-arrow { font-size: 12px; color: #6C757D; }
    .eg-accordion-body { padding: 0 16px 16px; }
  `]
})
export class EgAccordionPanelComponent {
  @Input() expanded = false;
  @Output() expandedChange = new EventEmitter<boolean>();

  toggle(): void {
    this.expanded = !this.expanded;
    this.expandedChange.emit(this.expanded);
  }
}

@NgModule({
  imports: [EgAccordionComponent, EgAccordionPanelComponent],
  exports: [EgAccordionComponent, EgAccordionPanelComponent]
})
export class EgAccordionModule {}
