/* eslint-disable @angular-eslint/use-lifecycle-interface */
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { Progress } from '../../models/progress.model';
import { ContextService } from '../../services/context.service';
import { UxService } from '../../services/ux.service';
import { AuthService } from '../../services';
import { NavService } from '../../services/nav.service';
import { IconComponent } from '../../../ux/icon/icon.component';
import { TogglerComponent } from '../../../ux/toggler/toggler.component';
import { DataService } from '../../services/data.service';
import { ProcessingIndicatorComponent } from "../../../ux/processing-indicator/processing-indicator.component";
@Component({
    selector: 'oa-core-tasks-progress-footer',
    imports: [
        IconComponent, TogglerComponent,
        ProcessingIndicatorComponent
    ],
    templateUrl: './tasks-progress-footer.component.html',
    styleUrls: ['./tasks-progress-footer.component.css']
})
export class TasksProgressFooterComponent implements OnInit {

  @Input()
  items: Progress[] = []

  isHidden: boolean = false
  isIntervalSet: boolean = false
  data?: Subscription;
  timeOut: any;

  completeCount: number = 0
  inProgressCount: number = 0
  erroredCount: number = 0

  constructor(
    public context: ContextService,
    public uxService: UxService,
    public http: HttpClient,
    public auth: AuthService,
    private navService: NavService,
    private dataService: DataService
  ) {
    this.items = this.items || []

    this.data = this.context.tasks.changes.subscribe((tasks: any) => {
      this.items = tasks;
      tasks.type = tasks.type || 'upload';
      this.items.unshift(tasks);
      this.setCount()
      if (!this.isIntervalSet) {
        this.get()
      }
      // for (const task of tasks) {
      //   if(task.url) {

      //   }
      // }
    });
    // handleItemProgress(item: any) {
    //   const url = this.context.currentApplication()?.getService(item.api.code)?.url
    //   item.url = `${url}/${item.api.service}/${item.id}`
    //   item.code = item.id

    //   return this._progressItem.next(item);
    // }

    // this.data = this.uxService.progressItem.subscribe((item: any) => {
    //   // console.log("1..........", this.items.length)
    //   item.type = item.type || 'upload';

    //   this.items.unshift(item);
    //   this.setCount()
    //   if (!this.isIntervalSet) { this.get() }
    // });

  }

  ngOnInit(): void { }

  ngOnDestroy() {
    this.clear()
    this.data?.unsubscribe();
  }

  get() {
    this.timeOut = setInterval(() => {
      this.isIntervalSet = true
      if (!this.getInProgressItems().items.length) return

      this.getCurrentProgress()
    }, 4000)
  }

  /**
   *
   * @returns --array (filter list of in-progress items)
   */
  getInProgressItems() {
    const items = this.items.filter(item => (item.status === 'new') || (item.status === 'in-progress') || (item.status === 'queued'))
    if (!items.length) {
      this.isIntervalSet = false;
      clearInterval(this.timeOut)
    }

    return { items }
  }

  /**
   *  --get current progress of each in-progess/queued items
   */
  getCurrentProgress() {
    const observables = [];

    for (const item of this.items) {
      if (item.url) {
        observables.push(
          this.http.get(item.url, { headers: this.context.getApiHeaders() }).pipe(first())
        )
      }
    }



    forkJoin(observables).subscribe((responses: any) => {
      if (!responses || !responses.length) {
        return;
      }
      this.setItems(responses)
      this.resetCount();
      this.setCount();
    }, (err) => { });
  }

  setItems(responses: any[]) {
    const downloads = []
    const uploads = []


    for (const response of responses) {
      const data = response.data;
      const item = this.items.find(item => item.id === data.id)

      if (!item) {
        continue;
      }
      item.value = data.value
      item.status = data.status;

      if (item.type === 'download' || item.type === 'upload' && item.status === 'ready') {
        downloads.push(response.data) || uploads.push(response.data)
      }
    }

    if (downloads.length) { this.download(downloads, 0) } //downloadable items
    if (uploads.length) { this.upload(downloads, 0) } //uploadable items
  }

  /**
   * ---set count of errored/complete/inProgress items
   */
  setCount() {
    this.erroredCount = this.items.filter(item => item.status === 'errored').length;
    this.completeCount = this.items.filter(item => item.status === 'complete' || item.status === 'ready').length;
    this.inProgressCount = this.items.filter(item => (item.status === 'new') || (item.status === 'queued') || (item.status === 'in-progress')).length;
  }

  resetCount() {
    this.completeCount = 0
    this.inProgressCount = 0
    this.erroredCount = 0
  }

  onSelect(item: Progress) {
    if (item.status !== 'complete' || !item.redirect || !item.redirect.url) return

    item.redirect.type = item.redirect.type || 'navigate'
    switch (item.redirect.type) {
      case 'navigate':
        this.navService.goto(item.redirect.url, {}, { newTab: true });
        break;
      case 'open':
        window.open(item.redirect.url, '_blank')
        break
      default:
        break
    }
  }

  /**
   * @param items --downloadable items
   * @param i --index
   */
  download(items: Progress[], i: number) {
    const item = items[i];
    if (item?.url) {
      this.uxService.download(item.url, item?.type?.code)
    }


    if (i < items.length - 1) {
      setTimeout(() => {
        this.download(items, i + 1)
      }, 500)
    }
  }
  upload(items: Progress[], i: number) {
    const item = items[i];
    if (item?.url) {
      this.dataService.upload(item?.type, item?.type?.code)
    }


    if (i < items.length - 1) {
      setTimeout(() => {
        this.upload(items, i + 1)
      }, 500)
    }
  }


  clear() {
    this.items = [];
    this.resetCount();
    this.isIntervalSet = false;
    clearInterval(this.timeOut);
  }
}
