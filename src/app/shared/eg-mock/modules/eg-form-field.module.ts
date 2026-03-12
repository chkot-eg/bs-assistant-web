import { NgModule, Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormControl, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'eg-form-field-base',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="eg-form-field">
      @if (label) { <label class="eg-form-field-label">{{ label }}</label> }
      <input class="eg-form-field-input" [formControl]="control" [placeholder]="placeholder" [type]="type">
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-form-field { display: flex; flex-direction: column; gap: 4px; }
    .eg-form-field-label { font-size: 12px; font-weight: 500; color: #495057; }
    .eg-form-field-input {
      padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit;
      transition: border-color 0.2s;
    }
    .eg-form-field-input:focus { border-color: #2196F3; outline: none; box-shadow: 0 0 0 2px rgba(33,150,243,0.15); }
  `]
})
export class EgFormFieldBaseComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() control: FormControl<any> = new FormControl('');
}

@Component({
  selector: 'eg-form-field-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="eg-form-field">
      @if (label) { <label class="eg-form-field-label">{{ label }}</label> }
      <div class="eg-search-wrapper">
        <span class="eg-search-icon">🔍</span>
        <input class="eg-form-field-input eg-search-input" [formControl]="control" [placeholder]="placeholder">
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-form-field { display: flex; flex-direction: column; gap: 4px; }
    .eg-form-field-label { font-size: 12px; font-weight: 500; color: #495057; }
    .eg-search-wrapper { position: relative; display: flex; align-items: center; }
    .eg-search-icon { position: absolute; left: 10px; font-size: 14px; }
    .eg-search-input { padding: 8px 12px 8px 34px; }
    .eg-form-field-input {
      width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit;
      transition: border-color 0.2s;
    }
    .eg-form-field-input:focus { border-color: #2196F3; outline: none; box-shadow: 0 0 0 2px rgba(33,150,243,0.15); }
  `]
})
export class EgFormFieldSearchComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() control: FormControl<any> = new FormControl('');
}

@Component({
  selector: 'eg-form-field-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="eg-form-field">
      @if (label) { <label class="eg-form-field-label">{{ label }}</label> }
      <select class="eg-form-field-select" [formControl]="control">
        @for (opt of options; track opt.value) {
          <option [value]="opt.value">{{ opt.label }}</option>
        }
      </select>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-form-field { display: flex; flex-direction: column; gap: 4px; }
    .eg-form-field-label { font-size: 12px; font-weight: 500; color: #495057; }
    .eg-form-field-select {
      padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit;
      background: #fff; cursor: pointer;
    }
    .eg-form-field-select:focus { border-color: #2196F3; outline: none; }
  `]
})
export class EgFormFieldSelectComponent {
  @Input() label = '';
  @Input() options: { value: any; label: string }[] = [];
  @Input() control: FormControl<any> = new FormControl('');
}

@Component({
  selector: 'eg-form-field-toggle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="eg-form-field eg-toggle-field">
      <label class="eg-toggle">
        <input type="checkbox" [formControl]="control">
        <span class="eg-toggle-slider"></span>
      </label>
      @if (label) { <span class="eg-form-field-label">{{ label }}</span> }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-toggle-field { display: flex; align-items: center; gap: 8px; flex-direction: row; }
    .eg-form-field-label { font-size: 13px; color: #495057; }
    .eg-toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
    .eg-toggle input { opacity: 0; width: 0; height: 0; }
    .eg-toggle-slider {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: #ccc; border-radius: 22px; cursor: pointer; transition: 0.3s;
    }
    .eg-toggle-slider::before {
      content: ''; position: absolute; width: 18px; height: 18px; left: 2px; bottom: 2px;
      background: #fff; border-radius: 50%; transition: 0.3s;
    }
    .eg-toggle input:checked + .eg-toggle-slider { background: #2196F3; }
    .eg-toggle input:checked + .eg-toggle-slider::before { transform: translateX(18px); }
  `]
})
export class EgFormFieldToggleComponent {
  @Input() label = '';
  @Input() control = new FormControl(false);
}

@Component({
  selector: 'eg-form-field-textarea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="eg-form-field">
      @if (label) { <label class="eg-form-field-label">{{ label }}</label> }
      <textarea class="eg-form-field-textarea" [formControl]="control" [placeholder]="placeholder" [rows]="rows"></textarea>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-form-field { display: flex; flex-direction: column; gap: 4px; }
    .eg-form-field-label { font-size: 12px; font-weight: 500; color: #495057; }
    .eg-form-field-textarea {
      padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical;
    }
    .eg-form-field-textarea:focus { border-color: #2196F3; outline: none; }
  `]
})
export class EgFormFieldTextareaComponent {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() rows = 3;
  @Input() control: FormControl<any> = new FormControl('');
}

@Component({
  selector: 'eg-form-field-file',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eg-form-field">
      @if (label) { <label class="eg-form-field-label">{{ label }}</label> }
      <input type="file" [accept]="accept" [multiple]="multiple" (change)="onFileChange($event)">
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eg-form-field { display: flex; flex-direction: column; gap: 4px; }
    .eg-form-field-label { font-size: 12px; font-weight: 500; color: #495057; }
  `]
})
export class EgFormFieldFileComponent {
  @Input() label = '';
  @Input() accept = '';
  @Input() multiple = false;

  onFileChange(event: Event): void {
    // placeholder - real component emits file events
  }
}

@NgModule({
  imports: [
    EgFormFieldBaseComponent, EgFormFieldSearchComponent, EgFormFieldSelectComponent,
    EgFormFieldToggleComponent, EgFormFieldTextareaComponent, EgFormFieldFileComponent
  ],
  exports: [
    EgFormFieldBaseComponent, EgFormFieldSearchComponent, EgFormFieldSelectComponent,
    EgFormFieldToggleComponent, EgFormFieldTextareaComponent, EgFormFieldFileComponent
  ]
})
export class EgFormFieldModule {}
