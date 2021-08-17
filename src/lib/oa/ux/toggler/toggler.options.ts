import { EditorOptions } from "../../core/models/editor.options";

export class TogglerOptions extends EditorOptions {

  incremental?: boolean;

  constructor(obj?: any) {
    super(obj);
    obj = obj || {};
  }
}
