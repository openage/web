import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { CurrencyExchangeDialogComponent } from '../../dialogs/currency-exchange-dialog/currency-exchange-dialog.component';

@Component({
    selector: 'oa-currency-ratio-editor',
    templateUrl: './currency-ratio-editor.component.html',
    styleUrls: ['./currency-ratio-editor.component.css'],
    standalone: false
})
export class CurrencyRatioEditorComponent implements OnInit {

  @Input()
  readonly = false;

  @Input()
  options: any = {};

  @Input()
  value: any;

  @Output()
  changed: EventEmitter<any> = new EventEmitter();

  items: any[] = [];

  constructor(
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {

    this.populate();
  }

  populate() {
    this.items = Object.keys(this.value.ratio || {}).map((c) => {
      return {
        currency: c,
        ratio: this.value.ratio[c],
        isSelected: false
      };
    });
  }


  openEditor(): void {
    if (this.readonly) { return }
    const dialogRef = this.dialog.open(CurrencyExchangeDialogComponent);
    const component = dialogRef.componentInstance;
    component.currency = JSON.parse(JSON.stringify(this.value));

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.value = result
        this.populate();
        this.changed.emit(this.value);
      }
    })
  }

}
