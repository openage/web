import { ApplicationRef, ComponentFactoryResolver, ComponentRef, Directive, ElementRef, EmbeddedViewRef, EventEmitter, HostListener, Injector, Input, Output, TemplateRef, OnDestroy, inject } from '@angular/core';
import { Action } from '../core/models/action.model';
import { PopupComponent } from '../ux/popup/popup.component';
import { PopupPosition, PopupTrigger } from '../core/models/popup.enums';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[oaDialog]'
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
  private readonly viewportListeners = {
    resize: () => this.positionPopup(),
    scroll: () => this.positionPopup()
  };

  private elementRef = inject(ElementRef)
  private appRef = inject(ApplicationRef)
  private componentFactoryResolver = inject(ComponentFactoryResolver)
  private injector = inject(Injector)
  constructor() { }

  @HostListener('click')
  onClick(): void {
    if (this.componentRef === null) {
      this.init();
    } else {
      this.hide();
    }
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.preventDefault();
    this.onClick();
  }

  private init() {
    if (this.oaDialog) {
      const componentFactory = this.componentFactoryResolver.resolveComponentFactory(PopupComponent);
      this.componentRef = componentFactory.create(this.injector);

      this.appRef.attachView(this.componentRef.hostView);
      const [popupDOMElement] = (this.componentRef.hostView as EmbeddedViewRef<any>).rootNodes;

      this.setComponentProperties();

      document.body.appendChild(popupDOMElement);
      window.addEventListener('resize', this.viewportListeners.resize);
      window.addEventListener('scroll', this.viewportListeners.scroll, true);
      requestAnimationFrame(() => this.positionPopup());
    }
  }

  private setComponentProperties() {
    if (this.componentRef !== null) {
      this.componentRef.instance.template = this.oaDialog;
      this.componentRef.instance.data = this.oaData;
      this.componentRef.instance.position = this.oaPosition;
      this.componentRef.instance.type = 'dialog';
      this.componentRef.instance.visible = true;
    }
  }

  clampToViewport(left: number, top: number, width: number, height: number): { left: number; top: number } {
    const margin = 12;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const boundedWidth = Math.min(Math.max(width, 0), Math.max(0, viewportWidth - (margin * 2)));
    const boundedHeight = Math.min(Math.max(height, 0), Math.max(0, viewportHeight - (margin * 2)));
    const maxLeft = Math.max(margin, viewportWidth - boundedWidth - margin);
    const maxTop = Math.max(margin, viewportHeight - boundedHeight - margin);

    return {
      left: Math.min(Math.max(left, margin), maxLeft),
      top: Math.min(Math.max(top, margin), maxTop)
    };
  }

  private positionPopup() {
    if (this.componentRef !== null) {
      const triggerRect = this.elementRef.nativeElement.getBoundingClientRect();
      const instance = this.componentRef.instance;
      const popupRoot = this.componentRef.location.nativeElement as HTMLElement;
      const popupPanel = (popupRoot?.firstElementChild as HTMLElement | null) ?? popupRoot;
      const popupRect = popupPanel?.getBoundingClientRect();
      const popupWidth = Math.max(popupRect?.width ?? 0, popupPanel?.offsetWidth ?? 0, popupRoot?.offsetWidth ?? 0);
      const popupHeight = Math.max(popupRect?.height ?? 0, popupPanel?.offsetHeight ?? 0, popupRoot?.offsetHeight ?? 0);
      const padding = 12;
      let left = triggerRect.left;
      let top = triggerRect.top;

      switch (this.oaPosition) {
        case PopupPosition.BELOW:
          left = triggerRect.left + ((triggerRect.width - popupWidth) / 2);
          top = triggerRect.bottom + padding;
          break;
        case PopupPosition.ABOVE:
          left = triggerRect.left + ((triggerRect.width - popupWidth) / 2);
          top = triggerRect.top - popupHeight - padding;
          break;
        case PopupPosition.RIGHT:
          left = triggerRect.right + padding;
          top = triggerRect.top + ((triggerRect.height - popupHeight) / 2);
          break;
        case PopupPosition.LEFT:
          left = triggerRect.left - popupWidth - padding;
          top = triggerRect.top + ((triggerRect.height - popupHeight) / 2);
          break;
        default:
          left = triggerRect.left + ((triggerRect.width - popupWidth) / 2);
          top = triggerRect.bottom + padding;
          break;
      }

      const clampedPosition = this.clampToViewport(left, top, popupWidth, popupHeight);
      instance.left = Math.round(clampedPosition.left);
      instance.top = Math.round(clampedPosition.top);
    }
  }

  hide() {
    if (this.componentRef) {
      window.removeEventListener('resize', this.viewportListeners.resize);
      window.removeEventListener('scroll', this.viewportListeners.scroll, true);
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
