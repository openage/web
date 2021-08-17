import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'oa-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements OnInit {

  @Input()
  view: 'pill' | 'circle' | 'bar' = 'pill';

  @Input()
  value: number;

  @Input()
  total: number;

  @Input()
  type: 'effort';

  @Input()
  size: number = 30;

  @Input()
  content: 'percentage' | 'total' | 'default' = 'default';

  progress: number = 0
  progressContent: any

  constructor() { }

  ngOnInit(): void {
    // if (this.view !== 'progress') return;

    this.getProgress()
    this.setContent()
  }

  getProgress() {
    if (!this.total) return

    this.value = this.value || 0
    this.progress = Math.floor((this.value / this.total) * 100)
  }

  setContent() {
    switch (this.content) {
      case 'percentage':
        this.progressContent = `${this.progress}%`
        break;
      case 'total':
        this.progressContent = this.total || '0'
        break;
      default:
        this.progressContent = `${this.value || '0'}/${this.total || '0'}`
        break;
    }
  }

}
