import { Component, inject, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ComponentFactoryResolver, Injector, OnInit } from '@angular/core';
import { StringService } from '../../core/services';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';
import { CustomRenderer } from './custom-renderer';
import { marked } from 'marked';

@Component({
  selector: 'oa-markdown',
  imports: [],
  templateUrl: './markdown.component.html',
  styleUrl: './markdown.component.scss'
})
export class MarkdownComponent implements OnInit {

  @Input()
  value?: string;

  @Input()
  options?: any;

  @ViewChild('container', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  compiledMarkdown: SafeHtml = '';
  private componentRefs: any[] = [];

  stringService = inject(StringService);
  context = inject(ContextService);
  dataService = inject(DataService);
  http = inject(HttpClient);
  sanitizer = inject(DomSanitizer);
  resolver = inject(ComponentFactoryResolver);
  injector = inject(Injector);

  async ngOnInit(): Promise<void> {

    if (this.value?.startsWith('http')) {
      this.loadMarkdownFromUrl(this.value);
    } else {
      await this.renderMarkdown(this.value ?? '');
    }
  }

  private loadMarkdownFromUrl(src: string): void {
    this.http.get(src!, { responseType: 'text' }).subscribe(
      async markdown => await this.renderMarkdown(markdown),
      error => console.error('Failed to load markdown:', error)
    );
  }
  private async renderMarkdown(markdown: string): Promise<void> {
    // Create custom renderer with component support
    const renderer = new CustomRenderer(
      this.resolver,
      this.container,
      this.injector,
      (ref) => this.componentRefs.push(ref)
    );

    // Configure marked
    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true
    });

    // Parse markdown
    const htmlOrPromise = marked.parse(markdown);
    const html = htmlOrPromise instanceof Promise ? await htmlOrPromise : htmlOrPromise;
    this.compiledMarkdown = this.sanitizer.bypassSecurityTrustHtml(html);
  }

}
