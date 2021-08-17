import { Entity } from '../models';
export interface IEntityHandler {
  setEntity(entity: Entity): void;
  resetEntity(): void;
  currentEntity(): void;
}
