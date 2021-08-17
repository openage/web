import { AfterViewInit, Component, TemplateRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from '../../lib/oa/core/components/layout/layout.component';
import { PageBaseComponent } from '../../lib/oa/core/components/page-base.component';
import { Logger } from '../../lib/oa/core/models';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  standalone: true,
  imports: [
    RouterOutlet,
    LayoutComponent
  ]
})
export class LandingComponent extends PageBaseComponent implements AfterViewInit {

  logger = new Logger(LandingComponent);

  // @ViewChild('htmlComponent')
  // htmlComponent?: TemplateRef<any>;

  // @ViewChild('videoComponent')
  // videoComponent?: TemplateRef<any>;

  // @ViewChild('summaryComponent')
  // summaryComponent?: TemplateRef<any>;

  constructor(
  ) {
    super();
    const log = this.logger.get('constructor');
    log.end();
  }

  ngAfterViewInit(): void {
    // this.addTemplate('html', this.htmlComponent)
    // this.addTemplate('video', this.videoComponent)
    // this.addTemplate('summary', this.summaryComponent)
  }


  override setContext(items: any[]): void | any[] {
  }
}
