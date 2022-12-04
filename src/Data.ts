import Dexie, { liveQuery, Table } from 'dexie';

export interface Book {
  id?: number;
  title?: string;
  url: string;   // 不支持本地存储，必须有url和hash
  hash?: string;
  enabled: boolean;
  createAt: Date;
  deleteAt?: Date;
  syncAt?: Date;   // 同步ipfs文件完成时间
  keyId?: number;
  isActived: boolean;
  activedAt?: Date;
}

export interface Menu {
  title: string;
  lastAt: Date;
  summary: string;
}

export interface Note {
  id?: number;
  content: string;
  hash?: string;
  createAt: Date;
  updateAt?: Date;
  deleteAt?: Date;
  syncAt?: Date;
  keyId?: number;
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

export interface Node {
  url: string;
  createAt: Date
}

export interface Option {
  bookWidth: number,
  bookVisible: boolean,
  menuWidth: number,
  menuVisible: boolean
}

function getDateNow() {
  // TODO 时间服务器
  return new Date();
}

export class NoteBookDexie extends Dexie {
  // 'books' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  books!: Table<Book>;
  notes!: Table<Note>;
  keys!: Table<Key>;
  options!: Table<Option>;
  nodes!: Table<Node>;

  getCurrentNode() {
    return this.nodes.toCollection().first();
  }

  getActiveBook() {
    return this.books.filter(it => it.isActived).first();
  }

  constructor() {
    super('jianguoke.notebook');
    this.version(5).stores({
      books: '++id, title, url, hash, enabled, createAt, deleteAt, keyId, isActived, activedAt',// Primary key and indexed props
      menus: '++id, title, bookId, summary, createAt, updateAt, deleteAt',
      notes: '++id, content, bookId, keyId, updateAt, createAt, deleteAt',
      keys: '++id, name, pubKey, priKey, enabled, createAt, deleteAt',
      options: 'bookWidth, bookVisible, menuWidth, menuVisible',
      nodes: 'url, createAt',
    });
    this.init();
  }

  async init() {
    if (await this.nodes.count() <= 0) {
      await this.nodes.add({
        url: 'https://jianguoke.cn/ipfs',
        createAt: getDateNow()
      })
    }
  }

  async createEmptyBook(title: string) {
    const currentNode = await this.getCurrentNode();
    if (!currentNode?.url) {
      throw new Error('IPFS接入节点未知,需要再设置中添加')
    }
    const id = await this.books.add({
      ...currentNode,
      enabled: true,
      createAt: getDateNow(),
      isActived: false,
      title
    });
    await this.books.each(book => {
      book.isActived = book.id === id;
    })
  }

  async addBook(hash: string) {
    const currentNode = await this.getCurrentNode();
    if (!currentNode?.url) {
      throw new Error('IPFS接入节点未知,需要再设置中添加')
    }
    const id = await this.books.add({
      ...currentNode,
      hash,
      enabled: true,
      createAt: getDateNow(),
      isActived: false,
    });
    await this.books.each(book => {
      book.isActived = book.id === id;
    })
  }

  async deleteBook(id: number) {
    const activeBook = await this.getActiveBook();
    const needChange = activeBook?.id === id;
    await this.books.delete(id);
    const books = this.books.toCollection();
    if (needChange && await books.count() > 0) {
      await this.books.update((await books.first())!.id!, {
        isActived: true
      });
    }
  }

  async changeBook(id: number) {
    const books: Book[] = [];
    await this.books.each(book => {
      book.isActived = book.id === id
      books.push(book);
    })
    await this.books.bulkPut(books);
  }

  async addNewNote() {
    const activeBook = await this.getActiveBook();
    await this.notes.add({
      content: '',
      hash: activeBook!.hash,
      createAt: getDateNow(),
    });
  }
}

export const db = new NoteBookDexie(); 