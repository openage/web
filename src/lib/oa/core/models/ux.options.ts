
export interface IDialog {
  show: (data?: any) => void,
  hide: () => void,
  close: () => void,
  response: () => Promise<any>
}

