import { Pipe, PipeTransform } from '@angular/core';
import { Logger } from '../core/models';
import { ContextService } from '../core/services/context.service';
import moment from 'moment';
import { TitleCasePipe } from '@angular/common';
import { Profile } from '../core/models/profile.model';
import { ContentService } from '../core/services/content.service';

@Pipe({
  name: 'format',
  standalone: true
})
export class FormatPipe implements PipeTransform {

  logger: Logger;
  constructor(private content: ContentService) {
    this.logger = new Logger(FormatPipe);
  }

  transform(value: any, args?: any): any {
    return this.content.transform(value, args);
  }
}
