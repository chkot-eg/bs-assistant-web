import { NgModule, Component } from '@angular/core';

@Component({
  selector: 'eg-section',
  standalone: true,
  template: '<div class="eg-section"><ng-content></ng-content></div>',
  styles: [':host { display: block; margin-bottom: 24px; } .eg-section { background: #fff; border-radius: 12px; border: 1px solid #e0e0e0; overflow: hidden; }']
})
export class EgSectionComponent {}

@Component({ selector: 'eg-section-header', standalone: true, template: '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #f0f0f0"><ng-content></ng-content></div>' })
export class EgSectionHeaderComponent {}

@Component({ selector: 'eg-section-title', standalone: true, template: '<h3 style="margin:0;font-size:16px;font-weight:600;color:#1a1a1a"><ng-content></ng-content></h3>' })
export class EgSectionTitleComponent {}

@Component({ selector: 'eg-section-content', standalone: true, template: '<div style="padding:16px 20px"><ng-content></ng-content></div>' })
export class EgSectionContentComponent {}

@NgModule({
  imports: [EgSectionComponent, EgSectionHeaderComponent, EgSectionTitleComponent, EgSectionContentComponent],
  exports: [EgSectionComponent, EgSectionHeaderComponent, EgSectionTitleComponent, EgSectionContentComponent]
})
export class EgSectionModule {}
