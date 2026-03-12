import { NgModule, Component } from '@angular/core';

@Component({ selector: 'eg-page', standalone: true, template: '<ng-content></ng-content>', styles: [':host { display: block; height: 100%; }'] })
export class EgPageComponent {}

@Component({ selector: 'eg-page-body', standalone: true, template: '<ng-content></ng-content>', styles: [':host { display: block; flex: 1; }'] })
export class EgPageBodyComponent {}

@Component({ selector: 'eg-page-content', standalone: true, template: '<ng-content></ng-content>', styles: [':host { display: block; }'] })
export class EgPageContentComponent {}

@Component({ selector: 'eg-page-footer', standalone: true, template: '<ng-content></ng-content>', styles: [':host { display: block; padding: 16px 0; border-top: 1px solid #e0e0e0; }'] })
export class EgPageFooterComponent {}

@Component({ selector: 'eg-page-aside', standalone: true, template: '<ng-content></ng-content>', styles: [':host { display: block; }'] })
export class EgPageAsideComponent {}

@NgModule({
  imports: [EgPageComponent, EgPageBodyComponent, EgPageContentComponent, EgPageFooterComponent, EgPageAsideComponent],
  exports: [EgPageComponent, EgPageBodyComponent, EgPageContentComponent, EgPageFooterComponent, EgPageAsideComponent]
})
export class EgPageModule {}
