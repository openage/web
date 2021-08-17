import { ApplicationRef, ComponentFactoryResolver, ComponentRef, Directive, ElementRef, EmbeddedViewRef, EventEmitter, HostListener, Injector, Input, Output, TemplateRef, OnDestroy } from '@angular/core';
import { Action } from '../core/models/action.model';
import { PopupComponent } from '../ux/popup/popup.component';
import { PopupPosition, PopupTrigger } from '../core/models/popup.enums';

@Directive({
  selector: '[oaDialog]',
  standalone: true
})
export class DialogDirective implements OnDestroy {

  @Input()
  oaDialog?: TemplateRef<any>;

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
    if (this.componentRef === null) {
      this.init();
    } else {
      this.hide();
    }
  }

  private init() {
    if (this.oaDialog) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(PopupComponent);
      this.componentRef = componentFactory.create(this.injector);

      this.appRef.attachView(this.componentRef.hostView);
      const [popupDOMElement] = (this.componentRef.hostView as EmbeddedViewRef<any>).rootNodes;

      this.setComponentProperties();

      document.body.appendChild(popupDOMElement);
      this.positionPopup();
    }
  }

  private setComponentProperties() {
    if (this.componentRef !== null) {
      this.componentRef.instance.template = this.oaDialog;
      this.componentRef.instance.data = this.oaData;
      this.componentRef.instance.position = this.oaPosition;
    }
  }

  private positionPopup() {
    if (this.componentRef !== null) {
      const { left, right, top, bottom } = this.elementRef.nativeElement.getBoundingClientRect();
      const instance = this.componentRef.instance;

      switch (this.oaPosition) {
        case PopupPosition.BELOW:
          instance.left = Math.round((right - left) / 2 + left);
          instance.top = Math.round(bottom);
          break;
        case PopupPosition.ABOVE:
          instance.left = Math.round((right - left) / 2 + left);
          instance.top = Math.round(top);
          break;
        case PopupPosition.RIGHT:
          instance.left = Math.round(right);
          instance.top = Math.round(top + (bottom - top) / 2);
          break;
        case PopupPosition.LEFT:
          instance.left = Math.round(left);
          instance.top = Math.round(top + (bottom - top) / 2);
          break;
        default:
          break;
      }
    }
  }

  hide() {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = null;
      this.oaMenuClose.emit();
    }
  }

  ngOnDestroy() {
    this.hide();
  }
}
