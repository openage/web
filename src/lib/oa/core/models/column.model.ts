import { FieldEditorModel } from "./field-editor.model";

export class ColumnModel extends FieldEditorModel {

    ascending?: boolean;
    filters?: any;
    override showFilters?: any;
    isSticky?: boolean;

    click?: any;

    identity?: boolean;
    formula?: string;


    constructor(obj?: any) {
        super(obj);
        if (!obj) { return; }

        this.click = obj.click || {};
        this.ascending = obj.ascending;

        this.filters = obj.filters;
        this.isSticky = obj.isSticky || false;
        this.showFilters = obj.showFilters || false;
        this.identity = obj.identity;
        this.formula = obj.formula;
    }
}
