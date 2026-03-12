import { NgModule, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-text',
  standalone: true,
  imports: [CommonModule],
  template: '<span [class.bold]="bold"><ng-content></ng-content></span>',
  styles: [':host { display: inline; } .bold { font-weight: 600; }']
})
export class EgTextComponent {
  @Input() bold = false;
}

@NgModule({
  imports: [EgTextComponent],
  exports: [EgTextComponent]
})
export class EgTextModule {}
