import Dexie, { IndexableType, liveQuery, Table } from 'dexie';

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
  bookId: number;
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
  deleteAt?: Date;
}

export interface Node {
  url: string;
  createAt: Date
}

export interface Option {
  id?: number;
  bookWidth?: number,
  bookVisible?: boolean,
  menuWidth?: number,
  menuVisible?: boolean,
  activeNoteId?: number
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

  getOptions() {
    return this.options.toCollection().first();
  }

  async getActiveNote() {
    const options = await this.getOptions();
    const activeBook = await this.getActiveBook();
    return (await this.notes.filter(note => note.id === options?.activeNoteId).first()) ||
      await this.notes.filter(note => note.bookId === activeBook?.id).first();
  }

  constructor() {
    super('jianguoke.notebook');
    this.version(12).stores({
      books: '++id, title, isActived',// Primary key and indexed props
      notes: '++id, bookId, content, createAt, updateAt',
      keys: '++id',
      options: '++id',
      nodes: 'url',
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
    if (await this.options.count() <= 0) {
      await this.options.add({})
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
    await this.changeBook(id);
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
    await this.changeBook(id);
  }

  async changeBook(id: IndexableType) {
    const books: Book[] = [];
    await this.books.each(book => {
      book.isActived = book.id === id;
      books.push(book);
    });
    await this.books.bulkPut(books);
    this.activeNote(-1);
  }

  async deleteBook(id: IndexableType) {
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

  async activeNote(id: IndexableType) {
    this.options.update((await this.getOptions())!.id!, {
      activeNoteId: id
    })
  }

  async upsertNote(content: string, id?: IndexableType) {
    const activeBook = await this.getActiveBook();
    let note = await this.notes.filter(it => it.id === id).first();
    if (!note) {
      note = {
        content,
        bookId: activeBook?.id!,
        hash: activeBook!.hash,
        createAt: getDateNow(),
        updateAt: getDateNow(),
      };
      const id = await this.notes.add(note);
      await this.activeNote(id);
    } else {
      await this.notes.update(note, {
        content,
        updateAt: getDateNow(),
      });
    }
  }

  async deleteNote(id: IndexableType) {
    await this.notes.delete(id);
  }

  async addKey(priKey: string, pubKey: string) {
    await this.keys.add({
      name: '秘钥',
      priKey,
      pubKey,
      enabled: true,
      createAt: getDateNow()
    })
  }

  async deleteKey(id: IndexableType) {
    await this.keys.delete(id);
  }

}

export const db = new NoteBookDexie(); 