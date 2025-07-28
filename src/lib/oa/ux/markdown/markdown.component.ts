import { Component, inject, Input, ViewChild, ViewContainerRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ComponentFactoryResolver, Injector, OnInit } from '@angular/core';
import { StringService } from '../../core/services';
import { ContextService } from '../../core/services/context.service';
import { DataService } from '../../core/services/data.service';
import { marked, Token } from 'marked';
import { FormComponent } from '../form/form.component';
import { firstValueFrom, skip } from 'rxjs';

interface Block {
  type: 'html' | 'oa-form';
  content: string;
}

@Component({
  selector: 'oa-markdown',
  imports: [FormComponent],
  templateUrl: './markdown.component.html',
  styleUrl: './markdown.component.scss'
})
export class MarkdownComponent implements OnInit {

  @Input()
  value?: any;

  @Input()
  options?: any;

  @ViewChild('container', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  components: { control: string; value?: any; options?: any; }[] = [];

  compiledMarkdown: SafeHtml = '';
  // private componentRefs: any[] = [];


  customComponents = 'oa-form'

  stringService = inject(StringService);
  context = inject(ContextService);
  dataService = inject(DataService);
  http = inject(HttpClient);
  sanitizer = inject(DomSanitizer);
  resolver = inject(ComponentFactoryResolver);
  injector = inject(Injector);

  async ngOnInit(): Promise<void> {

    this.options = this.options || {};

    if (typeof this.value === 'string') {
      if (this.value.startsWith('http')) {
        const content = await firstValueFrom(this.http.get(this.value!, { responseType: 'text' }));
        this.value = marked.lexer(content || '', { breaks: true, gfm: true });
        this.render()
      } else {
        const value = this.context.data(this.value);
        if (!value) {
          this.render()
        } else {
          this.value = await value.first();
          this.render()

          if (value.subscribe) {
            value.changes.pipe(skip(1)).subscribe((p: any) => {
              this.value = p;
              this.render();
            });
          }
        }
      }
    } else {
      this.render();
    }
  }

  async render() {
    if (!this.value) {
      return;
    }
    const tokens: any[] = this.value;
    let htmlBuffer = '';

    const flushHtml = () => {
      if (htmlBuffer.trim()) {
        this.components.push({ control: 'html', value: htmlBuffer });
        htmlBuffer = '';
      }
    };

    const toTable = (token: any) => {
      let html = '<table><thead><tr>';
      for (const header of token.header) {
        html += `<th>${renderInline(header.text)}</th>`;
      }
      html += '</tr></thead><tbody>';
      for (const row of token.rows) {
        html += '<tr>';
        for (const cell of row) {
          html += `<td>${renderInline(cell.text)}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      return html
    };

    const toList = (token: any) => {
      let html = ''
      const listTag = token.ordered ? 'ol' : 'ul';
      html += `<${listTag}>`;
      for (const item of token.items) {
        html += `<li>${renderInline(item.text)}</li>`;
      }
      html += `</${listTag}>`;
      return html;
    }

    const toAngularComponent = (token: any) => {
      const component: any = {};
      component.control = token.lang
      const obj = JSON.parse(token.text)
      component.options = obj.config || obj.options || obj
      if (obj.value) {
        component.value = obj.value;
      }

      return component
    }

    const escapeHtml = (text: string) =>
      text.replace(/</g, '&lt;').replace(/>/g, '&gt;');


    const renderInline = (raw: string) => {
      return marked.parseInline(raw); // supports **bold**, *italic*, `code`
    };


    for (const token of tokens) {
      switch (token.type) {
        case 'heading':
          htmlBuffer += `<h${token.depth}>${renderInline(token.text)}</h${token.depth}>`;
          break;

        case 'paragraph':
          htmlBuffer += `<p>${renderInline(token.text)}</p>`;
          break;

        case 'list':
          htmlBuffer += toList(token)
          break;

        case 'code':
          if (this.customComponents.indexOf(token.lang) !== -1) {
            flushHtml();
            this.components.push(toAngularComponent(token))
          } else {
            htmlBuffer += `<pre><code class="language-${token.lang || ''}">${token.text}</code></pre>`
          }
          break;
        case 'space':
          htmlBuffer += `<br/>`;
          break;

        case 'hr':
          htmlBuffer += `<hr/>`;
          break;

        case 'table':
          htmlBuffer += toTable(token);
          break;

        case 'html':
          htmlBuffer += renderInline(token.text);
          break;
        default:
          // 'blockquote'
          if (token.text) {
            if (token.type) {
              htmlBuffer += `<${token.type}>${renderInline(token.text)}</${token.type}>`;
            } else {
              htmlBuffer += renderInline(token.text);
            }
          }
          break;
      }
    }

    flushHtml(); // push any remaining HTML
  }
}
