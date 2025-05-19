import { Component, OnInit } from '@angular/core';
import { Logger } from '../../models';
import { ContextService } from '../../services/context.service';
import { RouterModule } from '@angular/router';

import { LayoutComponent } from "../layout/layout.component";
import { ConstantService } from '../../services/constant.service';

@Component({
  selector: 'page-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [
    RouterModule,
    LayoutComponent
  ]
})
export class FooterComponent implements OnInit {
  isProcessing = false;

  _logger: Logger = new Logger('FooterComponent');

  layout?: any;
  components: any = [];
  templates: any = {};
  data: any = {};

  constructor(
    public context: ContextService,
    public constant: ConstantService,
  ) {
  }

  ngOnInit() {
    const logger = this._logger.get('ngOnInit');
    const footer = this.context.getPageMeta('footer');
    if (footer) {
      this.layout = footer.layout;
      this.constant.populate(footer.data).then((data) => {
        this.data = data;
      })
      this.components = footer.components;
    }
  }
}
