import { Component, effect, inject, Input, OnInit } from '@angular/core';
import { ContextService } from '../../services/context.service';
import { NavService } from '../../services/nav.service';
import { Link } from '../../models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'page-breadcrumb',
  imports: [RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  breadcrumb: Link[] = [];

  @Input()
  options?: any;

  context = inject(ContextService);
  navService = inject(NavService);

  constructor() {

    effect(() => {
      const page = this.context.page();
      this.breadcrumb = [];

      const addLink = (p: Link) => {
        if (p.parent) {
          addLink(p.parent);
        }
        this.breadcrumb.push(p);
      }

      if (page) {
        addLink(page);
        this.context.title.set(page.title);
      }
    });
  }

  back() {
    if (this.breadcrumb.length > 1) {
      this.navService.setPage(this.breadcrumb[1]);
    } else {
      this.navService.goto('home')
    }
  }

  ngOnInit(): void {
  }

}
