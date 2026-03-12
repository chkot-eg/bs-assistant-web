import { NgModule, Directive, Input } from '@angular/core';

@Directive({
  selector: '[egTooltip]',
  standalone: true,
  host: {
    '[attr.title]': 'egTooltip'
  }
})
export class EgTooltipDirective {
  @Input() egTooltip = '';
}

@NgModule({
  imports: [EgTooltipDirective],
  exports: [EgTooltipDirective]
})
export class EgTooltipModule {}
