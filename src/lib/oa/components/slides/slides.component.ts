import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UxService } from 'src/app/core/services/ux.service';
import { Entity, Slide } from 'src/lib/oa/core/models';
import { Folder } from 'src/lib/oa/drive/models';
import { Doc } from 'src/lib/oa/drive/models/doc.model';

@Component({
    selector: 'oa-slides',
    templateUrl: './slides.component.html',
    styleUrls: ['./slides.component.css'],
    standalone: false
})
export class SlidesComponent implements OnInit {

  @Input()
  slides: Slide[] = [];

  @Input()
  entity: Entity;

  @Input()
  folder: Folder;

  @Output()
  changed: EventEmitter<Slide[]> = new EventEmitter();

  readyToReceive = false;
  showToolbar = false;

  toolbar: any[] = [
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }],      // superscript/subscript
    [{ indent: '-1' }, { indent: '+1' }],          // outdent/indent
    [{ size: ['small', false, 'large', 'huge'] }],  // custom dropdown
    [{ color: new Array<any>() }, { background: new Array<any>() }],          // dropdown with defaults from theme
    [{ align: new Array<any>() }],
  ];

  selected: Slide;
  constructor(
    private uxService: UxService
  ) {
  }

  ngOnInit() {
    this.slides = this.slides || [];

    for (let index = 0; index < this.slides.length; index++) {
      this.slides[index].id = index + 1;
    }
    if (!this.slides.length) {
      this.slides.push(new Slide({ id: 1 }));
    }
    this.selected = this.slides[0];
  }

  onUpdate($event: any) {
    let newValue = $event;

    if (typeof newValue !== 'string') {
      newValue = this.uxService.getTextFromEvent($event);
    }

    if (!newValue) {
      return;
    }

    if (this.selected.description === newValue) {
      return;
    }
    this.selected.description = newValue;

    this.changed.emit(this.slides);
  }

  onSelect(slide: Slide) {
    this.selected = slide;
  }

  onDelete(slide?: Slide) {
    if (!slide) {
      slide = this.selected;
    }
    this.slides = this.slides.filter((i) => i.id !== slide.id);
    for (let index = 0; index < this.slides.length; index++) {
      this.slides[index].id = index + 1;
    }

    if (!this.slides.length) {
      this.slides.push(new Slide({ id: 1 }));
    }

    this.selected = this.slides[0];
  }

  onAdd(index?: number) {
    index = index || this.slides.length;
    const slide = new Slide({ id: index + 1 });
    this.slides.push(slide);
    this.selected = slide;
  }

  onDocAdd(doc: Doc) {
    this.selected.description = `${this.selected.description}<div><img class="thumbnail" src="${doc.url}"></div>`;
  }

}
