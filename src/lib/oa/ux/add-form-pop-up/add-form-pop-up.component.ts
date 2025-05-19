import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ContextService } from '../../core/services/context.service';
import { StringService } from '../../core/services';
import { ContentService } from '../../core/services/content.service';
import { NavService } from '../../core/services/nav.service';
import { Router } from '@angular/router';
import { DomainPage } from '../../core/models/domain-page';
import { DataService } from '../../core/services/data.service';
import { Link } from '../../core/models';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
    selector: 'app-add-form-pop-up',
    imports: [FormsModule],
    templateUrl: './add-form-pop-up.component.html',
    styleUrl: './add-form-pop-up.component.scss'
})
export class AddFormPopUpComponent implements OnInit {
  isModalOpen: boolean = true;
  item: any;
  @Input()
  value: any;

  data = { type: '' };
  @Output() closePopup = new EventEmitter<void>();
  constructor(
    private context: ContextService,
    private router: Router,
    private strings: StringService,
    private content: ContentService,
    private nav: NavService,
    private _dataService: DataService
  ) {}
  formData: any = {
    name: '',
    description: '',
    code: '',
  };
  ngOnInit(): void {}

  async submitForm(form: NgForm) {
    if (form.invalid) {
      form.form.markAllAsTouched(); 
      return;
    }
    const items = { ...this.formData };
    const link = Link;

    await this.saveModal(items, link);
    this.isModalOpen = false;
  }
    saveModal = async (data: any, link: any) => {
      this.isModalOpen = true;
      console.log('Payload:', data);
      const payload = {
        service: 'system',
        collection: 'navs',
        page: {
          limit: 100,
          skip: 0,
        },
      };
      return this._dataService.create(data, payload);
    };

  closeModal() {
    this.isModalOpen = false;
    this.formData = {};
  }
  close() {
    this.closePopup.emit();
  }
}
