import { NgModule, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-box',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="eg-box" [class.no-gutters]="noGutters" [class.shadow-lifted]="shadow === \'lifted\'" [class.shadow-flying]="shadow === \'flying\'"><ng-content></ng-content></div>',
  styles: [`
    :host { display: block; }
    .eg-box { background: #fff; border-radius: 12px; border: 1px solid #e0e0e0; padding: 16px; }
    .eg-box.no-gutters { padding: 0; }
    .eg-box.shadow-lifted { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .eg-box.shadow-flying { box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
  `]
})
export class EgBoxComponent {
  @Input() noGutters = false;
  @Input() shadow: 'lifted' | 'flying' | '' = '';
}

@NgModule({
  imports: [EgBoxComponent],
  exports: [EgBoxComponent]
})
export class EgBoxModule {}
