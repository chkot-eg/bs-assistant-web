import { NgModule, Component, Input } from '@angular/core';

@Component({
  selector: 'eg-icon',
  standalone: true,
  template: `<span class="material-icons" [class]="'eg-icon eg-icon-' + size">{{ name }}</span>`,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .eg-icon { font-family: 'Material Icons'; font-feature-settings: 'liga'; -webkit-font-feature-settings: 'liga'; }
    .eg-icon-large { font-size: 32px; }
    .eg-icon-mediumLarge { font-size: 28px; }
    .eg-icon-medium { font-size: 24px; }
    .eg-icon-small { font-size: 18px; }
  `]
})
export class EgIconComponent {
  @Input() name = '';
  @Input() size: 'large' | 'mediumLarge' | 'medium' | 'small' = 'medium';
}

@NgModule({
  imports: [EgIconComponent],
  exports: [EgIconComponent]
})
export class EgIconModule {}
