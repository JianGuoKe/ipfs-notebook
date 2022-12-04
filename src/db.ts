import Dexie, { liveQuery, Table } from 'dexie';

export interface Book {
  id?: number;
  title: string;
  url: string;   // 不支持本地存储，必须有url和hash
  hash: string;
  enabled: boolean;
  createAt: Date;
  deleteAt?: Date;
  keyId?: number;
  isActived: boolean;
  activedAt?: Date;
}

export interface Menu {
  id?: number;
  title: string;
  bookId: number;
  createAt: Date;
  updateAt?: Date;
  deleteAt?: Date;
  summary?: string;
}

export interface Note {
  id?: number;
  content: string;
  hash: string;
  createAt: Date;
  updateAt?: Date;
  deleteAt?: Date;
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
  menus!: Table<Menu>;
  notes!: Table<Note>;
  keys!: Table<Key>;
  options!: Table<Option>;
  nodes!: Table<Node>;

  private _activeBook?: Book;
  private _currentNode?: Node;

  constructor() {
    super('jianguoke.notebook');
    this.version(4).stores({
      books: '++id, title, url, hash, enabled, createAt, deleteAt, keyId, isActived, activedAt',// Primary key and indexed props
      menus: '++id, title, bookId, summary, createAt, updateAt, deleteAt',
      notes: '++id, content, bookId, keyId, updateAt, createAt, deleteAt',
      keys: '++id, name, pubKey, priKey, enabled, createAt, deleteAt',
      options: 'bookWidth, bookVisible, menuWidth, menuVisible',
      nodes: 'url',
    });
    liveQuery(() => this.books.filter(book => book.isActived).first()).subscribe(book => {
      this._activeBook = book;
    });
    liveQuery(() => this.nodes.filter(node => !!node.url).first()).subscribe(node => {
      this._currentNode = node;
    })
  }

  get currentNode() {
    return this._currentNode;
  }

  get activeBook() {
    return this._activeBook;
  }

  async createEmptyBook(title: string) {
    if (!this.currentNode?.url) {
      throw new Error('IPFS接入节点未知,需要再设置中添加')
    }
    // careate ipfs hash
    const hash = ''
    await this.books.each(book => {
      book.isActived = false;
    })
    await this.books.add({
      ...this.currentNode,
      hash,
      enabled: true,
      createAt: getDateNow(),
      isActived: true,
      title
    })
  }

  async addBook(hash: string) {

  }

  async addNewNote() {
    await this.notes.add({
      content: '',
      hash: this.activeBook!.hash,
      createAt: getDateNow(),
    });
  }
}

export const db = new NoteBookDexie(); 