/* eslint-disable no-empty */
/* eslint-disable no-prototype-builtins */
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef
} from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { RouterModule } from '@angular/router';
import { Entity, Logger } from "../../models";
import { ContextService } from "../../services/context.service";
import { CommonModule } from "@angular/common";
import { NavService } from "../../services/nav.service";
import { NotFoundComponent } from "../../../ux/not-found/not-found.component";
import { HtmlViewerComponent } from "../../../ux/html-viewer/html-viewer.component";
import { VideoViewerComponent } from "../../../ux/video-viewer/video-viewer.component";
import { IconComponent } from "../../../ux/icon/icon.component";
import { ActionComponent } from "../../../ux/action/action.component";
import { FormComponent } from "../../../ux/form/form.component";
import { FileUploaderComponent } from "../../../ux/file-uploader/file-uploader.component";
import { TableEditorComponent } from "../../../ux/table-editor/table-editor.component";
import { ThumbnailSelectorComponent } from "../../../ux/thumbnail-selector/thumbnail-selector.component";
import { PaginationControlsComponent } from "../../../ux/pagination-controls/pagination-controls.component";
import { CalendarComponent } from "../../../ux/calendar/calendar.component";
import { DocumentUploaderComponent } from "../../../ux/document-uploader/document-uploader.component";
import { NavComponent } from "../../../ux/nav/nav.component";
import { JsonEditorComponent } from "../../../ux/json-editor/json-editor.component";
import { JsonViewerComponent } from "../../../ux/json-viewer/json-viewer.component";
import { BrandingComponent } from "../branding/branding.component";
import { BreadcrumbComponent } from "../breadcrumb/breadcrumb.component";
import { CurrentRoleComponent } from "../current-role/current-role.component";

@Component({
  selector: "oa-layout",
  standalone: true,
  templateUrl: "./layout.component.html",
  styleUrls: ["./layout.component.scss"],
  imports: [
    NotFoundComponent,
    RouterModule,
    CommonModule,
    HtmlViewerComponent,
    VideoViewerComponent,
    IconComponent,
    ActionComponent,
    FormComponent,
    FileUploaderComponent,
    TableEditorComponent,
    CalendarComponent,
    NavComponent,
    ThumbnailSelectorComponent,
    PaginationControlsComponent,
    DocumentUploaderComponent,
    JsonEditorComponent,
    BrandingComponent,
    BreadcrumbComponent,
    CurrentRoleComponent,
    // JsonViewerComponent
  ]
})
export class LayoutComponent implements OnInit, OnChanges {
  isProcessing = false;

  @Input() components: any[] = [];
  @Input() layout: any = {};
  @Input() data: any = {};
  @Input() filters: any[] = [];
  @Input() params: any = {};
  @Input() templates?: any;
  @Input() columnTemplate?: TemplateRef<any>;
  @Input() entity?: Entity;
  @Input() view = "grid";
  @Input() filterView = "inline";

  @Output() selected: EventEmitter<any> = new EventEmitter();

  // items = [];
  widgetArray = [];
  content: any;
  logger: Logger = new Logger('LayoutComponent');
  styles: any = {};
  sections: any = {};

  constructor(
    public context: ContextService,
    private navService: NavService,
    public sanitizer: DomSanitizer
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    const log = this.logger.get('ngOnChanges');
    log.silly('changes', changes);
    this.components = this.components || [];
    if (changes['section']) {
      this.initSection(changes['section'].currentValue);  // Reset and reinitialize with the new value
    }
    if (changes["data"]) {
      for (const c of this.components) {
        this.initComponent(c);
      }
      this.content = this.initSection(this.layout);
    }
  }

  ngOnInit() {
    const logger = this.logger.get('ngOnInit');

    this.styles = this.context.getPageMeta('styles') || {};
    this.components = this.components || [];

    if (!this.templates) {
      this.templates = {};
    }
    if (Array.isArray(this.templates)) {
      const templates: any = {};
      this.templates.forEach(t => {
        templates[(t.type || t.code).toLowerCase()] = t.template;
      });
      this.templates = templates;
    }

    this.layout = this.layout || {};
    this.layout.code = this.layout.code || 'content';
    this.layout.class = this.layout.class || 'content';
    this.content = this.initSection(this.layout);

    logger.silly('content', this.content);
  }

  /**
   * Initialize a section with its components and nested sections.
   */
  // initSection(section: any) {
  //   const log = this.logger.get('initSection');
  //   section.style = this.getStyle(section);
  //   section.container = this.getContainer(section);

  //   let components = section.components || [];
  //   components.push(...this.components.filter(c => c.section?.toLowerCase() === section.code?.toLowerCase()));
  //   components = components.filter((i: any) => this.context.hasPermission(i.permissions));

  //   log.silly(`components count: ${components.length}`);
  //   section.components = [];

