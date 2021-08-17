/* eslint-disable no-prototype-builtins */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { IconComponent } from "../icon/icon.component";

@Component({
  selector: 'processing-indicator',
  templateUrl: './processing-indicator.component.html',
  styleUrls: ['./processing-indicator.component.scss'],
  standalone: true,
  imports: [CommonModule, IconComponent]
})
export class ProcessingIndicatorComponent implements OnInit, OnChanges {

  @Input()
  inline = false;

  @Input()
  view: 'bars' | 'spinner' | 'progress-bar' | 'spinball' | 'stepper' | 'download-indicator' | 'spinner-withBackground' = 'bars';

  @Input()
  progressBarMode: 'determinate' | 'indeterminate' | 'buffer' | 'query' = 'buffer';

  @Input()
  progressBarBufferValue = 0;

  @Input()
  progressBarvalue = 0;

  @Input()
  progressTaskId?: string;

  @Input()
  progressError?: string;

  @Input()
  diameter: number = 100

  @Input()
  steps: {
    label: string,
    status: string,   // default, active, completed
    rightBar?: boolean,
    style: string
  }[] | any

  @Input()
  currentStep?: number | string;

  @Output()
  done: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  error: EventEmitter<boolean> = new EventEmitter<boolean>();

  type?: string;

  constructor(
  ) { }

  ngOnInit() {
    this.type = `${this.inline ? 'inline' : 'cover'}-${this.view}`;
    if (this.type === 'stepper') {
      this.steps.forEach((step: any, i: any) => {
        if (i === 0) { step.rightBar = false; }
      })
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.type = `${this.inline ? 'inline' : 'cover'}-${this.view}`;
    if (this.progressTaskId) {
      this.checkProgress();
    }
    if (this.currentStep && changes.hasOwnProperty('currentStep')) {
      this.next();
    }
  }

  checkProgress() {
    // const new_this = this;
    // this.taskService.get(this.progressTaskId).subscribe((task:any) => {
    //   if (task.status === 'complete') {
    //     this.progressBarvalue = task.progress;
    //     this.done.emit(true);
    //   } else if (task.status === 'errored') {
    //     this.progressBarvalue = task.progress;
    //     this.progressError = task.error;
    //   } else {
    //     this.progressBarvalue = task.progress;
    //     setTimeout(() => { this.checkProgress(); }, 1000);
    //   }
    // }, (err:any) => {
    //   this.error.emit(true);
    // });
  }

  next() {
    if (this.currentStep === 'completed') {
      this.steps.forEach((step: any) => {
        step.status = 'completed';
        step.rightBar = true;
      })
      return
    }

    const currentIndex = this.steps.findIndex((step: any) => step.label === this.currentStep);
    if (this.steps[currentIndex]) {
      this.steps[currentIndex].status = 'active';
    }

    this.steps.forEach((step: any, i: any) => {
      if (i < currentIndex) {
        step.status = 'completed';
        step.rightBar = true;
      }
    })

  }
}
