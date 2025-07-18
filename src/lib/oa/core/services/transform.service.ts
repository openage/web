import { inject, Injectable } from '@angular/core';
import { TransformRegistry } from '../../../../plugins/transforms/transform.registry';

@Injectable({
  providedIn: 'root'
})
export class TransformService {

  transformRegistry = inject(TransformRegistry);

  apply(data: any, transforms: any): any {

    if (!transforms?.length) {
      return data;
    }

    for (const transform of transforms) {
      const plugin = this.transformRegistry.getPlugin(transform.type);
      data = plugin.transform(data, transform.config);
    }

    return data;
  }
}



