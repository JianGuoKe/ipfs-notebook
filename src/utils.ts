export function download(filename: string, text: string) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function createPem(pubKey: string, priKey: string) {
  return (pubKey.includes('PUBLIC KEY')
    ? '\r\n'
    : '-----BEGIN RSA PUBLIC KEY-----\r\n') +
    pubKey +
    '\r\n' +
    (pubKey.includes('PUBLIC KEY')
      ? '\r\n'
      : '-----END RSA PUBLIC KEY-----') +
    '\r\n' +
    (priKey.includes('PRIVATE KEY')
      ? '\r\n'
      : '-----BEGIN RSA PRIVATE KEY-----\r\n') +
    priKey +
    '\r\n' +
    (priKey.includes('PRIVATE KEY')
      ? '\r\n'
      : '-----END RSA PRIVATE KEY-----')
}

export function getReasonText(reason: string | undefined) {
  switch (reason) {
    case 'nokey':
      return '没有秘钥无法加密存储'
    case 'cidconflict':
      return '远程更新冲突'
    case 'nobook':
      return '记事本未找到'
    case undefined:
      return ''
    default:
      return reason
  }
}