import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Address } from 'src/lib/oa/core/models';
import { AddressService } from 'src/lib/oa/core/services/address.service';
import { WizStepBaseComponent } from 'src/lib/oa/core/structures/wiz/wiz-step-base.component';

@Component({
  selector: 'oa-address-editor',
  templateUrl: './address-editor.component.html',
  styleUrls: ['./address-editor.component.css']
})
export class AddressEditorComponent extends WizStepBaseComponent implements OnInit {

  @Input()
  value: Address;

  @Input()
  view: 'full' | 'org' | 'short' | 'task' = 'full';

  @Input()
  readonly = false;

  @Output()
  changed: EventEmitter<Address>; // obsolete

  @Output()
  valueChange: EventEmitter<Address> = new EventEmitter();

  @Input()
  options: any = {};

  @Input()
  lineLabel = 'Registered Address';

  constructor(private addressService: AddressService) {
    super();
    this.changed = this.valueChange;
  }

  ngOnInit() {
  }

  onChange() {
    this.valueChange.emit(this.value);
  }

  validate(): boolean {
    // if (this.usercode !== 'my') {
    //   if (!this.address.line1) {
    //     return false;
    //   }
    //   if (!this.address.city) {
    //     return false;
    //   }
    //   if (!this.address.state) {
    //     return false;
    //   }
    //   if (!this.address.district) {
    //     return false;
    //   }
    //   if (!this.address.pinCode) {
    //     return false;
    //   }
    // }
    return true;
  }

  onPinCodeChange() {
    this.addressService.get(this.value.pinCode).subscribe((address) => {
      if (address) {
        this.value.city = address.city;
        this.value.district = address.district || address.city;
        this.value.state = address.state;
        this.value.country = address.country;
      }
      this.onChange();
    });
  }

  complete(): Observable<any> | boolean {
    return true;
  }
}
