import { Link } from '../models/link.model';

export interface ICacheService {
  store: Storage;
  currentPage?: Link;

  getItem(key: string): any;
  setItem(key: string, value: string): void;
  clear(): void;
  get(id: string, builder?: () => any): any;
  set(id: string, value: any): any;
  update(id: string, value: any): any;
  remove(id: string): void;
  components(name: string): {
    set(key: string | number, value: any): any;
    get(key: string | number, defaultValue?: any): any;
  };
  saveLink(link: Link): void;
  setPage(item: Link): void;
}
