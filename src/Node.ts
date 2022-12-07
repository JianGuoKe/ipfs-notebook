import { create, IPFSHTTPClient } from 'ipfs-http-client'
import { db, getDateNow, Key } from './Data';
import { liveQuery } from 'dexie';
import dayjs from 'dayjs';
import { MFSEntry } from 'ipfs-core-types/dist/src/files';
import crypto from 'crypto';

const root = '/jianguoke/note'

let ipfs: IPFSHTTPClient | undefined;
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

async function checkSync() {
  const key = await db.getActiveKey();
  // 30分钟内同步一次
  const lastAt = dayjs(getDateNow()).subtract(30, 'minute').toDate();
  // 从小到大时间顺序同步数据
  await db.notes.orderBy('checkAt').filter(note =>
    (!note.syncAt || note.syncAt < note.updateAt!) && (!note.checkAt || note.checkAt < lastAt)
  ).each(async note => {
    await db.updateCheck(note);
    const book = await db.books.get(note.bookId);
    // TOD 这里ipfspath有待修正
    await uploadFileEncrypted(note.content, root + '/' + book!.title! + '/' + note.id, key!);
    await db.updateSync(note);
  });
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

export async function uploadFileEncrypted(buff: string, ipfspath: string, keyPair: Key) {
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

    await ipfs!.files.write(
      ipfspath,
      content,
      { create: true, parents: true }
    );

    console.log('ENCRYPTION --------')
    console.log('key:', key, 'iv:', iv, 'ekey:', ekey.length)
    console.log('contents:', buff.length, 'encrypted:', ebuff.length)
    console.log(' ')

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
  return decrpyted;
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
