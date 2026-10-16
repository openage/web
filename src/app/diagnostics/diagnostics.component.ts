import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ContextService } from '../../lib/oa/core/services/context.service';
import { NavService } from '../../lib/oa/core/services/nav.service';
import { JsonViewerComponent } from '../../lib/oa/ux/json-viewer/json-viewer.component';
import { IconComponent } from '../../lib/oa/ux/icon/icon.component';

interface DiagnosticEntry {
  label: string;
  value: string;
  status?: 'ok' | 'warn' | 'error' | 'info';
  data?: any;
  actions?: Array<{ code: string; title: string; icon: string; event?: () => void }>;
  icon?: string;
  image?: string;
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'app-diagnostics',
  templateUrl: './diagnostics.component.html',
  styleUrl: './diagnostics.component.scss',
  imports: [
    JsonViewerComponent,
    IconComponent,
  ]
})
export class DiagnosticsComponent {

  options = {
    limit: 50,
    sort: { key: true },
    skip: {
      empty: true,
      fields: [
        'parent',
        'timeStamp',
        'createdAt',
        'isEditing',
        'isSelected',
        'isProcessing',
        'isDeleted',
        'isValid'
      ]
    }
  }

  readonly popupVisible = signal(false);
  readonly popupTitle = signal('');
  readonly popupData = signal<any>(null);
  readonly allPages = signal<any[]>([]);
  readonly pageTree = signal<any[]>([]);

  private router = inject(Router);
  readonly context = inject(ContextService);
  private navService = inject(NavService);

  get statusIcon(): Record<string, string> {
    return {
      ok: 'check_circle',
      warn: 'warning',
      error: 'error',
      info: 'info'
    };
  }

  async ngOnInit() {
    await this.loadPages();
  }

  private flattenPages(items: any[], parentCode?: string): any[] {
    return items.flatMap((item) => {
      const page = {
        ...item,
        parentCode,
        childrenCount: item.items?.length || 0,
        effectiveLayout: item.meta?.layout?.type || this.context.getAppMeta('layout.type') || 'sticky-header'
      };

      return item.items?.length ? [page, ...this.flattenPages(item.items, item.code)] : [page];
    });
  }

  async loadPages() {
    const navs = this.context.application()?.navs || [];
    this.pageTree.set(navs);
    this.allPages.set(this.flattenPages(navs));
  }

  private breakpoint(): string {
    const width = window.innerWidth;
    if (width <= 600) return 'Mobile';
    if (width <= 1024) return 'Tablet';
    if (width <= 1366) return 'Laptop';
    if (width <= 1600) return 'Desktop';
    return 'Desktop XL';
  }

  private deviceIcon(): string {
    switch (this.breakpoint()) {
      case 'Mobile': return 'phone_iphone';
      case 'Tablet': return 'tablet';
      case 'Laptop': return 'laptop';
      case 'Desktop': return 'desktop_windows';
      case 'Desktop XL': return 'tv';
      default: return 'devices';
    }
  }

  showJson(title: string, data: any): void {
    if (!data) return;
    this.popupTitle.set(title);
    this.popupData.set(data);
    this.popupVisible.set(true);
  }

  onPageAction(event: { type: string; page: any }): void {
    switch (event.type) {
      case 'navigate':
        if (event.page?.url) {
          this.router.navigateByUrl(event.page.url);
        } else if (event.page?.code) {
          this.router.navigateByUrl('/' + event.page.code);
        }
        break;
      case 'json':
        this.showJson(`Page Meta: ${event.page?.title || event.page?.name || event.page?.code}`, event.page);
        break;
      case 'edit':
        this.showJson(`Edit: ${event.page?.title || event.page?.name || event.page?.code}`, event.page);
        break;
      default:
        break;
    }
  }

