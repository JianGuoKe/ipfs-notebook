import Dexie, { Table } from 'dexie';

export interface Book {
  id?: number;
  title: string;
  url: string;
  hash: string;
  enabled: boolean;
  createAt: Date;
  deleteAt: Date;
  keyId: number;
  isActived: boolean;
  activedAt: Date;
}

export interface Menu {
  id?: number;
  title: string;
  bookId: number;
  createAt: Date;
  updateAt: Date;
  deleteAt: Date;
  summary: string;
}

export interface Note {
  id?: number;
  content: string;
  bookId: number;
  createAt: Date;
  updateAt: Date;
  deleteAt: Date;
  keyId: number;
}

export interface Key {
  id?: number;
  name: string;
  pubKey: string;
  priKey: string;
  enabled: boolean;
  createAt: Date;
  deleteAt: Date;
}

export interface Option {
  bookWidth: number,
  bookVisible: boolean,
  menuWidth: number,
  menuVisible: boolean
}

export class NoteBookDexie extends Dexie {
  // 'books' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  books!: Table<Book>;
  menus!: Table<Menu>;
  notes!: Table<Note>;
  keys!: Table<Key>;
  options!: Table<Option>;

  constructor() {
    super('jianguoke.notebook');
    this.version(1).stores({
      books: '++id, title, url, hash, enabled, createAt, deleteAt, keyId, isActived, activedAt',// Primary key and indexed props
      menus: '++id, title, bookId, summary, createAt, updateAt, deleteAt',
      notes: '++id, content, bookId, keyId, updateAt, createAt, deleteAt',
      keys: '++id, name, pubKey, priKey, enabled, createAt, deleteAt',
      options: 'bookWidth, bookVisible, menuWidth, menuVisible',
    });
  }
}

export const db = new NoteBookDexie();