import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Doc } from 'src/lib/oa/drive/models';

@Component({
  selector: 'app-show-carousel',
  templateUrl: './show-carousel.component.html',
  styleUrls: ['./show-carousel.component.css']
})
export class ShowCarouselComponent implements OnInit, OnChanges {

  @Input()
  files: Doc[];

  selectedFile: Doc;

  constructor(
  ) { }

  ngOnInit() {
    if (this.files && this.files.length) {
      this.getDefaultSelectedFile();
    }
  }

  ngOnChanges() {
    if (this.files && this.files.length) {
      this.getDefaultSelectedFile();
    }
  }

  getDefaultSelectedFile() {
    this.selectedFile = this.files[0];
  }

  next() {
    const index = this.files.findIndex((file) => file.id === this.selectedFile.id);

    if (index > -1) {
      if (index >= this.files.length - 1) {
        this.selectedFile = this.files[0];
      } else {
        this.selectedFile = this.files[index + 1];
      }
    }
  }

  previous() {
    const index = this.files.findIndex((file) => file.id === this.selectedFile.id);

    if (index > -1) {
      if (index === 0) {
        const lastIndex = this.files.length - 1;
        this.selectedFile = this.files[lastIndex];
      } else {
        this.selectedFile = this.files[index - 1];
      }
    }
  }

  onDotClick(index) {
    this.selectedFile = this.files[index];
  }
}
