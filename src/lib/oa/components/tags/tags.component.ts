import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UxService } from 'src/app/core/services';

@Component({
    selector: 'oa-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.scss'],
    standalone: false
})
export class TagsComponent implements OnInit {

  @Input()
  readonly = false;

  @Input()
  values: any[] = [];

  @Output()
  changed: EventEmitter<any[]> = new EventEmitter();

  @Output()
  selected: EventEmitter<any> = new EventEmitter();

  newTag = '';

  constructor(
    private uxService: UxService,
  ) { }

  ngOnInit(): void {
  }

  removeTag(index) {
    this.values.splice(index, 1);
    this.changed.emit(this.values);
  }

  addTag($event) {
    const value = this.uxService.getTextFromEvent($event);
    if (value && !this.values.includes(value)) {
      this.values.push(value);
      this.changed.emit(this.values);
    }
    this.newTag = '';
  }

}
