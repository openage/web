import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomainPage } from '../../core/models/domain-page';
import { ContextService } from '../../core/services/context.service';
import { ActionComponent } from "../action/action.component";
import { IconComponent } from "../icon/icon.component";

@Component({
  selector: 'oa-pagination',
  standalone: true,
  imports: [FormsModule, ActionComponent, IconComponent],
  templateUrl: './pagination-controls.component.html',
  styleUrl: './pagination-controls.component.scss'
})
export class PaginationControlsComponent implements OnInit {


  @Input()
  value?: DomainPage;

  @Input()
  options?: any;

  inputPage: number | null = null;

  constructor(
    private context: ContextService
  ) { }

  ngOnInit(): void {
    if (typeof this.value === 'string') {
      const value = this.context.data(this.value);

      if (value instanceof DomainPage) {
        value.subscribe((p) => {
          this.value = p;
        })
      }
      this.value = value;
    }
  }
}
