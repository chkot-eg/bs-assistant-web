import { NgModule, Component, Input } from '@angular/core';

@Component({
  selector: 'eg-header',
  standalone: true,
  template: `
    <div class="eg-header">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0 16px 0;
    }
  `]
})
export class EgHeaderComponent {
  @Input() variant: 'page' | 'drawer' | 'aside' | 'menu' = 'page';
  @Input() close = false;
}

@Component({
  selector: 'eg-header-title',
  standalone: true,
  template: '<h1 style="font-size:24px;font-weight:600;color:#1a1a1a;margin:0"><ng-content></ng-content></h1>',
})
export class EgHeaderTitleComponent {}

@Component({
  selector: 'eg-header-detail',
  standalone: true,
  template: '<span style="font-size:13px;color:#6C757D"><ng-content></ng-content></span>',
})
export class EgHeaderDetailComponent {}

@Component({
  selector: 'eg-header-subheader',
  standalone: true,
  template: '<span style="font-size:13px;color:#6C757D"><ng-content></ng-content></span>',
})
export class EgHeaderSubheaderComponent {}

@Component({
  selector: 'eg-header-actions',
  standalone: true,
  template: '<div style="display:flex;gap:8px;align-items:center"><ng-content></ng-content></div>',
})
export class EgHeaderActionsComponent {}

@NgModule({
  imports: [EgHeaderComponent, EgHeaderTitleComponent, EgHeaderDetailComponent, EgHeaderSubheaderComponent, EgHeaderActionsComponent],
  exports: [EgHeaderComponent, EgHeaderTitleComponent, EgHeaderDetailComponent, EgHeaderSubheaderComponent, EgHeaderActionsComponent]
})
export class EgHeaderModule {}
