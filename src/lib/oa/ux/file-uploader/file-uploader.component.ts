
import { Component, Input, OnInit } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { UxService } from '../../core/services/ux.service';
import { FormsModule } from '@angular/forms';
import { FileProviderComponent } from "../../components/file-provider/file-provider.component";
import { TasksProgressFooterComponent } from "../../core/components/tasks-progress-footer/tasks-progress-footer.component";
import { ProcessingIndicatorComponent } from "../processing-indicator/processing-indicator.component";
import { IconComponent } from "../icon/icon.component";

@Component({
  selector: 'oa-file-uploader',
  imports: [
    FormsModule,
    FileProviderComponent,
    ProcessingIndicatorComponent,
    IconComponent],
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.scss']
})
export class FileUploaderComponent implements OnInit {

  @Input()
  samples: { name: string; mapper?: string; url: string; }[] | undefined;

  isProcessing?: boolean = false;

  @Input()
  mappers: { name: string; value: string; }[] | undefined;

  @Input()
  selectedMapper = { format: 'default' };

  @Input()
  options: any;

  @Input()
  accept: string[] = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  @Input()
  errorMessage: string | undefined;

  file: File | any;
  isDisabled = false;
  taskId: any
  constructor(
    private dataService: DataService,
    private uxService: UxService
  ) { }

  ngOnInit() {
    this.samples = this.samples || this.options.templates || [];
  }

  onMapperChange(event: any) {
    this.selectedMapper = event.target.value;
  }

  onFileSelect($event: any) {
    const files = $event.srcElement.files;
    this.file = files && files.length ? files[0] : null;
    this.errorMessage = ''
  }
  successMessage: string = '';
  showSuccessDialog: boolean = false;
  onUpload() {
    if (!this.file) {
      return this.uxService.showMessage("Please select a file", { type: 'error' })
    }
    this.isProcessing = true

    this.errorMessage = undefined;
    this.isDisabled = true;

    this.options = {
      ...this.options,
      status: 'in-progress'
    };

    if (this.selectedMapper) {
      this.options.query = this.selectedMapper
    }

    this.dataService.upload(this.file, this.options).then((res) => {
      this.isDisabled = false;
      this.uxService.showMessage("Done")
      this.successMessage = "Upload successful!";
      this.showSuccessDialog = true;
      this.file = null;
      this.isProcessing = false

    }, (err) => {
      this.errorMessage = err;
      this.isProcessing = false
      this.isDisabled = false;
    })

    return;

  }
  closeDialog() {
    this.showSuccessDialog = false;
  }
}
