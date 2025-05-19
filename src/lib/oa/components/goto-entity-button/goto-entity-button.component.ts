import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NavService } from 'src/app/core/services';
import { Entity } from 'src/lib/oa/core/models/entity.model';

@Component({
    selector: 'oa-goto-entity-button',
    templateUrl: './goto-entity-button.component.html',
    styleUrls: ['./goto-entity-button.component.css'],
    standalone: false
})
export class GotoEntityButtonComponent implements OnInit {

  @Input()
  view = 'button';

  @Input()
  entity: Entity;

  @Input()
  title = 'Goto';

  @Output()
  done: EventEmitter<boolean> = new EventEmitter();

  show = false;

  constructor(
    private navService: NavService
  ) { }

  ngOnInit() {
    if (this.entity && (this.entity.code || this.entity.id)) {
      this.show = true;

      // if (this.entity.name) {
      //   this.title = this.entity.name;
      // }
    }
  }

  goto() {
    this.navService.goto(new Entity(this.entity));
    this.done.emit(true);
  }

}
