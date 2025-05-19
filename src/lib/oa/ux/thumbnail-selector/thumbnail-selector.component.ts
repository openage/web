import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Logger } from '../../core/models';

@Component({
    selector: 'oa-thumbnail-selector',
    imports: [FormsModule],
    templateUrl: './thumbnail-selector.component.html',
    styleUrl: './thumbnail-selector.component.scss'
})
export class ThumbnailSelectorComponent {
  url: any = '';
  logger = new Logger(ThumbnailSelectorComponent);

  onSelectFile(event: any) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]);

      reader.onload = (event: any) => {
        this.url = event.target.result;
        this.logger.log(this.url);
      };
    }
  }
  public delete() {
    this.url = null;
  }
}

