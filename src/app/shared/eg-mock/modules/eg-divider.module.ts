import { NgModule, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-divider',
  standalone: true,
  imports: [CommonModule],
  template: '<hr [class.vertical]="vertical">',
  styles: [`
    :host { display: block; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 16px 0; }
    hr.vertical { border-top: none; border-left: 1px solid #e0e0e0; height: 100%; margin: 0 16px; display: inline-block; }
  `]
})
export class EgDividerComponent {
  @Input() vertical = false;
}

@NgModule({
  imports: [EgDividerComponent],
  exports: [EgDividerComponent]
})
export class EgDividerModule {}
