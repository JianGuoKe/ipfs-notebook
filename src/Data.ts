import Dexie, { IndexableType, Table } from 'dexie';

export interface Book {
  id?: number;
  title?: string;
  hash?: string;
  url: string;
  enabled: boolean;
  createAt: Date;
  updateAt: Date;
  deleteAt?: Date;
  syncAt?: Date;   // 同步ipfs文件完成时间
  checkAt?: Date;  // 同步检查时间 
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
  enabled: boolean,
  createAt: Date;
  updateAt?: Date;
  deleteAt?: Date;
  syncAt?: Date;
  checkAt?: Date;  // 同步检查时间 
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

export function getDateNow() {
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

  getActaiveNode() {
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

  getActiveKey() {
    return this.keys.filter(key => key.enabled).first();
  }

  constructor() {
    super('jianguoke.notebook');
    this.version(13).stores({
      books: '++id, title, isActived',// Primary key and indexed props
      notes: '++id, bookId, content, createAt, updateAt, syncAt, checkAt',
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

  async setBookWidth(bookWidth: number) {
    const opt = await this.getOptions();
    if (!opt) {
      return;
    }
    await this.options.update(opt.id!, {
      bookWidth
    });
  }

  async setBookVisible(bookVisible: boolean) {
    const opt = await this.getOptions();
    await this.options.update(opt!.id!, {
      bookVisible
    });
  }

  async setMenuWidth(menuWidth: number) {
    const opt = await this.getOptions();
    await this.options.update(opt!.id!, {
      menuWidth
    });
  }

  async createEmptyBook(title: string) {
    const currentNode = await this.getActaiveNode();
    if (!currentNode?.url) {
      throw new Error('IPFS接入节点未知,需要再设置中添加')
    }
    const id = await this.books.add({
      ...currentNode,
      enabled: true,
      createAt: getDateNow(),
      updateAt: getDateNow(),
      isActived: false,
      title
    });
    await this.changeBook(id);
  }

  async addBook(hash: string) {
    const currentNode = await this.getActaiveNode();
    if (!currentNode?.url) {
      throw new Error('IPFS接入节点未知,需要再设置中添加')
    }
    const id = await this.books.add({
      ...currentNode,
      hash,
      enabled: true,
      createAt: getDateNow(),
      updateAt: getDateNow(),
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

  async updateBookTitle(book: Book) {
    await this.books.update(book, {
      title: book.title
    })
  }

  async deleteBook(id: IndexableType) {
    const activeBook = await this.getActiveBook();
    const needChange = activeBook?.id === id;
    // 逻辑删除，需要同步ipfs后彻底删除
    await this.books.update(id, {
      enabled: false,
      updateAt: getDateNow(),
      deleteAt: getDateNow()
    });
    const books = this.books.filter(book => book.enabled);
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
    if (!activeBook) {
      throw new Error('记事本不存在, 请先创建一个记事本');
    }
    let note = await this.notes.filter(it => it.id === id).first();
    if (!note) {
      note = {
        content,
        enabled: true,
        bookId: activeBook?.id!,
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
    // 逻辑删除，需要同步ipfs后彻底删除
    await this.notes.update(id, {
      enabled: false,
      updateAt: getDateNow(),
      deleteAt: getDateNow()
    });
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

  async updateCheck(note: Note) {
    await this.notes.update(note, {
      checkAt: getDateNow()
    });
  }

  async updateSync(note: Note) {
    await this.notes.update(note, {
      syncAt: getDateNow()
    });
  }
}

export const db = new NoteBookDexie(); 