import { Action } from "./action.model";


export class AlertOptions {
    title?: string;
    view?: 'banner' | 'subtle' | 'dialog' = 'dialog';
    // template?: TemplateRef;
    confirm?: {
        title?: string;
        hide?: boolean;
    };
    cancel?: {
        title?: string;
        hide?: boolean;
    };
    duration?: number;
    actions?: Action[];
    style?: {
        width?: string;
    };

    onOpen?: () => void;
    onClose?: (data: any, err: any) => void;
    onCancel?: () => void;

    constructor(obj?: any) {
        if (!obj) return;

        if (typeof obj !== 'string') {
            obj = { title: obj };
        }

        this.onOpen = obj.onOpen;
        this.onClose = obj.onClose;
        this.onCancel = obj.onCancel;

        this.confirm = {
            title: obj.confirm?.title || 'Confirm',
            hide: !!obj.confirm?.hide
        };
        this.cancel = {
            title: obj.cancel?.title || 'Cancel',
            hide: !!obj.cancel?.hide
        };

        this.title = obj.title || 'Info';
        this.duration = obj.duration;
        this.view = obj.view || 'dialog';
        this.actions = obj.actions;

        this.style = {
            width: obj.style?.width || '350px'
        };
    }

}
