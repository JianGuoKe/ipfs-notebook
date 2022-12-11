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
  return (pubKey.includes('BEGIN PUBLIC KEY')
    ? ''
    : '-----BEGIN PUBLIC KEY-----\r\n') +
    pubKey +
    '\r\n' +
    (pubKey.includes('END PUBLIC KEY')
      ? ''
      : '-----END PUBLIC KEY-----') +
    '\r\n' +
    (priKey.includes('BEGIN RSA PRIVATE KEY')
      ? ''
      : '-----BEGIN RSA PRIVATE KEY-----\r\n') +
    priKey +
    '\r\n' +
    (priKey.includes('END RSA PRIVATE KEY')
      ? ''
      : '-----END RSA PRIVATE KEY-----')
}