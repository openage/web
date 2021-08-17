import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { UxService } from '../../core/services/ux.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from "../../ux/icon/icon.component";


@Component({
  selector: 'oa-icon-file-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './file-provider.component.html',
  styleUrls: ['./file-provider.component.css']
})
export class FileProviderComponent implements OnInit {

  @Input()
  view: 'input' | 'zone' | 'layout' = 'input';

  @Input()
  readonly = false;

  @Input()
  disabled = false;

  @Input()
  accept?: string[];

  @Input()
  value: any;

  @Output()
  change: EventEmitter<File> = new EventEmitter();

  @Input()
  label = '';

  @Input()
  options: any = {};

  inputId: string;

  readyForDrop = false;

  constructor(
    private uxService: UxService
  ) {
    this.inputId = `file-provider-input-${Math.ceil(100 * Math.random())}`;
  }

  ngOnInit() {
    if (!this.view) { this.view = 'input'; }
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      if (event.target.files.length > 1) {
        return this.uxService.showMessage(`select only 1 file`);
      } else {
        this.onSelect(event.target.files[0]);
      }
    }
    return
  }

  onSelect(file: File) {
    let match = false;

    if (this.accept && this.accept.length) {
      if (this.accept.find((i) => i === file.type)) { match = true; } else { match = false; }
    }

    if (!match && this.accept && this.accept.length) {
      return this.uxService.showMessage(`Only ${this.accept.join()} are supported`);
    }

    this.value = file;
    this.change.emit(file);
    return
  }

  @HostListener('dragover', ['$event'])
  onDragOver(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    const items = evt.dataTransfer.items;
    if (items.length > 0) {
      this.readyForDrop = true;
      // do some stuff here
    }
  }

  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.readyForDrop = false;
    // do some stuff
  }

  @HostListener('drop', ['$event'])
  public onDrop(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    const files = evt.dataTransfer.files;
    this.readyForDrop = false;
    if (files.length > 0) {
      if (files.length > 1) {
        return this.uxService.showMessage(`select only 1 file`);
      } else {
        this.onSelect(files[0]);
      }
    }
    return
  }
}
