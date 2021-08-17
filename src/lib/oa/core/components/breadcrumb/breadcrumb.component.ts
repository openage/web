import { Component, Input, OnInit } from '@angular/core';
import { ContextService } from '../../services/context.service';
import { NavService } from '../../services/nav.service';
import { Link } from '../../models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'page-breadcrumb',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  breadcrumb: Link[] = [];

  @Input()
  options?: any;

  constructor(
    public context: ContextService,
    public navService: NavService
  ) {
    this.context.page.changes.subscribe((page) => {

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
    (this.breadcrumb.length > 1)
    this.navService.setPage(this.breadcrumb[1]);
  }

  ngOnInit(): void {
  }

}
