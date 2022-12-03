import Dexie, { Table } from 'dexie';

export interface Friend {
  id?: number;
  name: string;
  age: number;
}

export class NoteBookDexie extends Dexie {
  // 'friends' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  friends!: Table<Friend>;

  constructor() {
    super('jianguoke.notebook');
    this.version(1).stores({
      friends: '++id, name, age' // Primary key and indexed props
    });
  }
}

export const db = new NoteBookDexie();