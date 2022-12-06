import fs from 'fs'
import path from 'path'

const files = [];
function getFiles(dir) {
  const stat = fs.statSync(dir)
  if (stat.isDirectory()) {
    //判断是不是目录
    const dirs = fs.readdirSync(dir)
    dirs.forEach(value => {
      // console.log('路径',path.resolve(dir,value));
      getFiles(path.join(dir, value))
    })
  } else if (stat.isFile()) {
    files.push(dir);
  }
}
getFiles('./dist/assets')
const assets = ['/', '/index.html'].concat(files.map(k => 'https://static.jianguoke.cn/note/' + k.replace(/\\/g, '/').split('/').slice(1).join('/')))
console.log(assets)
// 记录生成的缓存文件
let sw = fs.readFileSync('./dist/serviceWorker.js', 'utf-8');
sw = sw.replace('[/* CACHEFILES */]', JSON.stringify(assets));
fs.writeFileSync('./dist/serviceWorker.js', sw);