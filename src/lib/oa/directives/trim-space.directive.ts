import { Directive, ElementRef, HostListener, inject, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[oaTrimSpace]'
})
export class TrimSpaceDirective {
  private _el = inject(ElementRef)
  constructor() { }

  @HostListener('blur', ['$event'])
  onInputChange(event: any) {
    const initalValue = this._el.nativeElement.value;

    // this._el.nativeElement.value = initalValue.replace(/^[ ]+|[ ]+$/g, '');
    this._el.nativeElement.value = initalValue.trim();
    if (initalValue !== this._el.nativeElement.value) {
      event.stopPropagation();
    }
  }
}
