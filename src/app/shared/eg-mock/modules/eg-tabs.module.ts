import { NgModule, Component, Input, Output, EventEmitter, ContentChildren, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-tab',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (active) {
      <div class="eg-tab-content">
        <ng-content></ng-content>
      </div>
    }
  `,
  styles: [':host { display: block; }']
})
export class EgTabComponent {
  @Input() label = '';
  @Input() active = false;
}

@Component({
  selector: 'eg-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eg-tabs">
      <div class="eg-tabs-header">
        @for (tab of tabs; track tab.label; let i = $index) {
          <button class="eg-tab-btn" [class.active]="i === selectedIndex" (click)="selectTab(i)">
            {{ tab.label }}
          </button>
        }
      </div>
      <div class="eg-tabs-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-tabs-header { display: flex; border-bottom: 2px solid #e0e0e0; gap: 0; }
    .eg-tab-btn {
      padding: 10px 20px; border: none; background: transparent; cursor: pointer;
      font-size: 14px; color: #6C757D; border-bottom: 2px solid transparent; margin-bottom: -2px;
      transition: color 0.2s, border-color 0.2s;
    }
    .eg-tab-btn:hover { color: #1a1a1a; }
    .eg-tab-btn.active { color: #2196F3; border-bottom-color: #2196F3; font-weight: 500; }
    .eg-tabs-body { padding: 16px 0; }
  `]
})
export class EgTabsComponent implements AfterContentInit {
  @ContentChildren(EgTabComponent) tabs!: QueryList<EgTabComponent>;
  @Output() tabChanged = new EventEmitter<number>();
  selectedIndex = 0;

  ngAfterContentInit(): void {
    this.selectTab(0);
  }

  selectTab(index: number): void {
    this.selectedIndex = index;
    this.tabs?.forEach((tab, i) => tab.active = i === index);
    this.tabChanged.emit(index);
  }
}

@NgModule({
  imports: [EgTabsComponent, EgTabComponent],
  exports: [EgTabsComponent, EgTabComponent]
})
export class EgTabsModule {}
