import { create, IPFSHTTPClient } from 'ipfs-http-client'
import { db, getDateNow, Key } from './Data';
import { liveQuery } from 'dexie';
import dayjs from 'dayjs';
import { MFSEntry } from 'ipfs-core-types/dist/src/files';
import crypto from 'crypto';
import shortid from 'shortid';
import { Buffer } from 'buffer';

let ipfs: IPFSHTTPClient | undefined;
export function start() {
  liveQuery(() => db.nodes.toCollection().first()).subscribe(node => {
    if (node && node.url) {
      ipfs = create({ url: node.url });
      startEnabled = true;
      startSync();
    } else {
      ipfs = undefined;
      startEnabled = false;
    }
  });
}

async function checkSync() {
  console.log('check sync...');
  const key = await db.getActiveKey();
  const options = await db.getOptions();
  // 30分钟内同步一次
  const lastAt = dayjs(getDateNow()).subtract(options?.syncMin || 10, 'minute').toDate();
  // 从小到大时间顺序同步数据
  const upnotes = await db.notes.orderBy('checkAt').filter(note =>
    !!note.bookId &&
    (!note.syncAt || note.syncAt < note.updateAt!) &&
    (!note.checkAt || note.checkAt < lastAt)
  ).toArray();
  console.debug('check notes...', upnotes.length);
  await upnotes.forEach(async note => {
    console.debug('check note id...', note.id)
    await db.checkNote(note);
    const book = await db.books.get(note.bookId!);
    if (book) {
      if (key) {
        note.name = note.name || shortid.generate();
        try {
          if (!note.enabled) {
            console.debug('delete file...', '/' + book.name + '/' + note.name);
            await deleteFile('/' + book.name + '/' + note.name, note.hash);
          } else {
            console.debug('write file...', '/' + book.name + '/' + note.name);
            note.hash = await uploadFileEncrypted(note.content, '/' + book.name + '/' + note.name, key, note.hash, note.force);
          }
          note.reason = 'success';
        } catch (err: any) {
          note.reason = err.message;
        }
      } else {
        note.reason = 'nokey';
      }
    } else {
      note.bookId = undefined;
      note.reason = 'nobook';
    }
    await db.syncNote(note);
  });
  // 拉取服务器文件
  const upbooks = await db.books.orderBy('checkAt').filter(book => (!book.checkAt || book.checkAt < lastAt)).toArray();
  console.debug('check books...', upbooks.length)
  await upbooks.forEach(async book => {
    console.debug('check book id...', book.id)
    await db.checkBook(book);
    if (key) {
      try {
        if (!book.enabled) {
          console.debug('delete folder...', '/' + book.name);
          await deleteFile('/' + book.name, book.hash);
        } else {
          const stat = await ipfs!.files.stat(book.name);
          if (stat.cid.toString() !== book.hash) {
            const files = await getUploadedFiles('/' + book.name);
            // 删除本地
            const removes = await db.notes.where(['bookId']).equals(book.id!).filter(note => files.every(file => file.path !== note.name));
            const pks = await removes.primaryKeys();
            console.debug('delete note...', pks);
            await db.notes.bulkDelete(pks);
            // 新增更新
            for (const file of files) {
              const note = await db.notes.get({ name: file.path });
              if (!note) {
                // 新增
                console.debug('add note...', file.path);
                await db.addNote(await downloadFileEncrypted(file.path, key), file.path, book.id!, file.cid.toString());
              } else {
                if (note.updateAt) {
                  if (note.syncAt && note.syncAt >= note.updateAt && note.hash !== file.cid.toString()) {
                    // 本地没有修改以服务器为主
                    console.debug('update note...', note.id, file.path);
                    await db.upsertNote(await downloadFileEncrypted(file.path, key), note.id);
                  }
                } else {
                  // 走note的保存机制
                }
              }
            }
            book.hash = stat.cid.toString();
          }
          // 更新本地hash
          const statRoot = await ipfs!.files.stat('/');
          book.root = statRoot.cid.toString();
          console.debug('update book...', book.id, statRoot.cid.toString());
        }
        book.reason = 'success';
      } catch (err: any) {
        let reason;
        if (err.message === 'file does not exists') {
          if (!book.enabled) {
            reason = 'success';
          } else {
            reason = err.message;
          }
        } else {
          reason = err.message;
        }
        book.reason = reason;
      }
    } else {
      book.reason = 'nokey';
    }
    await db.syncBook(book);
  });
  console.log('check sync end.');
}

let startEnabled = true;
let startTimer: any;
let isRunning = false;
function startSync(timeout = 0) {
  if (!startEnabled) {
    return;
  }
  if (isRunning) {
    return;
  }
  if (startTimer) {
    clearTimeout(startTimer);
    startTimer = null;
  }
  isRunning = false;
  startTimer = setTimeout(() => {
    isRunning = true;
    checkSync().then(() => startSync(60 * 1000)).catch(e => {
      console.error(e);
      startSync(5 * 60 * 1000);
    })
  }, timeout);
}