  get themeDiagnostics(): DiagnosticEntry[] {
    const appTheme = this.context.application()?.theme;
    const themeCode = this.context.theme()?.code || appTheme?.code || 'default';
    const isDark = this.context.theme()?.type === 'dark' || document.documentElement.classList.contains('theme-dark');

    return [
      { label: 'Mode', value: themeCode, status: 'info' },
      { label: 'Effective', value: isDark ? '🌙 Dark' : '☀️ Light', status: isDark ? 'info' : 'ok' },
      { label: 'System', value: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', status: 'info' },
      {
        label: 'Application',
        value: appTheme?.style ?? 'None',
        status: appTheme?.style ? 'ok' : 'warn',
        actions: appTheme ? [{ code: 'code', title: 'Open Json', icon: 'code', event: () => this.showJson('Application Theme', appTheme) }] : []
      },
      {
        label: 'Favicon',
        value: this.context.application()?.favicon?.url ?? 'Default',
        status: this.context.application()?.favicon?.url ? 'ok' : 'warn',
        image: this.context.application()?.favicon?.url
      }
    ];
  }

  get deviceDiagnostics(): DiagnosticEntry[] {
    return [
      {
        label: 'Viewport & Device',
        value: `${window.innerWidth} x ${window.innerHeight} (${this.breakpoint()})`,
        status: 'ok',
        icon: this.deviceIcon()
      },
      {
        label: 'Device Pixel Ratio',
        value: `${window.devicePixelRatio ?? 1}x`,
        status: (window.devicePixelRatio ?? 1) >= 2 ? 'ok' : 'info'
      }
    ];
  }

  get identityDiagnostics(): DiagnosticEntry[] {
    const app = this.context.application();
    return [
      {
        label: 'Application',
        value: app ? `${app.name} (${app.code})` : 'Not loaded',
        status: app ? 'ok' : 'error',
        actions: app ? [{ code: 'code', title: 'Open Json', icon: 'code', event: () => this.showJson('Application Meta', app) }] : [],
        image: app?.logo?.url || 'assets/images/default/application.png'
      },
      {
        label: 'Tenant',
        value: this.context.tenant()?.code ?? 'Not set',
        status: this.context.tenant() ? 'ok' : 'warn',
        actions: this.context.tenant() ? [{ code: 'code', title: 'Open Json', icon: 'code', event: () => this.showJson('Tenant Meta', this.context.tenant()) }] : [],
        image: this.context.tenant()?.logo?.url
      },
      {
        label: 'Organization',
        value: this.context.organization()?.code ?? 'Not set',
        status: this.context.organization() ? 'ok' : 'warn',
        actions: this.context.organization() ? [{ code: 'code', title: 'Open Json', icon: 'code', event: () => this.showJson('Organization Meta', this.context.organization()) }] : [],
        image: this.context.organization()?.logo?.url || 'assets/images/default/organization.png'
      },
      {
        label: 'User',
        value: this.context.user()?.code ?? 'Guest',
        status: this.context.user() ? 'ok' : 'warn',
        actions: this.context.user() ? [{ code: 'code', title: 'Open Json', icon: 'code', event: () => this.showJson('User Meta', this.context.user()) }] : [],
        image: this.context.user()?.profile?.pic?.url || 'assets/images/default/avatar.png'
      },
      {
        label: 'Session Active',
        value: this.context.session() ? 'Yes' : 'No',
        status: this.context.session() ? 'ok' : 'error',
        actions: this.context.session() ? [{ code: 'code', title: 'Open Json', icon: 'code', event: () => this.showJson('Session Meta', this.context.session()) }] : []
      }
    ];
  }

  get appLayoutDiagnostics(): DiagnosticEntry[] {
    const layoutCode = this.context.getAppMeta('layout.type') || 'sticky-header';
    return [
      {
        label: 'Standard App Layout',
        value: `${layoutCode} (${layoutCode === 'sticky-header' ? 'Sidebar Layout' : layoutCode})`,
        status: 'info',
        icon: 'category',
        actions: [{ code: 'code', title: 'Open Json', icon: 'code', event: () => this.showJson('App Layout Meta', this.context.application()?.meta?.app || this.context.application()) }]
      },
      {
        label: 'Layout Description',
        value: this.context.getAppMeta('layout.description') || 'None',
        status: 'info'
      }
    ];
  }

  expandSection(event: MouseEvent): void {
    const summary = event.currentTarget;
    if (summary instanceof HTMLElement && summary.parentElement instanceof HTMLDetailsElement) {
      summary.parentElement.open = true;
    }
  }
}

