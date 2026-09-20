import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Pic, User } from '../../core/models';
import { Profile } from '../../core/models/profile.model';
import { ContentService } from '../../core/services/content.service';
import { TooltipDirective } from '../../directives/tooltip.directive';
import { CommonModule, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'oa-avatar',
  imports: [
    TooltipDirective,
    TitleCasePipe,
    CommonModule
  ],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent implements OnInit, OnChanges {

  tooltipText = '';
  initials = '';

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

  content = inject(ContentService);


  constructor(
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
      }
      if (this.value instanceof Pic || this.value.url || this.value.thumbnail) {
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

    const fullName = this.profile
      ? [this.profile.firstName, this.profile.lastName].filter(Boolean).join(' ').trim() || this.user?.code || this.user?.email || this.text || 'A'
      : this.user?.profile
        ? [this.user.profile.firstName, this.user.profile.lastName].filter(Boolean).join(' ').trim() || this.user?.code || this.user?.email || this.text || 'A'
        : this.user?.code || this.user?.email || this.user?.phone || this.text || 'A';

    this.tooltipText = fullName;
    this.initials = this.getInitials(fullName);

    if (this.pic) {
      this.view = 'pic';
    } else {
      if (this.profile && this.profile.firstName) {
        this.text = this.initials;
      } else if (this.user && !this.text) {
        this.text = this.initials;
      } else if (!this.text) {
        this.text = this.initials || '+';
      }
    }

    this.style = {};

    if (this.border && this.border !== 'none') {
      this.style['border'] = `1px solid ${this.border}`;
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

    if (!this.url && !this.pic) {
      this.style['backgroundColor'] = this.getAvatarBackground(fullName);
      this.style['color'] = '#ffffff';
      this.style['display'] = 'inline-flex';
      this.style['alignItems'] = 'center';
      this.style['justifyContent'] = 'center';
      this.style['fontSize'] = `${Math.max(10, Math.round(Number(this.size) * 0.35))}px`;
      this.style['fontWeight'] = '700';
      this.style['lineHeight'] = '1';
      this.style['height'] = `${this.size}px`;
      this.style['width'] = `${this.size}px`;
      this.style['borderRadius'] = '50%';
      this.style['textTransform'] = 'uppercase';
      this.style['userSelect'] = 'none';
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
  }

  private getInitials(value: string): string {
    const cleanValue = (value || '').trim();
    if (!cleanValue) {
      return '+';
    }

    const segments = cleanValue.split(/\s+/).filter(Boolean);
    if (segments.length === 1) {
      return segments[0].slice(0, 2).toUpperCase();
    }

    return segments.slice(0, 2).map((segment) => segment.charAt(0).toUpperCase()).join('');
  }

  private getAvatarBackground(value: string): string {
    const seed = (value || 'avatar').toLowerCase();
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 48%)`;
  }

  onClick() {
    this.selected = true;
    this.click.emit();
  }



}
