 export abstract class ModelBase {
  id?: string | number;
  code?: string;
  name?: string;
  meta: any = {};
  status?: string;
  timeStamp?: Date;
  createdAt?: Date;
  isEditing = false;
  isSelected = false;
  isProcessing = false;
  isDeleted = false;
  isValid = false;
  constructor(obj?: any) {
    if (!obj) { return; }

    this.id = obj.id;
    this.code = obj.code;
    this.name = obj.name;
    this.meta = obj.meta || {};
    this.status = obj.status;
    this.timeStamp = obj.timeStamp || new Date();
    this.createdAt = obj.createdAt || new Date();
  }

  getUIState() {
    return {
      isEditing: this.isEditing,
      isSelected: this.isSelected,
      isProcessing: this.isProcessing,
      isDeleted: this.isDeleted
    }
  }

  setUIState(obj:any) {
    this.isEditing = obj.isEditing;
    this.isSelected = obj.isSelected;
    this.isProcessing = obj.isProcessing;
    this.isDeleted = obj.isDeleted;
  }
}
