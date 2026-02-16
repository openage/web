import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { UxService } from '../../core/services/ux.service';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'oa-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss']
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

  private contentService = inject(ContentService)

  ngOnInit(): void {
  }

  removeTag(index: number) {
    this.values.splice(index, 1);
    this.changed.emit(this.values);
  }

  addTag($event: any) {
    const value = this.contentService.getTextFromEvent($event);
    if (value && !this.values.includes(value)) {
      this.values.push(value);
      this.changed.emit(this.values);
    }
    this.newTag = '';
  }

}
