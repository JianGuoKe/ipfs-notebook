import Dexie, { IndexableType, Table } from 'dexie';
import shortid from 'shortid';
import { getBrowserWidth, loadPem } from './utils';
import keypair from 'keypair';

export interface Book {
  id?: number;
  title?: string;
  name: string; // name 存储MFS文件名称
  url: string;
  enabled: boolean;
  createAt: Date;
  updateAt: Date;
  deleteAt?: Date;
  hash?: string; // 文件夹hash
  root?: string; // root文件夹hash
  reason?: 'nokey' | 'cidconflict' | 'success';
  syncAt?: Date; // hash刷新时间
  checkAt?: Date;
  isActived: boolean;
  activedAt?: Date;
  activeKey?: string;
}

export interface Menu {
  title: string;
  lastAt: Date;
  summary: string;
}

export interface Note {
  id?: number;
  content: string;
  bookId?: number;
  name?: string; // name 存储MFS文件名称
  enabled: boolean;
  createAt: Date;
  updateAt?: Date;
  deleteAt?: Date;
  syncAt?: Date;
  hash?: string; // 同步hash
  force?: boolean; // 本地为主更新
  reason?: 'nokey' | 'cidconflict' | 'nobook' | 'success';
  checkAt?: Date; // 同步检查时间
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
  createAt: Date;
}

