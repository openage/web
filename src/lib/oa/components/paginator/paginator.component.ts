import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';


@Component({
  selector: 'app-paginator',
  standalone: true,
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.css'],
})
export class PaginatorComponent implements OnInit, OnChanges {

  @Input()
  view: 'pager-bar' | 'mini' | 'next' | 'previous' = 'pager-bar';

  @Input()
  title?: string;

  @Input()
  total?: number;

  @Input()
  size = 10;

  @Input()
  fetchByLimit = true;

  @Input()
  pager: any;

  @Input()
  showFirstLast = false;

  @Input()
  maxPagesToShow = 10;

  @Output()
  change: EventEmitter<number> = new EventEmitter();

  pages?: number[];

  constructor(
    // private cache: LocalStorageService
  ) { }

  ngOnInit() {
    this.init();
    // if (this.fetchByLimit) {
    //   if (this.cache.components('oa|paginator').get('limit')) {
    //     this.size = this.cache.components('oa|paginator').get('limit');
    //   } else {
    //     this.cache.components('oa|paginator').set('limit', this.size);
    //   }
    // }
  }

  ngOnChanges() {
    this.init();
  }

  init() {

    if (this.pager.currentPageNo < 1) {
      this.pager.currentPageNo = 1;
    } else if (this.pager.currentPageNo > this.pager.totalPages) {
      this.pager.currentPageNo = this.pager.totalPages;
    }
    this.calculatePages();
  }

  calculatePages() {
    let index: number;

    const pageNos: number[] = [];

    let firstPage = 1;

    let lastPage = this.pager.totalPages;

    if (this.pager.totalPages > this.maxPagesToShow) {
      if (this.pager.currentPageNo < this.maxPagesToShow) {
        lastPage = this.maxPagesToShow;
      } else if (this.pager.currentPageNo > (this.pager.totalPages - this.maxPagesToShow)) {
        firstPage = this.pager.totalPages - this.maxPagesToShow;
      } else {
        firstPage = this.pager.currentPageNo - this.maxPagesToShow / 2;
        if (firstPage < 1) { firstPage = 1; }
        lastPage = this.pager.currentPageNo + this.maxPagesToShow / 2;
        if (lastPage > this.pager.totalPages) { lastPage = this.pager.totalPages; }
      }
    }

    if (firstPage !== 1) {
      pageNos.push(-2);
    }

    for (index = firstPage; index <= lastPage; index++) {
      pageNos.push(index);
    }

    if (pageNos.length === 0) {
      pageNos.push(1);
    }

    if (lastPage !== this.pager.totalPages) {
      pageNos.push(-1);
    }

    // create an array of pages to ng-repeat in the pager control
    this.pages = pageNos;
  }

  showPage(no: number) {

    if (no === -2) {
      no = 1;
    } else if (no === -1) {
      no = this.pager.totalPages;
    }

    const result = this.pager.showPage(no);
    if (!result) { return; }
    result.subscribe(() => {
      this.calculatePages();
      this.change.next(no);
    });
  }

  setPageItems(no: number) {
    const result = this.pager.showItems(no);
    if (!result) { return; }
    result.subscribe(() => {
      this.calculatePages();
      // this.cache.components('oa|paginator').set('limit', no);
    });
  }

}
