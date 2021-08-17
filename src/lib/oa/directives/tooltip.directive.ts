import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  HostListener,
  Injector,
  Input
} from '@angular/core';
import { PopupPosition, PopupTheme } from '../core/models/popup.enums';
import { PopupComponent } from '../ux/popup/popup.component';


@Directive({
  selector: '[oaTooltip]',
  standalone: true,
})
export class TooltipDirective {

  @Input()
  oaTooltip?: string | null = '';

  @Input()
  oaPosition: PopupPosition = PopupPosition.ABOVE;

  @Input()
  oaTheme: PopupTheme = PopupTheme.DARK;

  @Input()
  showDelay = 0;

  @Input()
  hideDelay = 0;

  private componentRef: ComponentRef<any> | null = null;
  private showTimeout?: number;
  private hideTimeout?: number;
  private touchTimeout?: number;

  constructor(private elementRef: ElementRef, private appRef: ApplicationRef,
    private componentFactoryResolver: ComponentFactoryResolver, private injector: Injector) {
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.init();
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hide();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove($event: MouseEvent): void {
    if (this.componentRef !== null && this.oaPosition === PopupPosition.DYNAMIC) {
      this.componentRef.instance.left = $event.clientX;
      this.componentRef.instance.top = $event.clientY;
      this.componentRef.instance.tooltip = this.oaTooltip;
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart($event: TouchEvent): void {
    $event.preventDefault();
    window.clearTimeout(this.touchTimeout);
    this.touchTimeout = window.setTimeout(this.init.bind(this), 500);
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    window.clearTimeout(this.touchTimeout);
    this.hide();
  }

  private init() {
    if (this.componentRef === null) {
      window.clearInterval(this.hideDelay);
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(PopupComponent);

      this.componentRef = componentFactory.create(this.injector);

      this.appRef.attachView(this.componentRef.hostView);
      const [tooltipDOMElement] = (this.componentRef.hostView as EmbeddedViewRef<any>).rootNodes;

      this.setComponentProperties();

      document.body.appendChild(tooltipDOMElement);
      this.showTimeout = window.setTimeout(this.show.bind(this), this.showDelay);
    }
  }

  private setComponentProperties() {
    if (this.componentRef !== null) {
      this.componentRef.instance.tooltip = this.oaTooltip;
      this.componentRef.instance.position = this.oaPosition;
      this.componentRef.instance.theme = this.oaTheme;

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

  private show() {
    if (this.componentRef !== null) {
      this.componentRef.instance.visible = true;
    }
  }

  private hide() {
    this.hideTimeout = window.setTimeout(this.destroy.bind(this), this.hideDelay);
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  destroy(): void {
    if (this.componentRef !== null) {
      window.clearInterval(this.showTimeout);
      window.clearInterval(this.hideDelay);
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }
}
