import { inject, Input } from '@angular/core';
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
} from '@angular/core';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[oaClickOutside]',
})
export class ClickOutsideDirective {
  @Input()
  container: ElementRef | undefined;

  private el = inject(ElementRef)

  constructor() { }

  @Output()
  public clickOutside = new EventEmitter<MouseEvent>();

  @HostListener('document:click', ['$event', '$event.target'])
  public onClick(event: MouseEvent, targetElement: EventTarget | null): void {
    // if (this._elementRef !== this.container) {
    //   return;
    // }

    // event.target may be `null` or not a DOM Node in some environments — guard for safety
    if (!targetElement || !(targetElement instanceof Node)) {
      return;
    }

    const clickedInside = this.el.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.clickOutside.emit(event);
    }
  }
}
