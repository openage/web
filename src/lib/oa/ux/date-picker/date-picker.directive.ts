import {
  ChangeDetectorRef,
  ComponentRef,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewContainerRef,
} from '@angular/core';
import {
  Overlay,
  OverlayRef,
  PositionStrategy,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import { CalendarComponent } from '../calendar/calendar.component';

@Directive({
  selector: '[oaDatePicker]',
  standalone: true,
})
export class DatePickerDirective implements OnDestroy {
  @Input()
  oaDatePicker?: Date;

  @Input()
  max?: Date;

  @Input()
  min?: Date;

  @Output()
  select = new EventEmitter<Date>();

  private overlayRef: OverlayRef | null = null;
  private showPickerTimeout?: ReturnType<typeof setTimeout>;
  private subscriptions: Subscription[] = [];

  constructor(
    private element: ElementRef<HTMLElement>,
    private overlay: Overlay,
    private viewContainer: ViewContainerRef,
    private changeDetector: ChangeDetectorRef
  ) { }

  // We can add logic to some timeout on touch if needed
  @HostListener('click')
  @HostListener('focus')
  show(): void {
    if (this.overlayRef?.hasAttached() === true) {
      return;
    }

    this.showPickerTimeout = setTimeout(() => {
      this.attachPicker();
    }, 500);
  }

  ngOnDestroy(): void {
    clearTimeout(this.showPickerTimeout);
    this.overlayRef?.dispose();
  }

  private attachPicker(): void {
    if (this.overlayRef === null) {
      const positionStrategy = this.getPositionStrategy();
      this.overlayRef = this.overlay.create({ positionStrategy });
    }

    const component = new ComponentPortal(
      CalendarComponent,
      this.viewContainer,
      // injector
    );
    const componentRef: ComponentRef<CalendarComponent> = this.overlayRef.attach(component);
    const instance = componentRef.instance;


    this.changeDetector.markForCheck();
    instance.value = this.oaDatePicker;
    this.subscriptions.push(instance.valueChange.subscribe((date?: Date) => {
      this.detachAndUnsubscribe();
      this.select.emit(date);
    }));
  }

  private detachAndUnsubscribe(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.overlayRef?.detach();
  }

  /*
  This can be enhanced with pre-defined position
  1. Add new Input position with enum: TOP, LEFT, RIGHT, BOTTOM
  2. Then change getPositionStrategy accordingly
  */
  private getPositionStrategy(): PositionStrategy {
    return this.overlay
      .position()
      .flexibleConnectedTo(this.element)
      .withPositions([
        {
          originX: 'center',
          originY: 'center',
          overlayX: 'center',
          overlayY: 'top',
          panelClass: 'bottom',
        },
      ]);
  }
}
