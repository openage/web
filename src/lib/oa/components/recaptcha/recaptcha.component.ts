import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'oa-recaptcha',
  templateUrl: './recaptcha.component.html',
  styleUrls: ['./recaptcha.component.css']
})
export class RecaptchaComponent implements OnInit {

  @Output()
  token: EventEmitter<string> = new EventEmitter();

  correctCaptcha: any;

  constructor() { }

  ngOnInit() {
    this.renderCaptcha();
  }

  renderCaptcha(): any {
    if (document.getElementById('recaptcha')) {
      // @ts-ignore
      grecaptcha.render('recaptcha', {
        'sitekey': environment.captcha.key,
        'callback': (res) => {
          this.token.emit(res);
          this.correctCaptcha(res);
        },
        'expired-callback': () => {
          // @ts-ignore
          grecaptcha.reset();
          this.token.emit('');
          this.correctCaptcha('');
        }
      });
      return;
    }
    setTimeout(() => this.renderCaptcha(), 1000);
  }

}
