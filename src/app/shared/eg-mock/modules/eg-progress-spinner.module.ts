import { NgModule, Component, Input } from '@angular/core';

@Component({
  selector: 'eg-progress-spinner',
  standalone: true,
  template: `<div class="eg-spinner" [style.width.px]="diameter" [style.height.px]="diameter"></div>`,
  styles: [`
    :host { display: inline-flex; align-items: center; justify-content: center; }
    .eg-spinner {
      border: 3px solid #e0e0e0;
      border-top-color: #2196F3;
      border-radius: 50%;
      animation: eg-spin 0.8s linear infinite;
    }
    @keyframes eg-spin { to { transform: rotate(360deg); } }
  `]
})
export class EgProgressSpinnerComponent {
  @Input() diameter = 48;
}

@NgModule({
  imports: [EgProgressSpinnerComponent],
  exports: [EgProgressSpinnerComponent]
})
export class EgProgressSpinnerModule {}