  //   components.forEach((i: any) => {
  //     const component = this.initComponent(i);
  //     section.components.push(...(Array.isArray(component) ? component : [component]));
  //   });

  //   let sections = (section.sections || section.items || section.divs || []);
  //   if (!Array.isArray(sections)) {
  //     sections = [sections];
  //   }

  //   sections = sections.filter((s: any) => this.context.hasPermission(s.permission));
  //   let sectionIndex = 0;
  //   section.sections = sections.map((i: any) => {
  //     sectionIndex++;
  //     const s = this.initSection(i);
  //     s.code = s.code || `${section.code}-${sectionIndex}`;
  //     s.parent = section.code;
  //     return s;
  //   });

  //   if (section.type && section.type !== 'default') {
  //     section.container.header = section.container.header || {};
  //     section.container.body = section.container.body || {};
  //     let index = 0;
  //     let selected = false;
  //     section.sections.forEach((s: any) => {
  //       s.bodyOnly = true;
  //       s.index = index++;
  //       s.code = s.code || `${section.code}-${s.index}`;
  //       s.selected = !!s.selected;
  //       selected = selected || s.selected;
  //     });
  //     if (!selected && section.sections.length) {
  //       section.sections[0].selected = true;
  //     }

  //     section.actions = {
  //       next: {
  //         code: 'next',
  //         event: () => {
  //           this.selectNextSection(section);
  //         }
  //       },
  //       previous: {
  //         code: 'previous',
  //         event: () => {
  //           this.selectPreviousSection(section);
  //         }
  //       }
  //     };
  //   }

  //   log.silly(`section ${section.code}`, section);

  //   this.sections[section.code] = section;
  //   return section;
  // }
  initSection(section: any) {
    const log = this.logger.get('initSection');
    section.style = this.getStyle(section);
    section.container = this.getContainer(section);

    let components = section.components || [];
    components.push(...this.components.filter(c => c.section?.toLowerCase() === section.code?.toLowerCase()));

    // Filter components based on permissions and avoid duplicates
    components = components.filter((i: any) => this.context.hasPermission(i.permissions));

    log.silly(`components count: ${components.length}`);
    section.components = [];  // Reset components to avoid duplication

    // Initialize components and avoid duplication
    components.forEach((i: any) => {
      const component = this.initComponent(i);
      const componentArray = Array.isArray(component) ? component : [component];
      componentArray.forEach(comp => {
        if (!section.components.includes(comp)) {  // Only add if not already present
          section.components.push(comp);
        }
      });
    });

    let sections = (section.sections || section.items || section.divs || []);
    if (!Array.isArray(sections)) {
      sections = [sections];
    }

    sections = sections.filter((s: any) => this.context.hasPermission(s.permission));
    let sectionIndex = 0;
    section.sections = sections.map((i: any) => {
      sectionIndex++;
      const s = this.initSection(i);
      s.code = s.code || `${section.code}-${sectionIndex}`;
      s.parent = section.code;
      return s;
    });

    if (section.type && section.type !== 'default') {
      section.container.header = section.container.header || {};
      section.container.body = section.container.body || {};
      let index = 0;
      let selected = false;
      section.sections.forEach((s: any) => {
        s.bodyOnly = true;
        s.index = index++;
        s.code = s.code || `${section.code}-${s.index}`;
        s.selected = !!s.selected;
        selected = selected || s.selected;
      });
      if (!selected && section.sections.length) {
        section.sections[0].selected = true;
      }

      section.actions = {
        next: {
          code: 'next',
          event: () => {
            this.selectNextSection(section);
          }
        },
        previous: {
          code: 'previous',
          event: () => {
            this.selectPreviousSection(section);
          }
        }
      };
    }

    log.silly(`section ${section.code}`, section);

    // Reset current section to avoid retaining previous state
    this.sections[section.code] = { ...section };
    return section;
  }

  /**
   * Mark the selected section.
   */
  selectSection(section: any) {
    if (section.parent) {
      const parent = this.sections[section.parent];
      parent.sections.forEach((s: any) => {
        s.selected = false;
      });
    }
    section.selected = true;
  }

  /**
   * Select the next section in the list.
   */
  selectNextSection(section: any) {
    const selectedSection = section.sections.find((s: any) => s.selected);
    let index = selectedSection.index + 1;

    if (index >= section.sections.length) {
      index = 0;
    }

    selectedSection.selected = false;
    section.sections[index].selected = true;
  }

  /**
   * Select the previous section in the list.
   */
  selectPreviousSection(section: any) {
    const selectedSection = section.sections.find((s: any) => s.selected);
    let index = selectedSection.index - 1;

    if (index < 0) {
      index = section.sections.length - 1;
    }

    selectedSection.selected = false;
    section.sections[index].selected = true;
  }

