import { Component, HostListener, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Subscription } from 'rxjs/internal/Subscription';
import { Conversation } from 'src/lib/oa/send-it/models';
import { TaskListComponent } from 'src/lib/oa-ng/gateway/task-list/task-list.component';
import { JournalListComponent } from 'src/lib/oa-ng/insight/journal-list/journal-list.component';
import { TagDetailComponent } from 'src/lib/oa-ng/insight/tag-detail/tag-detail.component';
import { MessageComposerDialogComponent } from 'src/lib/oa-ng/send-it/message-composer-dialog/message-composer-dialog.component';
import { Member, Task } from 'src/lib/oa/gateway/models';
import { TaskService } from 'src/lib/oa/gateway/services';
import { TagService } from 'src/lib/oa/insight/services/tag.service';
import { Entity, IUser } from 'src/lib/oa/core/models';
import { LocalStorageService } from 'src/lib/oa/core/services/local-storage.service';
import { UxService } from '../../services/ux.service';
import { MatDrawerMode } from '@angular/material/sidenav';

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild('taskList')
  taskList: TaskListComponent;

  @ViewChild('activityList')
  activityList: JournalListComponent;

  @ViewChild('chipsDetail')
  chipsDetail: TagDetailComponent;


  @Input()
  entity: Entity;
  conversation: Conversation;

  section: 'files' | 'communication' | 'tasks' = 'communication';

  mode: MatDrawerMode = 'side';

  opened = false;

  task: Task;

  memberByRoles: any = [];

  roleArray: any[] = [];

  journalEntity: Entity;

  membersSection: boolean;
  messagesSection: boolean;
  activitiesSection: boolean;
  tasksSection: boolean;
  infoSection: boolean;
  helpSection: boolean;
  tagSection: boolean;
  tagSectionAdd: boolean;
  selectedType = '';
  setField: string;
  icons: any[] = [{
    icon: 'create',
    label: 'Created'
  }, {
    icon: 'update',
    label: 'Updated'
  }, {
    icon: 'delete',
    label: 'Deleted'
  }, {
    icon: 'view_list',
    label: 'View'
  }, {
    icon: 'person',
    label: 'Assignee'
  }];

  sections = [{
    code: 'members',
    name: 'Members',
    isSelected: true,
    show: true
  }, {
    code: 'tasks',
    name: 'Tasks',
    isSelected: true,
    show: true
  }, {
    code: 'notes',
    name: 'Notes',
    isSelected: true,
    show: true
  }, {
    code: 'tags',
    name: 'Tags',
    isSelected: true,
    show: true
  }, {
    code: 'activities',
    name: 'Activities',
    isSelected: true,
    show: true
  }, {
    code: 'info',
    name: 'Info',
    isSelected: false,
    show: false
  }, {
    code: 'help',
    name: 'Help',
    isSelected: false,
    show: false
  }];

  sectionList: string[] = ['members', 'tasks', 'notes', 'activities'];

  scrolled = false;
  selectedIndex: number;

  isInitialized = false;

  entitySubscription: Subscription;

  constructor(
    private uxService: UxService,
    private taskService: TaskService,
    private cache: LocalStorageService,
    public dialog: MatDialog,
    private tagService: TagService
  ) {
    this.opened = !!this.cache.components('core|side-bar').get('opened');
    this.entitySubscription = this.uxService.entityChanges.subscribe((item) => {
      this.entity = item;
      this.init();
    });

    this.uxService.deviceChanges.subscribe((device) => {
      if (device === 'desktop') {
        this.mode = 'side';
      } else {
        this.mode = 'over';
      }
    });
  }

  ngOnInit() {
    this.showSection();
  }

  ngOnChanges(): void {
    this.init();
  }

  init() {
    if (this.entity) {
      this.conversation = new Conversation();
      this.conversation.entity = this.entity;
      if (this.entity.meta && this.entity.meta.chat) {
        this.conversation.config = { chat: this.entity.meta.chat };
      }
      if (!this.entity.entityDetailOnly) {
        this.getTaskByEntity();
        this.checkRoleArray();
      } else {
        this.sections.forEach((section) => {
          if ('notes|tags|activities'.indexOf(section.code) === -1) { section.show = false; }
        });
      }
    } else {
      this.opened = false;
    }
  }

  onFilter(item: any, i: number) {
    this.selectedIndex = i;
    if (item.label === 'Assignee') {
      this.selectedType = 'updated';
      this.setField = 'assignee';
    } else {
      this.setField = '';
      this.selectedType = item.label.toLowerCase();
    }
  }
  onRefreshTasks() {
    this.taskList.onRefresh();
  }
  onRefreshActivities() {
    this.setField = '';
    this.selectedType = '';
    this.selectedIndex = null;
    this.activityList.ngOnChanges();
  }

  checkRoleArray() {
    switch (this.entity.type) {

      default:
        this.roleArray = [];
        break;
    }
  }

  getWorkflowCode() {
    let code;
    if (this.entity) {
      switch (this.entity.type) {
        case 'organization':
          code = 'directory|employees-role';
          break;
      }
      return code;
    }
  }

  getTaskByEntity() {
    const workflowCode = this.getWorkflowCode();
    this.taskService.getByEntity(this.entity, workflowCode).subscribe((item) => {
      this.task = item;
      if (this.task.members && this.task.members.length) {
        this.setMemberRole();
      }
    });
  }

  setMemberRole() {
    this.memberByRoles = [];
    this.roleArray.forEach((role) => {
      this.memberByRoles.push({ roleType: role, members: this.task.members.filter((m) => m.roles.includes(role.code)) });
    });
  }

  onSaveMembers(members: Member[]) {
    this.task.members = members;
    this.taskService.update(this.task.id, { members: this.task.members }).subscribe((item) => {
      this.task = item;
      this.setMemberRole();
    });
  }

  sendEmail($event: Member) {
    const user = $event.user;
    const dialogRef = this.dialog.open(MessageComposerDialogComponent, {
      width: '800px'
    });
    dialogRef.componentInstance.to = [user.email];
    dialogRef.componentInstance.conversation = this.conversation;
    dialogRef.componentInstance.modes = { sms: false, email: true, push: false, chat: false };

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.code) { }
    });
  }

  close() {
    this.opened = false;
    this.cache.components('core|side-bar').set('opened', this.opened);
  }

  open() {
    this.isInitialized = true;
    if (!this.entity.entityDetailOnly) { this.getTaskByEntity(); }
    this.opened = true;
    this.checkSections();
    this.cache.components('core|side-bar').set('opened', this.opened);
  }

  checkSections() {
    if (!this.sections.find((s) => this.sectionList.includes(s.code) && s.isSelected)) {
      this.sections.forEach((section) => {
        if (this.sectionList.includes(section.code)) { section.isSelected = true; }
      });
      this.showSection();
    }
  }

  setSection(section) {
    this.sections.find((s) => s.code === section.code).isSelected = !section.isSelected;
    this.showSection();
    if (section.isSelected) { this.open(); }
    if (!this.sections.find((s) => this.sectionList.includes(s.code) && s.isSelected)) { this.close(); }
  }

  showSection() {
    this.sections.forEach((section) => {
      switch (section.code) {
        case 'members':
          this.membersSection = section.isSelected;
          break;
        case 'notes':
          this.messagesSection = section.isSelected;
          break;
        case 'activities':
          this.activitiesSection = section.isSelected;
          break;
        case 'tasks':
          this.tasksSection = section.isSelected;
          break;
        case 'tags':
          this.tagSection = section.isSelected;
          break;
        case 'info':
          this.infoSection = section.isSelected;
          break;
        case 'help':
          this.helpSection = section.isSelected;
          break;
      }
    });
  }

  addTag(value) {
    const values = (this.chipsDetail.properties.values || []).map((v) => v.code);
    if (values.find((v) => v === value)) {
      this.uxService.handleError('Tag Already Exist');
    } else {
      values.push(value);
    }
    this.tagService.update(`${this.entity.type}:${this.entity.id}`, { values }).subscribe((item) => {
      this.tagSectionAdd = false;
      this.chipsDetail.ngOnInit();
    });
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll($event) {
    this.scrolled = $event.srcElement.scrollTop >= 150;
  }

  ngOnDestroy(): void {
    if (this.entitySubscription) { this.entitySubscription.unsubscribe(); }
  }
}
