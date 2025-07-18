export interface TransformPlugin {
  canHandle(type: any): boolean;
  transform(data: any, config?: any): any
}