////////////////////////////////
//////////// IPFS //////////////
////////////////////////////////

export async function deleteFile(ipfspath: string, cid?: string, force = false) {
  let stat = await ipfs!.files.stat(ipfspath);
  if (!force && cid && stat.cid.toString() !== cid) {
    throw new Error('cidconflict')
  }
  await ipfs!.files.rm(
    ipfspath,
    { recursive: true }
  );
}

export async function uploadFileEncrypted(buff: string, ipfspath: string, keyPair: Key, cid?: string, force = false) {
  try {
    const key = crypto.randomBytes(16).toString('hex'); // 16 bytes -> 32 chars
    const iv = crypto.randomBytes(8).toString('hex');   // 8 bytes -> 16 chars
    const ekey = encryptRSA(key, keyPair.pubKey); // 32 chars -> 684 chars
    const ebuff = encryptAES(Buffer.from(buff), key, iv);

    const content = Buffer.concat([ // headers: encrypted key and IV (len: 700=684+16)
      Buffer.from(ekey, 'utf8'),   // char length: 684
      Buffer.from(iv, 'utf8'),     // char length: 16
      Buffer.from(ebuff, 'utf8')
    ])
    let stat;
    try {
      stat = await ipfs!.files.stat(ipfspath);
    } catch (err: any) {
      if (err.message !== 'file does not exist') {
        throw err;
      }
    }
    if (!force && cid && stat?.cid.toString() !== cid) {
      throw new Error('cidconflict')
    }
    await ipfs!.files.write(
      ipfspath,
      content,
      { create: true, parents: true }
    );
    stat = await ipfs!.files.stat(ipfspath);

    console.log('ENCRYPTION --------')
    console.log('key:', key, 'iv:', iv, 'ekey:', ekey.length)
    console.log('contents:', buff.length, 'encrypted:', ebuff.length)
    console.log('cid:', stat.cid.toString())
    console.log(' ')

    return stat.cid.toString();

  } catch (err) {
    console.log(err)
    throw err;
  }
}

async function toArray(asyncIterator: AsyncIterable<MFSEntry>) {
  const arr = [];
  for await (const i of asyncIterator) {
    arr.push(i);
  }
  return arr;
}

export async function downloadFileEncrypted(ipfspath: string, keyPair: Key) {
  try {
    let file_data = await ipfs!.files.read(ipfspath)

    let edata = []
    for await (const chunk of file_data)
      edata.push(chunk)
    const buff = Buffer.concat(edata)

    const key = decryptRSA(buff.slice(0, 684).toString('utf8'), keyPair.priKey)
    const iv = buff.slice(684, 700).toString('utf8')
    const econtent = buff.slice(700).toString('utf8')
    const ebuf = Buffer.from(econtent, 'hex')
    const content = decryptAES(ebuf, key, iv)

    console.log(' ')
    console.log('DECRYPTION --------')
    console.log('key:', key, 'iv:', iv)
    console.log('contents:', content.length, 'encrypted:', econtent.length)
    console.log('downloaded:', edata.length)

    return content

  } catch (err) {
    console.log(err)
    throw err;
  }
}

export async function getUploadedFiles(ipfspath: string) {
  let files: { path: string; size: number; cid: string; }[] = []
  const arr = await toArray(ipfs!.files.ls(ipfspath))
  for (let file of arr) {
    if (file.type === 'directory') {
      const inner = await getUploadedFiles(ipfspath + file.name + '/')
      files = files.concat(inner)
    } else {
      files.push({
        path: ipfspath + file.name,
        size: file.size,
        cid: file.cid.toString()
      })
    }
  }
  return files
}

function encryptAES(buffer: Buffer, secretKey: string, iv: string) {
  const cipher = crypto.createCipheriv('aes-256-ctr', secretKey, iv);
  const data = cipher.update(buffer);
  const encrypted = Buffer.concat([data, cipher.final()]);
  return encrypted.toString('hex')
}

function decryptAES(buffer: Buffer, secretKey: string, iv: string) {
  const decipher = crypto.createDecipheriv('aes-256-ctr', secretKey, iv);
  const data = decipher.update(buffer)
  const decrpyted = Buffer.concat([data, decipher.final()]);
  return decrpyted.toString('utf8');
}

function encryptRSA(toEncrypt: string, publicKey: string) {
  const buffer = Buffer.from(toEncrypt, 'utf8')
  const encrypted = crypto.publicEncrypt(publicKey, buffer)
  return encrypted.toString('base64')
}

function decryptRSA(toDecrypt: string, privateKey: string) {
  const buffer = Buffer.from(toDecrypt, 'base64')
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey.toString(),
      passphrase: '',
    },
    buffer,
  )
  return decrypted.toString('utf8')
}
