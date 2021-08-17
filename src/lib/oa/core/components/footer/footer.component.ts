import { Component, OnInit } from '@angular/core';
import { Logger } from '../../models';
import { ContextService } from '../../services/context.service';
import { NotFoundComponent } from '../../../ux/not-found/not-found.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from "../layout/layout.component";
import { ConstantService } from '../../services/constant.service';

@Component({
  selector: 'page-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  imports: [
    NotFoundComponent,
    RouterModule,
    CommonModule,
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
