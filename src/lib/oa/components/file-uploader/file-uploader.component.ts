import { Component, Input, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { IUploader } from 'src/lib/oa/core/services/uploader.interface';

@Component({
  selector: 'shared-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css']
})
export class FileUploaderComponent implements OnInit {

  @Input()
  name: string;

  @Input()
  samples: { name: string, mapper?: string, url: string }[];

  @Input()
  mappers: { name: string, value: string }[];

  @Input()
  selectedMapper = { format: 'default' };

  @Input()
  options: any;

  @Input()
  uploader: IUploader;

  @Input()
  errorMessage: string;

  file: File;
  isDisabled = false;

  constructor(
  ) { }

  ngOnInit() {
    this.samples = this.samples || this.options.templates || [];
  }

  onSelect($event) {
    const files = $event.srcElement.files;
    this.file = files && files.length ? files[0] : null;
    this.errorMessage = ''
  }

  upload() {
    this.isDisabled = true;

    const subject = new Subject<string>();

    const options = this.options || {};
    options.path = options.path || 'bulk';
    options.queryParams = options.queryParams || {};
    options.queryParams.format = options.queryParams.format || this.selectedMapper.format;

    this.uploader.upload(this.file, options.path, options.queryParams).subscribe((message) => {
      this.isDisabled = false;
      subject.next(message);
    }, (err) => {
      this.errorMessage = err;
      this.isDisabled = false;
      subject.error(err);
    });

    return subject.asObservable();
  }

}
