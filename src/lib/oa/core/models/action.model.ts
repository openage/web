export class Action {
  code?: string;
  group?: any;
  event?: (obj?: any) => void;
  title?: string; // label
  icon?: any;
  /**
   * link,
   * toggle,
   * icon,
   * primary: primary raised button with icon and text,
   * raised: raised button with icon and text
   * button: button with icon and text
   * icon-button: button with icon only
   */
  type?: string; // obsolete use view
  view?: string;
  value?: any;
  /**
   * can be style object or class
   */
  style: any;
  class: any;
  options?: any[]; // values for select etc
  display?: string; // hidden, disabled etc
  permissions?: string[]; // hidden, disabled etc
  isDisabled?: boolean;
  isCancelled?: boolean;
  isSkipActionOnList?: boolean;
  isAuto?: boolean;
  config?: any; // can have data, await,
  handler?: string  //frontend, backend etc

  constructor(obj?: {
    code?: string,
    group?: any,
    event?: (obj?: any) => void,
    title?: string,
    label?: string,
    name?: string,
    icon?: any,
    type?: string,
    view?: string,
    class?: any,
    style?: any,
    value?: any,
    options?: any[],
    display?: string,
    permissions?: string[],
    isDisabled?: boolean,
    isCancelled?: boolean,
    isSkipActionOnList?: boolean,
    isAuto?: boolean,
    config?: any,
    handler?: string
  }) {
    if (!obj) { return; }
    this.code = obj.code;
    this.group = obj.group;
    this.event = obj.event;
    this.title = obj.title || obj.label || obj.name;
    this.icon = obj.icon;
    this.class = obj.class;
    this.style = obj.style;
    this.type = obj.type;
    this.view = obj.view || this.type;
    this.value = obj.value || obj.config;
    this.config = obj.config || obj.value
    this.options = obj.options;
    this.display = obj.display;
    this.permissions = obj.permissions;
    this.isDisabled = obj.isDisabled;
    this.isCancelled = obj.isCancelled;
    this.isSkipActionOnList = obj.isSkipActionOnList;
    this.isAuto = obj.isAuto;
    this.handler = obj.handler;

  }
}
