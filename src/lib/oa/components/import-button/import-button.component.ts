import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { IUploader } from 'src/lib/oa/core/services/uploader.interface';
import { ImporterComponent } from '../../dialogs/importer/importer.component';

@Component({
  selector: 'oa-import-button',
  templateUrl: './import-button.component.html',
  styleUrls: ['./import-button.component.css']
})
export class ImportButtonComponent implements OnInit {

  // @Input()
  // view: 'raised' | 'default' = 'default';

  @Input()
  uploader: IUploader;

  @Input()
  options: any;

  @Input()
  styleClass = '';

  @Input()
  selectedMapper: any;

  @Output()
  import: EventEmitter<void> = new EventEmitter();

  @Input()
  title: string;

  @Input()
  message: string; // message to show on the button

  @Input()
  view: 'basic' | 'raised' | 'stroked' | 'flat' | 'icon';

  constructor(
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.options = this.options || {};
    this.title = this.title || this.options.title || 'Import';
  }

  onClick() {
    const dialogRef = this.dialog.open(ImporterComponent, {
      width: '550px',
    });

    const instance = dialogRef.componentInstance;
    instance.title = this.options.title || 'Upload';
    instance.uploader = this.uploader;
    instance.options = this.options;
    instance.selectedMapper = this.selectedMapper;

    dialogRef.afterClosed().subscribe((success) => {
      if (success) {
        this.import.emit();
      }
    });
  }

}
