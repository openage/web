import { ApplicationRef, ComponentFactoryResolver, ComponentRef, Directive, ElementRef, EmbeddedViewRef, EventEmitter, HostListener, Injector, Input, Output, TemplateRef } from '@angular/core';
import { Action } from '../core/models/action.model';
import { PopupComponent } from '../ux/popup/popup.component';
import { PopupPosition, PopupTrigger } from '../core/models/popup.enums';

@Directive({
  selector: '[oaMenu]',
  standalone: true
})
export class MenuDirective {

  @Input()
  oaMenu?: Action[] = [];

  @Input()
  oaTitle?: string;

  @Input()
  oaData?: any;

  @Input()
  oaPosition: PopupPosition | string = PopupPosition.DYNAMIC;

  @Input()
  oaTrigger?: PopupTrigger = PopupTrigger.LEFT_CLICK;

  @Output()
  oaMenuClose: EventEmitter<Action> = new EventEmitter();

  private componentRef: ComponentRef<any> | null = null;


  constructor(private elementRef: ElementRef,
    private appRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector) { }

  @HostListener('click')
  onClick(): void {
    this.init.bind(this)
    this.show();
  }

  private init() {
    if (this.componentRef === null) {

      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(PopupComponent);
      this.componentRef = componentFactory.create(this.injector);

      this.appRef.attachView(this.componentRef.hostView);
      const [tooltipDOMElement] = (this.componentRef.hostView as EmbeddedViewRef<any>).rootNodes;

      this.setComponentProperties();

      document.body.appendChild(tooltipDOMElement);
      this.show.bind(this)

    }
  }

  private setComponentProperties() {
    if (this.componentRef !== null) {
      this.componentRef.instance.data = this.oaMenu;
      this.componentRef.instance.position = this.oaPosition;

      const { left, right, top, bottom } = this.elementRef.nativeElement.getBoundingClientRect();

      switch (this.oaPosition) {
        case PopupPosition.BELOW: {
          this.componentRef.instance.left = Math.round((right - left) / 2 + left);
          this.componentRef.instance.top = Math.round(bottom);
          break;
        }
        case PopupPosition.ABOVE: {
          this.componentRef.instance.left = Math.round((right - left) / 2 + left);
          this.componentRef.instance.top = Math.round(top);
          break;
        }
        case PopupPosition.RIGHT: {
          this.componentRef.instance.left = Math.round(right);
          this.componentRef.instance.top = Math.round(top + (bottom - top) / 2);
          break;
        }
        case PopupPosition.LEFT: {
          this.componentRef.instance.left = Math.round(left);
          this.componentRef.instance.top = Math.round(top + (bottom - top) / 2);
          break;
        }
        default: {
          break;
        }
      }
    }
  }

  show() {
    // const triggerElement = this.elementRef.nativeElement;
    // const triggerRect = triggerElement.getBoundingClientRect();
    // const body = document.body;
    // const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    // const windowHeight = window.innerHeight || document.documentElement.clientHeight;

    // // Basic positioning example (adjust as needed)
    // popupElement.style.position = 'absolute';
    // popupElement.style.top = `${triggerRect.bottom}px`;
    // popupElement.style.left = `${triggerRect.left}px`;

    // // Ensure the popup stays within viewport bounds
    // if (popupElement.offsetHeight + triggerRect.bottom > windowHeight) {
    //   popupElement.style.top = `${body.scrollTop + windowHeight - popupElement.offsetHeight}px`;
    // }

    // if (popupElement.offsetWidth + triggerRect.left > windowWidth) {
    //   popupElement.style.left = `${windowWidth - popupElement.offsetWidth}px`;
    // }

  }

  hide() {

  }

}
