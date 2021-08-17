import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../core/services/data.service';
import { UxService } from '../../core/services/ux.service';
import { FormsModule } from '@angular/forms';
import { FileProviderComponent } from "../../components/file-provider/file-provider.component";
import { TasksProgressFooterComponent } from "../../core/components/tasks-progress-footer/tasks-progress-footer.component";
import { ProcessingIndicatorComponent } from "../processing-indicator/processing-indicator.component";
import { IconComponent } from "../icon/icon.component";
import { Router } from '@angular/router';
import { PageBaseComponent } from '../../core/components/page-base.component';

@Component({
  selector: 'oa-document-uploader',
  standalone: true,
  imports: [CommonModule, FormsModule, FileProviderComponent, TasksProgressFooterComponent, ProcessingIndicatorComponent, IconComponent],
  templateUrl: './document-uploader.component.html',
  styleUrl: './document-uploader.component.scss'
})
export class DocumentUploaderComponent extends PageBaseComponent implements OnInit {

  @Input()
  samples: { name: string; mapper?: string; url: string; }[] | undefined;

  isProcessing?: boolean = false;

  @Input()
  mappers: { name: string; value: string; }[] | undefined;



  @Input()
  options: any;

  @Input()
  accept: string[] = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  @Input()
  errorMessage: string | undefined;

  file: File | any;
  isDisabled = false;
  taskId: any
  successMessage: string = '';
  showSuccessDialog: boolean = false;

  constructor(
    private dataService: DataService,
    private uxService: UxService
  ) {super() }

  //  ngOnInit() {
  //   this.samples = this.samples || this.options.templates || [];
  // }

  onFileSelect($event: any) {
    const files = $event.srcElement.files;
    this.file = files && files.length ? files[0] : null;
    this.errorMessage = ''
  }



  uploadFile() {
    const dynamicQuery = { ...this.options?.queryParam };
    for (const key in dynamicQuery) {
      // eslint-disable-next-line no-prototype-builtins
      if (dynamicQuery.hasOwnProperty(key)) {
        let id = dynamicQuery[key];
        if (id.includes(':code')) {
          id = id.replace(/:([a-zA-Z0-9_]+)/g, (_: any, key: string) => this.params(key) || `:${key}`)
        }
        if (id.includes('{{')) {
          id = id.replace(/{{([a-zA-Z0-9_]+)}}/g, (_: any, key: string) => this.params(key) || `{{${key}}}`);
        }
        dynamicQuery[key] = id;
      }
    }
    const dynamicOptions = {
      query: dynamicQuery
    };
    this.dataService.uploadFile(this.file, dynamicOptions).then((res: any) => {
      this.isDisabled = false;
      this.uxService.showMessage("Done");
      this.successMessage = "File upload successful!";
      this.showSuccessDialog = true;
      this.file = null;
      this.isProcessing = false;
    }, (err: any) => {
      this.errorMessage = err;
      this.isProcessing = false;
      this.isDisabled = false;
    });
  }
  
  closeDialog() {
    this.showSuccessDialog = false;
  }
  override setContext(items: any[]): void | any[] {

  }

}

