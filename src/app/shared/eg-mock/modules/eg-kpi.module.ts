import { NgModule, Component } from '@angular/core';

@Component({
  selector: 'eg-kpi',
  standalone: true,
  template: '<div class="eg-kpi"><ng-content></ng-content></div>',
  styles: [`
    :host { display: block; }
    .eg-kpi { text-align: center; padding: 16px; }
  `]
})
export class EgKpiComponent {}

@NgModule({
  imports: [EgKpiComponent],
  exports: [EgKpiComponent]
})
export class EgKpiModule {}
