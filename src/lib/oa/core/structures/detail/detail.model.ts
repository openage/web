import { DetailOptions } from './detail-options.model';
import { DetailBase } from './detail-base.component';
import { Directive } from '@angular/core';
@Directive()
export class DetailModel<TModel> extends DetailBase<TModel> {
  constructor(options: DetailOptions<TModel>) {
    super(options);
  }
}
