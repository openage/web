import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { PopupPosition, PopupTheme, PopupType } from '../../core/models/popup.enums';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'oa-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.scss']
})
export class PopupComponent implements OnInit {

  position: PopupPosition = PopupPosition.ABOVE;
  theme: PopupTheme = PopupTheme.DARK;
  type: PopupType = PopupType.DIALOG;

  template?: TemplateRef<any>;
  data?: any;
  title = '';

  left = 0;
  top = 0;
  visible = false;

  constructor() { }

  ngOnInit() {
  }

}