export interface Option {
  id?: number;
  clientId?: string;
  bookWidth?: number;
  bookVisible?: boolean;
  menuWidth?: number;
  menuVisible?: boolean;
  activeNoteId?: number;
  syncMin?: number; // 同步时间间隔
  firstOpen?: boolean; // 是否不是首次打开
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
    return this.books.filter((it) => it.isActived).first();
  }

  getOptions() {
    return this.options.toCollection().first();
  }

  async getActiveNote() {
    const options = await this.getOptions();
    const activeBook = await this.getActiveBook();
    return (
      (await this.notes
        .filter((note) => note.id === options?.activeNoteId)
        .first()) ||
      (await this.notes
        .filter((note) => note.bookId === activeBook?.id)
        .first())
    );
  }

  getActiveKey() {
    return this.keys.filter((key) => key.enabled).first();
  }

  constructor() {
    super('jianguoke.notebook');
    this.version(19).stores({
      books: '++id, name, checkAt', // Primary key and indexed props
      notes: '++id, name, bookId, content,  updateAt, syncAt, checkAt',
      keys: '++id, name',
      options: '++id',
      nodes: 'url',
    });
  }

  async init() {
    let isInit = false;
    if ((await this.nodes.count()) <= 0) {
      await this.nodes.add({
        url: 'https://ipfs.jianguoke.cn',
        createAt: getDateNow(),
      });
    } else {
      // 升级服务器地址
      for (const node of await this.nodes
        .filter((node) => node.url === 'https://jianguoke.cn/ipfs')
        .toArray()) {
        await this.nodes.update(node, {
          url: 'https://ipfs.jianguoke.cn',
        });
      }
    }
    if ((await this.options.count()) <= 0) {
      isInit = true;
      const size = getBrowserWidth();
      await this.options.add({
        bookVisible: size !== 'xs' && size !== 'sm',
        menuVisible: size !== 'xs',
        syncMin: 10,
      });
    }
    for (const opt of await this.options.toArray()) {
      if (!opt.clientId) {
        await this.options.update(opt, {
          clientId: shortid.generate(),
        });
      }
    }
    await (
      await this.books.filter((it) => !it.name).toArray()
    ).forEach(async (book) => {
      await this.books.update(book.id!, {
        name: shortid.generate(),
      });
    });
    await (
      await this.notes.filter((it) => !it.name).toArray()
    ).forEach(async (note) => {
      await this.notes.update(note.id!, {
        name: shortid.generate(),
      });
    });

    if (isInit) {
      // 自动分配一个默认秘钥
      if ((await this.keys.count()) <= 0) {
        const keys = keypair({
          bits: 2048,
        });
        await this.addKey(keys.private, keys.public);
      }

      // 默认添加一个记事本
      if ((await this.books.count()) <= 0) {
        const book = await this.createEmptyBook('');

        if (
          (await this.notes
            .filter((note) => note.bookId === book!.id)
            .count()) <= 0
        ) {
          await this.upsertNote('');
        }
      }
    }
  }

  async setFirstOpen(firstOpen: boolean = false) {
    const opt = await this.getOptions();
    if (!opt) {
      return;
    }
    await this.options.update(opt.id!, {
      firstOpen,
    });
  }

  async setBookWidth(bookWidth: number) {
    const opt = await this.getOptions();
    if (!opt) {
      return;
    }
    await this.options.update(opt.id!, {
      bookWidth,
    });
  }

  async setBookVisible(bookVisible: boolean) {
    const opt = await this.getOptions();
    await this.options.update(opt!.id!, {
      bookVisible,
    });
  }

  async setMenuVisible(menuVisible: boolean) {
    const opt = await this.getOptions();
    await this.options.update(opt!.id!, {
      menuVisible,
    });
  }

  async switchMenuVisible() {
    const opt = await this.getOptions();
    await this.options.update(opt!.id!, {
      menuVisible: !opt!.menuVisible,
    });
  }

  async setMenuWidth(menuWidth: number) {
    const opt = await this.getOptions();
    await this.options.update(opt!.id!, {
      menuWidth,
    });
  }

  async createEmptyBook(title: string) {
    const currentNode = await this.getActaiveNode();
    if (!currentNode?.url) {
      throw new Error('IPFS接入节点未知,需要再设置中添加');
    }
    const id = await this.books.add({
      ...currentNode,
      name: shortid.generate(),
      enabled: true,
      createAt: getDateNow(),
      updateAt: getDateNow(),
      checkAt: new Date(0),
      isActived: false,
      title,
    });
    await this.changeBook(id);
    return await this.books.get(id);
  }

  async addBook(
    name: string,
    root?: string,
    hash?: string,
    title?: string,
    keyName?: string
  ) {
    const currentNode = await this.getActaiveNode();
    if (!currentNode?.url) {
      throw new Error('IPFS接入节点未知,需要再设置中添加');
    }
    const id = await this.books.add({
      ...currentNode,
      root,
      hash,
      name,
      title,
      enabled: true,
      createAt: getDateNow(),
      updateAt: getDateNow(),
      checkAt: new Date(0),
      isActived: false,
      activeKey: keyName,
    });
    await this.changeBook(id);
  }

  async changeBook(id: IndexableType) {
    const books: Book[] = [];
    await this.books.each((book) => {
      book.isActived = book.id === id;
      books.push(book);
    });
    await this.books.bulkPut(books);
    this.activeNote(-1);
  }

  async updateBookTitle(book: Book) {
    await this.books.update(book, {
      title: book.title,
    });
  }

  async updateNodeUrl(node: Node) {
    await this.nodes.update(node, {
      url: node.url,
    });
  }

  async deleteBook(id: IndexableType) {
    const activeBook = await this.getActiveBook();
    const needChange = activeBook?.id === id;
    // 逻辑删除，需要同步ipfs后彻底删除
    await this.books.update(id, {
      enabled: false,
      updateAt: getDateNow(),
      deleteAt: getDateNow(),
      checkAt: new Date(0),
    });
    const books = this.books.filter((book) => book.enabled);
    if (needChange && (await books.count()) > 0) {
      await this.books.update((await books.first())!.id!, {
        isActived: true,
      });
    }
  }

  async activeNote(id: IndexableType) {
    this.options.update((await this.getOptions())!.id!, {
      activeNoteId: id,
    });
  }

  async addNote(content: string, name: string, bookId: number, hash?: string) {
    await this.notes.add({
      content,
      name,
      hash,
      bookId,
      enabled: true,
      createAt: getDateNow(),
      updateAt: getDateNow(),
      syncAt: hash ? getDateNow() : undefined,
    });
  }

  async upsertNote(content: string, id?: IndexableType, hash?: string) {
    let note = await this.notes.filter((it) => it.id === id).first();
    if (!note) {
      const activeBook = await this.getActiveBook();
      if (!activeBook) {
        throw new Error('记事本不存在, 请先创建一个记事本');
      }
      note = {
        content,
        enabled: true,
        bookId: activeBook?.id!,
        createAt: getDateNow(),
        updateAt: getDateNow(),
        hash,
        checkAt: new Date(0),
        syncAt: hash ? getDateNow() : undefined,
      };
      const id = await this.notes.add(note);
      await this.activeNote(id);
    } else {
      await this.notes.update(note, {
        content,
        updateAt: getDateNow(),
        hash: hash || note.hash,
        checkAt: new Date(0),
        syncAt: hash ? getDateNow() : note.syncAt,
      });
    }
  }

  async deleteNote(id: IndexableType) {
    const note = await this.notes.get(id);
    if (!note) {
      return;
    }
    if (note.hash) {
      // 逻辑删除，需要同步ipfs后彻底删除
      await this.notes.update(id, {
        enabled: false,
        updateAt: getDateNow(),
        deleteAt: getDateNow(),
        checkAt: new Date(0),
      });
    } else {
      await this.notes.delete(id);
    }
  }

  async upsertKey(priKey: string, pubKey: string) {
    const exists = await this.keys
      .filter(
        (key) =>
          loadPem(key.priKey, false).private === loadPem(priKey, false).private
      )
      .first();
    if (exists) {
      return exists.name;
    }
    return await this.addKey(priKey, pubKey);
  }

  async addKey(priKey: string, pubKey: string) {
    const exists = await this.keys
      .filter(
        (key) =>
          loadPem(key.priKey, false).private === loadPem(priKey, false).private
      )
      .first();
    if (exists) {
      throw new Error('秘钥已经存在');
    }
    const name = shortid.generate();
    await this.keys.add({
      name,
      priKey,
      pubKey,
      enabled: true,
      createAt: getDateNow(),
    });
    return name;
  }

  async deleteKey(id: IndexableType) {
    await this.keys.delete(id);
  }

  async resyncNote(note: Note | IndexableType) {
    await this.notes.update(note, {
      reason: '',
      checkAt: new Date(0),
    });
  }

  async checkNote(note: Note) {
    await this.notes.update(note, {
      checkAt: getDateNow(),
    });
  }

  async syncNote(note: Note) {
    if (!note.enabled && note.reason === 'success') {
      return await this.notes.delete(note.id!);
    }
    await this.notes.update(note, {
      name: note.name,
      hash: note.hash,
      bookId: note.bookId,
      reason: note.reason,
      syncAt: note.reason === 'success' ? getDateNow() : note.syncAt,
    });
  }

  async resyncBook(book: Book) {
    await this.books.update(book, {
      reason: '',
      checkAt: new Date(0),
    });
  }

  async checkBook(book: Book) {
    await this.books.update(book, {
      checkAt: getDateNow(),
    });
  }

  async syncBook(book: Book) {
    if (!book.enabled && book.reason === 'success') {
      await this.books.delete(book.id!);
      const ids = await this.notes
        .where('bookId')
        .equals(book.id!)
        .primaryKeys();
      console.log('remove notes...', ids);
      await this.notes.bulkDelete(ids);
      return;
    }
    await this.books.update(book, {
      hash: book.hash,
      reason: book.reason,
      root: book.root,
      syncAt: book.reason === 'success' ? getDateNow() : book.syncAt,
    });
  }
}

export const db = new NoteBookDexie();
