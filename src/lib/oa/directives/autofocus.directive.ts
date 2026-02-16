import { Directive, ElementRef, inject, Input, OnInit } from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[oaAutofocus]'
})
export class AutofocusDirective implements OnInit {

  private focus = true;
  private el = inject(ElementRef)

  @Input()
  set oaAutofocus(condition: boolean) {
    this.focus = condition !== false;
  }

  constructor() { }

  ngOnInit() {
    if (this.focus) {
      setTimeout(() => {
        this.el.nativeElement.focus();
      });
    }
  }

}
