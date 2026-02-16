import { Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { Action } from 'src/lib/oa/core/structures';
import { GenericDialogComponent } from '../../dialogs/generic-dialog/generic-dialog.component';
import { DialogOptions } from '../../models/dialog-options.model';

@Component({
  selector: 'oa-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent implements OnInit, OnChanges {

  @Input()
  options: DialogOptions | any;

  @Input()
  trigger: Action;

  @Input()
  title: string;

  @ViewChild('bodyTemplate')
  bodyTemplate: TemplateRef<any>;

  @Input()
  view: string;

  @Input()
  actions: Action[] = [];

  show = false;

  dialogRef: MatDialogRef<GenericDialogComponent, any>;

  constructor(
    public dialog: MatDialog
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.show) {
      if (this.view === 'modal') {
        if (this.show) {
          this.openDialog()
        } else {
          this.closeDialog();
        }
      }
    }
  }

  ngOnInit(): void {
    this.options = this.options && this.options instanceof DialogOptions
      ? this.options
      : new DialogOptions(this.options);

    if (!this.options) { this.options = new DialogOptions() }

    if (this.trigger && !(this.trigger instanceof Action)) {
      this.trigger = new Action(this.trigger);
    }

    if (!this.trigger) { this.trigger = this.options.trigger; }

    if (this.trigger) {
      this.trigger.event = () => {
        this.show = !this.show;
        if (this.view === 'modal') {
          if (this.show) {
            this.openDialog()
          } else {
            this.closeDialog();
          }
        }
      }
    }

    if (this.actions) {
      this.actions = (this.actions || []).map((a => {
        if (a instanceof Action) {
          return new Action(a);
        } else {
          return a
        }
      }))
    } else {
      this.actions = this.options.actions;
    }

    if (!this.view) { this.view = this.options.view; }

    this.title = this.title || this.options.title;
  }


  openDialog() {
    this.dialogRef = this.dialog.open(GenericDialogComponent);

    const instance = this.dialogRef.componentInstance;
    instance.title = this.title;
    instance.actions = this.actions.map(a => {
      const event = a.event;
      a.event = () => {
        if (event) {
          event();
        }
        this.dialogRef.close();
      }

      return a;
    });


    instance.bodyTemplate = this.bodyTemplate;

    this.dialogRef.afterClosed().subscribe(result => {
      // console.log(`Dialog result: ${result}`);
    });
  }

  closeDialog() {
    if (this.dialogRef) {
      this.dialogRef.close()
    }
  }
}

