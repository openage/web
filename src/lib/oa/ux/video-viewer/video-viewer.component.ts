import { Component, Input, OnInit, inject } from '@angular/core';
import { VideoOptions } from './video.options';
import { YouTubePlayer } from '@angular/youtube-player';
import { ConstantService } from '../../core/services/constant.service';

@Component({
  selector: 'oa-video-viewer',
  standalone: true,
  imports: [
    YouTubePlayer
  ],
  templateUrl: './video-viewer.component.html',
  styleUrl: './video-viewer.component.scss'
})
export class VideoViewerComponent implements OnInit {

  @Input()
  value?: any;

  @Input()
  options?: any | VideoOptions;

  private _constant: ConstantService = inject(ConstantService);

  ngOnInit(): void {
    if (!this.value) {
      return;
    }

    if (this.options! instanceof VideoOptions) {
      this.options = new VideoOptions(this.options);
    }

    if (!this.options.provider) {
      if (this.value.startsWith('https://www.youtube.com/embed')) {
        this.options.provider = 'youtube';
      } else {
        this.options.provider = 'file';
      }
    }
  }

  getMime(path: string) {
    if (!path) return '';
    const part = path.split('.')
    const ext = part[part.length - 1]
    return this._constant.mimes.get(ext);
  }
}
