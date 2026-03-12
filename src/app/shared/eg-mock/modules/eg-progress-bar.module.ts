import { NgModule, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eg-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eg-progress-bar">
      <div class="eg-progress-fill" [class.indeterminate]="mode === 'indeterminate'" [style.width.%]="mode === 'determinate' ? value : 0"></div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-progress-bar { height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden; }
    .eg-progress-fill { height: 100%; background: #2196F3; border-radius: 2px; transition: width 0.3s; }
    .eg-progress-fill.indeterminate {
      width: 40% !important;
      animation: eg-progress-indeterminate 1.5s infinite ease-in-out;
    }
    @keyframes eg-progress-indeterminate {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
  `]
})
export class EgProgressBarComponent {
  @Input() mode: 'determinate' | 'indeterminate' = 'indeterminate';
  @Input() value = 0;
}

@NgModule({
  imports: [EgProgressBarComponent],
  exports: [EgProgressBarComponent]
})
export class EgProgressBarModule {}
