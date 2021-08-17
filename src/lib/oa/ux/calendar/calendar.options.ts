


export class CalendarOptions {
  view?: 'date' | 'time' | 'datetime' = 'date';
  // template?: TemplateRef;
  header?: {
    title?: string;
    hide?: boolean;
    previous?: boolean;
    next?: boolean;
  };
  cancel?: {
    title?: string;
    hide?: boolean;
  };
  duration?: number;
  style?: {
    width?: string;
  };

  onOpen?: () => void;
  onClose?: (data: any, err: any) => void;
  onCancel?: () => void;

  constructor(obj?: any) {
    if (!obj) return;

    if (typeof obj !== 'string') {
      obj = { header: { title: obj } };
    }

    this.onOpen = obj.onOpen;
    this.onClose = obj.onClose;
    this.onCancel = obj.onCancel;

    if (obj.header) {
      this.header = {
        title: obj.header?.title,
        hide: !!obj.header?.hide
      };
    }

  }

}
