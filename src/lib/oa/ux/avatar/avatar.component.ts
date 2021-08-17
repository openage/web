import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Pic, User } from '../../core/models';
import { Profile } from '../../core/models/profile.model';
import { ContentService } from '../../core/services/content.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { AvatarModule } from 'ngx-avatars';

@Component({
  selector: 'oa-avatar',
  standalone: true,
  imports: [
    TooltipDirective,
    TitleCasePipe,
    AvatarModule,
    CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnInit, OnChanges {

  @Input()
  view: 'text' | 'avatar' | 'pic' | 'selectable' = 'avatar';

  @Input()
  value: string | User | Profile | Pic | any;

  @Input()
  default?: string;

  @Input()
  pic?: Pic;

  @Input()
  text?: string;

  @Input()
  user?: User;

  @Input()
  url?: string;

  @Input()
  profile?: Profile;

  @Input()
  type: 'micro' | 'button' | 'thumbnail' | 'box' | 'large' = 'button';

  @Input()
  shape: 'square' | 'round' = 'round';

  @Input()
  size: string | number = 30;

  @Input()
  border = 'var(--default)';

  @Input()
  color = 'var(--default)';

  @Output()
  click: EventEmitter<any> = new EventEmitter();

  @Input()
  style: any;

  @Input()
  selected = false;

  constructor(
    public content: ContentService
  ) { }

  ngOnChanges() {
    this.ngOnInit();
  }

  ngOnInit() {

    if (this.value) {
      if (typeof this.value === 'string') {
        if (this.value.startsWith('http') || this.value.startsWith('/')) {
          this.url = this.value;
        } else {
          this.text = this.value;
        }
      } else if (this.value instanceof Profile || this.value.pic || this.value.firstName) {
        this.profile = this.value;
      } else if (this.value instanceof User || this.value.profile) {
        this.user = this.value;
      } if (this.value instanceof Pic || this.value.url || this.value.thumbnail) {
        this.pic = this.value;
      }
    } else if (this.default) {
      if (this.default.startsWith('http') || this.default.startsWith('/')) {
        this.url = this.default;
      } else {
        this.text = this.default;
      }
    } else {
      this.text = '+';
    }

    if (!this.profile && this.user && this.user.profile) {
      this.profile = this.user.profile;
    }

    if (this.profile && this.profile.pic && this.profile.pic.url) {
      this.pic = this.profile.pic;
    }

    if (this.pic) {
      this.view = 'pic';
    } else {
      if (this.profile) {
        if (this.profile.firstName) {
          this.text = this.profile.firstName;
          if (this.profile.lastName && this.text.indexOf(this.profile.lastName) === -1) {
            this.text = `${this.text} ${this.profile.lastName}`;
          }
        }
      }
      if (!this.text && this.user) {
        this.text = this.user.code || this.user.email || this.user.phone;
      }
    }

    this.style = {
    };

    if (this.border && this.border !== 'none') {
      this.style['border'] = `1px solid ${this.border}`;
    }

    if (this.color) {
      this.style['color'] = this.color;
      this.style['backgroundColor'] = '#ffffff';
    }

    if (typeof this.size === 'string') {
      switch (this.size) {
        case 'xxx-sm':
          this.size = 4;
          break;
        case 'xx-sm':
          this.size = 8;
          break;
        case 'x-sm':
          this.size = 16;
          break;

        case 'sm':
          this.size = 20;
          break;

        case 'lg':
          this.size = 32;
          break;

        case 'x-lg':
          this.size = 64;
          break;

        case 'xx-lg':
          this.size = 128;
          break;
        case 'xxx-lg':
          this.size = 256;
          break;

        default:
          this.size = 24;
          break;
      }
    }


    if (!this.size && this.type) {

      switch (this.type) {
        case 'micro':
          this.size = 16;
          break;

        case 'button':
          this.size = 24;
          break;

        case 'thumbnail':
          this.size = 32;
          break;

        case 'large':
          this.size = 64;
          break;

        case 'box':
          this.size = 128;
          break;
      }
    }




    switch (this.view) {
      case 'pic':
        this.style['background-image'] = `url("${this.pic?.url}")`;
        this.style['background-repeat'] = 'no-repeat';

        this.style['background-size'] = 'cover';
        this.style['height'] = `${this.size}px`;
        this.style['width'] = `${this.size}px`;
        break;
    }

    switch (this.shape) {
      case 'round':
        this.style['borderRadius'] = `50%`;
        break;
    }

    // switch (this.size) {
    //   default:
    //     this.picSize = 40;
    //     break;
    // }
  }

  onClick() {
    this.selected = true;
    this.click.emit();
  }



}
