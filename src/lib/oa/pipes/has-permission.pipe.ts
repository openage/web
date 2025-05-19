import { Pipe, PipeTransform } from '@angular/core';

import { ContextService } from '../core/services/context.service';
import { Logger } from '../core/models';

@Pipe({
    name: 'hasPermission',
    pure: true,
    standalone: false
})
export class HasPermissionPipe implements PipeTransform {

  logger: Logger;
  constructor(private auth: ContextService) {
    this.logger = new Logger('HasPermissionPipe');
  }


  public transform(items: any, args?: any) {
    const logger = this.logger.get('transform');
    if (!items || !items.length) { return items; }

    return (items || []).filter((i: any) => {
      return !i.permissions || this.auth.hasPermission(i.permissions)
    })
  }

}
