import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[oaAutofocus], [autofocus]',
  standalone: true
})
export class AutofocusDirective implements OnInit {

  private focus = true;

  @Input()
  set oaAutofocus(condition: boolean) {
    this.focus = condition !== false;
  }

  constructor(private el: ElementRef) { }

  ngOnInit() {
    if (this.focus) {
      setTimeout(() => {
        this.el.nativeElement.focus();
      });
    }
  }

}
