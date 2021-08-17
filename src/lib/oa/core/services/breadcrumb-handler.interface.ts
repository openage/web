
export interface IBreadcrumbHandler {
  setBreadcrumb(links: any[]): void;
  pushBreadcrumb(obj: any): void;
  popBreadcrumb(): void;
  replaceBreadcrumb(obj: any): void;
  resetBreadcrumb(): void;
}