  /**
   * Initialize a component with its style, container, and control properties.
   */
  initComponent(component: any) {
    const log = this.logger.get('initComponent');
    component.style = this.getStyle(component);
    component.container = this.getContainer(component);
    component.control = component.control || component.type;
    // component.value = this.data[component.code]?.items || component.value?.items;

    // if (component.control === 'collection') {
    //   component.items = this.getSubComponents(component);
    // }


    log.silly(`component ${component.control}`, component);

    return component;
  }

  mapLabelsAndValues(data: any): any {
    // if (!data || typeof data !== 'object') {
    //   return data;
    // }
    if (Array.isArray(data)) {
      const mappedData = [];

      for (let index = 0; index < data.length; index++) {
        const element = data[index];

        for (const key in element) {
          const newElement: any = {};
          const newProp = {
            label: '',
            value: ''
          };
          if (Array.isArray(element[key])) {
            for (let i = 0; i < element[key].length; i++) {
              const arrayItem = element[key][i];
              if (typeof arrayItem === 'object') {
                for (const subKey in arrayItem) {
                  const subProp = {
                    label: subKey.toUpperCase(),
                    value: arrayItem[subKey]
                  };
                  newElement[subProp.label] = subProp.value;
                }
              } else {
                newElement[`${key}_${i}`] = arrayItem;
              }
            }
          }
          else if (typeof element[key] === 'object') {
            for (const subKey in element[key]) {
              const subProp = {
                label: subKey.toUpperCase(),
                value: element[key][subKey]
              };
              newElement[subProp.label] = subProp.value;
            }
          }
          else {
            newProp.label = key.toUpperCase();
            newProp.value = element[key];
            newElement[newProp.label] = newProp.value;
          }
          newElement[key] = newProp;
        }
        mappedData.push(element);
      }
      return mappedData;
    }
  }
  /**
   * Get the style for a section or component.
   */
  getStyle(section: any) {
    let style = section.style || section.code;
    if (typeof style === 'string') {
      style = this.styles[style];
    }
    return style;
  }

  /**
   * Get the container details for an item.
   */
  getContainer(item: any) {
    const container = item.container;
    if (container) {
      container.body = container.body || {};
      let style = container.body.style || container.style || item.style || item.code;

      if (style) {
        if (typeof style === 'string') {
          style = this.styles[item.style];
        }
        container.body.style = style;
      }

      let title = container.header?.title || container.title || item.title || item.label || item.name;
      if (title) {
        if (typeof title === 'string') {
          title = { text: title };
        }
        title.style = title.style || this.styles['container.title'];
        container.header = container.header || {};
        container.header.title = title;
      }

      const icon = container.header?.icon || container.icon || item.icon;
      if (icon) {
        container.header = container.header || {};
        container.header.icon = icon;
      }

      let link = container.header?.link || container.link || item.link;
      if (link) {
        if (typeof link === 'string') {
          link = { url: link, text: '...' };
        }
        link.style = link.style || this.styles['container.link'];
        container.header = container.header || {};
        container.header.link = link;
      }

      let description = container.header?.description || container.description || item.description || item.summary || item.html;
      if (description) {
        if (typeof description === 'string') {
          description = { text: description };
        }
        description.style = description.style || this.styles['container.description'];
        container.header = container.header || {};
        container.header.description = description;
      }
    }
    return container;
  }

  /**
   * Get sub-components for a collection component.
   */
  // getSubComponents(item: any) {
  //   const log = this.logger.get('getSubComponents');
  //   let values: any[] = [];

  //   if (typeof item.value === 'string') {
  //     let value = this.context.data(item.value);

  //     if (typeof value?.get === 'function') {
  //       value = value.get();
  //     }

  //     if (value.items) {
  //       values = value.items;
  //     } else if (Array.isArray(value)) {
  //       values = value;
  //     }
  //   }

  //   if (!Array.isArray(values)) {
  //     values = [values];
  //   }
  //   const components = values.map((v: any) => {
  //     const c = this.initComponent({
  //       container: v.container || item.options.container,
  //       control: v.control || item.options.control,
  //       options: v.options || item.options.options,
  //       value: v.value || v
  //     });
  //     return c;
  //   });
  //   return components;
  // }

  /**
   * Emit the selected section.
   */
  onSectionSelect(section: any) {
    this.selected.emit(section);
  }

  /**
   * Handle tab selection.
   */
  onTabSelect(item: { isSelected: boolean }, divs: any[]) {
    divs.forEach((div) => {
      div.isSelected = false;
    });
    item.isSelected = true;
  }

  /**
   * Navigate to the report editor for a given item.
   */
  onItemEdit(item: { code: any }) {
    this.navService.goto('console.report.editor', {
      path: { code: item.code }
    });
  }
  toggleUploaderVisibility(item: any) {
    item.isUploaderVisible = !item.isUploaderVisible;
  }
}
