import { Component } from '@angular/core';
import { ContextService } from '../../lib/oa/core/services/context.service';
import { JsonViewerComponent } from "../../lib/oa/ux/json-viewer/json-viewer.component";
import { NgTemplateOutlet } from '@angular/common';
import { Logger } from '../../lib/oa/core/models';

@Component({
  selector: 'app-debug',
  standalone: true,
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.scss',
  imports: [
    JsonViewerComponent,
    NgTemplateOutlet
  ]
})
export class DebugComponent {

  options = {
    limit: 50,
    sort: { key: true },
    skip: {
      empty: true,
      fields: [
        'parent',
        'timeStamp',
        'createdAt',
        'isEditing',
        'isSelected',
        'isProcessing',
        'isDeleted',
        'isValid'
      ]
    }
  }

  logger = new Logger(DebugComponent);

  constructor(
    public context: ContextService
  ) {
  }
}
