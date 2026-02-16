import { Component, Input, OnInit } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { Entity } from '../../core/models';
import { UxService } from '../../core/services/ux.service';


@Component({
  selector: 'oa-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.css']
})
export class ShareComponent implements OnInit {

  @Input()
  modes?: any[]
  // modes?: {
  //   name?: string;
  //   icon?: string;
  //   redirectTo?: string;
  // }[];

  @Input()
  members: any[] = [];

  @Input()
  entity?: Entity;

  @Input()
  options: any = {};

  // @Input()
  // options: {
  //   phone?: string,
  //   copy?: {
  //     template: string,
  //     query?: any
  //   },
  //   redirect?: {
  //     template: string,
  //     content: {
  //       url: string
  //     },
  //     query?: any
  //   },
  //   email?: {
  //     template?: string,
  //     subject?: string,
  //     data?: any
  //     attachments?: {
  //       filename: string,
  //       url: string,
  //       mimeType: string
  //     }[]
  //   }
  // }

  @Input()
  api?: DataService;

  // @Input()
  // url: {
  //   code?: string;
  //   addOn?: string;
  // };

  showList: boolean = false;

  // aka: Aka
  defaultModes: any[] = [
    { code: 'copy', name: 'Copy', icon: 'copy', redirectTo: '' },
    { code: 'whatsapp', name: 'Whatsapp', icon: 'whatsapp', redirectTo: 'https://api.whatsapp.com/send' },
    { code: 'email', name: 'Email', icon: 'email', redirectTo: '' },
    { code: 'fb', name: 'Facebook', icon: 'fb', redirectTo: '' },
    { code: 'sms', name: 'SMS', icon: 'sms', redirectTo: '' },
    { code: 'slack', name: 'Slack', icon: 'slack', redirectTo: 'https://app.slack.com/client' },
    { code: 'chat', name: 'Google Chat', icon: 'chat', redirectTo: '' },
    { code: 'teams', name: 'MS Teams', icon: 'teams', redirectTo: '' }
  ]

  constructor(
    public uxService: UxService,
  ) { }

  ngOnInit(): void {
    this.options = this.options || { email: {} }

    if (!this.modes || !this.modes.length) {
      this.modes = this.defaultModes
    } else {
      this.modes = (this.modes as any[]).map(m => {
        const mode = this.defaultModes.find(dm => dm.name.toLowerCase() === m)
        if (mode) { return m = mode }
      })
    }

    if (!this.api) {

      this.api = new DataService().init(this.options.api || {
        service: 'discovery',
        collection: 'akas'
      })
    }
  }

  onSelect(mode: any) {
    switch (mode.name.toLowerCase()) {
      case 'email':
        this.sendEmail()
        break;
      case 'copy':
        this.createAka(this.options.copy, mode)
        break;
      case 'slack':
      case 'whatsapp':
        this.createAka(this.options.redirect, mode)
        break;
      default:
        break;
    }
  }

  sendEmail() {
    // const dialogRef = this.dialog.open(MessageComposerDialogComponent, {
    //   width: '800px'
    // });
    // dialogRef.componentInstance.to = this.members && this.members.length ? this.members.map((member) => member.user.email) : [];
    // dialogRef.componentInstance.conversation = this.entity ? new Conversation({ entity: this.entity }) : null;
    // dialogRef.componentInstance.modes = { sms: false, email: true, push: false, chat: false };

    // dialogRef.componentInstance.attachments = this.options.email.attachments || []
    // dialogRef.componentInstance.message.subject = this.options.email.subject
    // dialogRef.componentInstance.template = this.options.email.template;
    // dialogRef.componentInstance.data = this.options.email.data

    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result && result.id) {
    //     this.uxService.showMessage('Message Sent', { type: 'success' })
    //   }
    // });
  }

  createAka(model: any, mode: any) {
    this.api?.create(model).then(data => {
      if (!data) {
        this.uxService.showMessage('Copy Failed', { type: 'error' })
        return;
      }

      navigator.clipboard.writeText(data.url);
      this.uxService.showMessage('Link Copied', { type: 'success' })
      if (!mode.redirectTo) { return }

      setTimeout(() => {
        const url = this.getRedirectionUrl(mode, data)
        window.open(url, '_blank')
      }, 700)
    })
  }

  getRedirectionUrl(mode: any, data: any) {
    const redirectUrl = mode.redirectTo
    let query

    switch (mode.name.toLowerCase()) {
      case 'whatsapp':
        query = `?text=${data.url}`
        if (this.options.phone) {
          query = `${query}&phone=${this.options.phone}`
        }
        break;
      default:
        break;
    }

    return query ? redirectUrl + query : redirectUrl
  }
}
