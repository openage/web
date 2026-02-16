import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[oaUppercase]',
  host: {
    '(input)': '$event'
  }
})
export class UppercaseInputDirective {
  lastValue?: string;
  private ref = inject(ElementRef)
  constructor() { }

  @HostListener('input', ['$event'])
  onInput($event: any) {
    const start = $event.target.selectionStart;
    const end = $event.target.selectionEnd;
    $event.target.value = $event.target.value.toUpperCase();
    $event.target.setSelectionRange(start, end);
    $event.preventDefault();

    if (!this.lastValue || (this.lastValue && $event.target.value.length > 0 && this.lastValue !== $event.target.value)) {
      this.lastValue = this.ref.nativeElement.value = $event.target.value;
      // Propagation
      const evt = document.createEvent('HTMLEvents');
      evt.initEvent('input', false, true);
      $event.target.dispatchEvent(evt);
    }
  }

}
